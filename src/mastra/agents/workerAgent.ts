/**
 * WorkerAgent implementation for Mastra AI
 *
 * This file implements a specialized agent that focuses on a specific domain
 * and provides expert-level assistance within that domain.
 */

import { Agent } from '@mastra/core';
import { google } from '@ai-sdk/google';

// Import types and constants
import {
  WorkerAgentConfig,
  WorkerAgentConfigSchema,
  TaskProcessingOptions,
  TaskProcessingOptionsSchema,
  ConfidenceEvaluationSchema
} from './types';
import { AgentType, DEFAULT_INSTRUCTIONS, DEFAULT_MODEL_NAMES } from './constants';
import { BaseAgent } from './baseAgent';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the WorkerAgent
const logger = createLogger({
  name: 'Mastra-WorkerAgent',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * WorkerAgent class that extends BaseAgent with domain-specific expertise
 * Provides specialized capabilities within a specific domain
 */
export class WorkerAgent extends BaseAgent {
  private domain: string;
  private expertise: string[];

  /**
   * Create a new WorkerAgent instance
   * @param config - Configuration for the worker agent
   */
  constructor(config: WorkerAgentConfig) {
    // Set default values for worker agent
    const workerConfig = {
      ...config,
      type: AgentType.WORKER,
      instructions: config.instructions || DEFAULT_INSTRUCTIONS.WORKER,
      modelName: config.modelName || DEFAULT_MODEL_NAMES.GEMINI_1_5_FLASH, // Use a faster model for workers
    };

    // Validate configuration
    const validatedConfig = WorkerAgentConfigSchema.parse(workerConfig);
    logger.info(`Creating WorkerAgent with name: ${validatedConfig.name} in domain: ${validatedConfig.domain}`);

    // Enhance instructions with domain-specific context
    const enhancedInstructions = `${validatedConfig.instructions}\n\nYou are specialized in the domain of ${validatedConfig.domain}.${validatedConfig.expertise ? ` Your areas of expertise include: ${validatedConfig.expertise.join(', ')}.` : ''}`;

    // Call parent constructor with validated config and enhanced instructions
    super({
      ...validatedConfig,
      instructions: enhancedInstructions
    });

    // Set worker-specific properties
    this.domain = validatedConfig.domain;
    this.expertise = validatedConfig.expertise || [];

    logger.info(`WorkerAgent ${validatedConfig.name} created successfully in domain: ${this.domain}`);
    if (this.expertise.length > 0) {
      logger.debug(`WorkerAgent expertise areas: ${this.expertise.join(', ')}`);
    }
  }

  /**
   * Get the domain of the worker agent
   * @returns The domain of the worker agent
   */
  getDomain() {
    return this.domain;
  }

  /**
   * Get the expertise areas of the worker agent
   * @returns Array of expertise areas
   */
  getExpertise() {
    return this.expertise;
  }

  /**
   * Add an expertise area to the worker agent
   * @param expertiseArea - Expertise area to add
   * @returns The worker agent instance for chaining
   */
  addExpertise(expertiseArea: string) {
    logger.info(`Adding expertise area to worker agent: ${expertiseArea}`);
    this.expertise.push(expertiseArea);

    // Update the agent's instructions to reflect the new expertise
    const currentInstructions = this.getAgent().getInstructions();
    const updatedInstructions = `${currentInstructions}\nYour areas of expertise now also include: ${expertiseArea}.`;

    // Recreate the agent with updated instructions
    // Create a new agent with the updated instructions
    const newAgent = new Agent({
      name: this.getAgent().name,
      instructions: updatedInstructions,
      model: google(this.getModelName()),
      memory: this.memory?.getMemoryInstance?.(),
      tools: this.tools.length > 0 ? this.tools.reduce((acc, tool) => {
        if (tool.name) {
          acc[tool.name] = tool;
        }
        return acc;
      }, {}) : undefined
    });

    // Replace the agent
    this.agent = newAgent;

    logger.debug(`Expertise area added successfully. Total expertise areas: ${this.expertise.length}`);
    return this;
  }

  /**
   * Check if the worker agent has expertise in a specific area
   * @param expertiseArea - Expertise area to check
   * @returns True if the worker has expertise in the area, false otherwise
   */
  hasExpertise(expertiseArea: string) {
    return this.expertise.includes(expertiseArea);
  }

  /**
   * Process a task within the worker's domain of expertise
   * @param task - Task to process
   * @returns Response from the worker agent
   */
  async processTask(task: string, options: TaskProcessingOptions = {}) {
    // Validate options with Zod
    const validatedOptions = TaskProcessingOptionsSchema.parse(options);
    logger.info(`Processing task in domain ${this.domain}: ${task.substring(0, 50)}${task.length > 50 ? '...' : ''}`);

    try {
      // Enhance the task with domain context
      const enhancedTask = `
Task: ${task}

You are an expert in the domain of ${this.domain}.
${this.expertise.length > 0 ? `Your specific areas of expertise include: ${this.expertise.join(', ')}.` : ''}

Instructions:
1. Analyze the task thoroughly from the perspective of your domain expertise
2. Apply specialized knowledge and best practices from your domain
3. Consider any domain-specific constraints, standards, or methodologies
4. Provide a comprehensive solution with clear reasoning
5. Include relevant technical details, references, or examples where appropriate
6. Ensure your response is accurate, practical, and implementable

Provide a detailed and authoritative response based on your specialized knowledge.
      `;

      // Set domain-specific options using validated options
      const taskOptions: Record<string, any> = {
        temperature: validatedOptions.temperature || 0.3, // Lower temperature for more factual responses
        maxTokens: validatedOptions.maxTokens || 1500, // Allow for detailed responses
        topP: validatedOptions.topP || 0.95, // Focus on more likely tokens
        // Include domain context in metadata for telemetry
        metadata: {
          ...(validatedOptions.metadata || {}),
          domain: this.domain,
          expertise: this.expertise,
          taskType: 'domain_specific'
        }
      };

      // Add thread and resource IDs if provided
      if (validatedOptions.threadId) {
        taskOptions['threadId'] = validatedOptions.threadId;
      }

      if (validatedOptions.resourceId) {
        taskOptions['resourceId'] = validatedOptions.resourceId;
      }

      // Generate response with enhanced context and options
      const response = await this.generate(enhancedTask, taskOptions);

      // Store the task and response in memory if available
      if (this.memory && this.threadId) {
        try {
          // Create user message
          const userMessage = {
            content: task,
            role: 'user' as const,
            type: 'text' as const,
            metadata: {
              domain: this.domain,
              expertise: this.expertise,
              timestamp: new Date().toISOString()
            }
          };

          // Store user message
          await (this.memory as any).addMessage(this.threadId, userMessage);

          // Create assistant message
          const assistantMessage = {
            content: response.text,
            role: 'assistant' as const,
            type: 'text' as const,
            metadata: {
              domain: this.domain,
              expertise: this.expertise,
              timestamp: new Date().toISOString()
            }
          };

          // Store assistant message
          await (this.memory as any).addMessage(this.threadId, assistantMessage);
        } catch (memoryError) {
          logger.warn(`Failed to store task in memory: ${memoryError}`);
        }
      }

      logger.debug(`Task processed successfully in domain: ${this.domain}`);
      return response;
    } catch (error) {
      logger.error(`Error processing task in domain ${this.domain}: ${error}`);

      // Attempt to recover with a simplified approach
      try {
        logger.info('Attempting recovery with simplified task processing');
        const response = await this.generate(task, {
          temperature: 0.2,
          maxTokens: 800
        });
        logger.debug('Recovery successful with simplified approach');
        return response;
      } catch (recoveryError) {
        logger.error(`Recovery failed: ${recoveryError}`);
        throw error; // Throw the original error
      }
    }
  }

  /**
   * Evaluate the worker's confidence in handling a specific task
   * @param task - Task to evaluate
   * @returns Confidence score between 0 and 1
   */
  async evaluateConfidence(task: string) {
    logger.info(`Evaluating confidence for task: ${task.substring(0, 50)}${task.length > 50 ? '...' : ''}`);

    try {
      const confidencePrompt = `
        Task: ${task}

        Based on your expertise in ${this.domain}${this.expertise.length > 0 ? ` and knowledge of ${this.expertise.join(', ')}` : ''},
        evaluate your confidence in handling this task.

        Respond with a JSON object containing:
        - confidence: A number between 0 and 1 representing your confidence level
        - reasoning: A brief explanation of your confidence assessment
      `;

      const response = await this.generate(confidencePrompt);

      // Extract the confidence score from the response
      try {
        // Extract JSON from the response
        const jsonMatch = response.text.match(/```json\n([\s\S]*?)\n```/) ||
                         response.text.match(/{[\s\S]*?}/);

        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const parsedJson = JSON.parse(jsonStr);

          // Validate the evaluation with Zod
          try {
            const evaluation = ConfidenceEvaluationSchema.parse(parsedJson);
            logger.debug(`Confidence evaluation: ${evaluation.confidence} - ${evaluation.reasoning}`);
            return evaluation.confidence;
          } catch (validationError) {
            logger.warn(`Invalid confidence evaluation format: ${validationError}`);
            // Default to moderate confidence if validation fails
            return 0.5;
          }
        } else {
          logger.warn('Failed to extract JSON confidence evaluation from response');
          // Default to moderate confidence if parsing fails
          return 0.5;
        }
      } catch (parseError) {
        logger.error(`Error parsing confidence evaluation: ${parseError}`);
        // Default to moderate confidence if parsing fails
        return 0.5;
      }
    } catch (error) {
      logger.error(`Error evaluating confidence: ${error}`);
      // Default to low confidence if evaluation fails
      return 0.3;
    }
  }
}
