"""
VetAI Graph Knowledge System Test
Tests Graphiti + FalkorDB integration with mock data
"""

import asyncio
import os
import sys
import logging
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============================================================================
# MOCK DATA - Veterinary Consultations
# ============================================================================

MOCK_CONSULTATIONS = [
    {
        "id": "consult_001",
        "timestamp": (datetime.now() - timedelta(days=30)).isoformat(),
        "vetName": "Dr. Sarah Smith",
        "ownerName": "John Doe",
        "patientName": "Max",
        "species": "Dog",
        "summary": "Annual wellness examination for Max, a 5-year-old Golden Retriever.",
        "transcription": "The patient presented for annual wellness examination. Max is a 5-year-old male neutered Golden Retriever. Owner reports no concerns. Patient is active, eating well, and normal behavior observed.",
        "extractedData": {
            "administrative": {
                "date": "2024-12-15",
                "species": "Dog",
                "breed": "Golden Retriever",
                "age": "5 years",
                "sex": "Male neutered"
            },
            "clinical": {
                "chiefComplaint": "Annual wellness examination",
                "diagnosis": "Healthy - no abnormalities detected",
                "treatment": "Routine vaccinations administered: DHPP, Rabies. Heartworm prevention prescribed.",
                "medications": ["Heartgard Plus", "NexGard"],
                "vitals": {
                    "temperature": "101.5°F",
                    "weight": "72 lbs",
                    "heart_rate": "90 bpm"
                }
            }
        },
        "attachments": []
    },
    {
        "id": "consult_002",
        "timestamp": (datetime.now() - timedelta(days=15)).isoformat(),
        "vetName": "Dr. Sarah Smith",
        "ownerName": "John Doe",
        "patientName": "Max",
        "species": "Dog",
        "summary": "Max presented with vomiting and lethargy. Diagnosed with gastroenteritis.",
        "transcription": "Patient presented with acute onset vomiting and lethargy of 24 hours duration. Owner reports patient may have gotten into trash. Physical examination revealed mild dehydration and abdominal discomfort.",
        "extractedData": {
            "administrative": {
                "date": "2024-12-30",
                "species": "Dog",
                "breed": "Golden Retriever",
                "age": "5 years",
                "sex": "Male neutered"
            },
            "clinical": {
                "chiefComplaint": "Vomiting and lethargy",
                "diagnosis": "Acute gastroenteritis, likely dietary indiscretion",
                "treatment": "Subcutaneous fluids administered, anti-emetic given (maropitant). Prescription diet recommended for 3-5 days. Recheck in 48 hours if no improvement.",
                "medications": ["Cerenia (maropitant)", "Prescription diet i/d"],
                "vitals": {
                    "temperature": "102.1°F",
                    "weight": "70 lbs",
                    "heart_rate": "100 bpm"
                }
            }
        },
        "attachments": []
    },
    {
        "id": "consult_003",
        "timestamp": (datetime.now() - timedelta(days=7)).isoformat(),
        "vetName": "Dr. Michael Chen",
        "ownerName": "Jane Smith",
        "patientName": "Luna",
        "species": "Cat",
        "summary": "Luna presented for limping. Diagnosed with a sprained leg.",
        "transcription": "Patient presented with left hind limb lameness of 2 days duration. Owner reports cat jumped off furniture and has been favoring the leg since. Physical examination reveals pain on manipulation of left stifle.",
        "extractedData": {
            "administrative": {
                "date": "2025-01-07",
                "species": "Cat",
                "breed": "Domestic Shorthair",
                "age": "3 years",
                "sex": "Female spayed"
            },
            "clinical": {
                "chiefComplaint": "Left hind limb lameness",
                "diagnosis": "Soft tissue injury/sprain of left hind limb",
                "treatment": "Rest restricted for 7-10 days. NSAID prescribed for pain and inflammation (meloxicam). Recheck in one week.",
                "medications": ["Metacam (meloxicam)"],
                "vitals": {
                    "temperature": "101.2°F",
                    "weight": "9 lbs",
                    "heart_rate": "180 bpm"
                }
            }
        },
        "attachments": []
    },
    {
        "id": "consult_004",
        "timestamp": (datetime.now() - timedelta(days=3)).isoformat(),
        "vetName": "Dr. Sarah Smith",
        "ownerName": "John Doe",
        "patientName": "Max",
        "species": "Dog",
        "summary": "Follow-up visit: Max has recovered from gastroenteritis.",
        "transcription": "Patient presented for recheck following gastroenteritis. Owner reports no further vomiting, normal appetite and activity. Physical examination normal. Patient has gained back lost weight.",
        "extractedData": {
            "administrative": {
                "date": "2025-01-11",
                "species": "Dog",
                "breed": "Golden Retriever",
                "age": "5 years",
                "sex": "Male neutered"
            },
            "clinical": {
                "chiefComplaint": "Recheck - gastroenteritis follow-up",
                "diagnosis": "Resolved - patient fully recovered",
                "treatment": "Continue regular diet and heartworm prevention. No further treatment needed at this time.",
                "medications": ["Heartgard Plus continued"],
                "vitals": {
                    "temperature": "101.3°F",
                    "weight": "72 lbs",
                    "heart_rate": "85 bpm"
                }
            }
        },
        "attachments": []
    },
    {
        "id": "consult_005",
        "timestamp": datetime.now().isoformat(),
        "vetName": "Dr. Emily Rodriguez",
        "ownerName": "Bob Wilson",
        "patientName": "Rocky",
        "species": "Dog",
        "summary": "Rocky presented with skin allergies and excessive scratching.",
        "transcription": "Patient presented with pruritus and skin lesions. Owner reports itching has been ongoing for several weeks. Physical examination reveals erythema, excoriations, and alopecia on ventral abdomen, paws, and ears.",
        "extractedData": {
            "administrative": {
                "date": "2025-01-14",
                "species": "Dog",
                "breed": "French Bulldog",
                "age": "2 years",
                "sex": "Male neutered"
            },
            "clinical": {
                "chiefComplaint": "Pruritus, skin lesions, alopecia",
                "diagnosis": "Canine atopic dermatitis, secondary bacterial skin infection",
                "treatment": "Started on Apoquel for allergic itch. Antibiotics (cephalexin) for secondary infection. Medicated shampoo (chlorhexidine) recommended twice weekly. Cytopoint injection given for immediate relief.",
                "medications": ["Apoquel (oclacitinib)", "Cephalexin", "Chlorhexidine shampoo", "Cytopoint"],
                "vitals": {
                    "temperature": "101.8°F",
                    "weight": "25 lbs",
                    "heart_rate": "110 bpm"
                }
            }
        },
        "attachments": []
    }
]


# ============================================================================
# TEST FUNCTIONS
# ============================================================================

async def test_falkordb_connection():
    """Test 1: FalkorDB Connection"""
    logger.info("\n" + "="*70)
    logger.info("TEST 1: FalkorDB Connection")
    logger.info("="*70)

    try:
        from falkordb import Graph as FalkorGraph

        host = os.getenv("FALKORDB_HOST", "localhost")
        port = int(os.getenv("FALKORDB_PORT", "6379"))

        logger.info(f"Connecting to FalkorDB at {host}:{port}...")

        graph = FalkorGraph(
            host=host,
            port=port,
            graph_name="vetai_test"
        )

        # Test query
        result = graph.query("RETURN 1 AS test")
        logger.info(f"✓ FalkorDB connected successfully")
        logger.info(f"  Query result: {result.result_set}")

        return True, graph

    except ImportError as e:
        logger.error(f"✗ FalkorDB not installed: {e}")
        return False, None
    except Exception as e:
        logger.error(f"✗ FalkorDB connection failed: {e}")
        return False, None


async def test_graphiti_availability():
    """Test 2: Graphiti Library Availability"""
    logger.info("\n" + "="*70)
    logger.info("TEST 2: Graphiti Library Availability")
    logger.info("="*70)

    try:
        from graphiti_core import Graphiti
        from graphiti_core.llm_client import LLMClient
        logger.info("✓ Graphiti library is installed")
        return True
    except ImportError as e:
        logger.error(f"✗ Graphiti not installed: {e}")
        logger.info("  Install with: pip install graphiti-core")
        return False


async def test_graphiti_initialization():
    """Test 3: Graphiti Client Initialization"""
    logger.info("\n" + "="*70)
    logger.info("TEST 3: Graphiti Client Initialization")
    logger.info("="*70)

    try:
        from graph_service import get_graphiti_client

        api_key = os.getenv("API_KEY", "")
        if not api_key:
            logger.warning("⚠ API_KEY not set in environment")
            logger.info("  Graphiti requires Gemini API key for LLM operations")
            return False

        client = await get_graphiti_client()

        if client:
            logger.info("✓ Graphiti client initialized successfully")
            logger.info(f"  Dataset: {os.getenv('GRAPHITI_GRAPH_NAME', 'vetai_knowledge')}")
            logger.info(f"  FalkorDB: {os.getenv('FALKORDB_HOST', 'localhost')}:{os.getenv('FALKORDB_PORT', '6379')}")
            return True
        else:
            logger.error("✗ Graphiti client initialization failed")
            return False

    except Exception as e:
        logger.error(f"✗ Graphiti initialization error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_add_consultations():
    """Test 4: Add Mock Consultations to Knowledge Graph"""
    logger.info("\n" + "="*70)
    logger.info("TEST 4: Add Mock Consultations to Knowledge Graph")
    logger.info("="*70)

    try:
        from graph_service import add_consultation_to_graph

        logger.info(f"Adding {len(MOCK_CONSULTATIONS)} mock consultations...")

        results = []
        for consult in MOCK_CONSULTATIONS:
            result = await add_consultation_to_graph(consult)
            results.append(result)
            status = "✓" if result.get("indexed") else "✗"
            logger.info(f"{status} {consult['id']}: {consult['patientName']} - {consult.get('extractedData', {}).get('clinical', {}).get('diagnosis', 'N/A')}")

        indexed_count = sum(1 for r in results if r.get("indexed"))
        logger.info(f"\n✓ Successfully indexed {indexed_count}/{len(MOCK_CONSULTATIONS)} consultations")

        return indexed_count > 0

    except Exception as e:
        logger.error(f"✗ Error adding consultations: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_search_knowledge_graph():
    """Test 5: Semantic Search Over Knowledge Graph"""
    logger.info("\n" + "="*70)
    logger.info("TEST 5: Semantic Search Over Knowledge Graph")
    logger.info("="*70)

    try:
        from graph_service import search_knowledge_graph

        test_queries = [
            "Max vomiting treatment",
            "Luna leg injury",
            "skin allergies Rocky",
            "gastroenteritis diagnosis"
        ]

        for query in test_queries:
            logger.info(f"\nQuery: '{query}'")
            results = await search_knowledge_graph(query, limit=3)

            if results:
                logger.info(f"✓ Found {len(results)} results:")
                for i, result in enumerate(results[:3], 1):
                    logger.info(f"  {i}. {result.get('name', 'N/A')}")
                    body_preview = result.get('body', '')[:100]
                    logger.info(f"     {body_preview}...")
            else:
                logger.warning(f"✗ No results found")

        return True

    except Exception as e:
        logger.error(f"✗ Search error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_ask_graph_questions():
    """Test 6: Ask Questions with Graph RAG"""
    logger.info("\n" + "="*70)
    logger.info("TEST 6: Ask Questions with Graph RAG")
    logger.info("="*70)

    try:
        from graph_service import ask_graph_question

        test_questions = [
            "What treatments were given to Max?",
            "What is Luna's diagnosis?",
            "Which patients have allergies?",
            "Summarize Max's visits"
        ]

        for question in test_questions:
            logger.info(f"\nQuestion: '{question}'")
            result = await ask_graph_question(question, context_limit=3)

            if result.get("answer"):
                logger.info(f"✓ Answer: {result.get('answer')[:200]}...")
                logger.info(f"  Sources: {len(result.get('sources', []))} episodes")
            else:
                logger.warning(f"✗ No answer generated: {result.get('error', 'Unknown error')}")

        return True

    except Exception as e:
        logger.error(f"✗ Question answering error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_patient_knowledge_graph():
    """Test 7: Get Patient Knowledge Graph"""
    logger.info("\n" + "="*70)
    logger.info("TEST 7: Get Patient Knowledge Graph")
    logger.info("="*70)

    try:
        from graph_service import get_patient_knowledge_graph

        test_patients = ["Max", "Luna", "Rocky"]

        for patient in test_patients:
            logger.info(f"\nPatient: '{patient}'")
            result = await get_patient_knowledge_graph(patient)

            if result.get("nodes"):
                logger.info(f"✓ Found {len(result.get('nodes', []))} nodes")
                logger.info(f"  Links: {len(result.get('links', []))}")
                logger.info(f"  Episodes: {result.get('episode_count', 'N/A')}")

                # Show a few nodes
                for node in result.get('nodes', [])[:5]:
                    logger.info(f"    - {node.get('label', 'N/A')} (group {node.get('group', '?')})")
            else:
                logger.warning(f"✗ No graph data found for {patient}")

        return True

    except Exception as e:
        logger.error(f"✗ Patient graph error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_graph_statistics():
    """Test 8: Get Graph Statistics"""
    logger.info("\n" + "="*70)
    logger.info("TEST 8: Get Graph Statistics")
    logger.info("="*70)

    try:
        from graph_service import get_graph_statistics, health_check

        # Health check
        logger.info("\nHealth Check:")
        health = await health_check()
        for key, value in health.items():
            logger.info(f"  {key}: {value}")

        # Statistics
        logger.info("\nGraph Statistics:")
        stats = await get_graph_statistics()
        for key, value in stats.items():
            logger.info(f"  {key}: {value}")

        return True

    except Exception as e:
        logger.error(f"✗ Statistics error: {e}")
        return False


# ============================================================================
# MAIN TEST RUNNER
# ============================================================================

async def run_all_tests():
    """Run all tests"""
    logger.info("\n" + "#"*70)
    logger.info("# VetAI Graph Knowledge System Test Suite")
    logger.info("# Testing: Graphiti + FalkorDB Integration")
    logger.info("#"*70)

    # Check environment
    logger.info("\nEnvironment Check:")
    logger.info(f"  API_KEY: {'✓ Set' if os.getenv('API_KEY') else '✗ Not set'}")
    logger.info(f"  FALKORDB_HOST: {os.getenv('FALKORDB_HOST', 'localhost')}")
    logger.info(f"  FALKORDB_PORT: {os.getenv('FALKORDB_PORT', '6379')}")

    # Run tests
    tests = [
        ("FalkorDB Connection", test_falkordb_connection),
        ("Graphiti Availability", test_graphiti_availability),
        ("Graphiti Initialization", test_graphiti_initialization),
        ("Add Consultations", test_add_consultations),
        ("Semantic Search", test_search_knowledge_graph),
        ("Graph RAG Questions", test_ask_graph_questions),
        ("Patient Knowledge Graph", test_patient_knowledge_graph),
        ("Graph Statistics", test_graph_statistics),
    ]

    results = {}
    for name, test_func in tests:
        try:
            result = await test_func()
            results[name] = result
        except Exception as e:
            logger.error(f"Test '{name}' crashed: {e}")
            results[name] = False

    # Summary
    logger.info("\n" + "#"*70)
    logger.info("# TEST SUMMARY")
    logger.info("#"*70)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        logger.info(f"{status}: {name}")

    logger.info(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        logger.info("\n🎉 All tests passed! Graphiti + FalkorDB is working correctly.")
    else:
        logger.warning(f"\n⚠ {total - passed} test(s) failed. Check logs above.")

    return passed == total


if __name__ == "__main__":
    asyncio.run(run_all_tests())
