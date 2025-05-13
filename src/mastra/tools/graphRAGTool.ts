/**
 * Graph RAG Tool Suite implementation for Mastra
 *
 * @file Provides a suite of tools for Graph-based Retrieval Augmented Generation (RAG):
 *       - queryTool: For querying the knowledge graph.
 *       - addDocumentsTool: For adding documents to the knowledge graph.
 *       - addNodesTool: For adding individual nodes.
 *       - addEdgesTool: For adding individual edges.
 *       - getSchemaTool: For retrieving the schema of the knowledge graph.
 *       - deleteNodesTool: For deleting nodes.
 *       - deleteEdgesTool: For deleting edges.
 *       - updateNodeTool: For updating node properties.
 *       - updateEdgeTool: For updating edge properties.
 * @version 2.1.0
 * @author Mastra Team
 * @copyright 2025
 * @license MIT
 */
import { z } from 'zod';
import { createTool, ToolExecutionContext as MastraToolExecutionContext } from '@mastra/core'; // Removed ToolExecutionOptions
import { GraphRAG } from '@mastra/rag'; // Assuming GraphRAG class is the primary export
// Removed imports for non-existent specific types from @mastra/rag
import { createLogger, MastraLogger } from '@mastra/core/logger'; // Corrected logger import

// Removed import for 'node-abort-controller'

const logger: MastraLogger = createLogger({
  name: 'Mastra-GraphRAGToolSuite',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

const DEFAULT_MAX_RESULTS = 10;
const DEFAULT_QUERY_DEPTH = 3;

// Configuration for the GraphRAG instance
// This should align with the actual constructor options of GraphRAG from @mastra/rag
interface InternalGraphRAGConfig {
  graphDatabase: {
    type: 'neo4j' | 'nebula' | 'custom' | string;
    uri: string;
    username?: string;
    password?: string;
    databaseName?: string;
  };
  vectorStoreConfig?: {
    name: string; // e.g., 'pinecone', 'faiss', 'upstash'
    apiKey?: string;
    environment?: string;
    indexName: string;
    // ... other vector store specific configs
  };
  embeddingModelConfig?: {
    provider: 'openai' | 'cohere' | 'huggingface' | 'custom' | string; // or specific model IDs/names
    modelName: string;
    apiKey?: string;
    // ... other model specific configs
  };
  llmConfig?: { // For potential summarization, question answering over graph results
    provider: 'openai' | 'anthropic' | 'google' | 'custom' | string;
    modelName: string;
    apiKey?: string;
    // ...
  };
  defaultQueryDepth?: number;
  // Add any other necessary configuration fields for GraphRAG constructor
}

export interface MastraGraphRAGToolsConfig {
  graphRAGInstanceConfig: InternalGraphRAGConfig;
  defaultMaxResults?: number;
}

// --- Schemas for the tools ---

// --- Query Tool Schemas ---
const queryInputSchema = z.object({
  query: z.string().describe("Natural language query or keyword search for the knowledge graph."),
  nodeTypes: z.array(z.string()).optional().describe("Filter results by specific node types (e.g., ['Person', 'Organization'])."),
  relationshipTypes: z.array(z.string()).optional().describe("Focus traversal on specific relationship types (e.g., ['WORKS_FOR', 'LOCATED_IN'])."),
  limit: z.number().int().positive().optional().describe(`Maximum number of primary results. Defaults to ${DEFAULT_MAX_RESULTS}.`),
  depth: z.number().int().positive().optional().describe(`Traversal depth for graph queries. Defaults to ${DEFAULT_QUERY_DEPTH}.`),
  includePaths: z.boolean().optional().default(false).describe("Whether to include full paths in results, if applicable."),
  customCypher: z.string().optional().describe("Advanced: Provide a direct Cypher query for execution (use with caution)."),
  // Using z.any() for options where structure might vary or is complex
  customQueryOptions: z.record(z.any()).optional().describe("Additional provider-specific options for the GraphRAG query method.")
});
const queryOutputSchema = z.object({
  success: z.boolean(),
  results: z.array(z.any()).optional().describe("Array of query results (nodes, paths, records). Structure depends on the query and GraphRAG implementation."),
  message: z.string().optional().describe("Optional message, e.g., status or error details.")
});

// --- Add Documents Tool Schemas ---
const documentInputSchema = z.object({
  id: z.string().optional().describe("Optional unique ID for the document."),
  content: z.string().describe("Textual content of the document."),
  metadata: z.record(z.any()).optional().describe("Associated metadata for the document."),
  nodeLabel: z.string().optional().describe("Suggested primary node label to be extracted from this document.")
});
const addDocumentsInputSchema = z.object({
  documents: z.array(documentInputSchema).min(1).describe("Array of documents to add/update in the graph."),
  options: z.record(z.any()).optional().describe("Options for the document ingestion process (e.g., chunkingStrategy, embeddingModelId, overwrite).")
});
const addDocumentsOutputSchema = z.object({
  success: z.boolean(),
  processedCount: z.number().optional().describe("Number of documents processed."),
  addedCount: z.number().optional().describe("Number of new documents successfully added."),
  updatedCount: z.number().optional().describe("Number of existing documents successfully updated."),
  failedCount: z.number().optional().describe("Number of documents that failed processing."),
  errors: z.array(z.object({ documentId: z.string().optional(), error: z.string() })).optional().describe("Details of failures."),
  message: z.string().optional()
});

// --- Add Nodes Tool Schemas ---
const nodeInputSchema = z.object({
  id: z.string().optional().describe("Optional unique ID for the node. If not provided, it might be auto-generated or based on properties."),
  label: z.string().describe("Label for the node (e.g., 'Person', 'Company')."),
  properties: z.record(z.any()).describe("Key-value pairs of node properties.")
});
const addNodesInputSchema = z.object({
  nodes: z.array(nodeInputSchema).min(1).describe("Array of nodes to add to the graph."),
  options: z.record(z.any()).optional().describe("Options for adding nodes (e.g., overwrite).")
});
const addNodesOutputSchema = z.object({
  success: z.boolean(),
  addedCount: z.number().optional(),
  failedCount: z.number().optional(),
  errors: z.array(z.object({ nodeId: z.string().optional(), error: z.string() })).optional(),
  message: z.string().optional()
});

// --- Add Edges Tool Schemas ---
const edgeInputSchema = z.object({
  id: z.string().optional().describe("Optional unique ID for the edge."),
  sourceNodeId: z.string().describe("ID of the source/from node."),
  targetNodeId: z.string().describe("ID of the target/to node."),
  label: z.string().describe("Label for the edge (e.g., 'WORKS_FOR', 'INVESTED_IN')."),
  properties: z.record(z.any()).optional().describe("Key-value pairs of edge properties.")
});
const addEdgesInputSchema = z.object({
  edges: z.array(edgeInputSchema).min(1).describe("Array of edges to add to the graph."),
  options: z.record(z.any()).optional().describe("Options for adding edges (e.g., overwrite).")
});
const addEdgesOutputSchema = z.object({
  success: z.boolean(),
  addedCount: z.number().optional(),
  failedCount: z.number().optional(),
  errors: z.array(z.object({ edgeId: z.string().optional(), error: z.string() })).optional(),
  message: z.string().optional()
});

// --- Get Schema Tool Schemas ---
const getSchemaInputSchema = z.object({
  options: z.record(z.any()).optional().describe("Options for schema retrieval (e.g., includePropertyDetails, nodeLabels, relationshipTypes).")
});
const getSchemaOutputSchema = z.object({
  success: z.boolean(),
  schema: z.any().optional().describe("The graph schema definition (node labels, relationship types, properties)."),
  message: z.string().optional()
});

// --- Delete Nodes Tool Schemas ---
const deleteNodesInputSchema = z.object({
  nodeIds: z.array(z.string()).min(1).describe("Array of node IDs to delete."),
  options: z.record(z.any()).optional().describe("Options for deleting nodes (e.g., detach: true for DETACH DELETE).")
});
const deleteNodesOutputSchema = z.object({
  success: z.boolean(),
  deletedCount: z.number().optional(),
  message: z.string().optional()
});

// --- Delete Edges Tool Schemas ---
const deleteEdgesInputSchema = z.object({
  edgeIds: z.array(z.string()).min(1).describe("Array of edge IDs to delete."),
  options: z.record(z.any()).optional().describe("Options for deleting edges.")
});
const deleteEdgesOutputSchema = z.object({
  success: z.boolean(),
  deletedCount: z.number().optional(),
  message: z.string().optional()
});

// --- Update Node Tool Schemas ---
const updateNodeInputSchema = z.object({
  nodeId: z.string().describe("ID of the node to update."),
  propertiesToSet: z.record(z.any()).optional().describe("Properties to set or update on the node."),
  propertiesToRemove: z.array(z.string()).optional().describe("Property keys to remove from the node.")
});
const updateNodeOutputSchema = z.object({
  success: z.boolean(),
  updated: z.boolean().optional().describe("True if the node was found and update was attempted."),
  message: z.string().optional()
});

// --- Update Edge Tool Schemas ---
const updateEdgeInputSchema = z.object({
  edgeId: z.string().describe("ID of the edge to update."),
  propertiesToSet: z.record(z.any()).optional().describe("Properties to set or update on the edge."),
  propertiesToRemove: z.array(z.string()).optional().describe("Property keys to remove from the edge.")
});
const updateEdgeOutputSchema = z.object({
  success: z.boolean(),
  updated: z.boolean().optional().describe("True if the edge was found and update was attempted."),
  message: z.string().optional()
});


export const createGraphRAGTools = (config: MastraGraphRAGToolsConfig) => {
  const {
    graphRAGInstanceConfig,
    defaultMaxResults = DEFAULT_MAX_RESULTS,
  } = config;

  const unconfiguredErrorMsg = "GraphRAGTools are not configured: missing graphRAGInstanceConfig.";
  const initFailedErrorMsgPrefix = "GraphRAG instance initialization failed: ";

  const createErrorTool = (idSuffix: string, baseId: string, description: string, inputSchema: z.ZodTypeAny, outputSchema: z.ZodTypeAny, message: string) => createTool({
    id: `${baseId}-${idSuffix}`,
    description: `${description} (${idSuffix.replace('-', ' ')}).`,
    inputSchema,
    outputSchema,
    execute: async () => ({ success: false, message })
  });

  if (!graphRAGInstanceConfig) {
    logger.error(unconfiguredErrorMsg);
    const baseArgs = [queryInputSchema, queryOutputSchema, unconfiguredErrorMsg]; // Schemas are illustrative for unconfigured state
    return {
      queryTool: createErrorTool("unconfigured", "graph-rag-query", "GraphRAG query tool", queryInputSchema, queryOutputSchema, unconfiguredErrorMsg),
      addDocumentsTool: createErrorTool("unconfigured", "graph-rag-add-documents", "GraphRAG add documents tool", addDocumentsInputSchema, addDocumentsOutputSchema, unconfiguredErrorMsg),
      addNodesTool: createErrorTool("unconfigured", "graph-rag-add-nodes", "GraphRAG add nodes tool", addNodesInputSchema, addNodesOutputSchema, unconfiguredErrorMsg),
      addEdgesTool: createErrorTool("unconfigured", "graph-rag-add-edges", "GraphRAG add edges tool", addEdgesInputSchema, addEdgesOutputSchema, unconfiguredErrorMsg),
      getSchemaTool: createErrorTool("unconfigured", "graph-rag-get-schema", "GraphRAG get schema tool", getSchemaInputSchema, getSchemaOutputSchema, unconfiguredErrorMsg),
      deleteNodesTool: createErrorTool("unconfigured", "graph-rag-delete-nodes", "GraphRAG delete nodes tool", deleteNodesInputSchema, deleteNodesOutputSchema, unconfiguredErrorMsg),
      deleteEdgesTool: createErrorTool("unconfigured", "graph-rag-delete-edges", "GraphRAG delete edges tool", deleteEdgesInputSchema, deleteEdgesOutputSchema, unconfiguredErrorMsg),
      updateNodeTool: createErrorTool("unconfigured", "graph-rag-update-node", "GraphRAG update node tool", updateNodeInputSchema, updateNodeOutputSchema, unconfiguredErrorMsg),
      updateEdgeTool: createErrorTool("unconfigured", "graph-rag-update-edge", "GraphRAG update edge tool", updateEdgeInputSchema, updateEdgeOutputSchema, unconfiguredErrorMsg),
    };
  }

  let graphRAGInstance: GraphRAG;
  try {
    graphRAGInstance = new GraphRAG(graphRAGInstanceConfig as any); // Cast if InternalGraphRAGConfig doesn't perfectly match
    logger.info("GraphRAG instance initialized successfully.");
  } catch (e: any) {
    const initErrorMsg = `${initFailedErrorMsgPrefix}${e.message}`;
    logger.error(initErrorMsg, { error: e, config: graphRAGInstanceConfig });
    return {
      queryTool: createErrorTool("init-failed", "graph-rag-query", "GraphRAG query tool", queryInputSchema, queryOutputSchema, initErrorMsg),
      addDocumentsTool: createErrorTool("init-failed", "graph-rag-add-documents", "GraphRAG add documents tool", addDocumentsInputSchema, addDocumentsOutputSchema, initErrorMsg),
      addNodesTool: createErrorTool("init-failed", "graph-rag-add-nodes", "GraphRAG add nodes tool", addNodesInputSchema, addNodesOutputSchema, initErrorMsg),
      addEdgesTool: createErrorTool("init-failed", "graph-rag-add-edges", "GraphRAG add edges tool", addEdgesInputSchema, addEdgesOutputSchema, initErrorMsg),
      getSchemaTool: createErrorTool("init-failed", "graph-rag-get-schema", "GraphRAG get schema tool", getSchemaInputSchema, getSchemaOutputSchema, initErrorMsg),
      deleteNodesTool: createErrorTool("init-failed", "graph-rag-delete-nodes", "GraphRAG delete nodes tool", deleteNodesInputSchema, deleteNodesOutputSchema, initErrorMsg),
      deleteEdgesTool: createErrorTool("init-failed", "graph-rag-delete-edges", "GraphRAG delete edges tool", deleteEdgesInputSchema, deleteEdgesOutputSchema, initErrorMsg),
      updateNodeTool: createErrorTool("init-failed", "graph-rag-update-node", "GraphRAG update node tool", updateNodeInputSchema, updateNodeOutputSchema, initErrorMsg),
      updateEdgeTool: createErrorTool("init-failed", "graph-rag-update-edge", "GraphRAG update edge tool", updateEdgeInputSchema, updateEdgeOutputSchema, initErrorMsg),
    };
  }

  // Helper to wrap GraphRAG method calls
  const callGraphRAGMethod = async (methodName: string, executionContext: MastraToolExecutionContext<any>, ...args: any[]) => {
    const { runtime, context: toolInput } = executionContext;
    const currentLogger = runtime?.logger || logger;
    const abortSignal = runtime?.abortSignal;

    currentLogger.debug(`Executing GraphRAG method '${methodName}'`, { toolInputArgs: args, toolInput, abortSignal: !!abortSignal });

    try {
      const method = (graphRAGInstance as any)[methodName];
      if (typeof method !== 'function') {
        const message = `GraphRAG instance does not have a method named '${methodName}'. This tool's functionality is speculative.`;
        currentLogger.warn(message);
        return { success: false, message };
      }
      // Pass abortSignal as part of an options object if the method supports it.
      // This is a common pattern, but might need adjustment based on actual GraphRAG method signatures.
      const lastArg = args[args.length - 1];
      let methodArgs = args;
      if (typeof lastArg === 'object' && lastArg !== null && !Array.isArray(lastArg) && abortSignal) {
        // If last arg is an options object, try to add signal to it
        args[args.length - 1] = { ...lastArg, abortSignal };
      } else if (abortSignal) {
        // Otherwise, append an options object with the signal if the method might take it
        // This is speculative; actual methods might not support this directly.
        methodArgs = [...args, { abortSignal }];
      }
      
      const response = await method.apply(graphRAGInstance, methodArgs);
      currentLogger.info(`GraphRAG method '${methodName}' executed successfully.`);
      return response; // This response structure is method-dependent
    } catch (error: any) {
      currentLogger.error(`Error during GraphRAG method '${methodName}' execution:`, { error: error.message, stack: error.stack, args });
      return { success: false, message: `Error in '${methodName}': ${error.message}` }; // Return a standard error object
    }
  };

  // --- Query Tool ---
  const queryTool = createTool({
    id: "graph-rag-query",
    description: "Queries a knowledge graph using GraphRAG for relevant information.",
    inputSchema: queryInputSchema,
    outputSchema: queryOutputSchema,
    execute: async (executionContext: MastraToolExecutionContext<typeof queryInputSchema>) => {
      const { context: toolInput } = executionContext;
      const { query, limit, depth, nodeTypes, relationshipTypes, includePaths, customCypher, customQueryOptions } = toolInput;
      const effectiveLimit = limit ?? defaultMaxResults;
      const effectiveDepth = depth ?? graphRAGInstanceConfig.defaultQueryDepth ?? DEFAULT_QUERY_DEPTH;

      const queryParams = {
        limit: effectiveLimit,
        depth: effectiveDepth,
        nodeTypes,
        relationshipTypes,
        includePaths,
        customCypher,
        ...customQueryOptions
      };
      
      const response = await callGraphRAGMethod('query', executionContext, query, queryParams);
      // Adapt response to queryOutputSchema
      if (response && typeof response.success === 'boolean' && !response.success) return response; // Error from callGraphRAGMethod
      return { success: true, results: response || [], message: response?.message };
    }
  });

  // --- Add Documents Tool ---
  const addDocumentsTool = createTool({
    id: "graph-rag-add-documents",
    description: "Adds or updates documents in the GraphRAG knowledge graph.",
    inputSchema: addDocumentsInputSchema,
    outputSchema: addDocumentsOutputSchema,
    execute: async (executionContext: MastraToolExecutionContext<typeof addDocumentsInputSchema>) => {
      const { context: toolInput } = executionContext;
      const { documents, options } = toolInput;
      const response = await callGraphRAGMethod('addDocuments', executionContext, documents, options);
      if (response && typeof response.success === 'boolean' && !response.success) return response;
      return {
        success: true,
        addedCount: response?.addedCount,
        updatedCount: response?.updatedCount,
        processedCount: response?.processedCount ?? documents.length,
        failedCount: response?.failedCount,
        errors: response?.errors,
        message: response?.message ?? "Documents processing initiated."
      };
    }
  });

  // --- Add Nodes Tool ---
  const addNodesTool = createTool({
    id: "graph-rag-add-nodes",
    description: "Adds individual nodes to the GraphRAG knowledge graph.",
    inputSchema: addNodesInputSchema,
    outputSchema: addNodesOutputSchema,
    execute: async (executionContext: MastraToolExecutionContext<typeof addNodesInputSchema>) => {
      const { context: toolInput } = executionContext;
      const { nodes, options } = toolInput;
      const response = await callGraphRAGMethod('addNodes', executionContext, nodes, options);
      if (response && typeof response.success === 'boolean' && !response.success) return response;
      return {
        success: true,
        addedCount: response?.addedCount,
        failedCount: response?.failedCount,
        errors: response?.errors,
        message: response?.message ?? `${response?.addedCount || 0} nodes processed.`
      };
    }
  });

  // --- Add Edges Tool ---
  const addEdgesTool = createTool({
    id: "graph-rag-add-edges",
    description: "Adds individual edges to the GraphRAG knowledge graph.",
    inputSchema: addEdgesInputSchema,
    outputSchema: addEdgesOutputSchema,
    execute: async (executionContext: MastraToolExecutionContext<typeof addEdgesInputSchema>) => {
      const { context: toolInput } = executionContext;
      const { edges, options } = toolInput;
      const response = await callGraphRAGMethod('addEdges', executionContext, edges, options);
      if (response && typeof response.success === 'boolean' && !response.success) return response;
      return {
        success: true,
        addedCount: response?.addedCount,
        failedCount: response?.failedCount,
        errors: response?.errors,
        message: response?.message ?? `${response?.addedCount || 0} edges processed.`
      };
    }
  });

  // --- Get Schema Tool ---
  const getSchemaTool = createTool({
    id: "graph-rag-get-schema",
    description: "Retrieves the schema of the GraphRAG knowledge graph.",
    inputSchema: getSchemaInputSchema,
    outputSchema: getSchemaOutputSchema,
    execute: async (executionContext: MastraToolExecutionContext<typeof getSchemaInputSchema>) => {
      const { context: toolInput } = executionContext;
      const { options } = toolInput;
      const response = await callGraphRAGMethod('getSchema', executionContext, options);
      if (response && typeof response.success === 'boolean' && !response.success) return response;
      return { success: true, schema: response, message: response?.message };
    }
  });

  // --- Delete Nodes Tool ---
  const deleteNodesTool = createTool({
    id: "graph-rag-delete-nodes",
    description: "Deletes nodes from the GraphRAG knowledge graph.",
    inputSchema: deleteNodesInputSchema,
    outputSchema: deleteNodesOutputSchema,
    execute: async (executionContext: MastraToolExecutionContext<typeof deleteNodesInputSchema>) => {
      const { context: toolInput } = executionContext;
      const { nodeIds, options } = toolInput;
      const response = await callGraphRAGMethod('deleteNodes', executionContext, nodeIds, options);
      if (response && typeof response.success === 'boolean' && !response.success) return response;
      return { success: true, deletedCount: response?.deletedCount, message: response?.message };
    }
  });

  // --- Delete Edges Tool ---
  const deleteEdgesTool = createTool({
    id: "graph-rag-delete-edges",
    description: "Deletes edges from the GraphRAG knowledge graph.",
    inputSchema: deleteEdgesInputSchema,
    outputSchema: deleteEdgesOutputSchema,
    execute: async (executionContext: MastraToolExecutionContext<typeof deleteEdgesInputSchema>) => {
      const { context: toolInput } = executionContext;
      const { edgeIds, options } = toolInput;
      const response = await callGraphRAGMethod('deleteEdges', executionContext, edgeIds, options);
      if (response && typeof response.success === 'boolean' && !response.success) return response;
      return { success: true, deletedCount: response?.deletedCount, message: response?.message };
    }
  });

  // --- Update Node Tool ---
  const updateNodeTool = createTool({
    id: "graph-rag-update-node",
    description: "Updates properties of a node in the GraphRAG knowledge graph.",
    inputSchema: updateNodeInputSchema,
    outputSchema: updateNodeOutputSchema,
    execute: async (executionContext: MastraToolExecutionContext<typeof updateNodeInputSchema>) => {
      const { context: toolInput } = executionContext;
      const { nodeId, propertiesToSet, propertiesToRemove } = toolInput;
      const response = await callGraphRAGMethod('updateNode', executionContext, nodeId, propertiesToSet, propertiesToRemove);
      if (response && typeof response.success === 'boolean' && !response.success) return response;
      return { success: true, updated: response?.updated ?? true, message: response?.message ?? "Node update processed." };
    }
  });

  // --- Update Edge Tool ---
  const updateEdgeTool = createTool({
    id: "graph-rag-update-edge",
    description: "Updates properties of an edge in the GraphRAG knowledge graph.",
    inputSchema: updateEdgeInputSchema,
    outputSchema: updateEdgeOutputSchema,
    execute: async (executionContext: MastraToolExecutionContext<typeof updateEdgeInputSchema>) => {
      const { context: toolInput } = executionContext;
      const { edgeId, propertiesToSet, propertiesToRemove } = toolInput;
      const response = await callGraphRAGMethod('updateEdge', executionContext, edgeId, propertiesToSet, propertiesToRemove);
      if (response && typeof response.success === 'boolean' && !response.success) return response;
      return { success: true, updated: response?.updated ?? true, message: response?.message ?? "Edge update processed." };
    }
  });

  return {
    queryTool,
    addDocumentsTool,
    addNodesTool,
    addEdgesTool,
    getSchemaTool,
    deleteNodesTool,
    deleteEdgesTool,
    updateNodeTool,
    updateEdgeTool,
  };
};