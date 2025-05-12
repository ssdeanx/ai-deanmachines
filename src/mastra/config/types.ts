/**
 * @file Type definitions for Mastra configuration
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This file defines the core type definitions and schemas for the Mastra configuration system.
 * It includes schemas for provider configurations, model instances, and agent LLM configurations,
 * providing type safety and validation through Zod schemas.
 */
import { LanguageModelV1, EmbeddingModelV1 } from '@ai-sdk/provider';
import { z } from 'zod';

/**
 * Schema for Google Provider specific type (gemini or vertex-ai)
 * Defines which Google AI platform to use
 * @constant {z.ZodType}
 */
export const GoogleProviderTypeSchema = z.enum(['gemini', 'vertex-ai']);
/**
 * Type definition for Google Provider type
 * @typedef {z.infer<typeof GoogleProviderTypeSchema>} GoogleProviderType
 */
export type GoogleProviderType = z.infer<typeof GoogleProviderTypeSchema>;

/**
 * Schema for Google Vertex AI specific options
 * Configuration options specific to Google Vertex AI platform
 * @constant {z.ZodType}
 */
export const VertexOptionsSchema = z.object({
  /** Google Cloud Project ID */
  project: z.string().optional().describe('Google Cloud Project ID'),
  /** Google Cloud Location, e.g., "us-central1" */
  location: z.string().optional().describe('Google Cloud Location, e.g., "us-central1"'),
});
/**
 * Type definition for Vertex AI options
 * @typedef {z.infer<typeof VertexOptionsSchema>} VertexOptions
 */
export type VertexOptions = z.infer<typeof VertexOptionsSchema>;

/**
 * Schema for an LLM provider client configuration
 * This holds the initialized client object from which specific models can be derived
 * @constant {z.ZodType}
 */
export const ProviderClientConfigSchema = z.object({
  /** Unique identifier, e.g., "google-generative-ai-default" */
  id: z.string().describe('Unique identifier, e.g., "google-generative-ai-default"'),
  /** User-friendly name, e.g., "Google Generative AI" */
  name: z.string().describe('User-friendly name, e.g., "Google Generative AI"'),
  /** Main provider type */
  type: z.enum(['google', 'openai', 'anthropic', 'custom']).describe('Main provider type'),
  /** Distinguishes between Google's offerings */
  googleSpecificProviderType: GoogleProviderTypeSchema.optional().describe("Distinguishes between Google's offerings"),
  /** Vertex AI specific configuration options */
  vertexOptions: VertexOptionsSchema.optional(),
  /** Initialized provider client object from AI SDK */
  client: z.any().describe('Initialized provider client object from AI SDK'),
});
/**
 * Type definition for provider client configuration
 * @typedef {z.infer<typeof ProviderClientConfigSchema>} ProviderClientConfig
 */
export type ProviderClientConfig = z.infer<typeof ProviderClientConfigSchema>;

/**
 * Schema for a specific LLM model instance configuration
 * This links a model to a provider client and holds the initialized LanguageModelV1 instance
 * @constant {z.ZodType}
 */
export const ModelInstanceConfigSchema = z.object({
  /** Unique identifier for this model configuration, e.g., "gemini-1.5-pro-via-genai" */
  id: z.string().describe('Unique identifier for this model configuration, e.g., "gemini-1.5-pro-via-genai"'),
  /** User-friendly name, e.g., "Gemini 1.5 Pro (via Generative AI)" */
  name: z.string().describe('User-friendly name, e.g., "Gemini 1.5 Pro (via Generative AI)"'),
  /** References the id of a ProviderClientConfig */
  providerClientId: z.string().describe('References the id of a ProviderClientConfig'),
  /** The string identifier for the model within the provider (e.g., "gemini-1.5-flash-latest") */
  modelIdString: z.string().describe('The string identifier for the model within the provider (e.g., "gemini-1.5-flash-latest")'),
  /** Initialized AI SDK LanguageModelV1 instance */
  instance: z.custom<LanguageModelV1>((val) => {
    return typeof val === 'object' && val !== null && 'modelId' in val && 'provider' in val;
  }).describe('Initialized AI SDK LanguageModelV1 instance'),
  /** Input token limit for the model */
  contextWindow: z.number().optional().describe('Input token limit for the model'),
  /** Maximum number of output tokens */
  maxOutputTokens: z.number().optional().describe('Maximum number of output tokens'),
  /** Description of the model */
  description: z.string().optional().describe('Description of the model'),
  /** Indicates if the model supports a system prompt */
  supportsSystemPrompt: z.boolean().optional().describe('Indicates if the model supports a system prompt'),
  /** Indicates if the model supports function calling */
  supportsFunctionCalling: z.boolean().optional().describe('Indicates if the model supports function calling'),
  /** Indicates if the model supports structured output (e.g., JSON mode) */
  supportsStructuredOutput: z.boolean().optional().describe('Indicates if the model supports structured output (e.g., JSON mode)'),
  /** Indicates if the model supports streaming responses */
  supportsStreaming: z.boolean().optional().describe('Indicates if the model supports streaming responses'),
  /** Indicates if the model supports audio input */
  supportsAudioInput: z.boolean().optional().describe('Indicates if the model supports audio input'),
  /** Indicates if the model supports image input */
  supportsImageInput: z.boolean().optional().describe('Indicates if the model supports image input'),
  /** Indicates if the model supports video input */
  supportsVideoInput: z.boolean().optional().describe('Indicates if the model supports video input'),
  /** Indicates if the model supports text input (assumed true if not specified for text models) */
  supportsTextInput: z.boolean().optional().describe('Indicates if the model supports text input (assumed true if not specified for text models)'),
  /** Indicates if the model supports code input (assumed true if not specified for code-capable models) */
  supportsCodeInput: z.boolean().optional().describe('Indicates if the model supports code input (assumed true if not specified for code-capable models)'),
  /** Indicates if the model supports caching */
  supportsCaching: z.boolean().optional().describe('Indicates if the model supports caching'),
  /** Indicates if the model supports grounding (e.g., Google Search grounding) */
  supportsGrounding: z.boolean().optional().describe('Indicates if the model supports grounding (e.g., Google Search grounding)'),
  /** Indicates if the model supports code execution */
  supportsCodeExecution: z.boolean().optional().describe('Indicates if the model supports code execution'),
  /** Indicates if the model supports fine-tuning capabilities */
  supportsTuning: z.boolean().optional().describe('Indicates if the model supports fine-tuning capabilities'),
  /** Indicates if the model has "thinking" capabilities (e.g., adaptive thinking) */
  supportsThinking: z.boolean().optional().describe('Indicates if the model has "thinking" capabilities (e.g., adaptive thinking)'),
  /** Indicates if the model is designed for live, low-latency interactions */
  supportsLiveAPI: z.boolean().optional().describe('Indicates if the model is designed for live, low-latency interactions'),
  /** Indicates if the model supports image generation */
  supportsImageGeneration: z.boolean().optional().describe('Indicates if the model supports image generation'),
  /** Indicates if the model supports audio generation */
  supportsAudioGeneration: z.boolean().optional().describe('Indicates if the model supports audio generation'),
});
/**
 * Type definition for model instance configuration
 * @typedef {z.infer<typeof ModelInstanceConfigSchema>} ModelInstanceConfig
 */
export type ModelInstanceConfig = z.infer<typeof ModelInstanceConfigSchema>;

/**
 * Schema for embedding model instance configuration
 * Defines the structure for embedding model configurations
 * @constant {z.ZodType}
 */
export const EmbeddingModelInstanceConfigSchema = z.object({
  /** Unique identifier for this embedding model configuration */
  id: z.string().describe('Unique identifier for this embedding model configuration'),
  /** User-friendly name for the embedding model */
  name: z.string().describe('User-friendly name for the embedding model'),
  /** References the id of a ProviderClientConfig */
  providerClientId: z.string().describe('References the id of a ProviderClientConfig'),
  /** The string identifier for the embedding model within the provider */
  modelIdString: z.string().describe('The string identifier for the embedding model within the provider'),
  /** Initialized AI SDK EmbeddingModelV1<string> instance */
  instance: z.custom<EmbeddingModelV1<string>>((val) => {
    return typeof val === 'object' && val !== null && typeof (val as any).embed === 'function';
  }).describe('Initialized AI SDK EmbeddingModelV1<string> instance'),
  /** Dimensionality of the embedding output */
  outputDimensions: z.number().optional().describe('Dimensionality of the embedding output'),
  /** Input token limit for the embedding model */
  contextWindow: z.number().optional().describe('Input token limit for the embedding model'),
  /** Description of the embedding model */
  description: z.string().optional().describe('Description of the embedding model'),
});
/**
 * Type definition for embedding model instance configuration
 * @typedef {z.infer<typeof EmbeddingModelInstanceConfigSchema>} EmbeddingModelInstanceConfig
 */
export type EmbeddingModelInstanceConfig = z.infer<typeof EmbeddingModelInstanceConfigSchema>;

/**
 * Schema for an agent's LLM configuration
 * Specifies which model instance to use and any agent-specific LLM parameters
 * @constant {z.ZodType}
 */
export const AgentLLMConfigSchema = z.object({
  /** References the id of a ModelInstanceConfig */
  modelInstanceId: z.string().describe('References the id of a ModelInstanceConfig'),
  /** Sampling temperature */
  temperature: z.number().min(0).max(2).optional().describe('Sampling temperature'),
  /** Top-p sampling */
  topP: z.number().min(0).max(1).optional().describe('Top-p sampling'),
  /** Maximum number of tokens to generate for this agent task, overrides model default if less */
  maxTokens: z.number().positive().optional().describe('Maximum number of tokens to generate for this agent task, overrides model default if less'),
});
/**
 * Type definition for agent LLM configuration
 * @typedef {z.infer<typeof AgentLLMConfigSchema>} AgentLLMConfig
 */
export type AgentLLMConfig = z.infer<typeof AgentLLMConfigSchema>;
