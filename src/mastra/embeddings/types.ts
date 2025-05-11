/**
 * Types for the Embeddings module
 */

import { z } from 'zod';
import { BaseConfigSchema } from '../types';

/**
 * Embeddings configuration schema
 */
export const EmbeddingsConfigSchema = z.object({
  ...BaseConfigSchema.shape,
  provider: z.enum(['xenova', 'google']),
  options: z.record(z.any()).optional(),
});

/**
 * Embeddings configuration type
 */
export type EmbeddingsConfig = z.infer<typeof EmbeddingsConfigSchema>;

/**
 * Xenova embeddings configuration schema
 */
export const XenovaEmbeddingsConfigSchema = z.object({
  modelName: z.string().default('all-MiniLM-L6-v2'),
  quantization: z.enum(['int8', 'none']).default('int8'),
  dimensions: z.number().default(384),
});

/**
 * Xenova embeddings configuration type
 */
export type XenovaEmbeddingsConfig = z.infer<typeof XenovaEmbeddingsConfigSchema>;

/**
 * Google embeddings configuration schema
 */
export const GoogleEmbeddingsConfigSchema = z.object({
  modelName: z.string().default('embedding-001'),
  apiKey: z.string().optional(),
  dimensions: z.number().default(1536),
});

/**
 * Google embeddings configuration type
 */
export type GoogleEmbeddingsConfig = z.infer<typeof GoogleEmbeddingsConfigSchema>;

/**
 * Embedding model interface
 */
export interface EmbeddingModel {
  embed(text: string): Promise<number[]>;
  embedBatch?(texts: string[]): Promise<number[][]>;
}

/**
 * Embedding result interface
 */
export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  text: string;
  metadata?: Record<string, any>;
}
