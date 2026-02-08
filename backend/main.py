"""
VetAI Backend Server
FastAPI backend for consultation management and graph operations
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Optional FalkorDB import
try:
    from falkordb import Graph
    FALKORDB_AVAILABLE = True
except ImportError:
    FALKORDB_AVAILABLE = False
    Graph = None

# Graph Knowledge Service
try:
    from graph_service import (
        add_consultation_to_graph,
        search_knowledge_graph,
        ask_graph_question,
        get_patient_knowledge_graph,
        get_graph_statistics,
        health_check as graph_health_check
    )
    GRAPH_SERVICE_AVAILABLE = True
except ImportError:
    GRAPH_SERVICE_AVAILABLE = False
    logger.warning("Graph service not available - graph_service.py import failed")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="VetAI Backend", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
CONSULTATION_DIR = Path("./consultation_data")
CONSULTATION_DIR.mkdir(exist_ok=True)

# FalkorDB configuration
FALKORDB_HOST = os.getenv("FALKORDB_HOST", "localhost")
FALKORDB_PORT = int(os.getenv("FALKORDB_PORT", "6379"))

# Global graph connection
_graph_connection = None


def get_graph_connection():
    """Get or create FalkorDB graph connection."""
    global _graph_connection

    if not FALKORDB_AVAILABLE:
        logger.warning("FalkorDB not available - falkordb package not installed")
        return None

    try:
        if _graph_connection is None:
            _graph_connection = Graph(
                host=FALKORDB_HOST,
                port=FALKORDB_PORT,
                graph_name="vetai_graph"
            )
            logger.info(f"Connected to FalkorDB at {FALKORDB_HOST}:{FALKORDB_PORT}")
        return _graph_connection
    except Exception as e:
        logger.error(f"Failed to connect to FalkorDB: {e}")
        return None


# Pydantic models
class ConsultationModel(BaseModel):
    id: str
    timestamp: str
    vetName: str
    ownerName: str
    patientName: str
    species: str
    summary: str
    transcription: Optional[str] = None
    extractedData: Optional[Dict[str, Any]] = None
    attachments: List[Dict[str, str]] = []


class GraphNode(BaseModel):
    id: str
    label: str
    group: int


class GraphLink(BaseModel):
    source: str
    target: str
    relation: str


class GraphData(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]


@app.get("/")
async def root():
    """Health check endpoint."""
    health = {
        "status": "online",
        "falkordb_available": FALKORDB_AVAILABLE,
        "falkordb_connected": _graph_connection is not None,
        "graph_service_available": GRAPH_SERVICE_AVAILABLE
    }

    if GRAPH_SERVICE_AVAILABLE:
        graph_health = await graph_health_check()
        health.update({"graphiti": graph_health})

    return health


@app.get("/consultations")
async def get_consultations() -> List[ConsultationModel]:
    """Load all consultations from disk."""
    consultations = []

    try:
        for file_path in CONSULTATION_DIR.glob("*.json"):
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                consultations.append(data)
    except Exception as e:
        logger.error(f"Error loading consultations: {e}")

    return consultations


@app.post("/save_consultation")
async def save_consultation(consultation: ConsultationModel):
    """Save a consultation to disk and index in knowledge graph."""
    try:
        file_path = CONSULTATION_DIR / f"{consultation.id}.json"

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(consultation.model_dump(), f, indent=2, ensure_ascii=False)

        # Index in legacy FalkorDB if available
        graph = get_graph_connection()
        if graph:
            await index_consultation_in_graph(graph, consultation.model_dump())

        # Index in Graphiti temporal knowledge graph if available
        graph_result = None
        if GRAPH_SERVICE_AVAILABLE:
            graph_result = await add_consultation_to_graph(consultation.model_dump())
            logger.info(f"Graphiti indexing result: {graph_result}")

        return {
            "status": "saved",
            "id": consultation.id,
            "graphiti_indexed": graph_result.get("indexed") if graph_result else False
        }

    except Exception as e:
        logger.error(f"Error saving consultation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def index_consultation_in_graph(graph: Graph, consultation: Dict[str, Any]):
    """Index a consultation in the knowledge graph."""
    try:
        patient_name = consultation.get("patientName", "").strip()
        owner_name = consultation.get("ownerName", "").strip()
        vet_name = consultation.get("vetName", "").strip()
        species = consultation.get("extractedData", {}).get("administrative", {}).get("species", "Unknown")
        diagnosis = consultation.get("extractedData", {}).get("clinical", {}).get("diagnosis", "")
        treatment = consultation.get("extractedData", {}).get("clinical", {}).get("treatment", "")

        if not patient_name:
            return

        # Create nodes and relationships
        queries = []

        # Patient node
        queries.append(f"""
            MERGE (p:Patient {{name: '{patient_name}'}})
            SET p.species = '{species}', p.last_seen = '{consultation.get('timestamp', '')}'
        """)

        # Owner node and relationship
        if owner_name:
            queries.append(f"""
                MERGE (o:Owner {{name: '{owner_name}'}})
                MERGE (p:Patient {{name: '{patient_name}'}})
                MERGE (o)-[:OWNS]->(p)
            """)

        # Vet node and relationship
        if vet_name:
            queries.append(f"""
                MERGE (v:Vet {{name: '{vet_name}'}})
                MERGE (p:Patient {{name: '{patient_name}'}})
                MERGE (v)-[:TREATED]->(p)
            """)

        # Diagnosis node and relationship
        if diagnosis:
            # Escape single quotes in diagnosis
            diagnosis_safe = diagnosis.replace("'", "\\'")
            queries.append(f"""
                MERGE (p:Patient {{name: '{patient_name}'}})
                MERGE (d:Diagnosis {{name: '{diagnosis_safe}'}})
                MERGE (p)-[:DIAGNOSED_WITH]->(d)
            """)

        # Treatment node and relationship
        if treatment:
            treatment_safe = treatment.replace("'", "\\'")
            queries.append(f"""
                MERGE (p:Patient {{name: '{patient_name}'}})
                MERGE (t:Treatment {{name: '{treatment_safe}'}})
                MERGE (p)-[:TREATED_WITH]->(t)
            """)

        # Execute queries
        for query in queries:
            try:
                graph.query(query)
            except Exception as e:
                logger.warning(f"Graph query failed: {e}")

        logger.info(f"Indexed consultation for {patient_name} in graph")

    except Exception as e:
        logger.error(f"Error indexing consultation in graph: {e}")


@app.get("/graph/patient/{patient_name}")
async def get_patient_graph(patient_name: str) -> GraphData:
    """
    Get knowledge graph for a specific patient.

    Returns nodes and links for visualization in D3.js.
    Node groups:
      1 - Patient (center)
      2 - Owner
      3 - Vet
      4 - Diagnosis
      5 - Treatment
    """
    graph = get_graph_connection()

    if not graph:
        # Return empty data if FalkorDB is not available
        return GraphData(nodes=[], links=[])

    try:
        # Clean patient name
        patient_name = patient_name.strip()

        # Query to get patient's knowledge graph
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

        def add_node(node_id: str, label: str, group: int):
            if node_id and node_id not in node_ids:
                nodes.append(GraphNode(id=node_id, label=label, group=group))
                node_ids.add(node_id)

        # Process result
        if result.result_set:
            for record in result.result_set:
                # Patient node (group 1 - center)
                if record[0]:  # p
                    patient = record[0]
                    if hasattr(patient, 'properties'):
                        props = patient.properties
                        add_node(props.get('name', patient_name), props.get('name', patient_name), 1)

                # Owner node (group 2)
                if record[1]:  # o
                    owner = record[1]
                    if hasattr(owner, 'properties'):
                        props = owner.properties
                        owner_name = props.get('name', 'Unknown')
                        add_node(owner_name, owner_name, 2)
                        links.append(GraphLink(source=patient_name, target=owner_name, relation="owns"))

                # Vet node (group 3)
                if record[2]:  # v
                    vet = record[2]
                    if hasattr(vet, 'properties'):
                        props = vet.properties
                        vet_name = props.get('name', 'Unknown')
                        add_node(vet_name, vet_name, 3)
                        links.append(GraphLink(source=vet_name, target=patient_name, relation="treated"))

                # Diagnosis nodes (group 4)
                if record[3]:  # d
                    diagnosis = record[3]
                    if hasattr(diagnosis, 'properties'):
                        props = diagnosis.properties
                        diag_name = props.get('name', 'Unknown')
                        # Truncate long diagnoses
                        diag_label = diag_name[:30] + "..." if len(diag_name) > 30 else diag_name
                        add_node(diag_name, diag_label, 4)
                        links.append(GraphLink(source=patient_name, target=diag_name, relation="diagnosed with"))

                # Treatment nodes (group 5)
                if record[4]:  # t
                    treatment = record[4]
                    if hasattr(treatment, 'properties'):
                        props = treatment.properties
                        treat_name = props.get('name', 'Unknown')
                        # Truncate long treatments
                        treat_label = treat_name[:30] + "..." if len(treat_name) > 30 else treat_name
                        add_node(treat_name, treat_label, 5)
                        links.append(GraphLink(source=patient_name, target=treat_name, relation="treated with"))

        # If no nodes found, patient may not exist in graph yet
        if not nodes:
            logger.warning(f"No graph data found for patient: {patient_name}")

        return GraphData(nodes=nodes, links=links)

    except Exception as e:
        logger.error(f"Error getting patient graph: {e}")
        return GraphData(nodes=[], links=[])


# =============================================================================
# Graphiti Knowledge Graph Endpoints
# =============================================================================

class GraphSearchRequest(BaseModel):
    query: str
    limit: int = 10


class GraphQuestionRequest(BaseModel):
    question: str
    context_limit: int = 5


@app.get("/graph/health")
async def graph_health():
    """Check Graphiti knowledge graph service health."""
    if not GRAPH_SERVICE_AVAILABLE:
        return {"available": False, "error": "Graph service not imported"}

    health = await graph_health_check()
    return health


@app.post("/graph/search")
async def graph_search(request: GraphSearchRequest):
    """
    Search the knowledge graph using Graphiti semantic search.

    Returns relevant episodes based on the query.
    """
    if not GRAPH_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Graph service not available")

    try:
        results = await search_knowledge_graph(request.query, limit=request.limit)
        return {"results": results, "count": len(results)}
    except Exception as e:
        logger.error(f"Graph search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/graph/ask")
async def graph_ask(request: GraphQuestionRequest):
    """
    Ask a question against the knowledge graph with RAG.

    Retrieves relevant context and generates an AI answer.
    """
    if not GRAPH_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Graph service not available")

    try:
        result = await ask_graph_question(request.question, context_limit=request.context_limit)
        return result
    except Exception as e:
        logger.error(f"Graph ask error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/graph/patient/{patient_name}")
async def get_graph_patient(patient_name: str):
    """
    Get knowledge graph for a specific patient using Graphiti.

    Returns nodes and links for D3.js visualization with temporal context.
    """
    if not GRAPH_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Graph service not available")

    try:
        result = await get_patient_knowledge_graph(patient_name)
        return result
    except Exception as e:
        logger.error(f"Graph patient error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/graph/stats")
async def graph_stats():
    """Get statistics about the knowledge graph."""
    if not GRAPH_SERVICE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Graph service not available")

    try:
        stats = await get_graph_statistics()
        return stats
    except Exception as e:
        logger.error(f"Graph stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.on_event("startup")
async def startup_event():
    """Initialize connections on startup."""
    logger.info("Starting VetAI Backend...")

    # Test FalkorDB connection
    graph = get_graph_connection()
    if graph:
        logger.info("FalkorDB connection established")
    else:
        logger.warning("FalkorDB not available - graph features will be limited")

    # Check Graphiti service
    if GRAPH_SERVICE_AVAILABLE:
        logger.info("Graphiti service available - temporal knowledge graph enabled")
        # Pre-initialize Graphiti client
        if GRAPH_SERVICE_AVAILABLE:
            from graph_service import get_graphiti_client
            try:
                await get_graphiti_client()
                logger.info("Graphiti client initialized successfully")
            except Exception as e:
                logger.warning(f"Graphiti initialization failed: {e}")
    else:
        logger.warning("Graphiti service not available")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
