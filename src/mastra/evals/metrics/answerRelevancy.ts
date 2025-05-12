import { NumericEvalMetric, EvalParams, EvalResult } from '../types';
import { DEFAULT_THRESHOLDS } from '../constants';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the AnswerRelevancy metric
const logger = createLogger({
  name: 'Mastra-AnswerRelevancy',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Answer Relevancy Metric
 *
 * Evaluates how relevant an answer is to the given question or prompt.
 * Returns a score between 0 and 1, where higher values indicate better relevance.
 */
export const AnswerRelevancyMetric: NumericEvalMetric = {
  name: 'answer_relevancy',
  description: 'Evaluates how relevant an answer is to the given question or prompt',
  type: 'numeric',
  minValue: 0,
  maxValue: 1,
  thresholds: DEFAULT_THRESHOLDS,

  /**
   * Evaluate answer relevancy
   *
   * @param params - Evaluation parameters
   * @returns Evaluation result with a score between 0 and 1
   */
  async evaluate(params: EvalParams): Promise<EvalResult<number>> {
    const { input, output } = params;

    logger.debug('Evaluating answer relevancy');

    try {
      // In a real implementation, this would use an LLM or other algorithm
      // to evaluate the relevance of the output to the input

      // For demonstration purposes, we'll use a simple heuristic
      // based on keyword overlap between input and output

      // Normalize and tokenize input and output
      const inputTokens = new Set(
        input.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(token => token.length > 3)
      );

      const outputTokens = new Set(
        output.toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(token => token.length > 3)
      );

      // Count overlapping tokens
      let overlapCount = 0;
      for (const token of inputTokens) {
        if (outputTokens.has(token)) {
          overlapCount++;
        }
      }

      // Calculate relevancy score
      // This is a very simplified approach - in production, use a more sophisticated method
      const relevancyScore = inputTokens.size > 0
        ? Math.min(1, overlapCount / Math.sqrt(inputTokens.size))
        : 0;

      return {
        value: relevancyScore,
        explanation: `Relevancy score based on keyword overlap: ${relevancyScore.toFixed(2)}`,
        metadata: {
          inputTokenCount: inputTokens.size,
          outputTokenCount: outputTokens.size,
          overlapCount
        }
      };
    } catch (error) {
      logger.error(`Error evaluating answer relevancy: ${error}`);

      // Return a default score in case of error
      return {
        value: 0,
        explanation: `Error evaluating answer relevancy: ${error}`,
        metadata: {
          error: String(error)
        }
      };
    }
  }
};
