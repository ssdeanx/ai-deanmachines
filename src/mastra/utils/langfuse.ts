import { logger } from './logger';
import { LangfuseConfig, MastraTelemetryConfig, TelemetryExportConfig } from './types';
import { DEFAULT_LANGFUSE_CONFIG } from './constants';

/**
 * Configure Langfuse for LLM observability
 *
 * This function checks if Langfuse credentials are available and returns
 * configuration for Mastra's telemetry system to use Langfuse
 *
 * @returns Configuration object for Langfuse or null if not configured
 */
export function configureLangfuse(): TelemetryExportConfig | null {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const baseUrl = process.env.LANGFUSE_BASEURL || DEFAULT_LANGFUSE_CONFIG.baseUrl;

  if (!publicKey || !secretKey) {
    logger.warn('Langfuse credentials not found. LLM observability will be disabled.');
    return null;
  }

  try {
    // Dynamically import langfuse-vercel to avoid requiring it as a dependency
    // if it's not being used
    const { LangfuseExporter } = require('langfuse-vercel');

    logger.info('Configuring Langfuse for LLM observability');

    return {
      type: 'custom',
      exporter: new LangfuseExporter({
        publicKey,
        secretKey,
        baseUrl,
      }),
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
    return { enabled: false };
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
