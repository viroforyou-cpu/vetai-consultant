"""
VetAI Backend Server
FastAPI backend for consultation management and graph operations
"""

import os
import json
import logging
import hashlib
import shutil
import time
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query, Request
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

# Rate limiting for destructive operations
# Simple in-memory rate limiter (for production, use Redis or similar)
_rate_limit_store: Dict[str, List[float]] = {}
RATE_LIMIT_WINDOW_SECONDS = 60  # 1 minute window
RATE_LIMIT_MAX_REQUESTS = 3  # Max 3 requests per window for destructive ops


def _check_rate_limit(client_id: str, max_requests: int = RATE_LIMIT_MAX_REQUESTS) -> bool:
    """
    Check if client is within rate limit.
    Returns True if request is allowed, False if rate limited.
    """
    current_time = time.time()
    
    # Get or create request history for this client
    if client_id not in _rate_limit_store:
        _rate_limit_store[client_id] = []
    
    # Remove expired timestamps
    _rate_limit_store[client_id] = [
        ts for ts in _rate_limit_store[client_id]
        if current_time - ts < RATE_LIMIT_WINDOW_SECONDS
    ]
    
    # Check if under limit
    if len(_rate_limit_store[client_id]) >= max_requests:
        return False
    
    # Record this request
    _rate_limit_store[client_id].append(current_time)
    return True


def _get_client_id(request: Request) -> str:
    """Extract client identifier from request for rate limiting."""
    # Try X-Forwarded-For header first (for reverse proxy setups)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    
    # Fall back to direct client IP
    return request.client.host if request.client else "unknown"


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


class CompactResult(BaseModel):
    duplicates_removed: int
    files_deleted: List[str]
    files_backed_up: List[str]  # Files moved to backup instead of deleted
    backup_directory: Optional[str] = None  # Path to backup directory if used
    space_saved_bytes: int
    space_saved_mb: float
    remaining_consultations: int


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


def _compute_content_hash(consultation: Dict[str, Any]) -> str:
    """Compute a hash of consultation content for duplicate detection."""
    # Fields to include in hash (excluding id and timestamp which may differ)
    content_fields = {
        "vetName": consultation.get("vetName"),
        "ownerName": consultation.get("ownerName"),
        "patientName": consultation.get("patientName"),
        "species": consultation.get("species"),
        "summary": consultation.get("summary"),
        "transcription": consultation.get("transcription"),
    }
    
    # Skip consultations with insufficient data (all fields None or empty)
    if all(v is None or v == "" for v in content_fields.values()):
        return ""  # Empty hash indicates no meaningful content
    
    content_str = json.dumps(content_fields, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(content_str.encode('utf-8')).hexdigest()


def _find_duplicate_consultations(consultations: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """
    Find duplicate consultations based on content hash.
    Returns dict mapping hash to list of duplicate consultations.
    """
    hash_map: Dict[str, List[Dict[str, Any]]] = {}

    for consultation in consultations:
        content_hash = _compute_content_hash(consultation)
        # Skip consultations with no meaningful content (empty hash)
        if not content_hash:
            continue
        if content_hash not in hash_map:
            hash_map[content_hash] = []
        hash_map[content_hash].append(consultation)

    # Return only groups with duplicates (more than 1)
    return {h: group for h, group in hash_map.items() if len(group) > 1}


def _get_file_size(file_path: Path) -> int:
    """Get file size in bytes."""
    try:
        return file_path.stat().st_size
    except OSError:
        return 0


def _validate_backup_directory(backup_dir: str) -> Path:
    """
    Validate and resolve backup directory path.
    Ensures the path is within allowed directories to prevent path traversal attacks.
    """
    # Define allowed base directories for backups
    allowed_bases = [
        CONSULTATION_DIR.parent,  # Parent of consultation_data
        Path("/tmp"),  # System temp directory
        Path.home(),  # User home directory
    ]
    
    # Resolve the provided path (handles .., symlinks, etc.)
    try:
        requested_path = Path(backup_dir).resolve()
    except Exception as e:
        raise ValueError(f"Invalid backup directory path: {e}")
    
    # Check if the path is within an allowed base directory
    for allowed_base in allowed_bases:
        try:
            allowed_base_resolved = allowed_base.resolve()
            # Check if requested_path is a subdirectory of allowed_base
            requested_path.relative_to(allowed_base_resolved)
            return requested_path
        except ValueError:
            continue
    
    # If we get here, the path is not within any allowed directory
    raise ValueError(
        f"Backup directory must be within one of the allowed directories: "
        f"{', '.join(str(b) for b in allowed_bases)}"
    )


@app.post("/compact/duplicates", response_model=CompactResult)
async def compact_duplicates(
    request: Request,
    dry_run: bool = Query(False, description="If true, only report what would be deleted"),
    backup: bool = Query(True, description="If true, move files to backup instead of deleting"),
    backup_dir: Optional[str] = Query(None, description="Custom backup directory path")
):
    """
    Find and remove duplicate consultation files.

    Duplicates are identified by content hash (same patient, owner, vet, summary, transcription).
    Keeps the newest file (by timestamp) and removes older duplicates.
    
    By default, files are moved to a backup directory instead of being permanently deleted.
    
    Rate limited to 3 requests per minute per client to prevent abuse.
    """
    # Rate limiting check (skip for dry runs which are read-only)
    if not dry_run:
        client_id = _get_client_id(request)
        if not _check_rate_limit(client_id):
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Maximum 3 compaction requests per minute. Please wait and try again."
            )
    
    try:
        # Load all consultations
        consultations = []
        file_map: Dict[str, Path] = {}  # consultation_id -> file_path

        for file_path in CONSULTATION_DIR.glob("*.json"):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    consultations.append(data)
                    file_map[data["id"]] = file_path
            except Exception as e:
                logger.warning(f"Failed to load {file_path}: {e}")

        if not consultations:
            return CompactResult(
                duplicates_removed=0,
                files_deleted=[],
                files_backed_up=[],
                backup_directory=None,
                space_saved_bytes=0,
                space_saved_mb=0.0,
                remaining_consultations=0
            )

        # Find duplicates
        duplicate_groups = _find_duplicate_consultations(consultations)

        files_to_remove: List[str] = []
        total_space_saved = 0

        # For each duplicate group, keep the newest, delete the rest
        for content_hash, group in duplicate_groups.items():
            # Sort by timestamp (newest first), then by id as fallback
            sorted_group = sorted(
                group,
                key=lambda c: (
                    c.get("timestamp", ""),
                    c.get("id", "")
                ),
                reverse=True
            )

            # Keep the first (newest), mark rest for deletion
            to_remove = sorted_group[1:]
            for consultation in to_remove:
                file_path = file_map.get(consultation.get("id"))
                if file_path and file_path.exists():
                    files_to_remove.append(str(file_path))
                    total_space_saved += _get_file_size(file_path)

        # Setup backup directory if backup is enabled
        backup_path: Optional[Path] = None
        files_deleted: List[str] = []
        files_backed_up: List[str] = []
        
        if backup and files_to_remove and not dry_run:
            # Create backup directory
            if backup_dir:
                # Validate backup directory to prevent path traversal
                try:
                    backup_path = _validate_backup_directory(backup_dir)
                except ValueError as e:
                    raise HTTPException(status_code=400, detail=str(e))
            else:
                backup_path = CONSULTATION_DIR.parent / "consultation_backup" / datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Backup directory created: {backup_path}")

        # Perform deletion or backup (unless dry run)
        if not dry_run:
            for file_path_str in files_to_remove:
                try:
                    src_path = Path(file_path_str)
                    if backup and backup_path:
                        # Move to backup instead of deleting
                        dest_path = backup_path / src_path.name
                        shutil.move(str(src_path), str(dest_path))
                        files_backed_up.append(file_path_str)
                        logger.info(f"Backed up duplicate consultation: {file_path_str} -> {dest_path}")
                    else:
                        # Permanent deletion
                        os.remove(file_path_str)
                        files_deleted.append(file_path_str)
                        logger.info(f"Deleted duplicate consultation: {file_path_str}")
                except (OSError, shutil.Error) as e:
                    logger.error(f"Failed to process {file_path_str}: {e}")

        remaining_count = len(consultations) - len(files_to_remove)

        return CompactResult(
            duplicates_removed=len(files_to_remove),
            files_deleted=files_deleted,
            files_backed_up=files_backed_up,
            backup_directory=str(backup_path) if backup_path else None,
            space_saved_bytes=total_space_saved,
            space_saved_mb=round(total_space_saved / (1024 * 1024), 2),
            remaining_consultations=remaining_count
        )

    except Exception as e:
        logger.error(f"Error during compaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/compact/stats")
async def get_compaction_stats():
    """Get statistics about consultation data for compaction planning."""
    try:
        total_files = 0
        total_size = 0
        consultation_count = 0
        potential_duplicates = 0

        consultations = []
        for file_path in CONSULTATION_DIR.glob("*.json"):
            total_files += 1
            total_size += _get_file_size(file_path)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    consultations.append(data)
                    consultation_count += 1
            except Exception:
                pass

        # Check for potential duplicates
        if consultations:
            duplicate_groups = _find_duplicate_consultations(consultations)
            potential_duplicates = sum(len(group) - 1 for group in duplicate_groups.values())

        return {
            "total_files": total_files,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "consultation_count": consultation_count,
            "potential_duplicates": potential_duplicates,
            "potential_space_recovery_bytes": potential_duplicates * (total_size // max(consultation_count, 1)),
        }

    except Exception as e:
        logger.error(f"Error getting compaction stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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

    # Auto-compact duplicates on startup if enabled
    # Requires explicit confirmation to prevent accidental data deletion
    auto_compact = os.getenv("AUTO_COMPACT_ON_STARTUP", "false").lower() == "true"
    auto_compact_confirm = os.getenv("AUTO_COMPACT_CONFIRM", "")
    
    if auto_compact:
        if auto_compact_confirm != "I_UNDERSTAND_DATA_WILL_BE_MOVED_TO_BACKUP":
            logger.warning(
                "Auto-compaction requires AUTO_COMPACT_CONFIRM='I_UNDERSTAND_DATA_WILL_BE_MOVED_TO_BACKUP' "
                "to prevent accidental data loss. Auto-compaction disabled."
            )
        else:
            logger.info("Auto-compaction enabled - scanning for duplicates...")
            try:
                # Always use backup mode for auto-compaction (safer)
                result = await compact_duplicates(dry_run=False, backup=True)
                if result.duplicates_removed > 0:
                    logger.info(
                        f"Auto-compaction completed: moved {result.duplicates_removed} duplicates to backup, "
                        f"freed {result.space_saved_mb} MB. Backup location: {result.backup_directory}"
                    )
                else:
                    logger.info("Auto-compaction: no duplicates found")
            except Exception as e:
                logger.error(f"Auto-compaction failed: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
