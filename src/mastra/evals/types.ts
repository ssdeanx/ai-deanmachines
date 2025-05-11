/**
 * Types for Mastra evaluation system
 */

/**
 * Evaluation metric type
 */
export type EvalMetricType = 'numeric' | 'categorical' | 'boolean';

/**
 * Base evaluation metric interface
 */
export interface EvalMetric<T = number | string | boolean> {
  name: string;
  description: string;
  type: EvalMetricType;
  evaluate: (params: EvalParams) => Promise<EvalResult<T>>;
}

/**
 * Numeric evaluation metric
 */
export interface NumericEvalMetric extends EvalMetric<number> {
  type: 'numeric';
  minValue?: number;
  maxValue?: number;
  thresholds?: {
    poor: number;
    fair: number;
    good: number;
    excellent: number;
  };
}

/**
 * Categorical evaluation metric
 */
export interface CategoricalEvalMetric extends EvalMetric<string> {
  type: 'categorical';
  categories: string[];
}

/**
 * Boolean evaluation metric
 */
export interface BooleanEvalMetric extends EvalMetric<boolean> {
  type: 'boolean';
}

/**
 * Parameters for evaluation
 */
export interface EvalParams {
  input: string;
  output: string;
  expectedOutput?: string;
  context?: string;
  metadata?: Record<string, any>;
}

/**
 * Result of an evaluation
 */
export interface EvalResult<T = number | string | boolean> {
  value: T;
  explanation?: string;
  metadata?: Record<string, any>;
}

/**
 * Performance metrics for LLM operations
 */
export interface PerformanceMetrics {
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costUsd?: number;
  modelName: string;
  timestamp: string;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Cost calculation information
 */
export interface CostInfo {
  modelName: string;
  promptTokens: number;
  completionTokens: number;
  promptCostUsd: number;
  completionCostUsd: number;
  totalCostUsd: number;
}

/**
 * Evaluation configuration
 */
export interface EvalConfig {
  metrics: EvalMetric[];
  llmEvaluator?: {
    modelName: string;
    temperature?: number;
    maxTokens?: number;
  };
  trackPerformance?: boolean;
  trackTokens?: boolean;
  trackCost?: boolean;
}

/**
 * Evaluation run result
 */
export interface EvalRunResult {
  requestId: string;
  metrics: Record<string, EvalResult>;
  performance?: PerformanceMetrics;
  input: string;
  output: string;
  expectedOutput?: string;
  timestamp: string;
}

/**
 * Token counter function type
 */
export type TokenCounterFn = (text: string, modelName?: string) => number;

/**
 * Cost calculator function type
 */
export type CostCalculatorFn = (usage: TokenUsage, modelName: string) => number;
