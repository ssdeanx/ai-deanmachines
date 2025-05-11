/**
 * Core constants for the Mastra AI application
 * 
 * This file contains shared constants used across multiple modules.
 */

/**
 * Default port for the Mastra server
 */
export const DEFAULT_PORT = 4111;

/**
 * Default timeout for requests in milliseconds
 */
export const DEFAULT_TIMEOUT = 30000;

/**
 * Default CORS settings
 */
export const DEFAULT_CORS = {
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};

/**
 * Default Google AI model
 */
export const DEFAULT_GOOGLE_MODEL = 'gemini-2.5-pro-preview-05-06';

/**
 * Default Google AI flash model
 */
export const DEFAULT_GOOGLE_FLASH_MODEL = 'gemini-2.5-flash-preview-04-17';

/**
 * Default Xenova embedding model
 */
export const DEFAULT_XENOVA_MODEL = 'all-MiniLM-L6-v2';

/**
 * Default embedding dimensions
 */
export const DEFAULT_EMBEDDING_DIMENSIONS = {
  XENOVA: 384,
  GOOGLE: 1536,
};

/**
 * Default vector search parameters
 */
export const DEFAULT_VECTOR_SEARCH = {
  TOP_K: 5,
  INCLUDE_METADATA: true,
  INCLUDE_VECTORS: false,
};

/**
 * Default memory settings
 */
export const DEFAULT_MEMORY = {
  PROVIDER: 'upstash',
  PREFIX: 'mastra:',
};

/**
 * Default namespace for vector stores
 */
export const DEFAULT_NAMESPACE = 'default';

/**
 * Environment variable names
 */
export const ENV = {
  GOOGLE_API_KEY: 'GOOGLE_GENERATIVE_AI_API_KEY',
  UPSTASH_REDIS_URL: 'UPSTASH_REDIS_REST_URL',
  UPSTASH_REDIS_TOKEN: 'UPSTASH_REDIS_REST_TOKEN',
  UPSTASH_VECTOR_URL: 'UPSTASH_VECTOR_REST_URL',
  UPSTASH_VECTOR_TOKEN: 'UPSTASH_VECTOR_REST_TOKEN',
};
