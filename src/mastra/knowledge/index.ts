/**
 * Knowledge module for Mastra AI
 * 
 * This module exports all knowledge-related implementations and related types.
 */

// Export the VectorStore class and its types
export { VectorStore, VectorStoreConfig, VectorStoreConfigSchema } from './vectorStore';
export { UpstashVectorStore } from './upstashVectorStore';

// TODO: Add more knowledge implementations as they are developed
// export { RAGSystem } from './ragSystem';
// export { GraphProcessor } from './graphProcessor';
