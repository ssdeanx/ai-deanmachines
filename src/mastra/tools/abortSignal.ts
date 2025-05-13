/**
 * Long Running Tool with Abort Signal implementation for Mastra
 * 
 * @file Provides a tool that demonstrates abort signal handling for long-running operations
 * @version 1.0.0
 * @author Mastra Team
 * @copyright 2025
 * @license MIT
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the LongRunningTool
const logger = createLogger({
  name: 'Mastra-LongRunningTool',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

/**
 * Helper function to check if operation is aborted
 * @param signal - AbortSignal to check
 * @param operationName - Name of the operation for logging
 * @throws Error if the operation is aborted
 */
const checkAborted = (signal: AbortSignal | undefined, operationName: string): void => {
  if (signal?.aborted) {
    logger.warn(`Operation aborted during ${operationName}`);
    throw new Error(`Aborted during ${operationName}`);
  }
};

/**
 * Long running tool that demonstrates abort signal handling
 */
export const longRunningTool = createTool({
  id: "long-computation",
  description: "Performs a potentially long computation with proper abort handling",
  inputSchema: z.object({
    complexity: z.number().min(1).max(10).default(5)
      .describe("Complexity level of the computation (1-10)"),
    context: z.string().optional()
      .describe("Additional context for the computation")
  }),
  
  /**
   * Tool execution function with optimized abort signal handling
   */
  execute: async ({ input: { complexity, context }, abortSignal }) => {
    const startTime = Date.now();
    const operationId = `comp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    logger.info(`Starting computation [${operationId}] with complexity: ${complexity}`, {
      complexity,
      context: context || 'none',
      operationId
    });

    try {
      // Set up abort listener for immediate response to abort events
      let aborted = false;
      const abortListener = () => {
        aborted = true;
        logger.warn(`Received abort signal for operation [${operationId}]`);
      };
      
      // Add listener if signal exists
      if (abortSignal) {
        abortSignal.addEventListener('abort', abortListener);
      }
      
      // Make API request with timeout and abort handling
      const fetchPromise = fetch("https://api.example.com/data", {
        signal: abortSignal,
        headers: { 'Content-Type': 'application/json' }
      });
      
      // Set up timeout for fetch operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timeout')), 5000);
      });
      
      // Race the fetch against a timeout
      const response = await Promise.race([fetchPromise, timeoutPromise])
        .catch(error => {
          if (aborted) throw new Error('Operation aborted during API request');
          logger.error(`API request failed: ${error.message}`);
          // Return mock data as fallback
          return {
            ok: true,
            json: async () => ({ status: 'fallback', message: 'Using fallback data' })
          };
        });
      
      // Check for abort after fetch
      if (aborted) throw new Error('Operation aborted after API request');
      
      // Start data processing in parallel with computation
      const dataPromise = (response as Response).json();
      
      // Optimize computation with batch processing
      logger.debug(`Starting computation with ${complexity} complexity level`);
      const results = [];
      const batchSize = 10000;
      const totalIterations = complexity * 50000;
      
      for (let i = 0; i < totalIterations; i += batchSize) {
        // Process in batches for better performance
        if (aborted) throw new Error('Operation aborted during computation');
        
        // Check abort signal less frequently for better performance
        if (i % 50000 === 0) {
          checkAborted(abortSignal, `computation at ${Math.round((i/totalIterations)*100)}%`);
          
          // Log progress for long operations
          logger.debug(`Computation progress: ${Math.round((i/totalIterations)*100)}%`, {
            operationId,
            progress: `${Math.round((i/totalIterations)*100)}%`,
            elapsedMs: Date.now() - startTime
          });
        }
        
        // Batch computation for better performance
        const batchResult = {
          sum: 0,
          max: 0,
          count: 0
        };
        
        const endBatch = Math.min(i + batchSize, totalIterations);
        for (let j = i; j < endBatch; j++) {
          const value = Math.sqrt(j) * Math.log(j + 1);
          batchResult.sum += value;
          batchResult.max = Math.max(batchResult.max, value);
          batchResult.count++;
        }
        
        results.push(batchResult);
      }
      
      // Wait for API data
      const data = await dataPromise;
      
      // Final abort check before returning
      if (aborted) throw new Error('Operation aborted before completion');
      
      // Clean up abort listener
      if (abortSignal) {
        abortSignal.removeEventListener('abort', abortListener);
      }
      
      // Aggregate results for better performance
      const aggregatedResults = {
        sum: results.reduce((acc, batch) => acc + batch.sum, 0),
        max: results.reduce((acc, batch) => Math.max(acc, batch.max), 0),
        count: results.reduce((acc, batch) => acc + batch.count, 0),
        batches: results.length
      };
      
      // Prepare final result
      const finalResult = {
        apiData: data,
        computationSummary: aggregatedResults,
        complexity,
        context: context || 'none',
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        operationId
      };
      
      logger.info(`Computation [${operationId}] completed successfully in ${Date.now() - startTime}ms`, {
        operationId,
        durationMs: Date.now() - startTime,
        complexity
      });
      
      return finalResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Handle aborted operations
      if (abortSignal?.aborted || errorMessage.includes('abort')) {
        logger.warn(`Computation [${operationId}] was aborted after ${Date.now() - startTime}ms`, {
          operationId,
          durationMs: Date.now() - startTime,
          complexity
        });
        return {
          status: 'aborted',
          message: 'Operation was cancelled',
          partialDurationMs: Date.now() - startTime
        };
      }
      
      // Handle other errors
      logger.error(`Error during computation [${operationId}]: ${errorMessage}`, {
        operationId,
        error: errorMessage,
        durationMs: Date.now() - startTime
      });
      
      // Return a structured error response rather than throwing
      return {
        status: 'error',
        message: `Computation failed: ${errorMessage}`,
        durationMs: Date.now() - startTime
      };
    }
  },
});