import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createVertex } from '@ai-sdk/google-vertex';
import { ProviderClientConfig, ProviderClientConfigSchema } from './types';
import { z } from 'zod';
import { createLogger } from '@mastra/core/logger'; // Changed import

// Create a logger instance for this module
const logger = createLogger({
  name: 'MastraConfigProviders',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

const googleGenerativeAIClient = createGoogleGenerativeAI({
  // The AI SDK will automatically pick up GOOGLE_GENERATIVE_AI_API_KEY
  // or GOOGLE_API_KEY environment variables if apiKey is not explicitly provided.
});

const googleVertexAIClient = createVertex({
  // The AI SDK will automatically pick up GOOGLE_VERTEX_PROJECT and GOOGLE_VERTEX_LOCATION
  // environment variables if project and location are not explicitly provided.
});

const providerClientConfigsData: Omit<ProviderClientConfig, 'client'>[] = [
  {
    id: 'google-generative-ai-default',
    name: 'Google Generative AI (Default)',
    type: 'google',
    googleSpecificProviderType: 'gemini',
  },
  {
    id: 'google-vertex-ai-default',
    name: 'Google Vertex AI (Default)',
    type: 'google',
    googleSpecificProviderType: 'vertex-ai',
    // vertexOptions can be added here if specific project/location are needed beyond env vars
  },
  // Add other provider clients here, e.g., for OpenAI, Anthropic
];

export const LLM_PROVIDER_CLIENTS: ProviderClientConfig[] = providerClientConfigsData.map(data => {
  let client: any;
  if (data.id === 'google-generative-ai-default') {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && !process.env.GOOGLE_API_KEY) {
      logger.warn(
        `GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_API_KEY environment variable not set for provider client '${data.id}'. Client may not function.`
      );
    }
    client = googleGenerativeAIClient;
  } else if (data.id === 'google-vertex-ai-default') {
    if (!process.env.GOOGLE_VERTEX_PROJECT) {
      logger.warn(
        `GOOGLE_VERTEX_PROJECT environment variable not set for provider client '${data.id}'. Client may not function.`
      );
    }
    if (!process.env.GOOGLE_VERTEX_LOCATION) {
      logger.warn(
        `GOOGLE_VERTEX_LOCATION environment variable not set for provider client '${data.id}'. Client may not function.`
      );
    }
    client = googleVertexAIClient;
  }
  // Add client assignments for other providers here

  const fullConfig = { ...data, client };

  try {
    return ProviderClientConfigSchema.parse(fullConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error(`Configuration error for provider client '${data.id}':`, error.errors);
    }
    throw new Error(`Invalid configuration for provider client '${data.id}'.`);
  }
});

/**
 * Retrieves a provider client configuration by its ID.
 * @param id The ID of the provider client to retrieve.
 * @returns The provider client configuration.
 * @throws Error if the provider client configuration is not found.
 */
export function getProviderClient(id: string): ProviderClientConfig {
  const clientConfig = LLM_PROVIDER_CLIENTS.find(pc => pc.id === id);
  if (!clientConfig) {
    throw new Error(`Provider client with id '${id}' not found.`);
  }
  return clientConfig;
}
