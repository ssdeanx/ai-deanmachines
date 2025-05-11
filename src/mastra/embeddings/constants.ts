/**
 * Constants for the Embeddings module
 */

/**
 * Default embedding provider
 */
export const DEFAULT_EMBEDDING_PROVIDER = 'xenova';

/**
 * Default Xenova model
 */
export const DEFAULT_XENOVA_MODEL = 'all-MiniLM-L6-v2';

/**
 * Default Google embedding model
 */
export const DEFAULT_GOOGLE_EMBEDDING_MODEL = 'embedding-001';

/**
 * Default embedding dimensions
 */
export const DEFAULT_DIMENSIONS = {
  XENOVA: 384,
  GOOGLE: 1536,
};

/**
 * Default quantization for Xenova models
 */
export const DEFAULT_QUANTIZATION = 'int8';

/**
 * Default batch size for embedding
 */
export const DEFAULT_BATCH_SIZE = 32;

/**
 * Maximum text length for embedding
 */
export const MAX_TEXT_LENGTH = {
  XENOVA: 512,
  GOOGLE: 8192,
};
