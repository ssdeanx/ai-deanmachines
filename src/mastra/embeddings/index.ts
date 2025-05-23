/**
 * Embeddings module for Mastra AI
 *
 * This module exports all embedding implementations and related types.
 */

// Export the Embeddings class and its types
export { Embeddings } from './embeddings';
export type { EmbeddingsConfig } from './embeddings';
export { EmbeddingsConfigSchema } from './embeddings';
export { XenovaEmbeddings } from './xenovaEmbeddings';

// TODO: Add more embedding implementations as they are developed
// export { GoogleEmbeddings } from './googleEmbeddings';
