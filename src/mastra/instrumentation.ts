/**
 * OpenTelemetry instrumentation for Mastra
 * 
 * This file should be loaded before any other code in the application
 * using the --require flag or by importing it at the top of your entry file.
 * 
 * Example:
 * node --require ./instrumentation.js app.js
 * 
 * Or in TypeScript:
 * ts-node --require ./instrumentation.ts app.ts
 */

// Import required OpenTelemetry components
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { 
  PeriodicExportingMetricReader, 
  ConsoleMetricExporter 
} from '@opentelemetry/sdk-metrics';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

// Load environment variables if dotenv is available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv is optional
}

// Configure the OpenTelemetry SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'mastra-app',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    ? new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
        headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
          ? { Authorization: process.env.OTEL_EXPORTER_OTLP_HEADERS }
          : undefined,
      })
    : new ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new ConsoleMetricExporter(),
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-fs': { enabled: true },
    }),
  ],
});

// Start the SDK
sdk.start()
  .then(() => console.log('OpenTelemetry instrumentation initialized'))
  .catch((error: any) => console.error('Error initializing OpenTelemetry instrumentation:', error));

// Handle process shutdown
const shutdownHandler = () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down successfully'))
    .catch(error => console.error('Error shutting down OpenTelemetry SDK:', error))
    .finally(() => process.exit(0));
};

process.on('SIGTERM', shutdownHandler);
process.on('SIGINT', shutdownHandler);
