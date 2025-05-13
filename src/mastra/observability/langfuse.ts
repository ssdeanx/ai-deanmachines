import {
  LangfuseConfig,
  MastraTelemetryConfig,
  TelemetryExportConfig,
  LangfuseGenerationOptions,
  LangfuseEventOptions,
  LangfuseScoreOptions,
  LangfuseFeedbackOptions
} from './types';
import { DEFAULT_LANGFUSE_CONFIG, LANGFUSE_ATTRIBUTES, TOKEN_COST_RATES } from './constants';
// Import Langfuse from langfuse package
import { Langfuse } from 'langfuse';
// Import Zod for schema validation
import { z } from 'zod';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for Langfuse integration
const logger = createLogger({
  name: 'Mastra-Langfuse',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

// Zod schemas for validation
const LangfuseConfigSchema = z.object({
  publicKey: z.string().min(1, "Public key is required"),
  secretKey: z.string().min(1, "Secret key is required"),
  baseUrl: z.string().url("Base URL must be a valid URL").optional()
});

const TokenCostOptionsSchema = z.object({
  modelName: z.string().min(1, "Model name is required"),
  promptTokens: z.number().int().nonnegative("Prompt tokens must be a non-negative integer"),
  completionTokens: z.number().int().nonnegative("Completion tokens must be a non-negative integer")
});

const LLMUsageOptionsSchema = z.object({
  modelName: z.string().min(1, "Model name is required"),
  promptTokens: z.number().int().nonnegative("Prompt tokens must be a non-negative integer"),
  completionTokens: z.number().int().nonnegative("Completion tokens must be a non-negative integer"),
  latencyMs: z.number().nonnegative("Latency must be a non-negative number"),
  requestType: z.string().min(1, "Request type is required"),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  requestId: z.string().optional(),
  success: z.boolean(),
  input: z.any().optional(),
  output: z.any().optional(),
  name: z.string().optional(),
  tags: z.array(z.string()).optional()
});

const SpanOptionsSchema = z.object({
  traceId: z.string().min(1, "Trace ID is required"),
  name: z.string().min(1, "Name is required"),
  input: z.any().optional(),
  output: z.any().optional(),
  metadata: z.record(z.any()).optional(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  level: z.string().optional()
});

export type MastraSpanOptions = z.infer<typeof SpanOptionsSchema>;

const EventOptionsSchema = z.object({
  traceId: z.string().min(1, "Trace ID is required"),
  name: z.string().min(1, "Name is required"),
  input: z.any().optional(),
  output: z.any().optional(),
  metadata: z.record(z.any()).optional()
});

const ScoreOptionsSchema = z.object({
  traceId: z.string().min(1, "Trace ID is required"),
  name: z.string().min(1, "Name is required"),
  value: z.number().min(0).max(1, "Score must be between 0 and 1"),
  comment: z.string().optional()
});

const FeedbackOptionsSchema = z.object({
  traceId: z.string().min(1, "Trace ID is required"),
  score: z.number().min(0).max(1, "Score must be between 0 and 1"),
  comment: z.string().optional(),
  userId: z.string().optional()
});

// Global Langfuse client instance
let langfuseClient: Langfuse | null = null;

/**
 * Get or create the Langfuse client instance
 *
 * @returns Langfuse client instance or null if not configured
 */
export function getLangfuseClient(): Langfuse | null {
  if (langfuseClient) {
    return langfuseClient;
  }

  try {
    // Create a config object
    const configData = {
      publicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
      secretKey: process.env.LANGFUSE_SECRET_KEY || '',
      baseUrl: process.env.LANGFUSE_BASEURL || DEFAULT_LANGFUSE_CONFIG.baseUrl
    };

    // Validate config with Zod
    const result = LangfuseConfigSchema.safeParse(configData);

    if (!result.success) {
      logger.warn(`Langfuse config validation failed: ${result.error.message}`);
      return null;
    }

    const config = result.data;

    logger.info('Initializing Langfuse client for LLM observability');

    // Create a Langfuse client instance
    langfuseClient = new Langfuse({
      secretKey: config.secretKey,
      publicKey: config.publicKey,
      baseUrl: config.baseUrl,
      release: process.env.npm_package_version || '0.0.1',
      environment: process.env.NODE_ENV || 'development',
      requestTimeout: 10000, // 10 seconds
    });

    return langfuseClient;
  } catch (error) {
    logger.error(`Error initializing Langfuse client: ${error}`);
    logger.warn('Make sure langfuse package is installed and credentials are correct');
    return null;
  }
}

/**
 * Configure Langfuse for LLM observability
 *
 * This function checks if Langfuse credentials are available and returns
 * configuration for Mastra's telemetry system to use Langfuse
 *
 * @returns Configuration object for Langfuse or null if not configured
 */
export function configureLangfuse(): TelemetryExportConfig | null {
  const client = getLangfuseClient();

  if (!client) {
    return null;
  }

  try {
    // Create a custom exporter that uses the Langfuse client
    const exporter = {
      export: (spans: any[]) => {
        // Process spans and send to Langfuse
        // This is a simplified implementation
        for (const span of spans) {
          if (span.attributes && span.name) {
            client.trace({
              name: span.name,
              metadata: span.attributes,
            });
          }
        }
        return Promise.resolve({ code: 0 });
      }
    };

    // Return the telemetry export configuration
    return {
      type: 'custom',
      exporter
    };
  } catch (error) {
    logger.error(`Error configuring Langfuse exporter: ${error}`);
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
  try {
    // Validate options with Zod
    const result = TokenCostOptionsSchema.safeParse(options);

    if (!result.success) {
      logger.warn(`Token cost calculation validation failed: ${result.error.message}`);
      return 0;
    }

    const { modelName, promptTokens, completionTokens } = result.data;

    // Get cost rates for the model, or use default if not found
    const costRates = TOKEN_COST_RATES[modelName] || TOKEN_COST_RATES['default'];

    // Calculate cost (convert from per 1K tokens to per token)
    const promptCost = (promptTokens / 1000) * costRates.input;
    const completionCost = (completionTokens / 1000) * costRates.output;

    // Return total cost rounded to 6 decimal places
    return Number((promptCost + completionCost).toFixed(6));
  } catch (error) {
    logger.error(`Error calculating token cost: ${error}`);
    return 0;
  }
}

/**
 * Track LLM usage with Langfuse
 *
 * This function creates a trace and generation in Langfuse for LLM usage
 *
 * @param options - Options for tracking LLM usage
 * @returns The trace ID if successful, undefined otherwise
 */
export function trackLLMUsage(options: LangfuseGenerationOptions): string | undefined {
  try {
    // Validate options with Zod
    const result = LLMUsageOptionsSchema.safeParse(options);

    if (!result.success) {
      logger.warn(`LLM usage tracking validation failed: ${result.error.message}`);
      return undefined;
    }

    const {
      modelName,
      promptTokens,
      completionTokens,
      latencyMs,
      requestType,
      userId,
      sessionId,
      requestId,
      success,
      input,
      output,
      name = 'llm-generation',
      tags = []
    } = result.data;

    // Get Langfuse client
    const client = getLangfuseClient();
    if (!client) {
      logger.warn('Langfuse client not available. LLM usage tracking skipped.');
      return undefined;
    }

    try {
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

      // Create metadata object
      const metadata: Record<string, any> = {
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
        metadata[LANGFUSE_ATTRIBUTES.USER_ID] = userId;
      }

      if (sessionId) {
        metadata[LANGFUSE_ATTRIBUTES.SESSION_ID] = sessionId;
      }

      if (requestId) {
        metadata[LANGFUSE_ATTRIBUTES.REQUEST_ID] = requestId;
      }

      // Create a trace
      const trace = client.trace({
        name: `${requestType}-trace`,
        userId,
        sessionId,
        id: requestId,
        metadata,
        tags: [...tags, modelProvider, modelName, success ? 'success' : 'error']
      });

      // Create a generation within the trace
      const generation = trace.generation({
        name,
        model: modelName,
        modelParameters: {
          temperature: metadata.temperature,
          maxTokens: metadata.maxTokens,
        },
        input,
        output,
        usage: {
          input: promptTokens,
          output: completionTokens,
          total: totalTokens,
          unit: 'TOKENS'
        },
        metadata
      });

      // Set the generation end time based on latency
      const startTime = new Date(Date.now() - latencyMs);
      generation.update({
        startTime,
        endTime: new Date(),
      });

      // Log the usage
      logger.info(`LLM usage tracked in Langfuse: ${modelName}, ${totalTokens} tokens, $${cost} USD, trace ID: ${trace.id}`);

      return trace.id;
    } catch (error) {
      logger.error(`Error tracking LLM usage in Langfuse: ${error}`);
      return undefined;
    }
  } catch (error) {
    logger.error(`Error validating LLM usage options: ${error}`);
    return undefined;
  }
}

/**
 * Track a span in Langfuse
 *
 * This function creates a span within a trace to track a specific operation
 *
 * @param options - Options for tracking the span
 * @returns The span ID if successful, undefined otherwise
 */
export function trackSpan(options: MastraSpanOptions): string | undefined {
  try {
    // Validate options with Zod
    const result = SpanOptionsSchema.safeParse(options);

    if (!result.success) {
      logger.warn(`Span tracking validation failed: ${result.error.message}`);
      return undefined;
    }

    const {
      traceId,
      name,
      input,
      output,
      metadata = {},
      startTime,
      endTime
    } = result.data;

    // Get Langfuse client
    const client = getLangfuseClient();
    if (!client) {
      logger.warn('Langfuse client not available. Span tracking skipped.');
      return undefined;
    }

    try {
      // Create a trace with the existing ID
      const trace = client.trace({
        id: traceId,
        name: 'existing-trace'
      });

      // Create a span within the trace
      const span = trace.span({
        name,
        input,
        output,
        metadata
      });

      // Update span times if provided
      if (startTime || endTime) {
        const updateOptions: Record<string, any> = {};
        if (startTime) updateOptions.startTime = startTime;
        if (endTime) updateOptions.endTime = endTime;
        span.update(updateOptions);
      }

      logger.info(`Span tracked in Langfuse: ${name}, trace ID: ${traceId}, span ID: ${span.id}`);
      return span.id;
    } catch (error) {
      logger.error(`Error tracking span in Langfuse: ${error}`);
      return undefined;
    }
  } catch (error) {
    logger.error(`Error validating span options: ${error}`);
    return undefined;
  }
}

/**
 * Track an event in Langfuse
 *
 * This function creates an event within a trace to track a specific point in time
 *
 * @param options - Options for tracking the event
 * @returns The event ID if successful, undefined otherwise
 */
export function trackEvent(options: LangfuseEventOptions): string | undefined {
  try {
    // Validate options with Zod
    const result = EventOptionsSchema.safeParse(options);

    if (!result.success) {
      logger.warn(`Event tracking validation failed: ${result.error.message}`);
      return undefined;
    }

    const {
      traceId,
      name,
      input,
      output,
      metadata = {}
    } = result.data;

    // Get Langfuse client
    const client = getLangfuseClient();
    if (!client) {
      logger.warn('Langfuse client not available. Event tracking skipped.');
      return undefined;
    }

    try {
      // Create a trace with the existing ID
      const trace = client.trace({
        id: traceId,
        name: 'existing-trace'
      });

      // Create an event within the trace
      const event = trace.event({
        name,
        input,
        output,
        metadata
      });

      logger.info(`Event tracked in Langfuse: ${name}, trace ID: ${traceId}, event ID: ${event.id}`);
      return event.id;
    } catch (error) {
      logger.error(`Error tracking event in Langfuse: ${error}`);
      return undefined;
    }
  } catch (error) {
    logger.error(`Error validating event options: ${error}`);
    return undefined;
  }
}

/**
 * Add a score to a trace in Langfuse
 *
 * This function adds a score to a trace for evaluation purposes
 *
 * @param options - Options for adding the score
 * @returns True if successful, false otherwise
 */
export function addScore(options: LangfuseScoreOptions): boolean {
  try {
    // Validate options with Zod
    const result = ScoreOptionsSchema.safeParse(options);

    if (!result.success) {
      logger.warn(`Score validation failed: ${result.error.message}`);
      return false;
    }

    const {
      traceId,
      name,
      value,
      comment
    } = result.data;

    // Get Langfuse client
    const client = getLangfuseClient();
    if (!client) {
      logger.warn('Langfuse client not available. Score tracking skipped.');
      return false;
    }

    try {
      // Create a trace with the existing ID
      const trace = client.trace({
        id: traceId,
        name: 'existing-trace'
      });

      // Add a score to the trace
      trace.score({
        name,
        value,
        comment
      });

      logger.info(`Score added in Langfuse: ${name}=${value}, trace ID: ${traceId}`);
      return true;
    } catch (error) {
      logger.error(`Error adding score in Langfuse: ${error}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error validating score options: ${error}`);
    return false;
  }
}

/**
 * Add user feedback to a trace in Langfuse
 *
 * This function adds user feedback to a trace
 *
 * @param options - Options for adding the feedback
 * @returns True if successful, false otherwise
 */
export function addFeedback(options: LangfuseFeedbackOptions): boolean {
  try {
    // Validate options with Zod
    const result = FeedbackOptionsSchema.safeParse(options);

    if (!result.success) {
      logger.warn(`Feedback validation failed: ${result.error.message}`);
      return false;
    }

    const {
      traceId,
      score,
      comment,
      userId
    } = result.data;

    // Get Langfuse client
    const client = getLangfuseClient();
    if (!client) {
      logger.warn('Langfuse client not available. Feedback tracking skipped.');
      return false;
    }

    try {
      // Create a trace with the existing ID
      const trace = client.trace({
        id: traceId,
        name: 'existing-trace'
      });

      // Add a score as feedback
      const feedbackComment = userId
        ? `User ${userId} feedback: ${score}${comment ? ` - ${comment}` : ''}`
        : `User feedback: ${score}${comment ? ` - ${comment}` : ''}`;

      trace.score({
        name: 'user-feedback',
        value: score,
        comment: feedbackComment
      });

      logger.info(`Feedback added in Langfuse: score=${score}, trace ID: ${traceId}`);
      return true;
    } catch (error) {
      logger.error(`Error adding feedback in Langfuse: ${error}`);
      return false;
    }
  } catch (error) {
    logger.error(`Error validating feedback options: ${error}`);
    return false;
  }
}

/**
 * Shutdown the Langfuse client
 *
 * This function should be called before the application exits to ensure all pending requests are sent
 *
 * @returns A promise that resolves when the client is shut down
 */
export async function shutdownLangfuse(): Promise<void> {
  if (langfuseClient) {
    try {
      await langfuseClient.shutdownAsync();
      logger.info('Langfuse client shut down successfully');
    } catch (error) {
      logger.error(`Error shutting down Langfuse client: ${error}`);
    } finally {
      langfuseClient = null;
    }
  }
}