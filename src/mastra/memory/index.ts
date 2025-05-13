/**
 * Database configuration for memory persistence using a custom LibSQL adapter.
 *
 * This module sets up the custom LibSQL adapter for Mastra memory persistence,
 * allowing agent conversations and context to be stored reliably.
 */

import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { Memory } from '@mastra/memory';
import type { MastraStorage, MastraVector, MemoryProcessor } from '@mastra/core';
import { createLogger } from '@mastra/core/logger';
import { MemoryConfig, EnhancedMemoryConfig, ThreadInfo } from './types';
import { getTracer } from '../observability/telemetry';
import { getLangfuseClient, trackSpan as langfuseTrackSpan, MastraSpanOptions } from '../observability/langfuse';
import { Span as OpenTelemetrySpan, SpanStatusCode } from '@opentelemetry/api';
import { 
  TokenLimiter,
  ToolCallFilter,
  ContextualSummarizer,
  PriorityRanker,
  DuplicateDetector,
  TemporalProcessor,
  EntityExtractor,
  SentimentAnalyzer,
  ContextualEnhancer,
  CommonEnhancements,
  MessageTransformer,
  CommonTransforms,
  StreamFilter,
  CommonFilters,
  StreamObjectProcessor,
  CommonStreamTransforms,
  StreamAggregator,
  CommonGroupings 
} from './processors';

const logger = createLogger({ name: 'database', level: 'info' });

// Default memory configuration that works well for most agents
const defaultMemoryConfig: EnhancedMemoryConfig = {
  provider: 'local',
  lastMessages: 250,
  semanticRecall: {
    topK: 8,
    messageRange: {
      before: 7,
      after: 2,
    },
  },
  workingMemory: {
    enabled: true,
    type: "text-stream",
  },
  options: {
    threads: {
      generateTitle: true,
    }
  }
};
// Enable lazy loading for Langfuse
async function getLangfuse() {
  try {
    const { getLangfuseClient } = await import("../observability/langfuse");
    return getLangfuseClient;
  } catch (error) {
    logger.warn("Failed to load Langfuse", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}
// Create LibSQL storage and vector instances with optimized configuration
export const storage = new LibSQLStore({
  url: process.env.DATABASE_URL || 'file:.mastra/mastra.db',
  authToken: process.env.DATABASE_KEY,
});

if (typeof (storage as LibSQLStore).init !== 'function') {
  (storage as LibSQLStore).init = async () => { };
}

export const vector = new LibSQLVector({
  connectionUrl: process.env.DATABASE_URL || 'file:.mastra/mastra-vector.db',
  authToken: process.env.DATABASE_KEY,
});

// Function to create a configured Memory instance with telemetry
export async function createMemory(options: Partial<MemoryConfig> = defaultMemoryConfig): Promise<Memory> {
  const config = { ...defaultMemoryConfig, ...options };
  const tracer = getTracer('memory-module.createMemory');
  const operationName = 'createMemoryInstance';

  return tracer.startActiveSpan(operationName, async (span: OpenTelemetrySpan) => {
    try {
      const memoryInstance = new Memory({
        storage: storage as unknown as MastraStorage,
        vector: vector as unknown as MastraVector,
        options: config,
      });
      span.setAttributes({
        'memory.config.lastMessages': config.lastMessages,
        'memory.config.provider': config.provider,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return memoryInstance;
    } catch (error) {
      logger.error(`Error during ${operationName}: ${error instanceof Error ? error.message : String(error)}`);
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      span.end();
      throw error;
    }
  });}

// Export shared memory instance with high token limit support
export const sharedMemory = new Memory({
  storage: storage as unknown as MastraStorage,
  vector: vector as unknown as MastraVector,
  options: defaultMemoryConfig,
  processors: createLargeContextProcessors()
});

// Ensure threadManager initializes only after sharedMemory is ready
export const initThreadManager = (async () => {
  const span = createTracedSpan('threadManager.init', 'memory-module');
  
  try {
    if ('init' in sharedMemory && typeof sharedMemory.init === 'function') {
      await sharedMemory.init();
    } else {
      await new Promise(res => setTimeout(res, 10));
    }
    let defaultThread: ThreadInfo | undefined;
    try {
      defaultThread = await threadManager.getOrCreateThread('mastra_memory');
    } catch (err) {
      logger.error('Failed to create default thread in threadManager:', { error: err instanceof Error ? err.message : String(err) });
    }
    const langfuseInstance = (await getLangfuse());
    if (langfuseInstance) {
      langfuseInstance.trace('initThreadManager', {
        metadata: {
          ...(defaultThread?.usage_details ? { usage_details: defaultThread.usage_details } : {}),
          ...(defaultThread?.cost_details ? { cost_details: defaultThread.cost_details } : {})
        }
      });
    }
    span?.end();
    return threadManager;
  } catch (error) {
    span?.recordException?.(error instanceof Error ? error : String(error));
    span?.end();
    throw error;
  }

})();export type { Memory };
export type { ThreadManager, ThreadInfo };

/**
 * Creates a configured Memory instance with advanced processor options
 * 
 * @param options Memory configuration options
 * @returns Configured Memory instance
 */
export async function createAdvancedMemory(options: Partial<EnhancedMemoryConfig> = defaultMemoryConfig): Promise<Memory> {
  const config = { ...defaultMemoryConfig, ...options };
  const tracer = getTracer('memory-module.createAdvancedMemory');
  const operationName = 'createAdvancedMemoryInstance';

  return tracer.startActiveSpan(operationName, async (span: OpenTelemetrySpan) => {
    try {
      const memoryInstance = new Memory({
        storage: storage as unknown as MastraStorage,
        vector: vector as unknown as MastraVector,
        options: config,
        processors: createLargeContextProcessors()
      });
      span.setAttributes({
        'memory.config.lastMessages': config.lastMessages,
        'memory.config.provider': config.provider,
        'memory.config.processors.count': config.processors?.length || 0,
      });
      span.setStatus({ code: SpanStatusCode.OK });
      span.end();
      return memoryInstance;
    } catch (error) {
      logger.error(`Error during ${operationName}`, { err: error, operation: operationName });
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      span.end();
      throw error;
    }
  });}

/**
 * Creates a chain of memory processors optimized for handling large context windows up to 1M tokens
 * 
 * @returns Array of memory processors configured for high-volume context
 */
function createLargeContextProcessors(): MemoryProcessor[] {
  return [
    new ContextualSummarizer(),
    new TokenLimiter(),
    new ToolCallFilter(),
    new PriorityRanker(),
    new DuplicateDetector(),
    new TemporalProcessor(),
    new EntityExtractor(),
    new SentimentAnalyzer(),
    new ContextualEnhancer(),
    new MessageTransformer(),
    new StreamFilter(),
    new StreamObjectProcessor(),
    new StreamAggregator(),
  ];
}

/**
 * Creates an OpenTelemetry span.
 * @param tracerName Name for the tracer.
 * @param spanName Name for the span.
 * @returns An OpenTelemetry Span.
 */
function createTracedSpan(tracerName: string, spanName: string): OpenTelemetrySpan {
  const tracer = getTracer(tracerName);
  return tracer.startSpan(spanName);
}

/**
 * Standardized error handling for async operations
 * @param operation Name of the operation for logging
 * @param span Optional tracing span (OpenTelemetrySpan)
 * @param throwError Whether to rethrow the error (default: true)
 * @returns Function that wraps try/catch with standard error handling
 */
export function withErrorHandling<T>(
  operation: string,
  span?: OpenTelemetrySpan,
  throwError: boolean = true
) {
  return async function<A extends any[], R>(fn: (...args: A) => Promise<R>, ...args: A): Promise<R> {
    try {
      const result = await fn(...args);
      span?.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      logger.error(`Error during ${operation}`, { err: error, operation });
      span?.recordException(error as Error);
      span?.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
      if (throwError) {
        throw error;
      }
      return undefined as unknown as R;
      } finally {
        span?.end();
      }
    };
  }