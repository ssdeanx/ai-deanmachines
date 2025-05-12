/**
 * SupervisorAgent implementation for Mastra AI
 *
 * This file implements a specialized agent that coordinates multiple worker agents
 * to solve complex tasks through delegation and result synthesis.
 */

import { Agent } from '@mastra/core';
import { google } from '@ai-sdk/google';

// Import types and constants
import {
  SupervisorAgentConfig,
  SupervisorAgentConfigSchema,
  Subtask,
  SubtaskResult,
  ComplexTaskOptions,
  ComplexTaskOptionsSchema
} from './types';
import { AgentType, DEFAULT_INSTRUCTIONS, DEFAULT_MODEL_NAMES } from './constants';
import { logger } from '../observability/logger';
import { BaseAgent } from './baseAgent';

// Import AI SDK functions
import { generateObject, zodSchema } from 'ai';
import { z } from 'zod';

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
   * Get the Agent instance
   * @returns The Agent instance
   */
  getAgent() {
    return this.agent;
  }

  /**
   * Get the model name
   * @returns The model name
   */
  getModelName() {
    return this.modelName;
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
  async processComplexTask(input: string, options: ComplexTaskOptions = {}) {
    // Validate options with Zod
    const validatedOptions = ComplexTaskOptionsSchema.parse(options);
    if (this.workerAgents.length === 0) {
      logger.warn('Attempted to process complex task with no worker agents');
      throw new Error('No worker agents available for delegation');
    }

    logger.info(`Processing complex task: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);

    try {
      // Step 1: Analyze the task and create a plan
      const workerInfo = this.workerAgents.map((agent, index) => {
        // Use type assertion to access potential worker-specific methods
        const workerAgent = agent as any;
        const domain = typeof workerAgent.getDomain === 'function' ? workerAgent.getDomain() : 'general';
        const expertise = typeof workerAgent.getExpertise === 'function' ? workerAgent.getExpertise() : [];

        return `[${index}] ${agent.getAgent().name} - Domain: ${domain}${expertise.length > 0 ? `, Expertise: ${expertise.join(', ')}` : ''}`;
      }).join('\n');

      const planPrompt = `
I need to break down this complex task into subtasks for specialized worker agents.
For each subtask, I'll assign the most appropriate worker agent based on their domain and expertise.

Available worker agents:
${workerInfo}

Task: ${input}

Instructions:
1. Analyze the task thoroughly and identify distinct components that can be handled separately
2. Break down the task into 2-5 logical subtasks
3. For each subtask, determine which worker agent is best suited based on their domain and expertise
4. Assign a priority to each subtask (1 is highest priority, 5 is lowest)
5. Ensure all aspects of the original task are covered by the subtasks

Respond with a JSON object containing an array of subtasks, each with:
- description: A detailed description of the subtask
- agentIndex: The index of the worker agent to assign
- priority: A number from 1-5 indicating priority (1 is highest)
- rationale: A brief explanation of why this agent was chosen
      `;

      // Step 1: Create a plan for breaking down the task
      let subtasks: Subtask[] = [];

      // Use generateObject from the 'ai' package to get a structured plan
      // Import SubtaskSchema from types.ts and add descriptions
      const PlanSchema = z.object({
        subtasks: z.array(
          z.object({
            description: z.string().describe('A detailed description of the subtask'),
            agentIndex: z.number().int().min(0).describe('The index of the worker agent to assign'),
            priority: z.number().int().min(1).max(5).describe('Priority level (1 is highest)'),
            rationale: z.string().optional().describe('Why this agent was chosen')
          })
        )
      });

      try {
        // Generate a structured plan using generateObject
        const { object: plan } = await generateObject({
          model: google(this.modelName),
          temperature: 0.2, // Lower temperature for more logical planning
          schema: zodSchema(PlanSchema),
          prompt: planPrompt,
          schemaDescription: 'A plan for breaking down a complex task into subtasks assigned to worker agents'
        });

        logger.debug('Task breakdown plan generated using structured object generation');

        // Extract subtasks from the plan
        subtasks = plan.subtasks;
      } catch (structuredPlanError) {
        logger.warn(`Structured plan generation failed: ${structuredPlanError}`);

        // Fall back to traditional text generation
        // Use the Agent class directly for plan generation
        const planningAgent = new Agent({
          name: this.getAgent().name,
          instructions: `You are a planning agent specialized in breaking down complex tasks into subtasks.`,
          model: google(this.modelName),
          memory: this.memory?.getMemoryInstance?.()
        });

        const planResponse = await planningAgent.generate(planPrompt, {
          temperature: 0.2, // Lower temperature for more logical planning
          maxTokens: 2000 // Allow for detailed planning
        });
        logger.debug('Task breakdown plan generated using traditional text generation');

        // Parse the plan and extract subtasks
        try {
          // Extract JSON from the response
          const jsonMatch = planResponse.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                           planResponse.text.match(/\{[\s\S]*?\}/);

          if (jsonMatch) {
            const jsonStr = jsonMatch[1] || jsonMatch[0];
            const plan = JSON.parse(jsonStr);
            subtasks = plan.subtasks || [];
            logger.debug(`Extracted ${subtasks.length} subtasks from plan`);

            // Validate subtasks
            if (subtasks.length === 0) {
              throw new Error('No subtasks found in the plan');
            }

            // Validate each subtask
            subtasks.forEach((subtask, index) => {
              if (!subtask.description) {
                throw new Error(`Subtask ${index} is missing a description`);
              }
              if (typeof subtask.agentIndex !== 'number' ||
                  subtask.agentIndex < 0 ||
                  subtask.agentIndex >= this.workerAgents.length) {
                throw new Error(`Subtask ${index} has an invalid agent index: ${subtask.agentIndex}`);
              }
              if (!subtask.priority) {
                subtask.priority = index + 1; // Assign sequential priority if missing
              }
            });
          } else {
            logger.warn('Failed to extract JSON plan from response');
            throw new Error('Failed to parse task breakdown plan');
          }
        } catch (parseError) {
          logger.error(`Error parsing task plan: ${parseError}`);

          // Fallback: Create a simple plan with one subtask per worker agent
          logger.info('Using fallback plan creation');
          subtasks = this.workerAgents.map((_, index) => {
            return {
              description: `Handle the following task from your expertise perspective: ${input}`,
              agentIndex: index,
              priority: index + 1,
              rationale: 'Fallback assignment due to plan parsing failure'
            };
          });
        }
      }

      // Step 3: Execute subtasks in priority order
      subtasks.sort((a, b) => a.priority - b.priority);

      const results: SubtaskResult[] = [];
      const errors: Error[] = [];

      // Execute subtasks with potential parallel processing if enabled
      const executeSubtasks = validatedOptions.parallel ?
        Promise.all(subtasks.map((subtask) => this.executeSubtask(subtask))) :
        this.executeSubtasksSequentially(subtasks);

      const subtaskResults = await executeSubtasks;

      // Process results and errors
      subtaskResults.forEach(result => {
        if (result.error) {
          errors.push(result.error);
          logger.warn(`Subtask execution error: ${result.error.message}`);
        } else {
          results.push(result);
        }
      });

      // Log warning if some subtasks failed
      if (errors.length > 0) {
        logger.warn(`${errors.length} subtasks failed during execution`);
      }

      // Step 4: Synthesize results
      const synthesisPrompt = `
I need to synthesize the results of multiple subtasks into a coherent response.

Original task: ${input}

Subtask results:
${results.map(r => `- Subtask: ${r.subtask}\n  Result: ${r.result}`).join('\n\n')}
${errors.length > 0 ? `\nNote: ${errors.length} subtasks failed during execution. Please synthesize based on the available results.` : ''}

Instructions:
1. Carefully analyze all subtask results
2. Identify key insights, findings, and recommendations from each result
3. Integrate the information into a cohesive narrative that addresses the original task
4. Ensure the response is comprehensive, well-structured, and directly answers the original request
5. Highlight any important patterns or contradictions between subtask results
6. Provide a conclusion that summarizes the main points

Please provide a comprehensive and coherent response that addresses the original task
by integrating all the subtask results.
      `;

      // Use the Agent class directly for synthesis
      const synthesisAgent = new Agent({
        name: this.getAgent().name,
        instructions: `You are a synthesis agent specialized in integrating results from multiple subtasks into a coherent response.`,
        model: google(this.modelName),
        memory: this.memory?.getMemoryInstance?.()
      });

      const synthesisResponse = await synthesisAgent.generate(synthesisPrompt, {
        temperature: validatedOptions.temperature || 0.4, // Moderate temperature for creative synthesis
        maxTokens: validatedOptions.maxTokens || 2500 // Allow for detailed synthesis
      });
      logger.debug('Synthesis of subtask results completed');

      // Store the task and response in memory if available
      if (this.memory && this.threadId) {
        try {
          // Create user message
          const userMessage = {
            content: input,
            role: 'user' as const,
            type: 'text' as const,
            metadata: {
              taskType: 'complex',
              subtaskCount: subtasks.length,
              timestamp: new Date().toISOString()
            }
          };

          // Store user message
          await (this.memory as any).addMessage(this.threadId, userMessage);

          // Create assistant message
          const assistantMessage = {
            content: synthesisResponse.text,
            role: 'assistant' as const,
            type: 'text' as const,
            metadata: {
              taskType: 'complex_synthesis',
              subtaskCount: subtasks.length,
              successfulSubtasks: results.length,
              failedSubtasks: errors.length,
              timestamp: new Date().toISOString()
            }
          };

          // Store assistant message
          await (this.memory as any).addMessage(this.threadId, assistantMessage);
        } catch (memoryError) {
          logger.warn(`Failed to store complex task in memory: ${memoryError}`);
        }
      }

      return synthesisResponse;
    } catch (error) {
      logger.error(`Error processing complex task: ${error}`);

      // Attempt direct processing as fallback
      try {
        logger.info('Attempting direct processing as fallback');
        // Use the Agent class directly for direct processing
        const directProcessingAgent = new Agent({
          name: this.getAgent().name,
          instructions: `You are a direct processing agent that handles tasks without breaking them down.`,
          model: google(this.modelName),
          memory: this.memory?.getMemoryInstance?.()
        });

        const response = await directProcessingAgent.generate(input, {
          temperature: validatedOptions.temperature || 0.3,
          maxTokens: validatedOptions.maxTokens || 2000
        });
        logger.debug('Direct processing fallback successful');
        return response;
      } catch (fallbackError) {
        logger.error(`Direct processing fallback failed: ${fallbackError}`);
        throw error; // Throw the original error
      }
    }
  }

  /**
   * Execute a single subtask
   * @param subtask - Subtask to execute
   * @returns Result of the subtask execution
   */
  private async executeSubtask(subtask: Subtask): Promise<SubtaskResult> {
    try {
      logger.info(`Executing subtask: ${subtask.description.substring(0, 50)}${subtask.description.length > 50 ? '...' : ''}`);
      logger.debug(`Assigned to worker agent at index ${subtask.agentIndex}`);

      const result = await this.delegateToWorker(subtask.agentIndex, subtask.description);

      return {
        subtask: subtask.description,
        result: result.text,
        agentIndex: subtask.agentIndex,
        priority: subtask.priority
      };
    } catch (error) {
      logger.error(`Error executing subtask: ${error}`);
      return {
        subtask: subtask.description,
        error: error instanceof Error ? error : new Error(String(error)),
        agentIndex: subtask.agentIndex,
        priority: subtask.priority
      };
    }
  }

  /**
   * Execute subtasks sequentially in priority order
   * @param subtasks - Subtasks to execute
   * @returns Results of the subtask executions
   */
  private async executeSubtasksSequentially(subtasks: Subtask[]): Promise<SubtaskResult[]> {
    const results: SubtaskResult[] = [];

    for (const subtask of subtasks) {
      results.push(await this.executeSubtask(subtask));
    }

    return results;
  }
}
