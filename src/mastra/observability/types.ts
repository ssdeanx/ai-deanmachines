/**
 * Types for the observability module
 *
 * This file contains type definitions for the observability module,
 * including telemetry, logging, and monitoring.
 */

// OpenTelemetry imports
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Meter } from '@opentelemetry/api';

// Winston imports
import { TransportStreamOptions } from 'winston-transport';
import { Logger } from 'winston';

// Upstash imports
import { Redis } from '@upstash/redis';

// Langfuse imports
import { Langfuse } from 'langfuse';

/**
 * Logger level type
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  name: string;
  level?: LogLevel;
  format?: 'json' | 'pretty';
  transports?: any[];
}

/**
 * Upstash logger configuration options
 */
export interface UpstashLoggerConfig extends TransportStreamOptions {
  url: string;
  token: string;
  prefix?: string;
  batchSize?: number;
  flushInterval?: number;
  retentionPeriod?: number;
  level?: LogLevel;
}

/**
 * Telemetry configuration options
 */
export interface TelemetryConfig {
  serviceName?: string;
  serviceVersion?: string;
  environment?: string;
  enabled?: boolean;
  exporterEndpoint?: string;
  exporterHeaders?: Record<string, string>;
}

/**
 * Langfuse configuration options
 */
export interface LangfuseConfig {
  publicKey: string;
  secretKey: string;
  baseUrl?: string;
}

/**
 * Telemetry export configuration
 */
export interface TelemetryExportConfig {
  type: 'custom' | 'otlp';
  exporter: any;
}

/**
 * Mastra telemetry configuration
 */
export interface MastraTelemetryConfig {
  serviceName: string;
  enabled: boolean;
  environment?: string;
  export?: TelemetryExportConfig | null;
}

/**
 * OpenTelemetry SDK instance
 */
export type TelemetrySDK = NodeSDK | null;

/**
 * Langfuse trace options
 */
export interface LangfuseTraceOptions {
  name: string;
  userId?: string;
  sessionId?: string;
  id?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  input?: any;
  output?: any;
}

/**
 * Langfuse generation options
 */
export interface LangfuseGenerationOptions {
  name: string;
  model: string;
  modelParameters?: Record<string, any>;
  input?: any;
  output?: any;
  usage?: {
    input?: number;
    output?: number;
    total?: number;
    unit?: 'TOKENS' | 'CHARACTERS' | 'MILLISECONDS' | 'SECONDS' | 'IMAGES' | 'REQUESTS';
    inputCost?: number;
    outputCost?: number;
    totalCost?: number;
  };
  metadata?: Record<string, any>;
  startTime?: Date;
  endTime?: Date;
}

/**
 * Langfuse span options
 */
export interface LangfuseSpanOptions {
  name: string;
  input?: any;
  output?: any;
  metadata?: Record<string, any>;
  startTime?: Date;
  endTime?: Date;
}

/**
 * Langfuse event options
 */
export interface LangfuseEventOptions {
  name: string;
  input?: any;
  output?: any;
  metadata?: Record<string, any>;
}

/**
 * Langfuse score options
 */
export interface LangfuseScoreOptions {
  name: string;
  value: number;
  comment?: string;
}

/**
 * Langfuse feedback options
 */
export interface LangfuseFeedbackOptions {
  traceId: string;
  score: number;
  comment?: string;
  userId?: string;
}
