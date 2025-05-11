import { NodeSDK } from '@opentelemetry/sdk-node';

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
