/**
 * Types for the Agents module
 */

import { z } from 'zod';
import { BaseConfigSchema } from '../types';
import { AgentType, DEFAULT_MODEL_NAMES } from './constants';

/**
 * Agent configuration schema
 */
export const AgentConfigSchema = z.object({
  ...BaseConfigSchema.shape,
  name: z.string(),
  instructions: z.string(),
  modelName: z.string().default(DEFAULT_MODEL_NAMES.GEMINI_PRO),
  memory: z.any().optional(),
  tools: z.array(z.any()).optional(),
  type: z.nativeEnum(AgentType).default(AgentType.BASE),
  maxTokens: z.number().optional(),
  temperature: z.number().min(0).max(1).default(0.7),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().min(1).optional(),
});

/**
 * Agent configuration type
 */
export type AgentConfig = z.infer<typeof AgentConfigSchema>;

/**
 * Google agent configuration schema
 */
export const GoogleAgentConfigSchema = AgentConfigSchema.extend({
  type: z.literal(AgentType.GOOGLE).default(AgentType.GOOGLE),
  modelName: z.string().default(DEFAULT_MODEL_NAMES.GEMINI_PRO),
  multimodal: z.boolean().default(true),
  safetySettings: z.record(z.any()).optional(),
});

/**
 * Google agent configuration type
 */
export type GoogleAgentConfig = z.infer<typeof GoogleAgentConfigSchema>;

/**
 * Supervisor agent configuration schema
 */
export const SupervisorAgentConfigSchema = AgentConfigSchema.extend({
  type: z.literal(AgentType.SUPERVISOR).default(AgentType.SUPERVISOR),
  workerAgents: z.array(z.any()).optional(),
});

/**
 * Supervisor agent configuration type
 */
export type SupervisorAgentConfig = z.infer<typeof SupervisorAgentConfigSchema>;

/**
 * Worker agent configuration schema
 */
export const WorkerAgentConfigSchema = AgentConfigSchema.extend({
  type: z.literal(AgentType.WORKER).default(AgentType.WORKER),
  domain: z.string(),
  expertise: z.array(z.string()).optional(),
});

/**
 * Worker agent configuration type
 */
export type WorkerAgentConfig = z.infer<typeof WorkerAgentConfigSchema>;

/**
 * Tool configuration schema
 */
export const ToolConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  parameters: z.record(z.any()).optional(),
  handler: z.function().args(z.any()).returns(z.promise(z.any())),
});

/**
 * Tool configuration type
 */
export type ToolConfig = z.infer<typeof ToolConfigSchema>;

/**
 * Stream options schema
 */
export const StreamOptionsSchema = z.object({
  resourceId: z.string().optional(),
  threadId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Stream options type
 */
export type StreamOptions = z.infer<typeof StreamOptionsSchema>;

/**
 * Generate options schema
 */
export const GenerateOptionsSchema = StreamOptionsSchema;

/**
 * Generate options type
 */
export type GenerateOptions = z.infer<typeof GenerateOptionsSchema>;
