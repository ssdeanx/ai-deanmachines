/**
 * Default logger configuration
 */
export const DEFAULT_LOGGER_CONFIG = {
  name: 'Mastra',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: 'pretty',
};

/**
 * Default Upstash logger configuration
 */
export const DEFAULT_UPSTASH_LOGGER_CONFIG = {
  prefix: 'mastra:logs:',
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
  retentionPeriod: 7 * 24 * 60 * 60, // 7 days in seconds
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
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
  serviceName: 'mastra-service',
  enabled: true,
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

/**
 * OpenTelemetry semantic resource attributes
 * Using constants directly instead of SemanticResourceAttributes for bundle minification
 */
export const SEMRESATTRS = {
  SERVICE_NAME: 'service.name',
  SERVICE_VERSION: 'service.version',
  SERVICE_NAMESPACE: 'service.namespace',
  SERVICE_INSTANCE_ID: 'service.instance.id',
  DEPLOYMENT_ENVIRONMENT: 'deployment.environment',
};

/**
 * Langfuse trace attributes
 */
export const LANGFUSE_ATTRIBUTES = {
  // Token counting
  PROMPT_TOKENS: 'prompt_tokens',
  COMPLETION_TOKENS: 'completion_tokens',
  TOTAL_TOKENS: 'total_tokens',

  // Cost calculation
  COST: 'cost',
  COST_UNIT: 'cost_unit',

  // Performance metrics
  LATENCY: 'latency',
  LATENCY_UNIT: 'ms',

  // Model information
  MODEL_NAME: 'model_name',
  MODEL_PROVIDER: 'model_provider',

  // Request information
  REQUEST_TYPE: 'request_type',
  REQUEST_ID: 'request_id',

  // User information
  USER_ID: 'user_id',
  SESSION_ID: 'session_id',
};

/**
 * Default token cost rates by model (USD per 1K tokens)
 */
export const TOKEN_COST_RATES: Record<string, { input: number; output: number }> = {
  // Google Gemini models
  'gemini-1.0-pro': {
    input: 0.00025,
    output: 0.0005,
  },
  'gemini-1.5-flash': {
    input: 0.000075,  // $0.075 per 1M tokens (prompts <= 128k tokens)
    output: 0.0003,   // $0.30 per 1M tokens (prompts <= 128k tokens)
  },
  'gemini-1.5-flash-8b': {
    input: 0.0000375, // $0.0375 per 1M tokens (prompts <= 128k tokens)
    output: 0.00015,  // $0.15 per 1M tokens (prompts <= 128k tokens)
  },
  'gemini-1.5-pro': {
    input: 0.00125,   // $1.25 per 1M tokens (prompts <= 128k tokens)
    output: 0.005,    // $5.00 per 1M tokens (prompts <= 128k tokens)
  },
  'gemini-2.0-flash-exp': {
    input: 0.0001,    // $0.10 per 1M tokens (text/image/video)
    output: 0.0004,   // $0.40 per 1M tokens
  },
  'gemini-2.0-flash-lite': {
    input: 0.000075,  // $0.075 per 1M tokens
    output: 0.0003,   // $0.30 per 1M tokens
  },
  'gemini-2.5-flash': {
    input: 0.00015,   // $0.15 per 1M tokens (text/image/video)
    output: 0.0006,   // $0.60 per 1M tokens (non-thinking)
  },
  'gemini-2.5-pro': {
    input: 0.00125,   // $1.25 per 1M tokens (prompts <= 200k tokens)
    output: 0.01,     // $10.00 per 1M tokens (prompts <= 200k tokens)
  },

  // OpenAI models
  'gpt-3.5-turbo': {
    input: 0.0005,    // $0.50 per 1M tokens
    output: 0.0015,   // $1.50 per 1M tokens
  },
  'gpt-4': {
    input: 0.03,      // $30.00 per 1M tokens
    output: 0.06,     // $60.00 per 1M tokens
  },
  'gpt-4-32k': {
    input: 0.06,      // $60.00 per 1M tokens
    output: 0.12,     // $120.00 per 1M tokens
  },
  'gpt-4-turbo': {
    input: 0.01,      // $10.00 per 1M tokens
    output: 0.03,     // $30.00 per 1M tokens
  },
  'gpt-4-vision': {
    input: 0.01,      // $10.00 per 1M tokens
    output: 0.03,     // $30.00 per 1M tokens
  },
  'gpt-4.1': {
    input: 0.002,     // $2.00 per 1M tokens
    output: 0.008,    // $8.00 per 1M tokens
  },
  'o4-mini': {
    input: 0.0011,    // $1.10 per 1M tokens
    output: 0.0044,   // $4.40 per 1M tokens
  },
  'o3': {
    input: 0.01,      // $10.00 per 1M tokens
    output: 0.04,     // $40.00 per 1M tokens
  },

  // Anthropic models
  'claude-3-opus': {
    input: 0.015,     // $15.00 per 1M tokens
    output: 0.075,    // $75.00 per 1M tokens
  },
  'claude-3-sonnet': {
    input: 0.003,     // $3.00 per 1M tokens
    output: 0.015,    // $15.00 per 1M tokens
  },
  'claude-3-haiku': {
    input: 0.00025,   // $0.25 per 1M tokens
    output: 0.00125,  // $1.25 per 1M tokens
  },

  // Default fallback
  'default': {
    input: 0.001,     // $1.00 per 1M tokens
    output: 0.002,    // $2.00 per 1M tokens
  },
};
