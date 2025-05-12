import { TokenUsage, TokenCounterFn, CostCalculatorFn, PerformanceMetrics } from './types';
import { TOKEN_PRICING, TOKENS_PER_CHAR } from './constants';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the Evals Utils
const logger = createLogger({
  name: 'Mastra-EvalsUtils',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Simple token counter based on character count
 * This is a rough approximation and should be replaced with a proper tokenizer in production
 *
 * @param text - Text to count tokens for
 * @param modelName - Optional model name to use for tokenization
 * @returns Approximate token count
 */
export const simpleTokenCounter: TokenCounterFn = (text: string, modelName?: string): number => {
  if (!text) return 0;

  // Determine language based on character ranges (very simplified)
  let tokensPerChar = TOKENS_PER_CHAR.default;

  // Check for CJK characters (Chinese, Japanese, Korean)
  const hasCJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff66-\uff9f]/.test(text);
  if (hasCJK) {
    // If text contains CJK characters, use a higher token-per-char ratio
    tokensPerChar = TOKENS_PER_CHAR.chinese;
  }

  // Calculate token count based on character count
  return Math.ceil(text.length * tokensPerChar);
};

/**
 * Calculate cost based on token usage and model
 *
 * @param usage - Token usage information
 * @param modelName - Name of the model used
 * @returns Cost in USD
 */
export const calculateCost: CostCalculatorFn = (usage: TokenUsage, modelName: string): number => {
  // Get pricing for the specified model, or use default pricing
  const pricing = TOKEN_PRICING[modelName] || TOKEN_PRICING.default;

  // Calculate costs for prompt and completion tokens
  const promptCost = (usage.promptTokens / 1000) * pricing.prompt;
  const completionCost = (usage.completionTokens / 1000) * pricing.completion;

  // Return total cost
  return promptCost + completionCost;
};

/**
 * Track performance metrics for an LLM operation
 *
 * @param startTime - Start time of the operation
 * @param usage - Token usage information
 * @param modelName - Name of the model used
 * @returns Performance metrics
 */
export function trackPerformance(
  startTime: number,
  usage: TokenUsage,
  modelName: string
): PerformanceMetrics {
  const endTime = Date.now();
  const latencyMs = endTime - startTime;

  // Calculate cost if token usage is available
  let costUsd: number | undefined;
  if (usage.promptTokens > 0 || usage.completionTokens > 0) {
    try {
      costUsd = calculateCost(usage, modelName);
    } catch (error) {
      logger.warn(`Error calculating cost for model ${modelName}: ${error}`);
    }
  }

  return {
    latencyMs,
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    costUsd,
    modelName,
    timestamp: new Date().toISOString()
  };
}

/**
 * Extract token usage from OpenAI response
 *
 * @param response - OpenAI API response
 * @returns Token usage information
 */
export function extractOpenAITokenUsage(response: any): TokenUsage {
  try {
    if (response?.usage) {
      return {
        promptTokens: response.usage.prompt_tokens || 0,
        completionTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens || 0
      };
    }
  } catch (error) {
    logger.warn(`Error extracting OpenAI token usage: ${error}`);
  }

  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0
  };
}

/**
 * Extract token usage from Google AI response
 *
 * @param response - Google AI API response
 * @returns Token usage information
 */
export function extractGoogleTokenUsage(response: any): TokenUsage {
  try {
    if (response?.usageMetadata) {
      return {
        promptTokens: response.usageMetadata.promptTokenCount || 0,
        completionTokens: response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: (response.usageMetadata.promptTokenCount || 0) +
                    (response.usageMetadata.candidatesTokenCount || 0)
      };
    }
  } catch (error) {
    logger.warn(`Error extracting Google token usage: ${error}`);
  }

  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0
  };
}

/**
 * Extract token usage from Anthropic response
 *
 * @param response - Anthropic API response
 * @returns Token usage information
 */
export function extractAnthropicTokenUsage(response: any): TokenUsage {
  try {
    if (response?.usage) {
      return {
        promptTokens: response.usage.input_tokens || 0,
        completionTokens: response.usage.output_tokens || 0,
        totalTokens: (response.usage.input_tokens || 0) +
                    (response.usage.output_tokens || 0)
      };
    }
  } catch (error) {
    logger.warn(`Error extracting Anthropic token usage: ${error}`);
  }

  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0
  };
}

/**
 * Generate a unique request ID
 *
 * @returns Unique request ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
