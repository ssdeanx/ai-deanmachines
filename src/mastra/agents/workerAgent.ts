/**
 * WorkerAgent implementation for Mastra AI
 *
 * This file implements a specialized agent that focuses on a specific domain
 * and provides expert-level assistance within that domain.
 */

import { Agent } from '@mastra/core';
import { google } from '@ai-sdk/google';

// Import types and constants
import { WorkerAgentConfig, WorkerAgentConfigSchema } from './types';
import { AgentType, DEFAULT_INSTRUCTIONS, DEFAULT_MODEL_NAMES } from './constants';
import { logger } from '../index';
import { BaseAgent } from './baseAgent';

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
  async processTask(task: string) {
    logger.info(`Processing task in domain ${this.domain}: ${task.substring(0, 50)}${task.length > 50 ? '...' : ''}`);

    try {
      // Enhance the task with domain context
      const enhancedTask = `
        Task: ${task}

        Please approach this task from your expertise in ${this.domain}.
        ${this.expertise.length > 0 ? `Draw upon your knowledge in: ${this.expertise.join(', ')}.` : ''}

        Provide a detailed and accurate response based on your specialized knowledge.
      `;

      const response = await this.generate(enhancedTask);
      logger.debug(`Task processed successfully in domain: ${this.domain}`);
      return response;
    } catch (error) {
      logger.error(`Error processing task in domain ${this.domain}: ${error}`);
      throw error;
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
          const evaluation = JSON.parse(jsonStr);
          logger.debug(`Confidence evaluation: ${evaluation.confidence} - ${evaluation.reasoning}`);
          return evaluation.confidence;
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
