/**
 * Types for the Memory module
 */

import { z } from 'zod';
import { BaseConfigSchema } from '../types';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { CoreMessage } from 'ai';

/**
 * Semantic recall configuration schema
 */
export const SemanticRecallConfigSchema = z.object({
  enabled: z.boolean().default(true),
  topK: z.number().min(1).default(5),
  messageRange: z.number().min(1).default(100),
  threshold: z.number().min(0).max(1).optional(),
});

/**
 * Semantic recall configuration type
 */
export type SemanticRecallConfig = z.infer<typeof SemanticRecallConfigSchema>;

/**
 * Working memory configuration schema
 */
export const WorkingMemoryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  template: z.string().optional(),
  updateFrequency: z.number().min(1).default(5),
});

/**
 * Working memory configuration type
 */
export type WorkingMemoryConfig = z.infer<typeof WorkingMemoryConfigSchema>;

/**
 * Re-export types from @mastra/core/memory and 'ai'
 * for backward compatibility and proper processor implementation
 */
export { MemoryProcessor };
export type { MemoryProcessorOpts, CoreMessage };

// Type adapter to make Message compatible with CoreMessage
export type MessageOrCoreMessage = Message | CoreMessage;

/**
 * Memory configuration schema
 */
export const MemoryConfigSchema = z.object({
  ...BaseConfigSchema.shape,
  provider: z.enum(['upstash', 'local']),
  options: z.record(z.any()).optional(),
  lastMessages: z.number().min(1).default(20),
  semanticRecall: SemanticRecallConfigSchema.optional(),
  workingMemory: WorkingMemoryConfigSchema.optional(),
  processors: z.array(z.any()).optional(),
});

/**
 * Memory configuration type
 */
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;

/**
 * Upstash memory configuration schema
 */
export const UpstashMemoryConfigSchema = z.object({
  url: z.string(),
  token: z.string(),
  prefix: z.string().optional(),
  vectorUrl: z.string().optional(),
  vectorToken: z.string().optional(),
  vectorIndex: z.string().optional(),
});

/**
 * Upstash memory configuration type
 */
export type UpstashMemoryConfig = z.infer<typeof UpstashMemoryConfigSchema>;

/**
 * Local memory configuration schema
 */
export const LocalMemoryConfigSchema = z.object({
  path: z.string().optional(),
});

/**
 * Local memory configuration type
 */
export type LocalMemoryConfig = z.infer<typeof LocalMemoryConfigSchema>;

/**
 * Message role type
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';

/**
 * Message type
 */
export type MessageType = 'text' | 'tool-call' | 'tool-result';

/**
 * Message interface
 */
export interface Message {
  id: string;
  thread_id: string;
  content: string | Record<string, any>;
  role: MessageRole;
  type: MessageType;
  name?: string;
  timestamp?: string | Date;
  createdAt: Date;
  _tokens?: number;
  _filtered?: boolean;
  _remove?: boolean;
  [key: string]: any;
}

/**
 * Thread interface
 */
export interface Thread {
  id: string;
  createdAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Storage interface
 */
export interface Storage {
  set(key: string, value: string): Promise<boolean>;
  get(key: string): Promise<string | null>;
  lpush(key: string, value: string): Promise<boolean>;
  lrange(key: string, start: number, end: number): Promise<string[]>;
}

/**
 * Memory processor interface alias
 * Processors modify messages before they are sent to the LLM
 */
export type IMemoryProcessor = MemoryProcessor;