/**
 * SupervisorAgent implementation for Mastra AI
 * 
 * This file implements a specialized agent that coordinates multiple worker agents
 * to solve complex tasks through delegation and result synthesis.
 */

import { Agent } from '@mastra/core';
import { google } from '@ai-sdk/google';

// Import types and constants
import { SupervisorAgentConfig, SupervisorAgentConfigSchema } from './types';
import { AgentType, DEFAULT_INSTRUCTIONS, DEFAULT_MODEL_NAMES } from './constants';
import { logger } from '../index';
import { BaseAgent } from './baseAgent';

/**
 * SupervisorAgent class that extends BaseAgent with coordination capabilities
 * Manages multiple worker agents to solve complex tasks
 */
export class SupervisorAgent extends BaseAgent {
  private workerAgents: BaseAgent[];

  /**
   * Create a new SupervisorAgent instance
   * @param config - Configuration for the supervisor agent
   */
  constructor(config: SupervisorAgentConfig) {
    // Set default values for supervisor agent
    const supervisorConfig = {
      ...config,
      type: AgentType.SUPERVISOR,
      instructions: config.instructions || DEFAULT_INSTRUCTIONS.SUPERVISOR,
      modelName: config.modelName || DEFAULT_MODEL_NAMES.GEMINI_PRO,
    };

    // Validate configuration
    const validatedConfig = SupervisorAgentConfigSchema.parse(supervisorConfig);
    logger.info(`Creating SupervisorAgent with name: ${validatedConfig.name}`);

    // Call parent constructor with validated config
    super(validatedConfig);

    // Initialize worker agents array
    this.workerAgents = validatedConfig.workerAgents || [];

    logger.info(`SupervisorAgent ${validatedConfig.name} created successfully with ${this.workerAgents.length} worker agents`);
  }

  /**
   * Add a worker agent to the supervisor
   * @param agent - Worker agent to add
   * @returns The supervisor agent instance for chaining
   */
  addWorkerAgent(agent: BaseAgent) {
    logger.info(`Adding worker agent to supervisor: ${agent.getAgent().name}`);
    this.workerAgents.push(agent);
    logger.debug(`Worker agent added successfully. Total worker agents: ${this.workerAgents.length}`);
    return this;
  }

  /**
   * Get all worker agents
   * @returns Array of worker agents
   */
  getWorkerAgents() {
    return this.workerAgents;
  }

  /**
   * Delegate a task to a specific worker agent
   * @param agentIndex - Index of the worker agent to delegate to
   * @param task - Task to delegate
   * @returns Response from the worker agent
   */
  async delegateToWorker(agentIndex: number, task: string) {
    if (agentIndex < 0 || agentIndex >= this.workerAgents.length) {
      logger.error(`Invalid worker agent index: ${agentIndex}. Available workers: ${this.workerAgents.length}`);
      throw new Error(`Invalid worker agent index: ${agentIndex}`);
    }

    const worker = this.workerAgents[agentIndex];
    logger.info(`Delegating task to worker agent at index ${agentIndex}: ${worker.getAgent().name}`);
    logger.debug(`Task: ${task.substring(0, 50)}${task.length > 50 ? '...' : ''}`);

    try {
      const response = await worker.generate(task);
      logger.debug(`Worker agent response received successfully`);
      return response;
    } catch (error) {
      logger.error(`Error delegating task to worker agent: ${error}`);
      throw error;
    }
  }

  /**
   * Process a complex task by breaking it down, delegating to workers, and synthesizing results
   * @param input - User input describing the complex task
   * @returns Synthesized response from all worker agents
   */
  async processComplexTask(input: string) {
    if (this.workerAgents.length === 0) {
      logger.warn('Attempted to process complex task with no worker agents');
      throw new Error('No worker agents available for delegation');
    }

    logger.info(`Processing complex task: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);

    try {
      // Step 1: Analyze the task and create a plan
      const planPrompt = `
        I need to break down this complex task into subtasks for specialized worker agents.
        For each subtask, specify which worker agent should handle it (by index).
        Available worker agents: ${this.workerAgents.map((agent, index) => 
          `[${index}] ${agent.getAgent().name}`).join(', ')}
        
        Task: ${input}
        
        Respond with a JSON object containing an array of subtasks, each with:
        - description: The subtask description
        - agentIndex: The index of the worker agent to assign
        - priority: A number from 1-5 indicating priority (1 is highest)
      `;

      const planResponse = await this.generate(planPrompt);
      logger.debug('Task breakdown plan generated');

      // Step 2: Parse the plan and extract subtasks
      let subtasks = [];
      try {
        // Extract JSON from the response
        const jsonMatch = planResponse.text.match(/```json\n([\s\S]*?)\n```/) || 
                         planResponse.text.match(/{[\s\S]*?}/);
        
        if (jsonMatch) {
          const jsonStr = jsonMatch[1] || jsonMatch[0];
          const plan = JSON.parse(jsonStr);
          subtasks = plan.subtasks || [];
          logger.debug(`Extracted ${subtasks.length} subtasks from plan`);
        } else {
          logger.warn('Failed to extract JSON plan from response');
          throw new Error('Failed to parse task breakdown plan');
        }
      } catch (parseError) {
        logger.error(`Error parsing task plan: ${parseError}`);
        throw new Error('Failed to parse task breakdown plan');
      }

      // Step 3: Execute subtasks in priority order
      subtasks.sort((a, b) => a.priority - b.priority);
      
      const results = [];
      for (const subtask of subtasks) {
        logger.info(`Executing subtask: ${subtask.description.substring(0, 50)}${subtask.description.length > 50 ? '...' : ''}`);
        logger.debug(`Assigned to worker agent at index ${subtask.agentIndex}`);
        
        const result = await this.delegateToWorker(subtask.agentIndex, subtask.description);
        results.push({
          subtask: subtask.description,
          result: result.text
        });
      }

      // Step 4: Synthesize results
      const synthesisPrompt = `
        I need to synthesize the results of multiple subtasks into a coherent response.
        
        Original task: ${input}
        
        Subtask results:
        ${results.map(r => `- Subtask: ${r.subtask}\n  Result: ${r.result}`).join('\n\n')}
        
        Please provide a comprehensive and coherent response that addresses the original task
        by integrating all the subtask results.
      `;

      const synthesisResponse = await this.generate(synthesisPrompt);
      logger.debug('Synthesis of subtask results completed');
      
      return synthesisResponse;
    } catch (error) {
      logger.error(`Error processing complex task: ${error}`);
      throw error;
    }
  }
}
