/**
 * @file Model configuration and initialization for Mastra framework
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This file defines and initializes the language and embedding models used by the Mastra framework.
 * It creates model instances with specific configurations, capabilities, and parameters,
 * and provides functions to access these configured models.
 */
import { LanguageModelV1, EmbeddingModelV1 } from '@ai-sdk/provider';
import {
  ModelInstanceConfig,
  ModelInstanceConfigSchema,
  EmbeddingModelInstanceConfig,
  EmbeddingModelInstanceConfigSchema,
} from './types';
import { getProviderClient } from './providers';
import { createLogger } from '@mastra/core/logger';

/**
 * Logger for model configuration operations
 */
const logger = createLogger({
  name: 'MastraConfigModels',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Creates a text model instance with specified configuration
 * 
 * @param {string} providerClientId - ID of the provider client to use
 * @param {string} modelIdString - Model identifier string within the provider
 * @param {string} name - Display name for the model
 * @param {string} [overrideId] - Optional custom ID for the model instance
 * @param {number} [contextWindow] - Maximum input token limit
 * @param {number} [maxOutputTokens] - Maximum output token limit
 * @param {string} [description] - Description of the model
 * @param {boolean} [supportsSystemPrompt] - Whether the model supports system prompts
 * @param {boolean} [supportsFunctionCalling] - Whether the model supports function calling
 * @param {boolean} [supportsStructuredOutput] - Whether the model supports structured output
 * @param {boolean} [supportsStreaming] - Whether the model supports streaming responses
 * @param {boolean} [supportsAudioInput] - Whether the model supports audio input
 * @param {boolean} [supportsImageInput] - Whether the model supports image input
 * @param {boolean} [supportsVideoInput] - Whether the model supports video input
 * @param {boolean} [supportsTextInput] - Whether the model supports text input
 * @param {boolean} [supportsCodeInput] - Whether the model supports code input
 * @param {boolean} [supportsCaching] - Whether the model supports caching
 * @param {boolean} [supportsGrounding] - Whether the model supports grounding
 * @param {boolean} [supportsCodeExecution] - Whether the model supports code execution
 * @param {boolean} [supportsTuning] - Whether the model supports fine-tuning
 * @param {boolean} [supportsThinking] - Whether the model supports thinking capabilities
 * @param {boolean} [supportsLiveAPI] - Whether the model supports live API interactions
 * @param {boolean} [supportsImageGeneration] - Whether the model supports image generation
 * @param {boolean} [supportsAudioGeneration] - Whether the model supports audio generation
 * @returns {ModelInstanceConfig | null} The created model instance configuration or null if creation fails
 */
function createModelInstance(
  providerClientId: string,
  modelIdString: string,
  name: string,
  overrideId?: string,
  contextWindow?: number,
  maxOutputTokens?: number,
  description?: string,
  supportsSystemPrompt?: boolean,
  supportsFunctionCalling?: boolean,
  supportsStructuredOutput?: boolean,
  supportsStreaming?: boolean,
  supportsAudioInput?: boolean,
  supportsImageInput?: boolean,
  supportsVideoInput?: boolean,
  supportsTextInput?: boolean, // Added
  supportsCodeInput?: boolean, // Added
  supportsCaching?: boolean, // Added
  supportsGrounding?: boolean, // Added
  supportsCodeExecution?: boolean, // Added
  supportsTuning?: boolean, // Added
  supportsThinking?: boolean, // Added
  supportsLiveAPI?: boolean, // Added
  supportsImageGeneration?: boolean, // Added
  supportsAudioGeneration?: boolean // Added
): ModelInstanceConfig | null {
  try {
    const providerClientConfig = getProviderClient(providerClientId);
    if (!providerClientConfig || !providerClientConfig.client) {
      logger.warn(
        `Provider client '${providerClientId}' not found or client not initialized for model '${modelIdString}'.`
      );
      return null;
    }

    const instance: LanguageModelV1 = providerClientConfig.client(modelIdString);

    const modelConfig: ModelInstanceConfig = {
      id: overrideId || `${providerClientId}-${modelIdString.replace(/[/:]/g, '-')}`,
      name,
      providerClientId,
      modelIdString,
      instance,
      contextWindow,
      maxOutputTokens,
      description,
      supportsSystemPrompt,
      supportsFunctionCalling,
      supportsStructuredOutput,
      supportsStreaming,
      supportsAudioInput,
      supportsImageInput,
      supportsVideoInput,
      supportsTextInput,
      supportsCodeInput,
      supportsCaching,
      supportsGrounding,
      supportsCodeExecution,
      supportsTuning,
      supportsThinking,
      supportsLiveAPI,
      supportsImageGeneration,
      supportsAudioGeneration,
    };

    ModelInstanceConfigSchema.parse(modelConfig);
    logger.debug(`Model instance created and validated: ${modelConfig.id}`);
    return modelConfig;
  } catch (error) {
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : { error };
    logger.error(`Error creating model instance for '${modelIdString}' with provider '${providerClientId}':`, errorDetails);
    return null;
  }
}

/**
 * Creates an embedding model instance with specified configuration
 * 
 * @param {string} providerClientId - ID of the provider client to use
 * @param {string} modelIdString - Model identifier string within the provider
 * @param {string} name - Display name for the embedding model
 * @param {string} [overrideId] - Optional custom ID for the embedding model instance
 * @param {number} [outputDimensions] - Dimensionality of the embedding output
 * @param {number} [contextWindow] - Maximum input token limit
 * @param {string} [description] - Description of the embedding model
 * @returns {EmbeddingModelInstanceConfig | null} The created embedding model instance configuration or null if creation fails
 */
function createEmbeddingModelInstance(
  providerClientId: string,
  modelIdString: string,
  name: string,
  overrideId?: string,
  outputDimensions?: number,
  contextWindow?: number, // Added (input token limit)
  description?: string
): EmbeddingModelInstanceConfig | null {
  try {
    const providerClientConfig = getProviderClient(providerClientId);
    if (!providerClientConfig || !providerClientConfig.client) {
      logger.warn(
        `Provider client '${providerClientId}' not found or client not initialized for embedding model '${modelIdString}'.`
      );
      return null;
    }

    // Assuming the client itself can create embedding models or is an embedding model provider
    const instance: EmbeddingModelV1<string> = providerClientConfig.client.embeddingModel
      ? providerClientConfig.client.embeddingModel(modelIdString)
      : providerClientConfig.client(modelIdString);


    const modelConfig: EmbeddingModelInstanceConfig = {
      id: overrideId || `${providerClientId}-embedding-${modelIdString.replace(/[/:]/g, '-')}`,
      name,
      providerClientId,
      modelIdString,
      instance,
      outputDimensions,
      contextWindow,
      description,
    };

    EmbeddingModelInstanceConfigSchema.parse(modelConfig);
    logger.debug(`Embedding model instance created and validated: ${modelConfig.id}`);
    return modelConfig;
  } catch (error) {
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : { error };
    logger.error(`Error creating embedding model instance for '${modelIdString}' with provider '${providerClientId}':`, errorDetails);
    return null;
  }
}

/**
 * Gemini 2.5 Pro Preview model instance
 * Google's most powerful thinking model with maximum response accuracy and state-of-the-art performance
 * @constant {ModelInstanceConfig}
 */
const gemini25ProPreviewGenAI = createModelInstance(
  'google-generative-ai-default',
  'models/gemini-2.5-pro-preview-05-06',
  'Gemini 2.5 Pro Preview (GenAI)',
  'gemini-2.5-pro-preview-genai',
  1048576, // Input token limit
  65536,  // Output token limit
  'Our most powerful thinking model with maximum response accuracy and state-of-the-art performance. Inputs: Audio, images, videos, and text. Output: Text.',
  true,  // SystemPrompt
  true,  // FunctionCalling
  true,  // StructuredOutput
  true,  // Streaming
  true,  // AudioInput
  true,  // ImageInput
  true,  // VideoInput
  true,  // TextInput
  true,  // CodeInput
  true,  // Caching
  true,  // Grounding (Search grounding)
  true,  // CodeExecution
  false, // Tuning
  true,  // Thinking
  false, // LiveAPI
  false, // ImageGeneration
  false  // AudioGeneration
);

/**
 * Gemini 2.5 Flash Preview model instance
 * Google's best model in terms of price-performance, offering well-rounded capabilities
 * @constant {ModelInstanceConfig}
 */
const gemini25FlashPreviewGenAI = createModelInstance(
  'google-generative-ai-default',
  'models/gemini-2.5-flash-preview-04-17',
  'Gemini 2.5 Flash Preview (GenAI)',
  'gemini-2.5-flash-preview-genai',
  1048576, // Input token limit
  65536,  // Output token limit
  'Our best model in terms of price-performance, offering well-rounded capabilities. Inputs: Audio, images, videos, and text. Output: Text.',
  true,  // SystemPrompt
  true,  // FunctionCalling
  true,  // StructuredOutput
  true,  // Streaming
  true,  // AudioInput
  true,  // ImageInput
  true,  // VideoInput
  true,  // TextInput
  true,  // CodeInput
  false, // Caching
  true,  // Grounding (Search grounding)
  true,  // CodeExecution
  false, // Tuning
  true,  // Thinking
  false, // LiveAPI
  false, // ImageGeneration
  false  // AudioGeneration
);

/**
 * Gemini 2.0 Flash model instance
 * Next-generation model with advanced features, speed, and multimodal capabilities
 * @constant {ModelInstanceConfig}
 */
const gemini20FlashGenAI = createModelInstance(
  'google-generative-ai-default',
  'models/gemini-2.0-flash',
  'Gemini 2.0 Flash (GenAI)',
  'gemini-2.0-flash-genai',
  1048576, // Input token limit
  8192,   // Output token limit
  'Next-gen features, speed, thinking, realtime streaming, multimodal generation. Inputs: Audio, images, videos, text. Output: Text, images (experimental), audio (coming soon).',
  true,  // SystemPrompt
  true,  // FunctionCalling
  true,  // StructuredOutput
  true,  // Streaming
  true,  // AudioInput
  true,  // ImageInput
  true,  // VideoInput
  true,  // TextInput
  true,  // CodeInput
  true,  // Caching
  true,  // Grounding (Search)
  true,  // CodeExecution
  false, // Tuning
  true,  // Thinking (experimental)
  true,  // LiveAPI
  true,  // ImageGeneration (experimental)
  true   // AudioGeneration (coming soon)
);

/**
 * Gemini 2.0 Flash Lite model instance
 * Optimized for cost efficiency and low latency
 * @constant {ModelInstanceConfig}
 */
const gemini20FlashLiteGenAI = createModelInstance(
  'google-generative-ai-default',
  'models/gemini-2.0-flash-lite',
  'Gemini 2.0 Flash-Lite (GenAI)',
  'gemini-2.0-flash-lite-genai',
  1048576, // Input token limit
  8192,   // Output token limit
  'Optimized for cost efficiency and low latency. Inputs: Audio, images, videos, and text. Output: Text.',
  true,  // SystemPrompt
  true,  // FunctionCalling
  true,  // StructuredOutput
  true,  // Streaming
  true,  // AudioInput
  true,  // ImageInput
  true,  // VideoInput
  true,  // TextInput
  false, // CodeInput (Code execution not supported)
  true,  // Caching
  false, // Grounding (Search not supported)
  false, // CodeExecution
  false, // Tuning
  false, // Thinking (not listed)
  false, // LiveAPI
  false, // ImageGeneration
  false  // AudioGeneration
);

/**
 * Gemini 2.0 Flash Live model instance
 * Specialized for low-latency bidirectional voice and video interactions
 * @constant {ModelInstanceConfig}
 */
const gemini20FlashLiveGenAI = createModelInstance(
  'google-generative-ai-default',
  'models/gemini-2.0-flash-live-001',
  'Gemini 2.0 Flash Live (GenAI)',
  'gemini-2.0-flash-live-genai',
  1048576, // Input token limit
  8192,   // Output token limit
  'Low-latency bidirectional voice and video interactions. Inputs: Audio, video, text. Output: Text, audio.',
  true,  // SystemPrompt
  true,  // FunctionCalling
  true,  // StructuredOutput
  true,  // Streaming (implied by Live API)
  true,  // AudioInput
  false, // ImageInput (not listed for this specific live model)
  true,  // VideoInput
  true,  // TextInput
  true,  // CodeInput (Code execution supported)
  false, // Caching (not listed, Live API might preclude)
  true,  // Grounding (Search)
  true,  // CodeExecution
  false, // Tuning
  false, // Thinking (not listed)
  true,  // LiveAPI
  false, // ImageGeneration
  true   // AudioGeneration
);


// --- Google Embedding Models (via Generative AI API) ---
const geminiEmbeddingExpGenAI = createEmbeddingModelInstance(
  'google-generative-ai-default',
  'gemini-embedding-exp-03-07',
  'Gemini Embedding Experimental (GenAI)',
  'gemini-embedding-exp-genai',
  768, // Defaulting to 768 from elastic options
  8192, // Input token limit
  'Experimental Gemini embedding model with SOTA performance. Input: Text. Output: Text embeddings.'
);

const textEmbedding004GenAI = createEmbeddingModelInstance(
  'google-generative-ai-default',
  'models/text-embedding-004',
  'Text Embedding 004 (GenAI)',
  'text-embedding-004-genai',
  768, // Output dimension size
  2048, // Input token limit
  'Stronger retrieval performance embedding model. Input: Text. Output: Text embeddings.'
);

// --- Consolidate all model instances ---
export const ALL_MODEL_INSTANCES: ModelInstanceConfig[] = [
  gemini25ProPreviewGenAI,
  gemini25FlashPreviewGenAI,
  gemini20FlashGenAI,
  gemini20FlashLiteGenAI,
  gemini20FlashLiveGenAI,
].filter((instance): instance is ModelInstanceConfig => instance !== null);

export const ALL_EMBEDDING_MODEL_INSTANCES: EmbeddingModelInstanceConfig[] = [
  geminiEmbeddingExpGenAI,
  textEmbedding004GenAI,
].filter((instance): instance is EmbeddingModelInstanceConfig => instance !== null);


// --- Logging and Exported Functions (unchanged from previous correct state) ---
if (ALL_MODEL_INSTANCES.length === 0) {
  logger.warn('No text model instances were successfully created. Check provider configurations and API keys.');
} else {
  logger.info(`Successfully created ${ALL_MODEL_INSTANCES.length} text model instances.`);
  ALL_MODEL_INSTANCES.forEach(inst => logger.debug(`Available text model: ${inst.id} (${inst.name})`));
}

if (ALL_EMBEDDING_MODEL_INSTANCES.length === 0) {
  logger.warn('No embedding model instances were successfully created. Check provider configurations and API keys.');
} else {
  logger.info(`Successfully created ${ALL_EMBEDDING_MODEL_INSTANCES.length} embedding model instances.`);
  ALL_EMBEDDING_MODEL_INSTANCES.forEach(inst => logger.debug(`Available embedding model: ${inst.id} (${inst.name})`));
}

export function getModelInstance(id: string): ModelInstanceConfig {
  const modelConfig = ALL_MODEL_INSTANCES.find(mc => mc.id === id);
  if (!modelConfig) {
    const errorMessage = `Text model instance with id '${id}' not found. Available models: ${ALL_MODEL_INSTANCES.map(m => m.id).join(', ') || 'None configured'}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  return modelConfig;
}

export function getEmbeddingModelInstance(id: string): EmbeddingModelInstanceConfig {
  const modelConfig = ALL_EMBEDDING_MODEL_INSTANCES.find(mc => mc.id === id);
  if (!modelConfig) {
    const errorMessage = `Embedding model instance with id '${id}' not found. Available models: ${ALL_EMBEDDING_MODEL_INSTANCES.map(m => m.id).join(', ') || 'None configured'}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  return modelConfig;
}
