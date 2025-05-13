/**
 * Graph RAG Tool implementation for Mastra
 * 
 * @file Provides a Graph-based Retrieval Augmented Generation (RAG) tool
 * @version 1.0.0
 * @author Mastra Team
 * @copyright 2025
 * @license MIT
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createLogger } from '@mastra/core/logger';
import { Neo4jGraphStore } from "@mastra/knowledge/neo4j";
import { VectorStore } from "@mastra/knowledge/vector";
import { EmbeddingModel } from "@mastra/embeddings";

// Create a logger instance for the GraphRAGTool
const logger = createLogger({
  name: 'Mastra-GraphRAGTool',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

/**
 * Configuration for the Graph RAG tool
 */
export interface GraphRAGToolConfig {
  /** Neo4j graph store instance */
  graphStore: Neo4jGraphStore;
  /** Vector store instance for semantic search */
  vectorStore: VectorStore;
  /** Embedding model for query embedding */
  embeddingModel: EmbeddingModel;
  /** Maximum number of results to return */
  maxResults?: number;
  /** Minimum relevance score (0-1) for results */
  minRelevanceScore?: number;
  /** Whether to include graph relationships in results */
  includeRelationships?: boolean;
  /** Maximum hop distance for graph traversal */
  maxHops?: number;
}

/**
 * Creates a Graph RAG tool for knowledge retrieval using graph and vector search
 * 
 * @param config - Configuration for the Graph RAG tool
 * @returns Tool object that can be used with Mastra agents
 * 
 * @example
 * 
 * // Create the Graph RAG tool
 * const graphRAGTool = createGraphRAGTool({
 *   graphStore: neo4jStore,
 *   vectorStore: pineconeStore,
 *   embeddingModel: openAIEmbeddings,
 *   maxResults: 5,
 *   includeRelationships: true
 * });
 * 
 * // Add to agent tools
 * const agent = new BaseAgent({
 *   name: 'KnowledgeAgent',
 *   tools: [graphRAGTool]
 * });
 * 
 */
export const createGraphRAGTool = (config: GraphRAGToolConfig) => {
  const {
    graphStore,
    vectorStore,
    embeddingModel,
    maxResults = 5,
    minRelevanceScore = 0.7,
    includeRelationships = true,
    maxHops = 2
  } = config;
  
  return createTool({
    id: "graph-rag",
    name: "retrieveKnowledge",
    description: "Retrieves knowledge using graph-based RAG with both semantic and structural relevance",
    inputSchema: z.object({
      /**
       * Query to search for in the knowledge graph
       */
      query: z.string().describe("Query to search for in the knowledge graph"),
      
      /**
       * Optional node types to filter results
       */
      nodeTypes: z.array(z.string()).optional()
        .describe("Node types to filter results (e.g., ['Person', 'Organization'])"),
      
      /**
       * Optional relationship types to traverse
       */
      relationshipTypes: z.array(z.string()).optional()
        .describe("Relationship types to traverse (e.g., ['WORKS_FOR', 'KNOWS'])"),
      
      /**
       * Maximum number of results to return
       */
      limit: z.number().optional().default(maxResults)
        .describe("Maximum number of results to return"),
      
      /**
       * Whether to include graph relationships in results
       */
      includeRelationships: z.boolean().optional().default(includeRelationships)
        .describe("Whether to include graph relationships in results"),
      
      /**
       * Maximum hop distance for graph traversal
       */
      maxHops: z.number().optional().default(maxHops)
        .describe("Maximum hop distance for graph traversal")
    }),
    
    /**
     * Executes a graph-based RAG query
     * 
     * @param params - Parameters for the knowledge retrieval
     * @param options - Execution options including abort signal
     * @returns Retrieved knowledge with both semantic and structural relevance
     */
    execute: async ({ 
      query, 
      nodeTypes, 
      relationshipTypes, 
      limit = maxResults,
      includeRelationships: includeRels = includeRelationships,
      maxHops: hops = maxHops
    }, { abortSignal }) => {
      const operationId = `rag-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const startTime = Date.now();
      
      logger.info(`Starting Graph RAG query [${operationId}]`, {
        query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
        operationId,
        nodeTypes,
        relationshipTypes,
        limit,
        includeRels,
        hops
      });
      
      try {
        // Set up abort handling
        let aborted = false;
        const abortListener = () => {
          aborted = true;
          logger.warn(`Received abort signal for RAG operation [${operationId}]`);
        };
        
        if (abortSignal) {
          abortSignal.addEventListener('abort', abortListener);
        }
        
        // Generate query embedding
        logger.debug(`Generating embedding for query [${operationId}]`);
        const embedding = await embeddingModel.embed(query);
        
        if (aborted) throw new Error('Operation aborted during embedding generation');
        
        // Perform vector search
        logger.debug(`Performing vector search [${operationId}]`);
        const vectorResults = await vectorStore.search({
          embedding,
          filter: nodeTypes ? { nodeType: { $in: nodeTypes } } : undefined,
          limit: limit * 2, // Get more results for filtering
          minScore: minRelevanceScore
        });
        
        if (aborted) throw new Error('Operation aborted during vector search');