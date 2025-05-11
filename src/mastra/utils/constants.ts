/**
 * Default logger configuration
 */
export const DEFAULT_LOGGER_CONFIG = {
  name: 'Mastra',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: 'pretty',
};

/**
 * Default telemetry configuration
 */
export const DEFAULT_TELEMETRY_CONFIG = {
  serviceName: 'mastra-service',
  serviceVersion: '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  enabled: true,
};

/**
 * Default Langfuse configuration
 */
export const DEFAULT_LANGFUSE_CONFIG = {
  baseUrl: 'https://cloud.langfuse.com',
};

/**
 * Log levels in order of severity
 */
export const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * OpenTelemetry semantic conventions for AI/LLM attributes
 */
export const OTEL_AI_ATTRIBUTES = {
  // LLM attributes
  LLM_MODEL_NAME: 'llm.model.name',
  LLM_REQUEST_TYPE: 'llm.request.type',
  LLM_REQUEST_MODEL: 'llm.request.model',
  LLM_RESPONSE_MODEL: 'llm.response.model',
  LLM_TEMPERATURE: 'llm.temperature',
  LLM_TOP_P: 'llm.top_p',
  LLM_TOP_K: 'llm.top_k',
  LLM_MAX_TOKENS: 'llm.max_tokens',
  LLM_PROMPT_TEMPLATE: 'llm.prompt.template',
  LLM_PROMPT_TEMPLATE_VERSION: 'llm.prompt.template_version',
  LLM_PROMPT_TEMPLATE_VARIABLES: 'llm.prompt.template_variables',
  
  // Embedding attributes
  EMBEDDING_MODEL_NAME: 'embedding.model.name',
  EMBEDDING_DIMENSIONS: 'embedding.dimensions',
  
  // RAG attributes
  RAG_QUERY: 'rag.query',
  RAG_RETRIEVED_DOCUMENTS: 'rag.retrieved_documents',
  RAG_RETRIEVED_DOCUMENT_IDS: 'rag.retrieved_document_ids',
  
  // Agent attributes
  AGENT_NAME: 'agent.name',
  AGENT_TYPE: 'agent.type',
  AGENT_TOOL_NAME: 'agent.tool.name',
  AGENT_TOOL_DESCRIPTION: 'agent.tool.description',
  AGENT_TOOL_PARAMETERS: 'agent.tool.parameters',
};
