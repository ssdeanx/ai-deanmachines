/**
 * Graph RAG Tool Suite implementation for Mastra
 *
 * @file Provides a suite of tools for Graph-based Retrieval Augmented Generation (RAG):
 *       - queryTool: For querying the knowledge graph.
 *       - addDocumentsTool: For adding documents to the knowledge graph.
 *       - getSchemaTool: For retrieving the schema of the knowledge graph.
 * @version 1.0.0
 * @author Mastra Team
 * @copyright 2025
 * @license MIT
 */
import { z } from 'zod';
import { createTool, ToolExecutionContext, ToolExecutionOptions } from '@mastra/core';
import { GraphRAG } from '@mastra/rag'; // Assuming GraphRAG class is the primary export
import { createLogger, MastraLogger } from '@mastra/loggers';

const logger: MastraLogger = createLogger({
  name: 'Mastra-GraphRAGToolSuite',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

const DEFAULT_MAX_RESULTS = 10;

// Define the expected configuration structure for the GraphRAG instance itself.
// This should align with what @mastra/rag GraphRAG constructor expects.
interface InternalGraphRAGConfig {
  vectorStoreName: string; // Example, adjust based on actual GraphRAG needs
  indexName: string;       // Example
  model: any;              // Example: LLM model instance or config for the embedder/ranker
  graphOptions?: {
    dimension?: number;
    threshold?: number;
    randomWalkSteps?: number;
    restartProb?: number;
  };
  // Add any other necessary configuration fields for GraphRAG constructor
  // e.g., connection details for graph DB, vector DB, LLM API keys if managed internally by GraphRAG
}

export interface MastraGraphRAGToolsConfig {
  graphRAGInstanceConfig: InternalGraphRAGConfig;
  defaultMaxResults?: number;
}

// --- Schemas for the tools ---

const queryInputSchema = z.object({
  query: z.string().describe("Query to search for in the knowledge graph"),
  nodeTypes: z.array(z.string()).optional()
    .describe("Node types to filter results (e.g., ['Person', 'Organization'])"),
  relationshipTypes: z.array(z.string()).optional()
    .describe("Relationship types to traverse (e.g., ['WORKS_FOR', 'KNOWS'])"),
  limit: z.number().int().positive().optional()
    .describe(`Maximum number of results to return. Defaults to ${DEFAULT_MAX_RESULTS}`),
  customQueryOptions: z.any().optional()
    .describe("Additional options specific to the GraphRAG query method (e.g., depth, specific algorithms).")
});
const queryOutputSchema = z.object({
  success: z.boolean(),
  results: z.array(z.any()).optional().describe("Array of results from the graph query."),
  message: z.string().optional().describe("Optional message, e.g., in case of error or status update.")
});

const addDocumentsInputSchema = z.object({
  documents: z.array(z.object({
    id: z.string().optional().describe("Optional unique ID for the document."),
    content: z.string().describe("Textual content of the document."),
    metadata: z.record(z.any()).optional().describe("Associated metadata for the document.")
  })).min(1).describe("Array of documents to add to the graph."),
  options: z.any().optional().describe("Additional options for the document ingestion process (e.g., chunking strategy, batch size).")
});
const addDocumentsOutputSchema = z.object({
  success: z.boolean(),
  addedCount: z.number().optional().describe("Number of documents successfully processed or submitted for addition."),
  message: z.string().optional()
});

const getSchemaInputSchema = z.object({
  options: z.any().optional().describe("Options for schema retrieval (e.g., retrieve for specific node/relationship types, include property details).")
});
const getSchemaOutputSchema = z.object({
  success: z.boolean(),
  schema: z.any().optional().describe("The graph schema definition (e.g., node labels, relationship types, properties)."),
  message: z.string().optional()
});


export const createGraphRAGTools = (config: MastraGraphRAGToolsConfig) => {
  const {
    graphRAGInstanceConfig,
    defaultMaxResults = DEFAULT_MAX_RESULTS,
  } = config;

  const unconfiguredErrorMsg = "GraphRAGTools are not configured: missing graphRAGInstanceConfig.";
  const initFailedErrorMsgPrefix = "GraphRAG instance initialization failed: ";

  if (!graphRAGInstanceConfig) {
    logger.error(unconfiguredErrorMsg);
    return {
      queryTool: createTool({
        id: "graph-rag-query-unconfigured",
        description: "GraphRAG query tool (unconfigured).",
        inputSchema: queryInputSchema,
        outputSchema: queryOutputSchema,
        execute: async () => ({ success: false, message: unconfiguredErrorMsg })
      }),
      addDocumentsTool: createTool({
        id: "graph-rag-add-documents-unconfigured",
        description: "GraphRAG add documents tool (unconfigured).",
        inputSchema: addDocumentsInputSchema,
        outputSchema: addDocumentsOutputSchema,
        execute: async () => ({ success: false, message: unconfiguredErrorMsg })
      }),
      getSchemaTool: createTool({
        id: "graph-rag-get-schema-unconfigured",
        description: "GraphRAG get schema tool (unconfigured).",
        inputSchema: getSchemaInputSchema,
        outputSchema: getSchemaOutputSchema,
        execute: async () => ({ success: false, message: unconfiguredErrorMsg })
      }),
    };
  }

  let graphRAGInstance: GraphRAG;
  try {
    graphRAGInstance = new GraphRAG(graphRAGInstanceConfig as any);
    logger.info("GraphRAG instance initialized successfully.");
  } catch (e: any) {
    const initErrorMsg = `${initFailedErrorMsgPrefix}${e.message}`;
    logger.error(initErrorMsg, { error: e, config: graphRAGInstanceConfig });
    return {
      queryTool: createTool({
        id: "graph-rag-query-init-failed",
        description: "GraphRAG query tool (initialization failed).",
        inputSchema: queryInputSchema,
        outputSchema: queryOutputSchema,
        execute: async () => ({ success: false, message: initErrorMsg })
      }),
      addDocumentsTool: createTool({
        id: "graph-rag-add-documents-init-failed",
        description: "GraphRAG add documents tool (initialization failed).",
        inputSchema: addDocumentsInputSchema,
        outputSchema: addDocumentsOutputSchema,
        execute: async () => ({ success: false, message: initErrorMsg })
      }),
      getSchemaTool: createTool({
        id: "graph-rag-get-schema-init-failed",
        description: "GraphRAG get schema tool (initialization failed).",
        inputSchema: getSchemaInputSchema,
        outputSchema: getSchemaOutputSchema,
        execute: async () => ({ success: false, message: initErrorMsg })
      }),
    };
  }

  // --- Query Tool ---
  const queryTool = createTool({
    id: "graph-rag-query",
    description: "Queries a knowledge graph using GraphRAG for relevant information.",
    inputSchema: queryInputSchema,
    outputSchema: queryOutputSchema,
    execute: async (
      executionContext: ToolExecutionContext<typeof queryInputSchema>,
      _options?: ToolExecutionOptions
    ) => {
      const { context: toolInput, runtime } = executionContext;
      const abortSignal = runtime?.abortSignal;
      const { query, nodeTypes, relationshipTypes, limit, customQueryOptions } = toolInput;
      const effectiveLimit = limit ?? defaultMaxResults;

      (runtime?.logger || logger).debug(`Executing GraphRAG query: "${query}"`, { toolInput, abortSignal: !!abortSignal });

      try {
        if (typeof graphRAGInstance.query !== 'function') {
          const message = "GraphRAG instance does not have a 'query' method or it's not implemented as expected.";
          (runtime?.logger || logger).warn(message);
          return { success: false, message };
        }

        const results = await graphRAGInstance.query(query, {
          limit: effectiveLimit,
          nodeTypes,
          relationshipTypes,
          ...(customQueryOptions || {})
        }, { abortSignal });

        (runtime?.logger || logger).info(`GraphRAG query successful, returned ${Array.isArray(results) ? results.length : 'unknown number of'} results.`);
        return { success: true, results: results || [] };
      } catch (error: any) {
        (runtime?.logger || logger).error("Error during GraphRAG query execution:", { query, error: error.message, stack: error.stack });
        return { success: false, message: `Error querying GraphRAG: ${error.message}` };
      }
    }
  });

  // --- Add Documents Tool ---
  const addDocumentsTool = createTool({
    id: "graph-rag-add-documents",
    description: "Adds documents to the GraphRAG knowledge graph.",
    inputSchema: addDocumentsInputSchema,
    outputSchema: addDocumentsOutputSchema,
    execute: async (
      executionContext: ToolExecutionContext<typeof addDocumentsInputSchema>,
      _options?: ToolExecutionOptions
    ) => {
      const { context: toolInput, runtime } = executionContext;
      const abortSignal = runtime?.abortSignal;
      const { documents, options } = toolInput;

      (runtime?.logger || logger).debug(`Attempting to add ${documents.length} documents to GraphRAG.`, { options, abortSignal: !!abortSignal });

      try {
        if (typeof (graphRAGInstance as any).addDocuments !== 'function') {
          const message = "GraphRAG instance does not have an 'addDocuments' method. This tool's functionality is speculative.";
          (runtime?.logger || logger).warn(message);
          return { success: false, message };
        }
        
        const response = await (graphRAGInstance as any).addDocuments(documents, options, { abortSignal });

        (runtime?.logger || logger).info(`Successfully processed addDocuments request for ${documents.length} documents. Response:`, response);
        return { success: true, addedCount: response?.addedCount ?? documents.length, message: response?.message ?? "Documents submitted for processing." };
      } catch (error: any) {
        (runtime?.logger || logger).error("Error during GraphRAG addDocuments execution:", { error: error.message, stack: error.stack });
        return { success: false, message: `Error adding documents to GraphRAG: ${error.message}` };
      }
    }
  });

  // --- Get Schema Tool ---
  const getSchemaTool = createTool({
    id: "graph-rag-get-schema",
    description: "Retrieves the schema of the GraphRAG knowledge graph.",
    inputSchema: getSchemaInputSchema,
    outputSchema: getSchemaOutputSchema,
    execute: async (
      executionContext: ToolExecutionContext<typeof getSchemaInputSchema>,
      _options?: ToolExecutionOptions
    ) => {
      const { context: toolInput, runtime } = executionContext;
      const abortSignal = runtime?.abortSignal;
      const { options } = toolInput;

      (runtime?.logger || logger).debug("Attempting to retrieve GraphRAG schema.", { options, abortSignal: !!abortSignal });

      try {
        if (typeof (graphRAGInstance as any).getSchema !== 'function') {
          const message = "GraphRAG instance does not have a 'getSchema' method. This tool's functionality is speculative.";
          (runtime?.logger || logger).warn(message);
          return { success: false, message };
        }

        const schema = await (graphRAGInstance as any).getSchema(options, { abortSignal });

        (runtime?.logger || logger).info("GraphRAG schema retrieval successful.");
        return { success: true, schema };
      } catch (error: any) {
        (runtime?.logger || logger).error("Error during GraphRAG getSchema execution:", { error: error.message, stack: error.stack });
        return { success: false, message: `Error retrieving schema from GraphRAG: ${error.message}` };
      }
    }
  });

  return {
    queryTool,
    addDocumentsTool,
    getSchemaTool,
  };
};