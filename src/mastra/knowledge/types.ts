/**
 * Types for the Knowledge module
 */

import { z } from 'zod';
import { BaseConfigSchema } from '../types';

/**
 * Vector store configuration schema
 */
export const VectorStoreConfigSchema = z.object({
  ...BaseConfigSchema.shape,
  provider: z.enum(['upstash', 'local']),
  options: z.record(z.any()).optional(),
});

/**
 * Vector store configuration type
 */
export type VectorStoreConfig = z.infer<typeof VectorStoreConfigSchema>;

/**
 * Upstash vector store configuration schema
 */
export const UpstashVectorStoreConfigSchema = z.object({
  url: z.string(),
  token: z.string(),
  namespace: z.string().optional(),
});

/**
 * Upstash vector store configuration type
 */
export type UpstashVectorStoreConfig = z.infer<typeof UpstashVectorStoreConfigSchema>;

/**
 * Local vector store configuration schema
 */
export const LocalVectorStoreConfigSchema = z.object({
  path: z.string().optional(),
});

/**
 * Local vector store configuration type
 */
export type LocalVectorStoreConfig = z.infer<typeof LocalVectorStoreConfigSchema>;

/**
 * Document interface
 */
export interface Document {
  id: string;
  text: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

/**
 * Query result interface
 */
export interface QueryResult {
  id: string;
  text: string;
  metadata?: Record<string, any>;
  score?: number;
  vector?: number[];
}

/**
 * Query options interface
 */
export interface QueryOptions {
  topK?: number;
  includeMetadata?: boolean;
  includeVectors?: boolean;
  filter?: Record<string, any>;
  namespace?: string;
}

/**
 * RAG workflow configuration schema
 */
export const RAGWorkflowConfigSchema = z.object({
  embeddingProvider: z.any(),
  vectorStore: z.any(),
  modelName: z.string().default('gemini-2.5-pro-preview-05-06'),
  topK: z.number().default(5),
  contextTemplate: z.string(),
  reranking: z.boolean().default(false),
});

/**
 * RAG workflow configuration type
 */
export type RAGWorkflowConfig = z.infer<typeof RAGWorkflowConfigSchema>;

/**
 * RAG state interface
 */
export interface RAGState {
  query: string;
  context?: string;
  response?: string;
}
