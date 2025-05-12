import { metrics, Meter, trace } from '@opentelemetry/api';

/**
 * Create a tracer for a specific module
 *
 * @param moduleName - The name of the module to create a tracer for
 * @returns A tracer instance for the specified module
 */
export function getTracer(moduleName: string) {
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

let memoizedLlmMetrics: any = null;

/**
 * LLM metrics for tracking token usage, latency, and costs.
 * Lazily initializes and memoizes the metrics object.
 */
export function getLlmMetrics() {
  if (memoizedLlmMetrics) {
    return memoizedLlmMetrics;
  }

  const meter = getMeter('mastra.llm');

  memoizedLlmMetrics = {
    promptTokens: meter.createCounter('llm.prompt_tokens', {
      description: 'Number of tokens in the prompt',
      unit: 'tokens'
    }),
    completionTokens: meter.createCounter('llm.completion_tokens', {
      description: 'Number of tokens in the completion',
      unit: 'tokens'
    }),
    totalTokens: meter.createCounter('llm.total_tokens', {
      description: 'Total number of tokens used',
      unit: 'tokens'
    }),
    cost: meter.createCounter('llm.cost', {
      description: 'Cost of LLM operations',
      unit: 'usd'
    }),
    latency: meter.createHistogram('llm.latency', {
      description: 'Latency of LLM operations',
      unit: 'ms'
    }),
    requests: meter.createCounter('llm.requests', {
      description: 'Number of LLM requests',
      unit: '1'
    }),
    errors: meter.createCounter('llm.errors', {
      description: 'Number of LLM errors',
      unit: '1'
    })
  };
  return memoizedLlmMetrics;
}

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
  const currentLlmMetrics = getLlmMetrics();
  const attributes = {
    'model.name': metrics.modelName,
    'operation.type': metrics.operationType
  };

  if (metrics.promptTokens) {
    currentLlmMetrics.promptTokens.add(metrics.promptTokens, attributes);
  }

  if (metrics.completionTokens) {
    currentLlmMetrics.completionTokens.add(metrics.completionTokens, attributes);
  }

  if (metrics.totalTokens) {
    currentLlmMetrics.totalTokens.add(metrics.totalTokens, attributes);
  }

  if (metrics.cost) {
    currentLlmMetrics.cost.add(metrics.cost, attributes);
  }

  if (metrics.latency) {
    currentLlmMetrics.latency.record(metrics.latency, attributes);
  }

  currentLlmMetrics.requests.add(1, attributes);

  if (metrics.error) {
    currentLlmMetrics.errors.add(1, attributes);
  }
}
