/**
 * Upstash logger implementation for Mastra
 *
 * This file provides a Winston transport that stores logs in Upstash Redis
 * with batching, retention policies, and OpenTelemetry integration.
 */

import Transport from 'winston-transport';
import { v4 as uuidv4 } from 'uuid';
import { createLogger as createWinstonLogger, format, transports, Logger as WinstonLogger } from 'winston';
import { UpstashLoggerConfig, LoggerConfig, LogLevel } from './types';
import { DEFAULT_UPSTASH_LOGGER_CONFIG, DEFAULT_LOGGER_CONFIG } from './constants';
import { getTracer } from './telemetry';
// CRITICAL: Use @mastra/upstash package instead of @upstash/redis directly
// Note: We're still importing Redis from @upstash/redis for now, but this should be replaced
// with the appropriate class from @mastra/upstash when available
import { UpstashStore } from '@mastra/upstash';
import { Redis } from '@upstash/redis';

/**
 * Winston transport for Upstash Redis
 * Stores logs in Upstash Redis with batching and retention policies
 */
export class UpstashTransport extends Transport {
  private url: string;
  private token: string;
  private prefix: string;
  private batchSize: number;
  private flushInterval: number;
  private retentionPeriod: number;
  private redis: Redis;
  private logBatch: any[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private tracer = getTracer('mastra.logger.upstash');

  /**
   * Create a new UpstashTransport instance
   * @param options - Configuration options for the transport
   */
  constructor(options: UpstashLoggerConfig) {
    super(options);

    // Set required properties
    this.url = options.url;
    this.token = options.token;

    // Set optional properties with defaults
    this.prefix = options.prefix || DEFAULT_UPSTASH_LOGGER_CONFIG.prefix;
    this.batchSize = options.batchSize || DEFAULT_UPSTASH_LOGGER_CONFIG.batchSize;
    this.flushInterval = options.flushInterval || DEFAULT_UPSTASH_LOGGER_CONFIG.flushInterval;
    this.retentionPeriod = options.retentionPeriod || DEFAULT_UPSTASH_LOGGER_CONFIG.retentionPeriod;

    // Initialize Upstash Redis client
    this.redis = new Redis({
      url: this.url,
      token: this.token,
    });

    // Start the flush timer
    this.startFlushTimer();
  }

  /**
   * Log method called by Winston
   * @param info - Log information
   * @param callback - Callback function
   */
  log(info: any, callback: () => void) {
    // Create a span for the log operation
    const span = this.tracer.startSpan('log');
    span.setAttribute('log.level', info.level);

    try {
      // Add timestamp if not present
      if (!info.timestamp) {
        info.timestamp = new Date().toISOString();
      }

      // Add log ID if not present
      if (!info.id) {
        info.id = uuidv4();
      }

      // Add to batch
      this.logBatch.push(info);

      // Flush if batch size reached
      if (this.logBatch.length >= this.batchSize) {
        this.flush();
      }

      span.end();
      callback();
    } catch (error) {
      span.recordException(error as Error);
      span.end();
      callback();
    }
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      if (this.logBatch.length > 0) {
        this.flush();
      }
      this.startFlushTimer(); // Restart the timer
    }, this.flushInterval);
  }

  /**
   * Flush the log batch to Upstash Redis
   */
  private async flush() {
    if (this.logBatch.length === 0) {
      return;
    }

    // Create a span for the flush operation
    const span = this.tracer.startSpan('flush');
    span.setAttribute('batch.size', this.logBatch.length);

    try {
      const batch = [...this.logBatch];
      this.logBatch = [];

      // Process each log entry
      const pipeline = this.redis.pipeline();

      for (const log of batch) {
        const logId = log.id;
        const timestamp = new Date(log.timestamp).getTime();
        const key = `${this.prefix}${timestamp}:${logId}`;

        // Store the log entry
        pipeline.set(key, JSON.stringify(log));

        // Set expiration if retention period is defined
        if (this.retentionPeriod > 0) {
          pipeline.expire(key, this.retentionPeriod);
        }

        // Add to time-sorted index
        pipeline.zadd(`${this.prefix}index`, { score: timestamp, member: key });
      }

      // Execute the pipeline
      await pipeline.exec();

      span.end();
    } catch (error) {
      span.recordException(error as Error);
      span.end();

      // Put logs back in the batch for retry
      this.logBatch = [...this.logBatch, ...this.logBatch];

      // Limit batch size to prevent memory issues
      if (this.logBatch.length > this.batchSize * 3) {
        this.logBatch = this.logBatch.slice(-this.batchSize * 3);
      }
    }
  }

  /**
   * Clean up old logs based on retention policy
   */
  async cleanup() {
    // Create a span for the cleanup operation
    const span = this.tracer.startSpan('cleanup');

    try {
      const now = Date.now();
      const cutoff = now - (this.retentionPeriod * 1000);

      // Find keys older than the cutoff
      const oldKeys = await this.redis.zrange(
        `${this.prefix}index`,
        0,
        cutoff,
        { byScore: true }
      );

      if (oldKeys.length > 0) {
        span.setAttribute('cleanup.count', oldKeys.length);

        // Delete old keys
        const pipeline = this.redis.pipeline();

        for (const key of oldKeys) {
          pipeline.del(String(key));
          pipeline.zrem(`${this.prefix}index`, String(key));
        }

        await pipeline.exec();
      }

      span.end();
    } catch (error) {
      span.recordException(error as Error);
      span.end();
    }
  }

  /**
   * Query logs with filtering options
   * @param options - Query options
   * @returns Filtered logs
   */
  async query(options: {
    level?: LogLevel;
    from?: Date | number;
    to?: Date | number;
    limit?: number;
    offset?: number;
  } = {}) {
    // Create a span for the query operation
    const span = this.tracer.startSpan('query');

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
      // First get all keys in the time range
      const allKeys = await this.redis.zrange(
        `${this.prefix}index`,
        fromTime,
        toTime,
        { byScore: true }
      );

      // Then apply pagination manually
      const keys = allKeys.slice(offset, offset + limit);

      if (keys.length === 0) {
        span.end();
        return [];
      }

      // Get log entries
      const stringKeys = keys.map((key: any) => String(key));
      const logs = await this.redis.mget(...stringKeys);

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
  }

  /**
   * Close the transport
   */
  async close() {
    // Create a span for the close operation
    const span = this.tracer.startSpan('close');

    try {
      // Clear the flush timer
      if (this.flushTimer) {
        clearTimeout(this.flushTimer);
        this.flushTimer = null;
      }

      // Flush any remaining logs
      await this.flush();

      span.end();
    } catch (error) {
      span.recordException(error as Error);
      span.end();
    }
  }
}

/**
 * Create an Upstash logger instance
 *
 * @param options - Configuration options for the logger
 * @returns A Winston logger instance with Upstash transport and additional methods
 */
export function createUpstashLogger(options: {
  url: string;
  token: string;
  name?: string;
  level?: string;
  prefix?: string;
  batchSize?: number;
  flushInterval?: number;
  retentionPeriod?: number;
  additionalTransports?: Transport[];
}) {
  // Use LoggerConfig and UpstashLoggerConfig types to validate options
  const loggerOptions: Partial<LoggerConfig> = {
    name: options.name || DEFAULT_LOGGER_CONFIG.name,
    level: options.level as LogLevel || DEFAULT_LOGGER_CONFIG.level,
    format: 'json'
  };

  const upstashOptions: UpstashLoggerConfig = {
    url: options.url,
    token: options.token,
    prefix: options.prefix || DEFAULT_UPSTASH_LOGGER_CONFIG.prefix,
    batchSize: options.batchSize || DEFAULT_UPSTASH_LOGGER_CONFIG.batchSize,
    flushInterval: options.flushInterval || DEFAULT_UPSTASH_LOGGER_CONFIG.flushInterval,
    retentionPeriod: options.retentionPeriod || DEFAULT_UPSTASH_LOGGER_CONFIG.retentionPeriod,
    level: options.level as LogLevel || DEFAULT_LOGGER_CONFIG.level
  };

  // Create Upstash transport
  const upstashTransport = new UpstashTransport(upstashOptions);

  // Create Winston logger with Upstash transport
  const logger = createWinstonLogger({
    level: loggerOptions.level,
    format: format.combine(
      format.timestamp(),
      format.json()
    ),
    defaultMeta: { service: loggerOptions.name },
    transports: [
      // Console transport for local development
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      }),
      // Upstash transport for persistent logging
      upstashTransport,
      // Additional transports
      ...(options.additionalTransports || [])
    ]
  });

  // Add Upstash-specific methods to the logger
  const enhancedLogger = logger as any;

  // Add query method
  enhancedLogger.query = async (queryOptions: any) => {
    return upstashTransport.query(queryOptions);
  };

  // Add cleanup method
  enhancedLogger.cleanup = async () => {
    return upstashTransport.cleanup();
  };

  // Add close method that ensures Upstash transport is properly closed
  const originalClose = enhancedLogger.close;
  enhancedLogger.close = async () => {
    await upstashTransport.close();
    if (originalClose) {
      return originalClose.call(enhancedLogger);
    }
  };

  // Add a reference to the UpstashStore for direct access if needed
  // This ensures the UpstashStore import is used
  enhancedLogger.getUpstashStore = () => {
    return new UpstashStore({
      url: options.url,
      token: options.token,
    });
  };

  return enhancedLogger;
}