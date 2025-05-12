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
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().min(1).optional(),
  maxRetries: z.number().optional(),
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

/**
 * Memory context options schema
 */
export const MemoryContextOptionsSchema = z.object({
  resourceId: z.string().optional(),
  threadId: z.string().optional(),
  semanticQuery: z.string().optional(),
  vectorSearch: z.boolean().optional(),
  semanticLimit: z.number().int().positive().optional().default(5),
  messageRange: z.number().int().positive().optional().default(100),
  useWorkingMemory: z.boolean().optional(),
  applyProcessors: z.boolean().optional(),
  processors: z.array(z.string()).optional(),
  context: z.record(z.any()).optional(),
});

/**
 * Memory context options type
 */
export type MemoryContextOptions = z.infer<typeof MemoryContextOptionsSchema>;

/**
 * Message role schema
 */
export const MessageRoleSchema = z.enum(['user', 'assistant', 'system', 'tool']);

/**
 * Message type schema
 */
export const MessageTypeSchema = z.enum(['text', 'tool-call', 'tool-result']);

/**
 * Message schema
 */
export const MessageSchema = z.object({
  id: z.string().optional(),
  content: z.string(),
  role: MessageRoleSchema,
  type: MessageTypeSchema.optional().default('text'),
  timestamp: z.number().optional().default(() => Date.now()),
  metadata: z.record(z.any()).optional(),
});

/**
 * Message type
 */
export type Message = z.infer<typeof MessageSchema>;

/**
 * Token count schema
 */
export const TokenCountSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
});

/**
 * Token count type
 */
export type TokenCount = z.infer<typeof TokenCountSchema>;

/**
 * Metrics schema
 */
export const MetricsSchema = z.object({
  promptTokens: z.number().int().nonnegative(),
  completionTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
  latency: z.number().nonnegative().optional(),
  modelName: z.string(),
  operationType: z.string(),
  error: z.boolean().optional(),
});

/**
 * Metrics type
 */
export type Metrics = z.infer<typeof MetricsSchema>;

/**
 * Image processing options schema
 */
export const ImageProcessingOptionsSchema = z.object({
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().optional(),
  threadId: z.string().optional(),
  resourceId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Image processing options type
 */
export type ImageProcessingOptions = z.infer<typeof ImageProcessingOptionsSchema>;

/**
 * Video processing options schema
 */
export const VideoProcessingOptionsSchema = z.object({
  temperature: z.number().min(0).max(1).optional().default(0.2),
  maxTokens: z.number().int().positive().optional().default(1500),
  threadId: z.string().optional(),
  resourceId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Video processing options type
 */
export type VideoProcessingOptions = z.infer<typeof VideoProcessingOptionsSchema>;

/**
 * Multimodal message schema
 */
export const MultimodalMessageSchema = z.object({
  content: z.string(),
  role: MessageRoleSchema,
  type: z.enum(['image_url', 'video_url', 'text']),
  metadata: z.record(z.any()).optional(),
});

/**
 * Multimodal message type
 */
export type MultimodalMessage = z.infer<typeof MultimodalMessageSchema>;

/**
 * Subtask schema for SupervisorAgent
 */
export const SubtaskSchema = z.object({
  description: z.string(),
  agentIndex: z.number().int().min(0),
  priority: z.number().int().min(1).max(5),
  rationale: z.string().optional()
});

/**
 * Subtask type
 */
export type Subtask = z.infer<typeof SubtaskSchema>;

/**
 * Subtask result schema for SupervisorAgent
 */
export const SubtaskResultSchema = z.object({
  subtask: z.string(),
  result: z.string().optional(),
  error: z.instanceof(Error).optional(),
  agentIndex: z.number().int().min(0),
  priority: z.number().int().min(1).max(5)
});

/**
 * Subtask result type
 */
export type SubtaskResult = z.infer<typeof SubtaskResultSchema>;

/**
 * Complex task options schema for SupervisorAgent
 */
export const ComplexTaskOptionsSchema = z.object({
  parallel: z.boolean().optional(),
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().optional(),
  threadId: z.string().optional(),
  resourceId: z.string().optional(),
  metadata: z.record(z.any()).optional()
}).catchall(z.any());

/**
 * Complex task options type
 */
export type ComplexTaskOptions = z.infer<typeof ComplexTaskOptionsSchema>;

/**
 * Task processing options schema for WorkerAgent
 */
export const TaskProcessingOptionsSchema = z.object({
  temperature: z.number().min(0).max(1).optional(),
  maxTokens: z.number().int().positive().optional(),
  topP: z.number().min(0).max(1).optional(),
  threadId: z.string().optional(),
  resourceId: z.string().optional(),
  metadata: z.record(z.any()).optional()
}).catchall(z.any());

/**
 * Task processing options type
 */
export type TaskProcessingOptions = z.infer<typeof TaskProcessingOptionsSchema>;

/**
 * Confidence evaluation schema for WorkerAgent
 */
export const ConfidenceEvaluationSchema = z.object({
  confidence: z.number().min(0).max(1),
  reasoning: z.string()
});

/**
 * Confidence evaluation type
 */
export type ConfidenceEvaluation = z.infer<typeof ConfidenceEvaluationSchema>;
