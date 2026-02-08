"""
VetAI Graph Knowledge Service
Graphiti + FalkorDB integration for temporal knowledge graphs
"""

import os
import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from pathlib import Path

# Graphiti imports
try:
    from graphiti_core import Graphiti
    from graphiti_core.llm_client import LLMClient
    from graphiti_core.utils.uuid_utils import generate_uuid
    GRAPHITI_AVAILABLE = True
except ImportError:
    GRAPHITI_AVAILABLE = False
    Graphiti = None
    LLMClient = None

# FalkorDB imports
try:
    from falkordb import Graph as FalkorGraph
    FALKORDB_AVAILABLE = True
except ImportError:
    FALKORDB_AVAILABLE = False
    FalkorGraph = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
FALKORDB_HOST = os.getenv("FALKORDB_HOST", "localhost")
FALKORDB_PORT = int(os.getenv("FALKORDB_PORT", "6379"))
GRAPH_NAME = os.getenv("GRAPHITI_GRAPH_NAME", "vetai_knowledge")

# Gemini AI for Graphiti LLM client
GEMINI_API_KEY = os.getenv("API_KEY", "")


class GeminiLLMClient(LLMClient):
    """Gemini LLM client for Graphiti."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            self.genai = genai
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        except ImportError:
            logger.error("google.generativeai not installed")

    async def generate_completion(self, prompt: str) -> str:
        """Generate completion from prompt."""
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini LLM error: {e}")
            raise


# Global Graphiti instance
_graphiti_client: Optional[Graphiti] = None


async def get_graphiti_client() -> Optional[Graphiti]:
    """Get or create Graphiti client."""
    global _graphiti_client

    if not GRAPHITI_AVAILABLE:
        logger.warning("Graphiti not available - graphiti-core package not installed")
        return None

    if not GEMINI_API_KEY:
        logger.warning("API_KEY not set - Graphiti requires Gemini API key")
        return None

    try:
        if _graphiti_client is None:
            # Create LLM client
            llm_client = GeminiLLMClient(GEMINI_API_KEY)

            # Initialize Graphiti with FalkorDB
            _graphiti_client = Graphiti(
                dataset_name=GRAPH_NAME,
                llm_client=llm_client,
                falkordb_url=f"redis://{FALKORDB_HOST}:{FALKORDB_PORT}"
            )

            logger.info(f"Graphiti client initialized: {GRAPH_NAME}")
        return _graphiti_client

    except Exception as e:
        logger.error(f"Failed to initialize Graphiti: {e}")
        return None


async def add_consultation_to_graph(consultation: Dict[str, Any]) -> Dict[str, Any]:
    """
    Add a consultation to the temporal knowledge graph.

    This extracts entities, relationships, and adds temporal context.
    """
    graphiti = await get_graphiti_client()
    if not graphiti:
        logger.warning("Graphiti not available - consultation not indexed in graph")
        return {"indexed": False, "reason": "Graphiti not available"}

    try:
        # Build episode text from consultation data
        episode_text = build_episode_text(consultation)

        # Generate episode ID
        episode_id = generate_uuid()

        # Add episode to graph
        await graphiti.add_episode(
            name=f"Consultation: {consultation.get('patientName', 'Unknown')}",
            episode_body=episode_text,
            episode_id=episode_id,
            reference_id=consultation.get('id'),
            timestamp=datetime.fromisoformat(consultation.get('timestamp', datetime.now().isoformat()))
        )

        logger.info(f"Added consultation {consultation.get('id')} to Graphiti")

        return {
            "indexed": True,
            "episode_id": episode_id,
            "patient": consultation.get('patientName'),
            "timestamp": consultation.get('timestamp')
        }

    except Exception as e:
        logger.error(f"Error adding consultation to graph: {e}")
        return {"indexed": False, "reason": str(e)}


async def search_knowledge_graph(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Search the knowledge graph using Graphiti's semantic search.

    Returns relevant episodes and extracted information.
    """
    graphiti = await get_graphiti_client()
    if not graphiti:
        logger.warning("Graphiti not available - cannot search knowledge graph")
        return []

    try:
        # Search for relevant episodes
        results = await graphiti.search(
            query=query,
            limit=limit
        )

        # Format results
        formatted_results = []
        for result in results:
            formatted_results.append({
                "episode_id": str(result.uuid),
                "name": result.name,
                "body": result.body,
                "created_at": result.created_at.isoformat() if result.created_at else None,
                "score": getattr(result, 'score', None)
            })

        return formatted_results

    except Exception as e:
        logger.error(f"Error searching knowledge graph: {e}")
        return []


async def ask_graph_question(query: str, context_limit: int = 5) -> Dict[str, Any]:
    """
    Ask a question against the knowledge graph with RAG.

    Retrieves relevant context and generates an answer.
    """
    graphiti = await get_graphiti_client()
    if not graphiti:
        return {
            "answer": None,
            "context": [],
            "error": "Graphiti not available"
        }

    try:
        # First, search for relevant episodes
        context = await search_knowledge_graph(query, limit=context_limit)

        if not context:
            return {
                "answer": "No relevant information found in the knowledge graph.",
                "context": [],
                "sources": []
            }

        # Build context from retrieved episodes
        context_text = "\n\n".join([
            f"- {ep['name']}: {ep['body'][:200]}..."
            for ep in context
        ])

        # Generate answer using Gemini
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-2.5-flash')

            prompt = f"""You are a veterinary AI assistant. Answer the question based on the knowledge graph context below.

Context from patient records:
{context_text}

Question: {query}

Provide a concise, accurate answer. If the context doesn't contain enough information, say so. Cite specific details from the context."""

            response = model.generate_content(prompt)

            return {
                "answer": response.text,
                "context": context,
                "sources": [ep["episode_id"] for ep in context]
            }

        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return {
                "answer": None,
                "context": context,
                "error": str(e)
            }

    except Exception as e:
        logger.error(f"Error asking graph question: {e}")
        return {
            "answer": None,
            "context": [],
            "error": str(e)
        }


async def get_patient_knowledge_graph(patient_name: str) -> Dict[str, Any]:
    """
    Get knowledge graph data for a specific patient.

    Returns nodes and links for D3.js visualization.
    """
    graphiti = await get_graphiti_client()
    if not graphiti:
        # Fallback to direct FalkorDB query
        return await get_patient_graph_fallback(patient_name)

    try:
        # Search for all episodes related to this patient
        search_results = await search_knowledge_graph(
            query=f"patient {patient_name} consultations visits treatments",
            limit=50
        )

        # Extract entities and relationships from episodes
        nodes = []
        links = []
        node_ids = set()

        # Add patient node
        patient_id = f"patient_{patient_name}"
        if patient_id not in node_ids:
            nodes.append({
                "id": patient_id,
                "label": patient_name,
                "group": 1,
                "details": "Patient"
            })
            node_ids.add(patient_id)

        # Process each episode to extract entities
        for episode in search_results:
            # Extract entities from episode body
            entities = extract_entities_from_episode(episode)

            # Add entity nodes and links
            for entity in entities:
                if entity["id"] not in node_ids:
                    nodes.append(entity)
                    node_ids.add(entity["id"])

                # Add relationship link
                links.append({
                    "source": patient_id,
                    "target": entity["id"],
                    "relation": entity.get("relation", "related_to")
                })

        return {
            "nodes": nodes,
            "links": links,
            "episode_count": len(search_results)
        }

    except Exception as e:
        logger.error(f"Error getting patient knowledge graph: {e}")
        # Fallback to direct FalkorDB query
        return await get_patient_graph_fallback(patient_name)


async def get_patient_graph_fallback(patient_name: str) -> Dict[str, Any]:
    """Fallback method using direct FalkorDB queries."""
    if not FALKORDB_AVAILABLE:
        return {"nodes": [], "links": [], "error": "FalkorDB not available"}

    try:
        graph = FalkorGraph(
            host=FALKORDB_HOST,
            port=FALKORDB_PORT,
            graph_name="vetai_graph"
        )

        query = f"""
            MATCH (p:Patient {{name: '{patient_name}'}})
            OPTIONAL MATCH (p)-[r1:OWNS]-(o:Owner)
            OPTIONAL MATCH (p)-[r2:TREATED]-(v:Vet)
            OPTIONAL MATCH (p)-[r3:DIAGNOSED_WITH]-(d:Diagnosis)
            OPTIONAL MATCH (p)-[r4:TREATED_WITH]-(t:Treatment)
            RETURN p, o, v, d, t, r1, r2, r3, r4
        """

        result = graph.query(query)

        nodes = []
        links = []
        node_ids = set()

        if result.result_set:
            for record in result.result_set:
                # Process nodes and relationships
                # (similar logic to existing main.py implementation)
                pass

        return {"nodes": nodes, "links": links}

    except Exception as e:
        logger.error(f"Fallback graph query error: {e}")
        return {"nodes": [], "links": [], "error": str(e)}


def build_episode_text(consultation: Dict[str, Any]) -> str:
    """Build episode text from consultation data."""
    parts = []

    # Basic info
    parts.append(f"Patient: {consultation.get('patientName', 'Unknown')}")
    parts.append(f"Species: {consultation.get('species', 'Unknown')}")
    parts.append(f"Owner: {consultation.get('ownerName', 'Unknown')}")
    parts.append(f"Veterinarian: {consultation.get('vetName', 'Unknown')}")

    # Date
    extracted = consultation.get('extractedData', {})
    if isinstance(extracted, dict):
        admin = extracted.get('administrative', {})
        if admin:
            date = admin.get('date', '')
            if date:
                parts.append(f"Date: {date}")

        # Clinical info
        clinical = extracted.get('clinical', {})
        if clinical:
            chief_complaint = clinical.get('chiefComplaint', '')
            if chief_complaint:
                parts.append(f"Chief Complaint: {chief_complaint}")

            diagnosis = clinical.get('diagnosis', '')
            if diagnosis:
                parts.append(f"Diagnosis: {diagnosis}")

            treatment = clinical.get('treatment', '')
            if treatment:
                parts.append(f"Treatment: {treatment}")

            medications = clinical.get('medications', [])
            if medications:
                parts.append(f"Medications: {', '.join(medications) if isinstance(medications, list) else medications}")

    # Transcription
    transcription = consultation.get('transcription', '')
    if transcription:
        parts.append(f"Transcription: {transcription[:500]}...")  # Truncate long transcriptions

    # Summary
    summary = consultation.get('summary', '')
    if summary:
        parts.append(f"Summary: {summary}")

    return "\n".join(parts)


def extract_entities_from_episode(episode: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract entities from an episode for graph visualization."""
    entities = []
    body = episode.get('body', '')

    # Simple entity extraction (in production, use NER)
    # This is a placeholder - Graphiti handles entity extraction internally

    return entities


async def get_graph_statistics() -> Dict[str, Any]:
    """Get statistics about the knowledge graph."""
    graphiti = await get_graphiti_client()
    if not graphiti:
        return {"error": "Graphiti not available"}

    try:
        # Get episode count
        # Graphiti API may have specific methods for this
        return {
            "status": "active",
            "graph_name": GRAPH_NAME,
            "falkordb_connected": True
        }
    except Exception as e:
        return {"error": str(e)}


# Health check
async def health_check() -> Dict[str, Any]:
    """Check health of graph knowledge service."""
    return {
        "graphiti_available": GRAPHITI_AVAILABLE,
        "falkordb_available": FALKORDB_AVAILABLE,
        "gemini_configured": bool(GEMINI_API_KEY),
        "graphiti_initialized": _graphiti_client is not None
    }
