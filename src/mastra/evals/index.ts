import {
  EvalConfig,
  EvalMetric,
  EvalParams,
  EvalResult,
  EvalRunResult,
  PerformanceMetrics,
  TokenUsage
} from './types';
import {
  simpleTokenCounter,
  calculateCost,
  trackPerformance,
  generateRequestId
} from './utils';
import { logger } from '../utils/logger';
import { getTracer } from '../utils/telemetry';

// Create a tracer for the evals module
const tracer = getTracer('mastra.evals');

/**
 * Mastra Evaluation System
 *
 * Provides tools for evaluating LLM outputs, tracking performance metrics,
 * and calculating token usage and costs.
 */
export class Evaluator {
  private metrics: EvalMetric[];
  private trackPerformance: boolean;
  private trackTokens: boolean;
  private trackCost: boolean;
  private llmEvaluator?: {
    modelName: string;
    temperature?: number;
    maxTokens?: number;
  };

  /**
   * Create a new Evaluator instance
   *
   * @param config - Evaluation configuration
   */
  constructor(config: EvalConfig) {
    this.metrics = config.metrics || [];
    this.trackPerformance = config.trackPerformance !== false;
    this.trackTokens = config.trackTokens !== false;
    this.trackCost = config.trackCost !== false;
    this.llmEvaluator = config.llmEvaluator;

    logger.info(`Evaluator initialized with ${this.metrics.length} metrics`);
    if (this.trackPerformance) {
      logger.debug('Performance tracking enabled');
    }
    if (this.trackTokens) {
      logger.debug('Token tracking enabled');
    }
    if (this.trackCost) {
      logger.debug('Cost tracking enabled');
    }
  }

  /**
   * Run evaluations on LLM input/output
   *
   * @param params - Evaluation parameters
   * @returns Evaluation results
   */
  async evaluate(params: EvalParams): Promise<EvalRunResult> {
    const requestId = generateRequestId();
    const startTime = Date.now();

    // Create a span for the evaluation
    const span = tracer.startSpan('evaluate');
    span.setAttribute('requestId', requestId);
    span.setAttribute('input.length', params.input.length);
    span.setAttribute('output.length', params.output.length);

    logger.info(`Starting evaluation for request ${requestId}`);

    try {
      // Run all metrics
      const metricResults: Record<string, EvalResult> = {};

      // Run metrics in parallel
      const metricPromises = this.metrics.map(async (metric) => {
        const metricSpan = tracer.startSpan(`metric.${metric.name}`);
        try {
          logger.debug(`Running metric: ${metric.name}`);
          const result = await metric.evaluate(params);
          metricResults[metric.name] = result;

          // Add metric result to span
          metricSpan.setAttribute('metric.name', metric.name);
          metricSpan.setAttribute('metric.type', metric.type);
          metricSpan.setAttribute('metric.value', String(result.value));

          return result;
        } catch (error) {
          logger.error(`Error running metric ${metric.name}: ${error}`);
          metricSpan.recordException({
            name: 'MetricEvaluationError',
            message: `Error evaluating metric ${metric.name}: ${error}`
          });
          throw error;
        } finally {
          metricSpan.end();
        }
      });

      // Wait for all metrics to complete
      await Promise.all(metricPromises);

      // Calculate performance metrics if enabled
      let performanceMetrics: PerformanceMetrics | undefined;

      if (this.trackPerformance) {
        // Estimate token usage
        const tokenUsage: TokenUsage = {
          promptTokens: this.trackTokens ? simpleTokenCounter(params.input) : 0,
          completionTokens: this.trackTokens ? simpleTokenCounter(params.output) : 0,
          totalTokens: this.trackTokens ?
            simpleTokenCounter(params.input) + simpleTokenCounter(params.output) : 0
        };

        // Use a default model name if not provided
        const modelName = params.metadata?.modelName || 'default';

        // Track performance
        performanceMetrics = trackPerformance(startTime, tokenUsage, modelName);

        // Add performance metrics to span
        span.setAttribute('performance.latencyMs', performanceMetrics.latencyMs);
        span.setAttribute('performance.totalTokens', performanceMetrics.totalTokens);
        if (performanceMetrics.costUsd) {
          span.setAttribute('performance.costUsd', performanceMetrics.costUsd);
        }
      }

      // Create evaluation result
      const result: EvalRunResult = {
        requestId,
        metrics: metricResults,
        performance: performanceMetrics,
        input: params.input,
        output: params.output,
        expectedOutput: params.expectedOutput,
        timestamp: new Date().toISOString()
      };

      logger.info(`Evaluation completed for request ${requestId}`);
      return result;
    } catch (error) {
      logger.error(`Error during evaluation: ${error}`);
      span.recordException({
        name: 'EvaluationError',
        message: `Error during evaluation: ${error}`
      });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Add a metric to the evaluator
   *
   * @param metric - Metric to add
   */
  addMetric(metric: EvalMetric): void {
    this.metrics.push(metric);
    logger.debug(`Added metric: ${metric.name}`);
  }

  /**
   * Remove a metric from the evaluator
   *
   * @param metricName - Name of the metric to remove
   * @returns True if the metric was removed, false otherwise
   */
  removeMetric(metricName: string): boolean {
    const initialLength = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.name !== metricName);
    const removed = initialLength > this.metrics.length;

    if (removed) {
      logger.debug(`Removed metric: ${metricName}`);
    }

    return removed;
  }
}

// Export types and utilities
export * from './types';
export * from './constants';
export * from './utils';

// Export default metrics
export * from './metrics';
