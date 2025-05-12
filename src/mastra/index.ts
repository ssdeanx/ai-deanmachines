import { Mastra } from '@mastra/core';
import { createLogger } from '@mastra/core/logger';
import { createTelemetryConfig } from './observability/langfuse';
import { MastraTelemetryConfig, TelemetryExportConfig } from './observability/types'; // Import necessary types




// Create a logger instance for the main Mastra module
const logger = createLogger({
  name: 'Mastra',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Initialize and configure the Mastra instance
 * This is the main entry point for the Mastra application
 *
 * @returns The configured Mastra instance
 */
export function createMastraInstance() {

  // Configure Langfuse for LLM observability
  const localTelemetryConfig: MastraTelemetryConfig = createTelemetryConfig({
    enabled: process.env.ENABLE_TELEMETRY !== 'false',
    serviceName: 'ai', // Must be 'ai' for Langfuse to recognize it as an AI SDK trace
    environment: process.env.NODE_ENV || 'development'
  });

  // Adapt the local telemetry configuration to OtelConfig expected by Mastra core
  const mastraCoreTelemetryConfig: any = {
    enabled: localTelemetryConfig.enabled,
    serviceName: localTelemetryConfig.serviceName,
    environment: localTelemetryConfig.environment,
    export: localTelemetryConfig.export === null ? undefined : localTelemetryConfig.export as TelemetryExportConfig | undefined,
  };

  

  // Initialize Mastra instance with logger, telemetry, and agent instances
  const mastra = new Mastra({
    logger,
    telemetry: mastraCoreTelemetryConfig,
    agents: {
    }
  }) as any; // Type assertion to avoid TypeScript errors with custom properties

  logger.info('Mastra instance created with telemetry and agent configuration');
  return mastra;
}

// Create and export the Mastra instance
export const mastra = createMastraInstance();

/**
 * Export core types and constants
 */
export * from './types';
export * from './constants';

;

export * from './embeddings';
export * from './knowledge';