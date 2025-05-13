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
  storePrefix: z.string().optional(),
  vectorUrl: z.string().optional(),
  vectorToken: z.string().optional(),
  vectorIndexName: z.string().optional(),
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
  thread_id: string; // Ensure this matches data-schema.md
  content: string | Record<string, any>; // Allow content to be object for tool calls
  role: MessageRole;
  type: MessageType;
  name?: string; // For tool calls/results
  createdAt: Date;
  embedding?: number[];
  _tokens?: number;
  _filtered?: boolean;
  _remove?: boolean;
  [key: string]: any; // Allow other properties, but try to define common ones
}

/**
 * Thread interface
 */
export interface Thread {
  id: string;
  createdAt: Date;
  metadata?: Record<string, any>;
  messages: Message[]; // Holds the actual message objects when retrieved
  resourceId?: string; 
  title?: string; 
  updatedAt?: Date; 
}

/**
 * User interface
 */
export interface User {
  id: string;
  createdAt: Date;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow other properties
}

/**
 * Assistant interface
 */
export interface Assistant {
  id: string;
  createdAt: Date;
  name?: string;
  model?: string;
  instructions?: string;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow other properties
}

/**
 * MemoryRecord interface
 */
export interface MemoryRecord {
  id: string;
  vector?: number[]; // Embedding vector
  metadata?: Record<string, any>; // Should contain content, role, type, thread_id, messageId etc.
  score?: number; // Similarity score
  content?: string | Record<string, any>; 
  role?: MessageRole; 
  type?: MessageType; 
  thread_id?: string; // Changed from threadId to thread_id for consistency with Message
  messageId?: string; 
  createdAt?: Date | string; // Store as ISO string, convert to Date on retrieval
}

/**
 * Storage interface
 */
export interface Storage {
  set(_key: string, _value: string): Promise<boolean>; // Keep params for clarity, linters might complain
  get(_key: string): Promise<string | null>; // Keep params for clarity
  delete(_key: string): Promise<boolean>; // Keep params for clarity
  lpush?(_key: string, _value: string): Promise<boolean>; // Keep params for clarity
  lrange?(_key: string, _start: number, _end: number): Promise<string[]>; // Keep params for clarity
}

/**
 * MemoryProvider interface defines the contract for memory storage and retrieval.
 */
export interface MemoryProvider {
  // Thread Management
  createThread(thread: Partial<Thread>): Promise<Thread>;
  getThread(threadId: string): Promise<Thread | null>;
  updateThread(threadId: string, updates: Partial<Thread>): Promise<Thread | null>;
  deleteThread(threadId: string): Promise<void>;

  // Message Management
  addMessage(threadId: string, message: Omit<Message, 'id' | 'createdAt' | 'thread_id'>): Promise<Message>; // thread_id will be set internally
  getMessage(messageId: string): Promise<Message | null>;
  updateMessage(messageId: string, updates: Partial<Message>): Promise<Message | null>;
  deleteMessage(messageId: string, threadId?: string): Promise<void>; // Added optional threadId as it's often needed
  getMessages(threadId: string, limit?: number, before?: string, after?: string): Promise<Message[]>;

  // Semantic Search
  findRelatedMessages?(
    threadId: string,
    queryEmbedding: number[],
    options?: { topK?: number; filter?: Record<string, any> | string }
  ): Promise<MemoryRecord[]>;

  // User Management
  createUser?(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  getUser?(userId: string): Promise<User | null>;
  updateUser?(userId: string, updates: Partial<User>): Promise<User | null>;
  deleteUser?(userId: string): Promise<void>;

  // Assistant Management
  createAssistant?(assistant: Omit<Assistant, 'id' | 'createdAt'>): Promise<Assistant>;
  getAssistant?(assistantId: string): Promise<Assistant | null>;
  updateAssistant?(assistantId: string, updates: Partial<Assistant>): Promise<Assistant | null>;
  deleteAssistant?(assistantId: string): Promise<void>;

  // Generic Memory Record Management
  saveRecord?(record: MemoryRecord): Promise<MemoryRecord>;
  getRecord?(recordId: string): Promise<MemoryRecord | null>;
  deleteRecord?(recordId: string): Promise<void>;

  // Utility
  clearAllData?(): Promise<void>;
}

/**
 * Memory processor interface alias
 */
export type MemoryProcessorAlias = MemoryProcessor; 
export type IMemoryProcessor = MemoryProcessor;