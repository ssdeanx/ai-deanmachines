/**
 * Core types for the Mastra AI application
 * 
 * This file contains shared types used across multiple modules.
 */

import { z } from 'zod';

/**
 * Base configuration schema for all components
 */
export const BaseConfigSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
});

/**
 * Base configuration type
 */
export type BaseConfig = z.infer<typeof BaseConfigSchema>;

/**
 * Mastra configuration schema
 */
export const MastraConfigSchema = z.object({
  port: z.number().default(4111),
  timeout: z.number().default(30000),
  cors: z.object({
    origin: z.string().default('*'),
    allowMethods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
  }).optional(),
});

/**
 * Mastra configuration type
 */
export type MastraConfig = z.infer<typeof MastraConfigSchema>;

/**
 * Provider types supported by the application
 */
export enum Provider {
  GOOGLE = 'google',
  XENOVA = 'xenova',
  UPSTASH = 'upstash',
  LOCAL = 'local',
}

/**
 * Model types supported by the application
 */
export enum ModelType {
  LLM = 'llm',
  EMBEDDING = 'embedding',
  VOICE = 'voice',
}

/**
 * Storage types supported by the application
 */
export enum StorageType {
  MEMORY = 'memory',
  VECTOR = 'vector',
  FILE = 'file',
}

/**
 * Common options for all API requests
 */
export interface RequestOptions {
  resourceId?: string;
  threadId?: string;
  metadata?: Record<string, any>;
}

/**
 * Common response interface
 */
export interface Response<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}
