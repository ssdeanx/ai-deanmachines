/**
 * WorkerAgent implementation for Mastra AI
 *
 * This file implements a specialized agent that focuses on a specific domain
 * and provides expert-level assistance within that domain.
 */

// Import types and constants
import { BaseAgent } from './baseAgent';
import { WorkerAgentConfigSchema, WorkerAgentConfig, AgentType } from './types';
import { createLogger } from '@mastra/core/logger';
import { DefinedAgentConfig } from '../../config/agentConfig';
import { DEFAULT_INSTRUCTIONS, DEFAULT_MODEL_NAMES } from './constants';

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
   * @param config - Configuration for the worker agent, now using DefinedAgentConfig
   */
  constructor(config: DefinedAgentConfig) {
    // Worker-specific properties from config
    const domain = (config as any).domain || 'general'; // Default domain if not specified
    const expertise = (config as any).expertise || [];

    // Enhance instructions with domain-specific context
    const baseInstructions = config.instructions || DEFAULT_INSTRUCTIONS.WORKER;
    const enhancedInstructions = `${baseInstructions}\n\nYou are specialized in the domain of ${domain}.${expertise.length > 0 ? ` Your areas of expertise include: ${expertise.join(', ')}.` : ''}`;

    const workerSpecificConfig = {
      ...config,
      type: AgentType.WORKER, // Ensure type is Worker
      instructions: enhancedInstructions, // Use enhanced instructions
      modelName: config.modelName || DEFAULT_MODEL_NAMES.GEMINI_1_5_FLASH,
    };

    super(workerSpecificConfig);

    // Set worker-specific properties
    this.domain = domain;
    this.expertise = expertise;

    logger.info(`Creating WorkerAgent with name: ${this.name} in domain: ${this.domain}`);
    if (this.expertise.length > 0) {
      logger.debug(`WorkerAgent expertise: ${this.expertise.join(', ')}`);
    }
    logger.info(`WorkerAgent ${this.name} created successfully in domain: ${this.domain}`);
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
    logger.warn("Adding expertise dynamically might not update the core agent's behavior without re-initialization.");
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
    logger.info(`WorkerAgent ${this.name} processing task in domain ${this.domain}: ${task.substring(0, 50)}...`);
    throw new Error('processTask method not fully implemented after refactor.');
  }

  /**
   * Evaluate the worker's confidence in handling a specific task
   * @param task - Task to evaluate
   * @returns Confidence score between 0 and 1
   */
  async evaluateConfidence(task: string) {
    logger.info(`WorkerAgent ${this.name} evaluating confidence for task: ${task.substring(0, 50)}...`);
    return 0.5; // Placeholder
  }
}
