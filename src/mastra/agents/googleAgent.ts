/**
 * GoogleAgent implementation for Mastra AI
 *
 * This file implements a specialized agent that uses Google's Gemini models
 * with enhanced capabilities for multimodal processing and Google-specific features.
 */
import { BaseAgent } from './baseAgent';
import { AgentType } from './constants';
import { createLogger } from '@mastra/core/logger';
import { z } from 'zod';
import { DefinedAgentConfig, DefinedAgentConfigSchema } from '../config/agentConfig';
import { Agent as MastraAgent } from '@mastra/core';
import { generateObject } from 'ai';
import { SubtaskSchema, SubtaskResult } from './types';

// Create a logger instance for the GoogleAgent
const logger = createLogger({
  name: 'Mastra-GoogleAgent',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

/**
 * GoogleAgent class that extends BaseAgent with Google Gemini-specific functionality
 * Provides enhanced capabilities for multimodal processing and Google-specific features
 */
export class GoogleAgent extends BaseAgent {
  private multimodal: boolean;
  private safetySettings?: Record<string, any>;

  /**
   * Create a new GoogleAgent instance
   * @param config - Configuration for the Google agent
   */
  constructor(config: DefinedAgentConfig) {
    // validate full config including LLM and memory
    const validated = DefinedAgentConfigSchema.parse(config);
    // call BaseAgent with validated config
    super(validated);

    // Google-specific settings from validated config
    this.multimodal = (validated as any).multimodal ?? true;
    this.safetySettings = (validated as any).safetySettings;

    logger.info(`GoogleAgent ${this.name} initialized with model ${this.getModelName()}`);
  }

  /** 
   * Process an image input by embedding a JSON payload for the AI model 
   * @param imageUrl - URL of the image to process
   * @param prompt - Optional text prompt to accompany the image
   * @returns The model's response to the image
   * @throws Error if the agent is not configured for multimodal processing
   */
  public async processImage(imageUrl: string, prompt: string = ''): Promise<any> {
    if (!this.multimodal) throw new Error('Agent not configured for multimodal processing');
    return this.generate(JSON.stringify({ image_url: imageUrl, prompt }));
  }

  /** 
   * Process a video input similarly to image processing
   * @param videoUrl - URL of the video to process
   * @param prompt - Optional text prompt to accompany the video
   * @returns The model's response to the video
   * @throws Error if the agent is not configured for multimodal processing or the model doesn't support video
   */
  public async processVideo(videoUrl: string, prompt: string = ''): Promise<any> {
    if (!this.multimodal || !this.supportsVideoProcessing()) throw new Error('Model does not support video');
    return this.generate(JSON.stringify({ video_url: videoUrl, prompt }));
  }

  /**
   * Check if the current model supports video processing
   * @returns Whether the current model supports video processing
   */
  private supportsVideoProcessing(): boolean {
    const supported = ['gemini-1.5-pro-latest', 'gemini-2.5-pro-preview-genai'];
    return supported.includes(this.getModelName());
  }

  /** 
   * Generate structured output parsed by Zod schema
   * @param input - Input prompt for the model
   * @param schema - Zod schema to validate and parse the output
   * @returns The structured and validated output
   */
  public async generateStructured<T extends z.ZodType<any>>(input: string, schema: T): Promise<z.infer<T>> {
    const result = await this.agent.generate(input);
    const data = JSON.parse(result.text || result.toString());
    return schema.parse(data);
  }

  /** 
   * Create a new tool for the agent
   * @param name - Name of the tool
   * @param description - Description of what the tool does
   * @param handler - Function that implements the tool's functionality
   */
  public async createTool(name: string, description: string, handler: (...args: any[]) => Promise<any>): Promise<void> {
    this.agent.registerTool({ name, description, handler });
  }

  /** 
   * Delegate subtasks to the agent
   * @param input - Input describing the task to be broken down
   * @returns Results of all subtasks
   */
  public async delegateSubtasks(input: string): Promise<SubtaskResult[]> {
    try {
      // Use the AI SDK's generateObject function with the correct parameters
      const { object: subtasks } = await generateObject({
        model: this.sdkModel,
        schema: z.array(SubtaskSchema),
        prompt: input
      });
      
      const results: SubtaskResult[] = [];
      
      for (const sub of subtasks) {
        const res = await this.agent.generate(sub.description);
        const result: SubtaskResult = {
          subtask: sub.description,
          result: res.text,
          agentIndex: sub.agentIndex,
          priority: sub.priority,
        };
        results.push(result);
      }
      
      return results;
    } catch (error) {
      logger.error(`Error delegating subtasks: ${error}`);
      throw new Error(`Failed to delegate subtasks: ${error}`);
    }
  }

  /**
   * Get the underlying Mastra agent instance
   * @returns The Mastra agent instance
   */
  public override getAgent(): MastraAgent {
    return this.agent;
  }

  /**
   * Get the tools available to this agent
   * @param params - Parameters for tool retrieval
   * @returns Available tools
   */
  public override async getTools(params: { runtimeContext?: any } = {}): Promise<any> {
    return this.agent.getTools(params);
  }

  /**
   * Get model information
   * @param params - Parameters for model retrieval
   * @returns Model information
   */
  public override async getModel(params: { runtimeContext?: any } = {}): Promise<any> {
    return this.agent.getModel(params);
  }

  /**
   * Get instructions used by this agent
   * @param params - Parameters for instructions retrieval
   * @returns Agent instructions
   */
  public override async getInstructions(params: { runtimeContext?: any } = {}): Promise<string> {
    return this.agent.getInstructions(params);
  }

  /**
   * Generate simple text response
   * @param input - Input prompt for the model
   * @param options - Generation options
   * @returns The model's response
   */
  public override async generate(input: string, options: any = {}): Promise<any> {
    return super.generate(input, options);
  }
}