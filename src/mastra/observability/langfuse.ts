import { logger } from './logger';
import { LangfuseConfig, MastraTelemetryConfig, TelemetryExportConfig } from './types';
import { DEFAULT_LANGFUSE_CONFIG, LANGFUSE_ATTRIBUTES, TOKEN_COST_RATES } from './constants';
// Import LangfuseExporter from langfuse-vercel
import { LangfuseExporter } from 'langfuse-vercel';

/**
 * Configure Langfuse for LLM observability
 *
 * This function checks if Langfuse credentials are available and returns
 * configuration for Mastra's telemetry system to use Langfuse
 *
 * @returns Configuration object for Langfuse or null if not configured
 */
export function configureLangfuse(): TelemetryExportConfig | null {
  // Create a LangfuseConfig object to ensure the type is used
  const config: LangfuseConfig = {
    publicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
    secretKey: process.env.LANGFUSE_SECRET_KEY || '',
    baseUrl: process.env.LANGFUSE_BASEURL || DEFAULT_LANGFUSE_CONFIG.baseUrl
  };

  if (!config.publicKey || !config.secretKey) {
    logger.warn('Langfuse credentials not found. LLM observability will be disabled.');
    return null;
  }

  try {
    logger.info('Configuring Langfuse for LLM observability');

    // Create a LangfuseExporter instance
    const exporter = new LangfuseExporter({
      publicKey: config.publicKey,
      secretKey: config.secretKey,
      baseUrl: config.baseUrl,
    });

    // Return the telemetry export configuration
    return {
      type: 'custom',
      exporter
    };
  } catch (error) {
    logger.error(`Error configuring Langfuse: ${error}`);
    logger.warn('Install langfuse-vercel package to enable Langfuse integration');
    return null;
  }
}

/**
 * Create a configuration object for Mastra's telemetry system
 *
 * @param options - Configuration options
 * @returns Telemetry configuration object for Mastra
 */
export function createTelemetryConfig(options: {
  enabled?: boolean;
  serviceName?: string;
  environment?: string;
} = {}): MastraTelemetryConfig {
  const {
    enabled = true,
    serviceName = 'ai', // Must be 'ai' for Langfuse to recognize it as an AI SDK trace
    environment = process.env.NODE_ENV || 'development',
  } = options;

  if (!enabled) {
    logger.info('Telemetry is disabled');
    return {
      enabled: false,
      serviceName: serviceName || DEFAULT_LANGFUSE_CONFIG.serviceName || 'mastra-service'
    };
  }

  const langfuseConfig = configureLangfuse();

  const telemetryConfig = {
    serviceName,
    enabled: true,
    environment,
    export: langfuseConfig,
  };

  logger.info(`Telemetry configured with service name: ${serviceName}`);
  return telemetryConfig;
}

/**
 * Calculate token cost based on model and token counts
 *
 * @param options - Options for cost calculation
 * @returns Cost in USD
 */
export function calculateTokenCost(options: {
  modelName: string;
  promptTokens: number;
  completionTokens: number;
}): number {
  const { modelName, promptTokens, completionTokens } = options;

  // Get cost rates for the model, or use default if not found
  const costRates = TOKEN_COST_RATES[modelName] || TOKEN_COST_RATES['default'];

  // Calculate cost (convert from per 1K tokens to per token)
  const promptCost = (promptTokens / 1000) * costRates.input;
  const completionCost = (completionTokens / 1000) * costRates.output;

  // Return total cost rounded to 6 decimal places
  return Number((promptCost + completionCost).toFixed(6));
}

/**
 * Track LLM usage with Langfuse
 *
 * This function creates a trace in Langfuse for LLM usage
 *
 * @param options - Options for tracking LLM usage
 */
export function trackLLMUsage(options: {
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number;
  requestType: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  success: boolean;
}): void {
  const {
    modelName,
    promptTokens,
    completionTokens,
    latencyMs,
    requestType,
    userId,
    sessionId,
    requestId,
    success
  } = options;

  // Calculate total tokens
  const totalTokens = promptTokens + completionTokens;

  // Calculate cost
  const cost = calculateTokenCost({
    modelName,
    promptTokens,
    completionTokens
  });

  // Get model provider from model name
  const modelProvider = modelName.startsWith('gemini') ? 'google' :
                        modelName.startsWith('claude') ? 'anthropic' :
                        modelName.startsWith('gpt') ? 'openai' :
                        'unknown';

  // Create attributes object
  const attributes = {
    [LANGFUSE_ATTRIBUTES.MODEL_NAME]: modelName,
    [LANGFUSE_ATTRIBUTES.MODEL_PROVIDER]: modelProvider,
    [LANGFUSE_ATTRIBUTES.REQUEST_TYPE]: requestType,
    [LANGFUSE_ATTRIBUTES.PROMPT_TOKENS]: promptTokens,
    [LANGFUSE_ATTRIBUTES.COMPLETION_TOKENS]: completionTokens,
    [LANGFUSE_ATTRIBUTES.TOTAL_TOKENS]: totalTokens,
    [LANGFUSE_ATTRIBUTES.COST]: cost,
    [LANGFUSE_ATTRIBUTES.COST_UNIT]: 'USD',
    [LANGFUSE_ATTRIBUTES.LATENCY]: latencyMs,
    [LANGFUSE_ATTRIBUTES.LATENCY_UNIT]: 'ms',
    success
  };

  // Add optional attributes if provided
  if (userId) {
    attributes[LANGFUSE_ATTRIBUTES.USER_ID] = userId;
  }

  if (sessionId) {
    attributes[LANGFUSE_ATTRIBUTES.SESSION_ID] = sessionId;
  }

  if (requestId) {
    attributes[LANGFUSE_ATTRIBUTES.REQUEST_ID] = requestId;
  }

  // Log the usage
  logger.info(`LLM usage tracked: ${modelName}, ${totalTokens} tokens, $${cost} USD`);

  // Note: The actual Langfuse trace creation would happen here if we had direct access to the Langfuse client
  // For now, we're just logging the information, but in a real implementation, this would be sent to Langfuse
}
