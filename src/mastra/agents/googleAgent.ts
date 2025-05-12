/**
 * GoogleAgent implementation for Mastra AI
 *
 * This file implements a specialized agent that uses Google's Gemini models
 * with enhanced capabilities for multimodal processing and Google-specific features.
 */
// Import types and constants
import { BaseAgent } from './baseAgent';
import { AgentType, DEFAULT_INSTRUCTIONS } from './constants';
import { createLogger } from '@mastra/core/logger';
import { z } from 'zod';
import { DefinedAgentConfig, DefinedAgentConfigSchema } from '../config/agentConfig';
import { Agent as MastraAgent } from '@mastra/core';
import { generateObject } from 'ai';
import { SubtaskSchema, Subtask, SubtaskResultSchema, SubtaskResult } from './types';

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
    this.multimodal = (validated as any).multimodal;
    this.safetySettings = (validated as any).safetySettings;

    logger.info(`GoogleAgent ${this.name} initialized with model ${this.getModelName()}`);
  }

  /** Process an image input by embedding a JSON payload for the AI model */
  public async processImage(imageUrl: string, prompt: string = ''): Promise<any> {
    if (!this.multimodal) throw new Error('Agent not configured for multimodal processing');
    return this.generate(JSON.stringify({ image_url: imageUrl, prompt }));
  }

  /** Process a video input similarly */
  public async processVideo(videoUrl: string, prompt: string = ''): Promise<any> {
    if (!this.multimodal || !this.supportsVideoProcessing()) throw new Error('Model does not support video');
    return this.generate(JSON.stringify({ video_url: videoUrl, prompt }));
  }

  /**
   * Check if the current model supports video processing
   */
  private supportsVideoProcessing(): boolean {
    const supported = ['gemini-1.5-pro-latest', 'gemini-2.5-pro-preview-genai'];
    return supported.includes(this.getModelName());
  }

  /** Generate structured output parsed by Zod schema */
  public async generateStructured<T extends z.ZodType<any>>(input: string, schema: T): Promise<z.infer<T>> {
    const result = await this.agent.generate(input);
    const data = JSON.parse(result.text || result.toString());
    return schema.parse(data);
  }

  /** Create a new tool for the agent */
  public async createTool(name: string, description: string, handler: (...args: any[]) => Promise<any>): Promise<void> {
    this.agent.registerTool({ name, description, handler });
  }

  /** Delegate subtasks to the agent */
  public async delegateSubtasks(input: string): Promise<SubtaskResult[]> {
    const planOutput = await generateObject(input, SubtaskSchema);
    const subtasks = SubtaskSchema.array().parse(planOutput);
    const results: SubtaskResult[] = [];
    for (const sub of subtasks) {
      const res = await this.agent.generate(sub.description);
      const parsed: SubtaskResult = SubtaskResultSchema.parse({
        subtask: sub.description,
        result: res.text,
        agentIndex: sub.agentIndex,
        priority: sub.priority,
      });
      results.push(parsed);
    }
    return results;
  }

  /** Expose underlying MastraAgent */
  public getAgent(): MastraAgent {
    return this.agent;
  }

  /**
   * Get tools
   */
  public async getTools(params: { runtimeContext?: any } = {}): Promise<any> {
    return this.agent.getTools(params);
  }

  /**
   * Get model info
   */
  public async getModel(params: { runtimeContext?: any } = {}): Promise<any> {
    return this.agent.getModel(params);
  }

  /**
   * Get instructions
   */
  public async getInstructions(params: { runtimeContext?: any } = {}): Promise<string> {
    return this.agent.getInstructions(params);
  }

  /**
   * Generate simple text
   */
  public async generate(input: string, options: any = {}): Promise<any> {
    return this.agent.generate(input, options);
  }
}