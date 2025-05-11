/**
 * GoogleAgent implementation for Mastra AI
 *
 * This file implements a specialized agent that uses Google's Gemini models
 * with enhanced capabilities for multimodal processing and Google-specific features.
 */
import { Agent, CoreMessage } from '@mastra/core';
import { google } from '@ai-sdk/google';
// Import types and constants
import { GoogleAgentConfig, GoogleAgentConfigSchema } from './types';
import { AgentType, DEFAULT_INSTRUCTIONS, DEFAULT_MODEL_NAMES } from './constants';
import { logger } from '../index';
import { BaseAgent } from './baseAgent';
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
  constructor(config: GoogleAgentConfig) {
    // Set default values for Google agent
    const googleConfig = {
      ...config,
      type: AgentType.GOOGLE,
      instructions: config.instructions || DEFAULT_INSTRUCTIONS.GOOGLE,
      modelName: config.modelName || DEFAULT_MODEL_NAMES.GEMINI_PRO,
    };

    // Validate configuration
    const validatedConfig = GoogleAgentConfigSchema.parse(googleConfig);
    logger.info(`Creating GoogleAgent with name: ${validatedConfig.name}`);

    // Call parent constructor with validated config
    super(validatedConfig);

    // Set Google-specific properties
    this.multimodal = validatedConfig.multimodal;
    this.safetySettings = validatedConfig.safetySettings;

    logger.info(`GoogleAgent ${validatedConfig.name} created successfully with model: ${validatedConfig.modelName}`);
    logger.debug(`GoogleAgent multimodal support: ${this.multimodal}`);
  }

  /**
   * Process an image input for the agent
   * @param imageUrl - URL of the image to process
   * @param prompt - Optional prompt to guide image processing
   * @returns A response from the agent about the image
   */
  async processImage(imageUrl: string, prompt?: string) {
    if (!this.multimodal) {
      logger.warn('Attempted to process image with non-multimodal agent configuration');
      throw new Error('This agent is not configured for multimodal processing');
    }

    logger.info(`Processing image with URL: ${imageUrl}`);
    const defaultPrompt = 'Describe what you see in this image in detail.';
    const userPrompt = prompt || defaultPrompt;

    try {
      // Create a multimodal message with the image
      // For simplicity, we'll use a text-only message for now
      // In a real implementation, you would use the proper multimodal format
      const message = `${userPrompt}\n\nImage URL: ${imageUrl}`;

      // Generate a response using the agent
      const response = await this.getAgent().generate(message);
      logger.debug('Image processed successfully');
      return response;
    } catch (error) {
      logger.error(`Error processing image: ${error}`);
      throw error;
    }
  }
    /**
   * Process a video input for the agent (if supported by the model)
   * @param videoUrl - URL of the video to process
   * @param prompt - Optional prompt to guide video processing
   * @returns A response from the agent about the video
   */
  async processVideo(videoUrl: string, prompt?: string) {
    if (!this.multimodal) {
      logger.warn('Attempted to process video with non-multimodal agent configuration');
      throw new Error('This agent is not configured for multimodal processing');
    }

    // Check if the model supports video processing
    if (!this.supportsVideoProcessing()) {
      logger.warn(`Model does not support video processing: ${this.getAgent().getModel()}`);
      throw new Error('The selected model does not support video processing');
    }

    logger.info(`Processing video with URL: ${videoUrl}`);
    const defaultPrompt = 'Describe what you see in this video in detail.';
    const userPrompt = prompt || defaultPrompt;

    try {
      // Create a multimodal message with the video
      // For simplicity, we'll use a text-only message for now
      // In a real implementation, you would use the proper multimodal format
      const message = `${userPrompt}\n\nVideo URL: ${videoUrl}`;

      // Generate a response using the agent
      const response = await this.getAgent().generate(message);
      logger.debug('Video processed successfully');
      return response;
    } catch (error) {
      logger.error(`Error processing video: ${error}`);
      throw error;
    }
  }

  /**
   * Check if the current model supports video processing
   * @returns True if the model supports video processing, false otherwise
   */
  private supportsVideoProcessing(): boolean {
    const videoSupportedModels = [
      DEFAULT_MODEL_NAMES.GEMINI_PRO,
      DEFAULT_MODEL_NAMES.GEMINI_FLASH,
      DEFAULT_MODEL_NAMES.GEMINI_1_5_PRO,
      DEFAULT_MODEL_NAMES.GEMINI_1_5_FLASH
    ];

    return videoSupportedModels.includes(this.getAgent().getModel().toString());
  }

  /**
   * Generate a structured response in JSON format
   * @param input - User input text
   * @param schema - JSON schema for the response structure
   * @returns A structured JSON response
   */
  async generateStructured(input: string, schema: Record<string, any>) {
    logger.info(`Generating structured response for input: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);
    logger.debug(`Schema: ${JSON.stringify(schema)}`);

    try {
      // Create a message with instructions for structured output
      const structuredPrompt = `${input}\n\nPlease format your response as a JSON object following this schema: ${JSON.stringify(schema)}`;

      // Generate a response
      const response = await this.getAgent().generate(structuredPrompt);

      logger.debug('Structured response generated successfully');
      return response;
    } catch (error) {
      logger.error(`Error generating structured response: ${error}`);
      throw error;
    }
  }}
