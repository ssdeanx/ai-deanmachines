/**
 * GoogleAgent implementation for Mastra AI
 *
 * This file implements a specialized agent that uses Google's Gemini models
 * with enhanced capabilities for multimodal processing and Google-specific features.
 */
import { Agent } from '@mastra/core';
import { google } from '@ai-sdk/google';
// Import types and constants
import {
  GoogleAgentConfig,
  GoogleAgentConfigSchema,
  ImageProcessingOptionsSchema,
  VideoProcessingOptionsSchema,
  MultimodalMessageSchema
} from './types';
import { AgentType, DEFAULT_INSTRUCTIONS, DEFAULT_MODEL_NAMES } from './constants';
import { BaseAgent } from './baseAgent';
import { generateObject, zodSchema } from 'ai';
import { z } from 'zod';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the GoogleAgent
const logger = createLogger({
  name: 'Mastra-GoogleAgent',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
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

    if (this.safetySettings) {
      logger.debug(`GoogleAgent safety settings configured: ${JSON.stringify(this.safetySettings)}`);
    }
  }

  /**
   * Process an image input for the agent
   * @param imageUrl - URL of the image to process
   * @param prompt - Optional prompt to guide image processing
   * @returns A response from the agent about the image
   */
  async processImage(imageUrl: string, prompt?: string, options: any = {}) {
    // Validate options with Zod
    const validatedOptions = ImageProcessingOptionsSchema.parse(options);

    if (!this.multimodal) {
      logger.warn('Attempted to process image with non-multimodal agent configuration');
      throw new Error('This agent is not configured for multimodal processing');
    }

    logger.info(`Processing image with URL: ${imageUrl}`);
    const defaultPrompt = 'Describe what you see in this image in detail.';
    const userPrompt = prompt || defaultPrompt;

    try {
      // Determine if the URL is a data URL or a remote URL
      const isDataUrl = imageUrl.startsWith('data:');
      const isRemoteUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');

      if (!isDataUrl && !isRemoteUrl) {
        logger.warn('Invalid image URL format');
        throw new Error('Image URL must be a data URL or a remote URL (http/https)');
      }

      // Set up multimodal content based on the Google AI SDK format
      let response;

      try {
        // First attempt: Try using the multimodal content format
        // Format the message as a string with the image URL
        // This is a simplified approach that works with most AI SDK versions
        const enhancedPrompt = `
${userPrompt}

[IMAGE: ${imageUrl}]

Please analyze this image in detail and describe what you see.
`;

        logger.debug('Attempting to process image with enhanced prompt format');

        // Create generate options from validated options
        const generateOptions: Record<string, any> = {
          temperature: validatedOptions.temperature || 0.2,
          maxTokens: validatedOptions.maxTokens || 1000
        };

        // Add thread and resource IDs if provided
        if (validatedOptions.threadId) {
          generateOptions.threadId = validatedOptions.threadId;
        }

        if (validatedOptions.resourceId) {
          generateOptions.resourceId = validatedOptions.resourceId;
        }

        // Use the Agent class directly for image processing
        const agent = new Agent({
          name: this.getAgent().name,
          instructions: `You are a multimodal agent specialized in image analysis. Provide detailed descriptions of images.`,
          model: google(this.modelName),
          memory: this.memory?.getMemoryInstance?.()
        });

        response = await agent.generate(enhancedPrompt, generateOptions);
      } catch (multimodalError) {
        logger.warn(`Multimodal format failed: ${multimodalError}`);

        // Second attempt: Fall back to text-based approach
        logger.debug('Falling back to text-based approach for image processing');
        const message = `${userPrompt}\n\nImage URL: ${imageUrl}\n\nPlease analyze this image and provide a detailed description.`;

        // Create generate options from validated options
        const generateOptions: Record<string, any> = {
          temperature: validatedOptions.temperature || 0.2,
          maxTokens: validatedOptions.maxTokens || 1000
        };

        // Add thread and resource IDs if provided
        if (validatedOptions.threadId) {
          generateOptions.threadId = validatedOptions.threadId;
        }

        if (validatedOptions.resourceId) {
          generateOptions.resourceId = validatedOptions.resourceId;
        }

        // Use the Agent class directly for fallback image processing
        const fallbackAgent = new Agent({
          name: this.getAgent().name,
          instructions: `You are a multimodal agent specialized in image analysis. Provide detailed descriptions of images based on their URLs.`,
          model: google(this.modelName),
          memory: this.memory?.getMemoryInstance?.()
        });

        response = await fallbackAgent.generate(message, generateOptions);
      }

      logger.debug('Image processed successfully');

      // Store the image processing in memory if available
      if (this.memory && this.threadId) {
        try {
          // Create and validate user message with image
          const userMessage = MultimodalMessageSchema.parse({
            content: userPrompt,
            role: 'user',
            type: 'image_url',
            metadata: {
              imageUrl: imageUrl,
              timestamp: new Date().toISOString()
            }
          });

          // Store the user message
          await (this.memory as any).addMessage(this.threadId, userMessage);

          // Create and validate assistant response
          const assistantMessage = MultimodalMessageSchema.parse({
            content: response.text,
            role: 'assistant',
            type: 'text',
            metadata: {
              imageProcessing: true,
              timestamp: new Date().toISOString()
            }
          });

          // Store the assistant response
          await (this.memory as any).addMessage(this.threadId, assistantMessage);
        } catch (memoryError) {
          logger.warn(`Failed to store image processing in memory: ${memoryError}`);
        }
      }

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
  async processVideo(videoUrl: string, prompt?: string, options: any = {}) {
    // Validate options with Zod
    const validatedOptions = VideoProcessingOptionsSchema.parse(options);
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
      // Determine if the URL is a valid video URL
      const isValidUrl = videoUrl.startsWith('http://') || videoUrl.startsWith('https://');

      if (!isValidUrl) {
        logger.warn('Invalid video URL format');
        throw new Error('Video URL must be a remote URL (http/https)');
      }

      // Create an enhanced prompt for video analysis
      const enhancedPrompt = `
${userPrompt}

[VIDEO: ${videoUrl}]

Instructions for video analysis:
1. Describe the overall content and theme of the video
2. Identify key scenes, transitions, and important moments
3. Note any text, graphics, or overlays that appear
4. Describe any people, objects, or settings in detail
5. Analyze the audio content if applicable (speech, music, sound effects)
6. Identify the mood, tone, and style of the video
7. Provide a comprehensive summary of the video's message or purpose

Please provide a detailed analysis of this video content.
`;

      // Generate a response using the agent with enhanced instructions
      // Create generate options from validated options
      const generateOptions: Record<string, any> = {
        temperature: validatedOptions.temperature || 0.2, // Lower temperature for more factual analysis
        maxTokens: validatedOptions.maxTokens || 1500 // Allow for a detailed response
      };

      // Add thread and resource IDs if provided
      if (validatedOptions.threadId) {
        generateOptions.threadId = validatedOptions.threadId;
      }

      if (validatedOptions.resourceId) {
        generateOptions.resourceId = validatedOptions.resourceId;
      }

      // Use the Agent class directly for video processing
      const videoAgent = new Agent({
        name: this.getAgent().name,
        instructions: `You are a multimodal agent specialized in video analysis. Provide detailed descriptions of videos.`,
        model: google(this.modelName),
        memory: this.memory?.getMemoryInstance?.()
      });

      const response = await videoAgent.generate(enhancedPrompt, generateOptions);

      logger.debug('Video processed successfully');

      // Store the video processing in memory if available
      if (this.memory && this.threadId) {
        try {
          // Create and validate user message with video
          const userMessage = MultimodalMessageSchema.parse({
            content: userPrompt,
            role: 'user',
            type: 'video_url',
            metadata: {
              videoUrl: videoUrl,
              timestamp: new Date().toISOString()
            }
          });

          // Store the user message
          await (this.memory as any).addMessage(this.threadId, userMessage);

          // Create and validate assistant response
          const assistantMessage = MultimodalMessageSchema.parse({
            content: response.text,
            role: 'assistant',
            type: 'text',
            metadata: {
              videoProcessing: true,
              timestamp: new Date().toISOString()
            }
          });

          // Store the assistant response
          await (this.memory as any).addMessage(this.threadId, assistantMessage);
        } catch (memoryError) {
          logger.warn(`Failed to store video processing in memory: ${memoryError}`);
        }
      }

      return response;
    } catch (error) {
      logger.error(`Error processing video: ${error}`);

      // Attempt with simplified prompt as fallback
      try {
        logger.info('Attempting video processing with simplified prompt');
        const simplifiedPrompt = `${userPrompt}\n\nVideo URL: ${videoUrl}\n\nPlease analyze this video.`;

        // Create simplified generate options
        const simplifiedOptions: Record<string, any> = {
          temperature: validatedOptions.temperature || 0.2,
          maxTokens: validatedOptions.maxTokens || 1000
        };

        // Add thread and resource IDs if provided
        if (validatedOptions.threadId) {
          simplifiedOptions.threadId = validatedOptions.threadId;
        }

        if (validatedOptions.resourceId) {
          simplifiedOptions.resourceId = validatedOptions.resourceId;
        }

        // Use the Agent class directly for simplified video processing
        const simplifiedVideoAgent = new Agent({
          name: this.getAgent().name,
          instructions: `You are a multimodal agent specialized in video analysis. Provide descriptions of videos based on their URLs.`,
          model: google(this.modelName),
          memory: this.memory?.getMemoryInstance?.()
        });

        const response = await simplifiedVideoAgent.generate(simplifiedPrompt, simplifiedOptions);

        logger.debug('Video processed successfully with simplified prompt');
        return response;
      } catch (fallbackError) {
        logger.error(`Simplified video processing failed: ${fallbackError}`);
        throw error; // Throw the original error
      }
    }
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
   * @param schema - Zod schema for the response structure
   * @returns A structured JSON response
   */
  async generateStructured<T extends z.ZodType>(input: string, schema: T) {
    logger.info(`Generating structured response for input: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);
    logger.debug(`Schema: ${schema.description || 'No schema description'}`);

    try {
      // Use generateObject from the 'ai' package with Zod schema
      const { object } = await generateObject({
        model: google(this.modelName),
        temperature: 0.1, // Lower temperature for more predictable JSON formatting
        schema: zodSchema(schema),
        prompt: input,
        schemaDescription: 'Generate a structured response based on the input'
      });

      logger.debug('Structured response generated successfully');
      logger.debug(`Generated object: ${JSON.stringify(object).substring(0, 100)}...`);

      return {
        text: JSON.stringify(object),
        parsedJson: object,
        raw: object
      };
    } catch (error) {
      logger.error(`Error generating structured response: ${error}`);

      // Fallback to traditional approach if generateObject fails
      try {
        logger.info('Attempting fallback for structured generation');
        // Use the Agent class directly for fallback structured generation
        const fallbackStructuredAgent = new Agent({
          name: this.getAgent().name,
          instructions: `You are an agent specialized in generating structured JSON responses. Always respond with valid JSON.`,
          model: google(this.modelName),
          memory: this.memory?.getMemoryInstance?.()
        });

        const response = await fallbackStructuredAgent.generate(input + '\n\nRespond with a valid JSON object.');

        // Attempt to parse the response as JSON
        try {
          const responseText = response.text || '';
          // Extract JSON if it's wrapped in code blocks or has extra text
          const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) ||
                            responseText.match(/\{[\s\S]*\}/);

          const jsonString = jsonMatch ? jsonMatch[0] : responseText;
          const parsedJson = JSON.parse(jsonString);
          logger.debug('Successfully parsed fallback response as valid JSON');

          // Return both the original response and the parsed JSON
          return {
            ...response,
            parsedJson
          };
        } catch (parseError) {
          logger.warn(`Fallback response could not be parsed as valid JSON: ${parseError}`);
          // Return the original response even if parsing failed
          return response;
        }
      } catch (fallbackError) {
        logger.error(`Fallback structured generation failed: ${fallbackError}`);
        throw error; // Throw the original error
      }
    }
  }
}