import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import {
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
  MeterProvider
} from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { diag, DiagConsoleLogger, DiagLogLevel, metrics, Meter, trace } from '@opentelemetry/api';
import { logger } from './logger';
import { TelemetryConfig, TelemetrySDK } from './types';
import { DEFAULT_TELEMETRY_CONFIG, SEMRESATTRS } from './constants';

/**
 * Configure and initialize OpenTelemetry
 *
 * @param config - Configuration options for OpenTelemetry
 * @returns The initialized NodeSDK instance
 */
export function initTelemetry(config: TelemetryConfig = {}): TelemetrySDK {
  const {
    serviceName = DEFAULT_TELEMETRY_CONFIG.serviceName,
    serviceVersion = DEFAULT_TELEMETRY_CONFIG.serviceVersion,
    environment = DEFAULT_TELEMETRY_CONFIG.environment,
    enabled = DEFAULT_TELEMETRY_CONFIG.enabled,
    exporterEndpoint,
    exporterHeaders
  } = config;

  if (!enabled) {
    logger.info('OpenTelemetry is disabled');
    return null;
  }

  // Enable OpenTelemetry debugging if needed
  if (process.env.OTEL_DEBUG === 'true') {
    // We already imported these at the top of the file
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
  }

  logger.info(`Initializing OpenTelemetry for service: ${serviceName}`);

  // Determine if we're in production
  const isProduction = environment === 'production';

  // Prepare Langfuse OTLP endpoint if credentials are available
  const langfuseEnabled = !!(process.env.LANGFUSE_SECRET_KEY && process.env.LANGFUSE_PUBLIC_KEY);
  const langfuseBaseUrl = process.env.LANGFUSE_BASEURL || 'https://cloud.langfuse.com';
  const langfuseOtlpEndpoint = `${langfuseBaseUrl}/api/public/otel/v1/traces`;

  // Create auth string for Langfuse if credentials are available
  let langfuseAuthString: string | undefined;
  if (langfuseEnabled) {
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    if (publicKey && secretKey) {
      langfuseAuthString = Buffer.from(`${publicKey}:${secretKey}`).toString('base64');
    }
  }

  // Create a resource that identifies your service
  // Using SEMRESATTRS constants for semantic resource attributes
  const resourceAttributes = {
    [SEMRESATTRS.SERVICE_NAME]: serviceName || process.env.OTEL_SERVICE_NAME || 'mastra-app',
    [SEMRESATTRS.SERVICE_VERSION]: serviceVersion || process.env.npm_package_version || '1.0.0',
    [SEMRESATTRS.DEPLOYMENT_ENVIRONMENT]: environment || process.env.NODE_ENV || 'development',
    'app.name': 'mastra-ai',
    'app.component': 'agent-framework',
    'ai.framework': 'mastra',
    'ai.version': process.env.npm_package_version || '1.0.0',
  };

  // Create the resource using the attributes
  const resource = resourceFromAttributes(resourceAttributes);

  // Configure trace exporters
  const traceExporters = [];

  // Add Langfuse exporter if credentials are available
  if (langfuseEnabled && langfuseAuthString) {
    logger.info(`Adding Langfuse OTLP exporter with endpoint: ${langfuseOtlpEndpoint}`);
    traceExporters.push(
      new OTLPTraceExporter({
        url: langfuseOtlpEndpoint,
        headers: {
          'Authorization': `Basic ${langfuseAuthString}`,
        },
      })
    );
  }

  // Add OTLP exporter if endpoint is provided
  if (exporterEndpoint) {
    logger.info(`Adding OTLP exporter with endpoint: ${exporterEndpoint}`);
    traceExporters.push(
      new OTLPTraceExporter({
        url: exporterEndpoint,
        headers: exporterHeaders,
      })
    );
  }

  // Always add console exporter for development visibility
  if (environment === 'development') {
    traceExporters.push(new ConsoleSpanExporter());
  }

  // Create and configure the OpenTelemetry SDK
  const sdk = new NodeSDK({
    resource,
    traceExporter: traceExporters.length > 0 ? traceExporters[0] : new ConsoleSpanExporter(),
    metricReader: new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
      // Export metrics every 15 seconds in production, 5 seconds in development
      exportIntervalMillis: isProduction ? 15000 : 5000,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-http': { enabled: true },
        '@opentelemetry/instrumentation-express': { enabled: true },
        '@opentelemetry/instrumentation-fs': { enabled: true },
        '@opentelemetry/instrumentation-dns': { enabled: true },
        '@opentelemetry/instrumentation-graphql': { enabled: true },
        '@opentelemetry/instrumentation-grpc': { enabled: true },
        '@opentelemetry/instrumentation-redis': { enabled: true },
        '@opentelemetry/instrumentation-pg': { enabled: true },
        '@opentelemetry/instrumentation-mongodb': { enabled: true },
      }),
    ],
  });

  // Start the SDK
  try {
    sdk.start();
    if (!isProduction) {
      logger.info('OpenTelemetry SDK started successfully');
      if (langfuseEnabled && langfuseAuthString) {
        logger.info('Langfuse instrumentation configured');
      }
    }
  } catch (error) {
    logger.error(`Error starting OpenTelemetry SDK: ${error}`);
  }

  // Handle process shutdown
  const shutdownHandler = () => {
    logger.info('Shutting down OpenTelemetry SDK');
    sdk.shutdown()
      .then(() => {
        logger.info('OpenTelemetry SDK shut down successfully');
        process.exit(0);
      })
      .catch(error => {
        logger.error(`Error shutting down OpenTelemetry SDK: ${error}`);
        process.exit(1);
      });
  };

  process.on('SIGTERM', shutdownHandler);
  process.on('SIGINT', shutdownHandler);

  return sdk;
}

/**
 * Create a tracer for a specific module
 *
 * @param moduleName - The name of the module to create a tracer for
 * @returns A tracer instance for the specified module
 */
export function getTracer(moduleName: string) {
  // Use the trace API imported at the top of the file
  return trace.getTracer(moduleName);
}

/**
 * Create a meter for a specific module
 *
 * @param moduleName - The name of the module to create a meter for
 * @returns A meter instance for the specified module
 */
export function getMeter(moduleName: string): Meter {
  return metrics.getMeter(moduleName);
}

/**
 * LLM metrics for tracking token usage, latency, and costs
 */
export const llmMetrics = {
  // Token usage metrics
  promptTokens: getMeter('mastra.llm').createCounter('llm.prompt_tokens', {
    description: 'Number of tokens in the prompt',
    unit: 'tokens'
  }),

  completionTokens: getMeter('mastra.llm').createCounter('llm.completion_tokens', {
    description: 'Number of tokens in the completion',
    unit: 'tokens'
  }),

  totalTokens: getMeter('mastra.llm').createCounter('llm.total_tokens', {
    description: 'Total number of tokens used',
    unit: 'tokens'
  }),

  // Cost metrics
  cost: getMeter('mastra.llm').createCounter('llm.cost', {
    description: 'Cost of LLM operations',
    unit: 'usd'
  }),

  // Latency metrics
  latency: getMeter('mastra.llm').createHistogram('llm.latency', {
    description: 'Latency of LLM operations',
    unit: 'ms'
  }),

  // Request count metrics
  requests: getMeter('mastra.llm').createCounter('llm.requests', {
    description: 'Number of LLM requests',
    unit: '1'
  }),

  // Error metrics
  errors: getMeter('mastra.llm').createCounter('llm.errors', {
    description: 'Number of LLM errors',
    unit: '1'
  })
};

/**
 * Record LLM metrics
 *
 * @param metrics - Metrics to record
 */
export function recordLLMMetrics(metrics: {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cost?: number;
  latency?: number;
  error?: boolean;
  modelName: string;
  operationType: string;
}) {
  const attributes = {
    'model.name': metrics.modelName,
    'operation.type': metrics.operationType
  };

  if (metrics.promptTokens) {
    llmMetrics.promptTokens.add(metrics.promptTokens, attributes);
  }

  if (metrics.completionTokens) {
    llmMetrics.completionTokens.add(metrics.completionTokens, attributes);
  }

  if (metrics.totalTokens) {
    llmMetrics.totalTokens.add(metrics.totalTokens, attributes);
  }

  if (metrics.cost) {
    llmMetrics.cost.add(metrics.cost, attributes);
  }

  if (metrics.latency) {
    llmMetrics.latency.record(metrics.latency, attributes);
  }

  // Record request count
  llmMetrics.requests.add(1, attributes);

  // Record error if applicable
  if (metrics.error) {
    llmMetrics.errors.add(1, attributes);
  }
}
