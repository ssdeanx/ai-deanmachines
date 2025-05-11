/**
 * Constants for Mastra evaluation system
 */

/**
 * Default thresholds for numeric metrics
 */
export const DEFAULT_THRESHOLDS = {
  poor: 0.25,
  fair: 0.5,
  good: 0.75,
  excellent: 0.9
};

/**
 * Default LLM evaluator configuration
 */
export const DEFAULT_LLM_EVALUATOR = {
  modelName: 'gpt-3.5-turbo',
  temperature: 0.2,
  maxTokens: 1000
};

/**
 * Token pricing per 1K tokens (in USD)
 * These are approximate and should be updated as pricing changes
 */
export const TOKEN_PRICING = {
  // OpenAI models
  'gpt-3.5-turbo': {
    prompt: 0.0015,
    completion: 0.002
  },
  'gpt-4': {
    prompt: 0.03,
    completion: 0.06
  },
  'gpt-4-turbo': {
    prompt: 0.01,
    completion: 0.03
  },
  'gpt-4o': {
    prompt: 0.005,
    completion: 0.015
  },
  
  // Google models
  'gemini-1.5-pro': {
    prompt: 0.00025,
    completion: 0.00075
  },
  'gemini-1.5-flash': {
    prompt: 0.000125,
    completion: 0.000375
  },
  'gemini-2.5-pro': {
    prompt: 0.0007,
    completion: 0.0021
  },
  'gemini-2.5-flash': {
    prompt: 0.00035,
    completion: 0.00105
  },
  
  // Anthropic models
  'claude-3-opus': {
    prompt: 0.015,
    completion: 0.075
  },
  'claude-3-sonnet': {
    prompt: 0.003,
    completion: 0.015
  },
  'claude-3-haiku': {
    prompt: 0.00025,
    completion: 0.00125
  },
  
  // Default fallback
  'default': {
    prompt: 0.001,
    completion: 0.002
  }
};

/**
 * Approximate tokens per character for different languages
 * These are rough estimates and should be refined for production use
 */
export const TOKENS_PER_CHAR = {
  english: 0.25, // ~4 chars per token
  chinese: 1.0,  // ~1 char per token
  japanese: 0.5, // ~2 chars per token
  korean: 0.5,   // ~2 chars per token
  default: 0.25  // Default fallback
};

/**
 * Performance metric names
 */
export const PERFORMANCE_METRICS = {
  LATENCY: 'latency_ms',
  PROMPT_TOKENS: 'prompt_tokens',
  COMPLETION_TOKENS: 'completion_tokens',
  TOTAL_TOKENS: 'total_tokens',
  COST_USD: 'cost_usd',
  MODEL_NAME: 'model_name',
  TIMESTAMP: 'timestamp'
};

/**
 * Evaluation metric names
 */
export const EVAL_METRICS = {
  ANSWER_RELEVANCY: 'answer_relevancy',
  BIAS: 'bias',
  COMPLETENESS: 'completeness',
  CONTENT_SIMILARITY: 'content_similarity',
  CONTEXT_PRECISION: 'context_precision',
  CONTEXT_RELEVANCY: 'context_relevancy',
  CONTEXTUAL_RECALL: 'contextual_recall',
  FAITHFULNESS: 'faithfulness',
  HALLUCINATION: 'hallucination',
  KEYWORD_COVERAGE: 'keyword_coverage',
  PROMPT_ALIGNMENT: 'prompt_alignment',
  SUMMARIZATION: 'summarization',
  TEXTUAL_DIFFERENCE: 'textual_difference',
  TONE_CONSISTENCY: 'tone_consistency',
  TOXICITY: 'toxicity'
};
