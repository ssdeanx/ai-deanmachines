/**
 * @file BaseAgent implementation for Mastra framework
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This file provides the BaseAgent class which serves as the foundation for all agent types
 * in the Mastra framework. It handles model initialization, memory management, and provides
 * core functionality for streaming and generating responses.
 */
import { createLogger } from '@mastra/core/logger';
import { Agent as MastraAgent } from '@mastra/core';
import { google } from '@ai-sdk/google';
import { Memory } from '../memory';
import { DefinedAgentConfig } from '../config/agentConfig';
import { getModelInstance } from '../config/models';
import { getTracer, recordLLMMetrics } from '../observability/telemetry';
import { AgentType, DEFAULT_INSTRUCTIONS } from './constants';
import { StreamOptionsSchema } from './types';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// Create a logger instance for the BaseAgent
const logger = createLogger({
  name: 'Mastra-BaseAgent',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

/**
 * BaseAgent class that provides core functionality for all agent types
 * 
 * @class BaseAgent
 * @description Foundation class for all Mastra agents with common functionality
 */
export class BaseAgent {
  /** Name of the agent */
  public name: string;
  /** Underlying Mastra agent instance */
  protected agent: MastraAgent;
  /** AI SDK model instance */
  protected sdkModel: any;
  /** Optional memory instance for conversation history */
  protected memory?: Memory;
  /** Array of tools available to the agent */
  protected tools: any[] = [];
  /** Type of agent (e.g., CHAT, ASSISTANT, etc.) */
  protected type: AgentType;

  /** Temperature parameter for model generation */
  protected temperature: number;
  /** Maximum tokens for model output */
  protected maxTokens?: number;
  /** Top-p sampling parameter */
  protected topP?: number;
  /** Top-k sampling parameter */
  protected topK?: number;

  /**
   * Create a new BaseAgent instance
   * 
   * @param {DefinedAgentConfig} config - Configuration for the agent
   * @constructor
   */
  constructor(config: DefinedAgentConfig) {
    this.name = config.name;
    logger.info(`Creating BaseAgent with name: ${this.name}`);

    const modelInst = getModelInstance(config.agentLLMConfig.modelInstanceId);
    this.sdkModel = google(modelInst.modelIdString);

    this.type = config.type;
    this.temperature = config.agentLLMConfig.temperature ?? config.temperature ?? 0.7;
    this.maxTokens = config.agentLLMConfig.maxTokens ?? config.maxTokens ?? modelInst.maxOutputTokens;
    this.topP = config.agentLLMConfig.topP ?? config.topP;
    this.topK = config.topK;

    if (config.memory) this.memory = new Memory(config.memory);
    if (config.tools) this.tools = config.tools;

    this.agent = new MastraAgent({
      name: this.name,
      instructions: config.instructions || DEFAULT_INSTRUCTIONS.BASE,
      model: this.sdkModel,
      tools: this.tools.length
        ? this.tools.reduce((acc, t) => ({ ...acc, [t.name]: t }), {})
        : undefined
    });

    logger.info(`BaseAgent '${this.name}' initialized`);
  }

  /**
   * Stream a response from the agent
   * 
   * @param {string} input - User input to process
   * @param {any} options - Stream options
   * @returns {Promise<any>} Stream response
   * @async
   */
  
  async stream(input: string, options: any = {}) {
    const tracer = getTracer('mastra.agent.stream');
    const span = tracer.startSpan(this.name);

    const opts = StreamOptionsSchema.parse(options);
    const resourceId = opts.resourceId || uuidv4();
    const threadId = opts.threadId || uuidv4();
    if (this.memory) await this.memory.addMessage(threadId, input, 'user', 'text');

    const response = await this.agent.stream(input, { ...opts, resourceId, threadId });
    recordLLMMetrics({ modelName: this.sdkModel.modelIdString, operationType: 'stream' });
    span.end();
    return response;
  }

  /**
   * Generate a complete response from the agent
   * 
   * @param {string} input - User input to process
   * @param {any} options - Generation options
   * @returns {Promise<any>} Complete response
   * @async
   */
  async generate(input: string, options: any = {}) {
    const tracer = getTracer('mastra.agent.generate');
    const span = tracer.startSpan(this.name);

    const opts = StreamOptionsSchema.parse(options);
    const resourceId = opts.resourceId || uuidv4();
    const threadId = opts.threadId || uuidv4();
    if (this.memory) await this.memory.addMessage(threadId, input, 'user', 'text');

    const resp = await this.agent.generate(input, { ...opts, resourceId, threadId });
    recordLLMMetrics({ modelName: this.sdkModel.modelIdString, operationType: 'generate' });
    span.end();
    return resp;
  }

  /**
   * Get the underlying Mastra agent instance
   * 
   * @returns {MastraAgent} The Mastra agent instance
   */
  public getAgentInstance(): MastraAgent {
    return this.agent;
  }

  /**
   * Get the model name used by this agent
   * 
   * @returns {string} Model name
   */
  public getModelName(): string {
    return this.sdkModel.modelIdString;
  }

  /**
   * Get the tools available to this agent
   * 
   * @param {Object} params - Parameters for tool retrieval
   * @param {any} [params.runtimeContext] - Runtime context for tool retrieval
   * @returns {Promise<any>} Available tools
   * @async
   */
  public async getTools(params: { runtimeContext?: any } = {}): Promise<any> {
    return this.agent.getTools(params);
  }

  /**
   * Get the model used by this agent
   * 
   * @param {Object} params - Parameters for model retrieval
   * @param {any} [params.runtimeContext] - Runtime context for model retrieval
   * @returns {Promise<any>} Model information
   * @async
   */
  public async getModel(params: { runtimeContext?: any } = {}): Promise<any> {
    return this.agent.getModel(params);
  }

  /**
   * Get the instructions used by this agent
   * 
   * @param {Object} params - Parameters for instructions retrieval
   * @param {any} [params.runtimeContext] - Runtime context for instructions retrieval
   * @returns {Promise<string>} Agent instructions
   * @async
   */
  public async getInstructions(params: { runtimeContext?: any } = {}): Promise<string> {
    return this.agent.getInstructions(params);
  }

  /**
   * Get the underlying Mastra agent instance
   * 
   * @returns {MastraAgent} The Mastra agent instance
   */
  public getAgent(): MastraAgent {
    return this.agent;
  }
}
