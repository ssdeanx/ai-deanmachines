import { LanguageModelV1, EmbeddingModelV1 } from '@ai-sdk/provider';
import { z } from 'zod';

/**
 * Schema for Google Provider specific type (gemini or vertex-ai).
 */
export const GoogleProviderTypeSchema = z.enum(['gemini', 'vertex-ai']);
export type GoogleProviderType = z.infer<typeof GoogleProviderTypeSchema>;

/**
 * Schema for Google Vertex AI specific options.
 */
export const VertexOptionsSchema = z.object({
  project: z.string().optional().describe('Google Cloud Project ID'),
  location: z.string().optional().describe('Google Cloud Location, e.g., "us-central1"'),
});
export type VertexOptions = z.infer<typeof VertexOptionsSchema>;

/**
 * Schema for an LLM provider client configuration.
 * This holds the initialized client object from which specific models can be derived.
 */
export const ProviderClientConfigSchema = z.object({
  id: z.string().describe('Unique identifier, e.g., "google-generative-ai-default"'),
  name: z.string().describe('User-friendly name, e.g., "Google Generative AI"'),
  type: z.enum(['google', 'openai', 'anthropic', 'custom']).describe('Main provider type'),
  googleSpecificProviderType: GoogleProviderTypeSchema.optional().describe("Distinguishes between Google's offerings"),
  vertexOptions: VertexOptionsSchema.optional(),
  client: z.any().describe('Initialized provider client object from AI SDK'),
});
export type ProviderClientConfig = z.infer<typeof ProviderClientConfigSchema>;

/**
 * Schema for a specific LLM model instance configuration.
 * This links a model to a provider client and holds the initialized LanguageModelV1 instance.
 */
export const ModelInstanceConfigSchema = z.object({
  id: z.string().describe('Unique identifier for this model configuration, e.g., "gemini-1.5-pro-via-genai"'),
  name: z.string().describe('User-friendly name, e.g., "Gemini 1.5 Pro (via Generative AI)"'),
  providerClientId: z.string().describe('References the id of a ProviderClientConfig'),
  modelIdString: z.string().describe('The string identifier for the model within the provider (e.g., "gemini-1.5-flash-latest")'),
  instance: z.custom<LanguageModelV1>((val) => {
    return typeof val === 'object' && val !== null && 'modelId' in val && 'provider' in val;
  }).describe('Initialized AI SDK LanguageModelV1 instance'),
  contextWindow: z.number().optional().describe('Input token limit for the model'),
  maxOutputTokens: z.number().optional().describe('Maximum number of output tokens'),
  description: z.string().optional().describe('Description of the model'),
  supportsSystemPrompt: z.boolean().optional().describe('Indicates if the model supports a system prompt'),
  supportsFunctionCalling: z.boolean().optional().describe('Indicates if the model supports function calling'),
  supportsStructuredOutput: z.boolean().optional().describe('Indicates if the model supports structured output (e.g., JSON mode)'),
  supportsStreaming: z.boolean().optional().describe('Indicates if the model supports streaming responses'),
  supportsAudioInput: z.boolean().optional().describe('Indicates if the model supports audio input'),
  supportsImageInput: z.boolean().optional().describe('Indicates if the model supports image input'),
  supportsVideoInput: z.boolean().optional().describe('Indicates if the model supports video input'),
  supportsTextInput: z.boolean().optional().describe('Indicates if the model supports text input (assumed true if not specified for text models)'),
  supportsCodeInput: z.boolean().optional().describe('Indicates if the model supports code input (assumed true if not specified for code-capable models)'),
  supportsCaching: z.boolean().optional().describe('Indicates if the model supports caching'),
  supportsGrounding: z.boolean().optional().describe('Indicates if the model supports grounding (e.g., Google Search grounding)'),
  supportsCodeExecution: z.boolean().optional().describe('Indicates if the model supports code execution'),
  supportsTuning: z.boolean().optional().describe('Indicates if the model supports fine-tuning capabilities'),
  supportsThinking: z.boolean().optional().describe('Indicates if the model has "thinking" capabilities (e.g., adaptive thinking)'),
  supportsLiveAPI: z.boolean().optional().describe('Indicates if the model is designed for live, low-latency interactions'),
  supportsImageGeneration: z.boolean().optional().describe('Indicates if the model supports image generation'),
  supportsAudioGeneration: z.boolean().optional().describe('Indicates if the model supports audio generation'),
});
export type ModelInstanceConfig = z.infer<typeof ModelInstanceConfigSchema>;

/**
 * Schema for embedding model instance configuration.
 */
export const EmbeddingModelInstanceConfigSchema = z.object({
  id: z.string().describe('Unique identifier for this embedding model configuration'),
  name: z.string().describe('User-friendly name for the embedding model'),
  providerClientId: z.string().describe('References the id of a ProviderClientConfig'),
  modelIdString: z.string().describe('The string identifier for the embedding model within the provider'),
  instance: z.custom<EmbeddingModelV1<string>>((val) => {
    return typeof val === 'object' && val !== null && typeof (val as any).embed === 'function';
  }).describe('Initialized AI SDK EmbeddingModelV1<string> instance'),
  outputDimensions: z.number().optional().describe('Dimensionality of the embedding output'),
  contextWindow: z.number().optional().describe('Input token limit for the embedding model'),
  description: z.string().optional().describe('Description of the embedding model'),
});
export type EmbeddingModelInstanceConfig = z.infer<typeof EmbeddingModelInstanceConfigSchema>;

/**
 * Schema for an agent's LLM configuration, specifying which model instance to use
 * and any agent-specific LLM parameters.
 */
export const AgentLLMConfigSchema = z.object({
  modelInstanceId: z.string().describe('References the id of a ModelInstanceConfig'),
  temperature: z.number().min(0).max(2).optional().describe('Sampling temperature'),
  topP: z.number().min(0).max(1).optional().describe('Top-p sampling'),
  maxTokens: z.number().positive().optional().describe('Maximum number of tokens to generate for this agent task, overrides model default if less'),
});
export type AgentLLMConfig = z.infer<typeof AgentLLMConfigSchema>;
