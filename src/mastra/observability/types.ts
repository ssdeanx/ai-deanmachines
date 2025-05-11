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
import { LangfuseExporter } from 'langfuse-vercel';

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
