import { Mastra } from '@mastra/core';
import { logger } from './observability/logger';
import { createTelemetryConfig } from './observability/langfuse';
import { initTelemetry } from './observability/telemetry';

/**
 * Initialize and configure the Mastra instance
 * This is the main entry point for the Mastra application
 * 
 * @returns The configured Mastra instance
 */
export function createMastraInstance() {
  // Initialize OpenTelemetry
  const telemetrySdk = initTelemetry({
    serviceName: 'mastra-service',
    enabled: process.env.ENABLE_TELEMETRY !== 'false',
    exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    exporterHeaders: process.env.OTEL_EXPORTER_OTLP_HEADERS ? 
      { Authorization: process.env.OTEL_EXPORTER_OTLP_HEADERS } : 
      undefined
  });

  // Configure Langfuse for LLM observability
  const telemetryConfig = createTelemetryConfig({
    enabled: process.env.ENABLE_TELEMETRY !== 'false',
    serviceName: 'ai', // Must be 'ai' for Langfuse to recognize it as an AI SDK trace
    environment: process.env.NODE_ENV || 'development'
  });

  // Initialize Mastra instance with logger and telemetry
  const mastra = new Mastra({
    logger,
    telemetry: {
      enabled: telemetryConfig.enabled,
      serviceName: telemetryConfig.serviceName,
      export: telemetryConfig.export ? {
        type: telemetryConfig.export.type,
        exporter: telemetryConfig.export.exporter
      } : undefined
    }
  }) as any; // Type assertion to avoid TypeScript errors with custom properties

  // Add telemetry SDK to Mastra instance for reference
  mastra.telemetrySdk = telemetrySdk;

  logger.info('Mastra instance created with telemetry configuration');
  return mastra;
}

// Create and export the Mastra instance
export const mastra = createMastraInstance();

/**
 * Export all available agents
 * @returns An object containing all agent implementations
 */
export async function getAllAgents() {
  // Import agent classes dynamically to avoid circular dependencies
  const agents = await import('./agents');
  const { BaseAgent, GoogleAgent, SupervisorAgent, WorkerAgent } = agents;

  return {
    BaseAgent,
    GoogleAgent,
    SupervisorAgent,
    WorkerAgent
  };
}

/**
 * Import agents into the main Mastra instance
 * This allows for centralized management of agents
 * @param agents - Object containing agent instances to import
 * @returns The Mastra instance with imported agents
 */
export function importAgents(agents: Record<string, any>) {
  logger.info(`Importing ${Object.keys(agents).length} agents into Mastra`);

  // Get the Mastra registry (or create one if it doesn't exist)
  if (!mastra.registry) {
    mastra.registry = {
      agents: new Map(),
      tools: new Map(),
      workflows: new Map()
    };
  }

  // Register each agent with Mastra
  Object.entries(agents).forEach(([name, agentInstance]) => {
    logger.debug(`Registering agent: ${name}`);

    // Add the agent to the registry
    mastra.registry.agents.set(name, agentInstance);

    // If the agent has a getAgent method, we can get more information about it
    if (agentInstance && typeof agentInstance.getAgent === 'function') {
      try {
        const agent = agentInstance.getAgent();
        const agentName = agent.name;
        logger.debug(`Agent ${name} has internal name: ${agentName}`);
      } catch (error) {
        logger.error(`Error getting agent information for ${name}: ${error}`);
      }
    }
  });

  logger.info('Agents imported successfully');
  return mastra;
}

