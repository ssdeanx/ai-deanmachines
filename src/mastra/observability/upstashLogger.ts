/**
 * Upstash logger implementation for Mastra
 *
 * This file provides a logger that stores logs in Upstash Redis
 * with batching, retention policies, and OpenTelemetry integration.
 */

import { v4 as uuidv4 } from 'uuid';
import { LogLevel } from './types';
import { DEFAULT_UPSTASH_LOGGER_CONFIG, DEFAULT_LOGGER_CONFIG } from './constants';
import { getTracer } from './telemetry';
import { createLogger } from '@mastra/core/logger';
// Use @mastra/upstash package for all Upstash operations
import { UpstashStore } from '@mastra/upstash';
// Temporarily import Redis from @upstash/redis until @mastra/upstash provides a full replacement
import { Redis } from '@upstash/redis';

/**
 * Upstash logger implementation for Mastra
 *
 * This implementation uses the Mastra logger and enhances it with Upstash integration
 * for persistent logging with batching, retention policies, and OpenTelemetry integration.
 */

/**
 * Create an Upstash logger instance
 *
 * @param options - Configuration options for the logger
 * @returns A Mastra logger instance with Upstash integration
 */
export function createUpstashLogger(options: {
  url: string;
  token: string;
  name?: string;
  level?: LogLevel;
  prefix?: string;
  batchSize?: number;
  flushInterval?: number;
  retentionPeriod?: number;
}) {
  // Create a standard Mastra logger
  const logger = createLogger({
    name: options.name || DEFAULT_LOGGER_CONFIG.name,
    level: (options.level || DEFAULT_LOGGER_CONFIG.level) as 'debug' | 'info' | 'warn' | 'error',
  });

  // Create an Upstash store for direct access
  const upstashStore = new UpstashStore({
    url: options.url,
    token: options.token,
  });

  // Create a Redis client for operations not covered by UpstashStore
  const redis = new Redis({
    url: options.url,
    token: options.token,
  });

  // Create a tracer for OpenTelemetry
  const tracer = getTracer('mastra.logger.upstash');

  // Set up configuration
  const prefix = options.prefix || DEFAULT_UPSTASH_LOGGER_CONFIG.prefix;
  const batchSize = options.batchSize || DEFAULT_UPSTASH_LOGGER_CONFIG.batchSize;
  const flushInterval = options.flushInterval || DEFAULT_UPSTASH_LOGGER_CONFIG.flushInterval;
  const retentionPeriod = options.retentionPeriod || DEFAULT_UPSTASH_LOGGER_CONFIG.retentionPeriod;

  // Set up log batching
  let logBatch: any[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  // Start the flush timer
  const startFlushTimer = () => {
    if (flushTimer) {
      clearTimeout(flushTimer);
    }

    flushTimer = setTimeout(() => {
      if (logBatch.length > 0) {
        flush();
      }
      startFlushTimer(); // Restart the timer
    }, flushInterval);
  };

  // Flush logs to Upstash
  const flush = async () => {
    if (logBatch.length === 0) {
      return;
    }

    // Create a span for the flush operation
    const span = tracer.startSpan('flush');
    span.setAttribute('batch.size', logBatch.length);

    try {
      const batch = [...logBatch];
      logBatch = [];

      // Process each log entry
      const pipeline = redis.pipeline();

      for (const log of batch) {
        const logId = log.id;
        const timestamp = new Date(log.timestamp).getTime();
        const key = `${prefix}${timestamp}:${logId}`;

        // Store the log entry
        pipeline.set(key, JSON.stringify(log));

        // Set expiration if retention period is defined
        if (retentionPeriod > 0) {
          pipeline.expire(key, retentionPeriod);
        }

        // Add to time-sorted index
        pipeline.zadd(`${prefix}index`, { score: timestamp, member: key });
      }

      // Execute the pipeline
      await pipeline.exec();

      span.end();
    } catch (error) {
      span.recordException(error as Error);
      span.end();

      // Put logs back in the batch for retry
      logBatch = [...logBatch, ...logBatch];

      // Limit batch size to prevent memory issues
      if (logBatch.length > batchSize * 3) {
        logBatch = logBatch.slice(-batchSize * 3);
      }
    }
  };

  // Clean up old logs
  const cleanup = async () => {
    // Create a span for the cleanup operation
    const span = tracer.startSpan('cleanup');

    try {
      const now = Date.now();
      const cutoff = now - (retentionPeriod * 1000);

      // Find keys older than the cutoff
      const oldKeys = await redis.zrange(
        `${prefix}index`,
        0,
        cutoff,
        { byScore: true }
      );

      if (oldKeys.length > 0) {
        span.setAttribute('cleanup.count', oldKeys.length);

        // Delete old keys
        const pipeline = redis.pipeline();

        for (const key of oldKeys) {
          pipeline.del(String(key));
          pipeline.zrem(`${prefix}index`, String(key));
        }

        await pipeline.exec();
      }

      span.end();
    } catch (error) {
      span.recordException(error as Error);
      span.end();
    }
  };

  // Query logs
  const query = async (options: {
    level?: LogLevel;
    from?: Date | number;
    to?: Date | number;
    limit?: number;
    offset?: number;
  } = {}) => {
    // Create a span for the query operation
    const span = tracer.startSpan('query');

    try {
      const {
        level,
        from = 0,
        to = Date.now(),
        limit = 100,
        offset = 0
      } = options;

      const fromTime = typeof from === 'number' ? from : from.getTime();
      const toTime = typeof to === 'number' ? to : to.getTime();

      span.setAttribute('query.from', fromTime);
      span.setAttribute('query.to', toTime);
      span.setAttribute('query.limit', limit);
      span.setAttribute('query.offset', offset);

      // Get keys in the time range
      const allKeys = await redis.zrange(
        `${prefix}index`,
        fromTime,
        toTime,
        { byScore: true }
      );

      // Apply pagination manually
      const keys = allKeys.slice(offset, offset + limit);

      if (keys.length === 0) {
        span.end();
        return [];
      }

      // Get log entries
      const stringKeys = keys.map((key: any) => String(key));
      const logs = await redis.mget(...stringKeys);

      // Parse and filter logs
      const result = logs
        .filter(Boolean)
        .map((log: any) => JSON.parse(log as string))
        .filter((log: any) => !level || log.level === level);

      span.end();
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      return [];
    }
  };

  // Close the logger
  const close = async () => {
    // Create a span for the close operation
    const span = tracer.startSpan('close');

    try {
      // Clear the flush timer
      if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
      }

      // Flush any remaining logs
      await flush();

      span.end();
    } catch (error) {
      span.recordException(error as Error);
      span.end();
    }
  };

  // Create an enhanced logger with additional methods
  const enhancedLogger = logger as any;

  // Add a custom log method that also sends logs to Upstash
  const logToUpstash = (level: string, message: string, meta?: Record<string, any>) => {
    // Create a log entry for Upstash
    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    };

    // Add to batch
    logBatch.push(logEntry);

    // Flush if batch size reached
    if (logBatch.length >= batchSize) {
      flush();
    }
  };

  // Override debug, info, warn, and error methods to also log to Upstash
  const originalDebug = enhancedLogger.debug;
  enhancedLogger.debug = (message: string, meta?: Record<string, any>) => {
    originalDebug.call(enhancedLogger, message, meta);
    logToUpstash('debug', message, meta);
  };

  const originalInfo = enhancedLogger.info;
  enhancedLogger.info = (message: string, meta?: Record<string, any>) => {
    originalInfo.call(enhancedLogger, message, meta);
    logToUpstash('info', message, meta);
  };

  const originalWarn = enhancedLogger.warn;
  enhancedLogger.warn = (message: string, meta?: Record<string, any>) => {
    originalWarn.call(enhancedLogger, message, meta);
    logToUpstash('warn', message, meta);
  };

  const originalError = enhancedLogger.error;
  enhancedLogger.error = (message: string, meta?: Record<string, any>) => {
    originalError.call(enhancedLogger, message, meta);
    logToUpstash('error', message, meta);
  };

  // Add Upstash-specific methods to the logger
  enhancedLogger.query = query;
  enhancedLogger.cleanup = cleanup;
  enhancedLogger.close = close;
  enhancedLogger.flush = flush;
  enhancedLogger.getUpstashStore = () => upstashStore;

  // Start the flush timer
  startFlushTimer();

  return enhancedLogger;
}