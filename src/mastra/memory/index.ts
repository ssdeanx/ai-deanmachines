/**
 * Memory management module for Mastra AI agents.
 * 
 * This module serves as the central memory system for Mastra AI, providing:
 * - Persistent storage for conversation history
 * - Vector-based semantic search for contextual recall
 * - Thread management for organizing conversations
 * - Memory processing pipeline for context optimization
 * - Telemetry integration for monitoring memory operations
 * 
 * The memory system is designed to be used with the agent system in `@mastra/core`
 * and integrates with the observability stack for performance monitoring.
 */
import { LibSQLStore, LibSQLVector } from '@mastra/libsql';
import { Memory } from '@mastra/memory';
import type { MastraStorage, MastraVector, MemoryProcessor } from '@mastra/core';
import { createLogger } from '@mastra/core/logger';
import { MemoryConfig, EnhancedMemoryConfig, ThreadInfo, ThreadManager } from './types';
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
import { ThreadManagerImpl } from './threadManager';

/** 
 * Logger instance for memory-related operations
 * Uses the centralized logging system from `@mastra/core/logger`
 */
const logger = createLogger({ name: 'database', level: 'info' });

/**
 * Default memory configuration optimized for most agent use cases.
 * 
 * Key configuration aspects:
 * - Retains last 250 messages for immediate context
 * - Semantic recall fetches 8 most relevant messages
 * - Includes context window of 7 messages before and 2 after each match
 * - Enables working memory with text-stream processing
 * - Automatically generates thread titles
 * 
 * This configuration balances performance and context quality for most
 * conversational AI applications. Adjust based on specific agent needs.
 */
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

/**
 * Lazily loads the Langfuse client for telemetry.
 * 
 * This approach prevents initialization errors if Langfuse is not configured,
 * making the memory system more resilient to missing observability components.
 * 
 * @returns The Langfuse client factory function or null if unavailable
 * @see ../observability/langfuse.ts for implementation details
 */
async function getLangfuse() {
  try {
    const { getLangfuseClient } = await import("../observability/langfuse");
    return getLangfuseClient;
  } catch (error) {
    logger.warn("Failed to load Langfuse", { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

/**
 * Primary LibSQL storage instance for persisting memory data.
 * 
 * This database stores:
 * - Message history
 * - Thread metadata
 * - Agent state information
 * - Working memory content
 * 
 * Configure with DATABASE_URL and DATABASE_KEY environment variables
 * or it will default to local file storage in the .mastra directory.
 */
export const storage = new LibSQLStore({
  url: process.env.DATABASE_URL || 'file:.mastra/mastra.db',
  authToken: process.env.DATABASE_KEY,
});

// Add init method if not present for backward compatibility
if (typeof (storage as LibSQLStore).init !== 'function') {
  (storage as LibSQLStore).init = async () => { };
}

/**
 * Vector database instance for semantic search capabilities.
 * 
 * Stores vector embeddings of messages to enable:
 * - Semantic similarity search
 * - Contextual recall based on query relevance
 * - Knowledge retrieval across conversation history
 * 
 * Uses the same connection details as the primary storage
 * but maintains a separate database file for vector operations.
 */
export const vector = new LibSQLVector({
  connectionUrl: process.env.DATABASE_URL || 'file:.mastra/mastra-vector.db',
  authToken: process.env.DATABASE_KEY,
});

/**
 * Creates a standard Memory instance with basic configuration and telemetry.
 * 
 * Use this function when you need a simple memory instance without advanced
 * processing capabilities. For more complex scenarios, use `createAdvancedMemory()`.
 * 
 * @param options - Configuration options to override defaults
 * @returns Configured Memory instance ready for use with agents
 * @example
 * 
 * // Create memory with default settings
 * const memory = await createMemory();
 * 
 * // Create memory with custom configuration
 * const customMemory = await createMemory({
 *   lastMessages: 100,
 *   provider: 'local'
 * });
 * 
 */
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

/**
 * Shared memory instance with high token limit support.
 * 
 * This pre-configured instance is used across the application for consistent
 * memory access. It includes all advanced processors for optimal context
 * management and is the recommended memory instance for most use cases.
 * 
 * The shared instance is automatically initialized and ready to use.
 */
export const sharedMemory = new Memory({
  storage: storage as unknown as MastraStorage,
  vector: vector as unknown as MastraVector,
  options: defaultMemoryConfig,
  processors: createLargeContextProcessors()
});

/** 
 * Thread manager instance for handling conversation threads
 * 
 * Implemented by ThreadManagerImpl which provides methods for:
 * - Creating new conversation threads
 * - Retrieving existing threads
 * - Managing thread metadata
 * 
 * @see ./threadManager.ts for implementation details
 */
const threadManagerInstance: ThreadManager = new ThreadManagerImpl(sharedMemory);

/**
 * Initializes the thread manager and creates a default thread.
 * 
 * This self-executing async function ensures:
 * 1. The shared memory is fully initialized
 * 2. A default thread named 'mastra_memory' exists
 * 3. Telemetry is configured for thread operations
 * 
 * The returned promise resolves to the initialized ThreadManager instance.
 * Wait for this promise to resolve before performing thread operations.
 * 
 * @example
 * 
 * // Get the initialized thread manager
 * const threadManager = await initThreadManager;
 * 
 * // Create a new thread
 * const thread = await threadManager.getOrCreateThread('my-conversation');
 * 
 */
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
      defaultThread = await threadManagerInstance.getOrCreateThread('mastra_memory');
    } catch (err) {
      logger.error('Failed to create default thread in threadManager:', { error: err instanceof Error ? err.message : String(err) });
    }
    const langfuseClientFactory = await getLangfuse();
    const langfuseInstance = langfuseClientFactory ? langfuseClientFactory() : null;
    if (langfuseInstance) {
      langfuseInstance.trace({
        name: 'initThreadManager',
        metadata: {
          ...(defaultThread?.usage_details ? { usage_details: defaultThread.usage_details } : {}),
          ...(defaultThread?.cost_details ? { cost_details: defaultThread.cost_details } : {})
        }
      });
    }
    span?.end();
    return threadManagerInstance;
  } catch (error) {
    span?.recordException?.(error instanceof Error ? error : String(error));
    span?.end();
    throw error;
  }

})();

export type { Memory };
export type { ThreadManager, ThreadInfo };

/**
 * Creates a Memory instance with advanced processor capabilities.
 * 
 * This function configures a memory instance with the full suite of memory
 * processors, enabling sophisticated context management for complex agents:
 * - Context summarization for long conversations
 * - Token limiting for LLM context windows
 * - Tool call filtering to focus on relevant actions
 * - Priority ranking of important information
 * - Duplicate detection to reduce redundancy
 * - Temporal processing for time-aware context
 * - Entity extraction for knowledge graphs
 * - Sentiment analysis for emotional context
 * 
 * @param options - Configuration options to override defaults
 * @returns Advanced Memory instance with enhanced processors
 * @example
 * 
 * // Create advanced memory with custom token limits
 * const advancedMemory = await createAdvancedMemory({
 *   workingMemory: {
 *     enabled: true,
 *     type: "knowledge-graph"
 *   },
 *   processors: [
 *     new CustomProcessor(),
 *     ...createLargeContextProcessors()
 *   ]
 * });
 * 
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
 * Creates a chain of memory processors optimized for handling large context windows.
 * 
 * This processor chain is designed to:
 * - Efficiently manage context up to 1M tokens
 * - Filter irrelevant or redundant information
 * - Prioritize important context elements
 * - Extract and enhance semantic understanding
 * - Process streaming data for real-time applications
 * 
 * The processors are executed in sequence, with each processor potentially
 * modifying the context before passing it to the next processor.
 * 
 * @returns Array of configured memory processors in execution order
 * @see ./processors/ directory for individual processor implementations
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
 * Creates an OpenTelemetry span for tracing operations.
 * 
 * This utility function simplifies the creation of tracing spans
 * for consistent observability across the memory module.
 * 
 * @param tracerName - Name for the tracer
 * @param spanName - Name for the span
 * @returns An OpenTelemetry Span for tracing the operation
 * @see ../observability/telemetry.ts for the tracer implementation
 */
function createTracedSpan(tracerName: string, spanName: string): OpenTelemetrySpan {
  const tracer = getTracer(tracerName);
  return tracer.startSpan(spanName);
}

/**
 * Standardized error handling for async operations with telemetry support.
 * 
 * This higher-order function wraps async operations with consistent error
 * handling, logging, and telemetry. It's designed to be used throughout
 * the memory module for uniform error management.
 * 
 * @param operation - Name of the operation for logging
 * @param span - Optional tracing span
 * @param throwError - Whether to rethrow the error
 * @returns Function that wraps try/catch with standard error handling
 * @example
 * ```typescript
 * // Basic usage
 * const safeOperation = withErrorHandling('fetchMemory')(async () => {
 *   return await memory.getMessages({ threadId });
 * });
 * 
 * // With custom span
 * const span = createTracedSpan('memory', 'customOperation');
 * const safeOperation = withErrorHandling('fetchMemory', span)(async () => {
 *   return await memory.getMessages({ threadId });
 * });
 * ```
 */
function withErrorHandling(operation: string, span?: OpenTelemetrySpan, throwError = true) {
  return async (fn: () => Promise<any>) => {
    try {
      return await fn();
    } catch (error) {
      logger.error(`Error during ${operation}: ${error instanceof Error ? error.message : String(error)}`);
      span?.recordException?.(error instanceof Error ? error : String(error));
      if (throwError) {
        throw error;
      }
    }
  };
}

export { withErrorHandling };
