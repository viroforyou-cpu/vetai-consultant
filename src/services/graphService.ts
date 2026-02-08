/**
 * Graphiti Knowledge Graph Service
 * Handles communication with Graphiti + FalkorDB backend
 */

import { backendUrl } from './backendService';

// ============================================================================
// Types
// ============================================================================

export interface GraphNode {
  id: string;
  label: string;
  group: number;
  details?: string;
}

export interface GraphLink {
  source: string;
  target: string;
  relation: string;
  value?: number;
}

export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  episode_count?: number;
  error?: string;
}

export interface GraphEpisode {
  episode_id: string;
  name: string;
  body: string;
  created_at: string | null;
  score?: number;
}

export interface GraphSearchResults {
  results: GraphEpisode[];
  count: number;
  error?: string;
}

export interface GraphAnswer {
  answer: string | null;
  context: GraphEpisode[];
  sources?: string[];
  error?: string;
}

export interface GraphHealth {
  available: boolean;
  graphiti_available?: boolean;
  falkordb_available?: boolean;
  gemini_configured?: boolean;
  graphiti_initialized?: boolean;
  error?: string;
}

export interface GraphStats {
  status?: string;
  graph_name?: string;
  falkordb_connected?: boolean;
  error?: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Check health of the graph knowledge service
 */
export async function getGraphHealth(): Promise<GraphHealth> {
  try {
    const response = await fetch(`${backendUrl}/graph/health`);
    if (!response.ok) {
      return { available: false, error: `HTTP ${response.status}` };
    }
    return await response.json();
  } catch (error) {
    console.warn('Graph health check failed:', error);
    return { available: false, error: String(error) };
  }
}

/**
 * Search the knowledge graph using semantic search
 */
export async function searchKnowledgeGraph(
  query: string,
  limit: number = 10
): Promise<GraphSearchResults> {
  try {
    const response = await fetch(`${backendUrl}/graph/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, limit })
    });

    if (!response.ok) {
      return { results: [], count: 0, error: `HTTP ${response.status}` };
    }

    return await response.json();
  } catch (error) {
    console.error('Graph search error:', error);
    return { results: [], count: 0, error: String(error) };
  }
}

/**
 * Ask a question against the knowledge graph with RAG
 */
export async function askGraphQuestion(
  question: string,
  contextLimit: number = 5
): Promise<string> {
  try {
    const response = await fetch(`${backendUrl}/graph/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context_limit: contextLimit })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result: GraphAnswer = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    return result.answer || 'No answer generated.';
  } catch (error) {
    console.error('Graph ask error:', error);
    throw error;
  }
}

/**
 * Get knowledge graph for a specific patient
 * Returns nodes and links for D3.js visualization
 */
export async function getPatientKnowledgeGraph(
  patientName: string
): Promise<KnowledgeGraphData> {
  try {
    // Use new Graphiti endpoint
    const response = await fetch(
      `${backendUrl}/graph/patient/${encodeURIComponent(patientName)}`
    );

    if (!response.ok) {
      return { nodes: [], links: [], error: `HTTP ${response.status}` };
    }

    return await response.json();
  } catch (error) {
    console.error('Get patient graph error:', error);
    return { nodes: [], links: [], error: String(error) };
  }
}

/**
 * Get statistics about the knowledge graph
 */
export async function getGraphStatistics(): Promise<GraphStats> {
  try {
    const response = await fetch(`${backendUrl}/graph/stats`);
    if (!response.ok) {
      return { error: `HTTP ${response.status}` };
    }
    return await response.json();
  } catch (error) {
    console.error('Graph stats error:', error);
    return { error: String(error) };
  }
}

/**
 * Check if Graphiti service is available
 */
export async function isGraphitiAvailable(): Promise<boolean> {
  const health = await getGraphHealth();
  return health.available && health.graphiti_initialized === true;
}

// ============================================================================
// Legacy Compatibility (for backward compatibility)
// ============================================================================

/**
 * Legacy function for backward compatibility.
 * Use getPatientKnowledgeGraph instead.
 * @deprecated Use getPatientKnowledgeGraph instead
 */
export async function getPatientGraph(patientName: string): Promise<KnowledgeGraphData> {
  return getPatientKnowledgeGraph(patientName);
}
