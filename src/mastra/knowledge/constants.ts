/**
 * Constants for the Knowledge module
 */

/**
 * Default vector store provider
 */
export const DEFAULT_VECTOR_STORE_PROVIDER = 'upstash';

/**
 * Default namespace for vector stores
 */
export const DEFAULT_NAMESPACE = 'default';

/**
 * Default local vector store path
 */
export const DEFAULT_LOCAL_VECTOR_STORE_PATH = './data/vectors';

/**
 * Default query options
 */
export const DEFAULT_QUERY_OPTIONS = {
  TOP_K: 5,
  INCLUDE_METADATA: true,
  INCLUDE_VECTORS: false,
};

/**
 * Default RAG context template
 */
export const DEFAULT_RAG_CONTEXT_TEMPLATE = `
Answer the following question based on the provided context.

Context:
{{context}}

Question:
{{query}}
`;

/**
 * Default chunk size for text splitting
 */
export const DEFAULT_CHUNK_SIZE = 1000;

/**
 * Default chunk overlap
 */
export const DEFAULT_CHUNK_OVERLAP = 200;
