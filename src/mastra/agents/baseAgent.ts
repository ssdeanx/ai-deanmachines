import { Agent } from '@mastra/core';
import { google } from '@ai-sdk/google';

// Import types and constants
import {
  AgentConfig,
  AgentConfigSchema,
  GenerateOptionsSchema,
  StreamOptionsSchema,
  MemoryContextOptionsSchema,
  MessageRoleSchema,
  MessageTypeSchema
} from './types';
import { AgentType, DEFAULT_INSTRUCTIONS, DEFAULT_MODEL_NAMES } from './constants';
import { Memory } from '../memory';
import { getTracer, recordLLMMetrics } from '../observability/telemetry';
import { simpleTokenCounter, calculateCost } from '../evals/utils';
import { streamText, generateText } from 'ai';
import { z } from 'zod';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the BaseAgent
const logger = createLogger({
  name: 'Mastra-BaseAgent',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});
/**
 * BaseAgent class that serves as the foundation for all agent types
 * Provides core functionality for interacting with LLMs and managing memory
 */
export class BaseAgent {
  protected agent: Agent;
  protected memory?: Memory;
  protected tools: any[] = [];
  protected type: AgentType;
  protected threadId?: string;
  protected resourceId?: string;
  protected modelName: string;
  protected temperature: number;
  protected maxTokens?: number;
  protected topP?: number;
  protected topK?: number;

  /**
   * Create a new BaseAgent instance
   * @param config - Configuration for the agent
   */
  constructor(config: AgentConfig) {
    // Validate configuration
    const validatedConfig = AgentConfigSchema.parse(config);
    logger.info(`Creating BaseAgent with name: ${validatedConfig.name}`);

    // Set agent properties
    this.type = validatedConfig.type || AgentType.BASE;
    this.modelName = validatedConfig.modelName || DEFAULT_MODEL_NAMES.GEMINI_PRO;
    this.temperature = validatedConfig.temperature || 0.7;
    this.maxTokens = validatedConfig.maxTokens;
    this.topP = validatedConfig.topP;
    this.topK = validatedConfig.topK;

    // Set memory if provided
    if (validatedConfig.memory) {
      logger.debug(`Setting memory for agent: ${validatedConfig.name}`);
      this.memory = validatedConfig.memory;
    }

    // Set tools if provided
    if (validatedConfig.tools) {
      logger.debug(`Setting ${validatedConfig.tools.length} tools for agent: ${validatedConfig.name}`);
      this.tools = validatedConfig.tools;
    }

    // Create the agent instance with Google model
    logger.info(`Initializing agent with model: ${this.modelName}`);

    // Configure Google model options
    const googleOptions: any = {};

    // Add generation config if any parameters are set
    if (this.temperature !== undefined || this.maxTokens !== undefined ||
        this.topP !== undefined || this.topK !== undefined) {

      googleOptions.generationConfig = {};

      if (this.temperature !== undefined) {
        googleOptions.generationConfig.temperature = this.temperature;
      }

      if (this.maxTokens !== undefined) {
        googleOptions.generationConfig.maxOutputTokens = this.maxTokens;
      }

      if (this.topP !== undefined) {
        googleOptions.generationConfig.topP = this.topP;
      }

      if (this.topK !== undefined) {
        googleOptions.generationConfig.topK = this.topK;
      }
    }

    // Create the agent with the configured model
    this.agent = new Agent({
      name: validatedConfig.name,
      instructions: validatedConfig.instructions || DEFAULT_INSTRUCTIONS.BASE,
      model: google(this.modelName, googleOptions),
      memory: this.memory?.getMemoryInstance?.(),
      // Convert tools array to record if needed
      tools: this.tools.length > 0 ? this.tools.reduce((acc, tool) => {
        if (tool.name) {
          logger.debug(`Adding tool to agent: ${tool.name}`);
          acc[tool.name] = tool;
        }
        return acc;
      }, {}) : undefined,
    });

    logger.info(`BaseAgent ${validatedConfig.name} created successfully with type: ${this.type}`);
  }

  /**
   * Stream a response from the agent
   * @param input - User input text
   * @param options - Additional options for the agent
   * @returns A streaming response from the agent
   */
  async stream(input: string, options: any = {}) {
    logger.info(`Streaming response for input: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);
    logger.debug(`Stream options: ${JSON.stringify(options)}`);

    // Create a tracer for this operation
    const tracer = getTracer('mastra.agent');
    const span = tracer.startSpan('stream');
    span.setAttribute('agent.type', this.type);
    span.setAttribute('agent.model', this.modelName);
    span.setAttribute('input.length', input.length);

    // Start timing the operation
    const startTime = Date.now();

    // Estimate prompt tokens
    const promptTokens = simpleTokenCounter(input);
    span.setAttribute('prompt.tokens', promptTokens);

    // Handle memory integration
    await this.prepareMemoryContext(input, options);

    try {
      // Validate options with Zod
      const validatedOptions = StreamOptionsSchema.parse(options);

      // Store the user message in memory if available
      if (this.memory && this.threadId) {
        await this.storeMessageInMemory(input, 'user', 'text');
      }

      // Use streamText from the 'ai' package
      const streamResponse = streamText({
        model: google(this.modelName),
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        topP: this.topP,
        topK: this.topK,
        prompt: input,
        ...validatedOptions
      });

      // Extract the textStream and text from the result
      const textStream = streamResponse.textStream;
      const text = streamResponse.text;

      logger.debug('Stream response started successfully');

      // For streaming, we can't know the completion tokens or total cost yet
      // So we just record what we know
      recordLLMMetrics({
        promptTokens,
        modelName: this.modelName,
        operationType: 'stream'
      });

      // For streaming, we'll record metrics after the response is complete
      const agent = this;
      let fullText = '';

      // Create a promise that resolves when the stream is complete
      const streamComplete = (async () => {
        try {
          for await (const chunk of textStream) {
            fullText += chunk;
          }

          // Calculate completion tokens and latency
          const completionTokens = simpleTokenCounter(fullText);
          const totalTokens = promptTokens + completionTokens;
          const latencyMs = Date.now() - startTime;

          // Calculate cost
          const cost = calculateCost(
            { promptTokens, completionTokens, totalTokens },
            agent.modelName
          );

          // Record final metrics
          recordLLMMetrics({
            completionTokens,
            totalTokens,
            cost,
            latency: latencyMs,
            modelName: agent.modelName,
            operationType: 'stream_complete'
          });

          // Add metrics to span
          span.setAttribute('completion.tokens', completionTokens);
          span.setAttribute('total.tokens', totalTokens);
          span.setAttribute('latency.ms', latencyMs);
          span.setAttribute('cost.usd', cost);
          span.setAttribute('response.length', fullText.length);

          // Store the assistant's response in memory if available
          if (agent.memory && agent.threadId && fullText) {
            await agent.storeMessageInMemory(fullText, 'assistant', 'text');
          }
        } catch (error) {
          logger.error(`Error processing stream: ${error}`);
        } finally {
          span.end();
        }
      })();

      // Return a response object that matches the expected interface
      return {
        text: Promise.resolve(text),
        textStream,
        streamComplete
      };
    } catch (error) {
      logger.error(`Error streaming response: ${error}`);

      // Record error metrics
      recordLLMMetrics({
        promptTokens,
        error: true,
        modelName: this.modelName,
        operationType: 'stream'
      });

      // Record error in span
      span.recordException({
        name: 'StreamError',
        message: String(error)
      });
      span.end();

      throw error;
    }
  }

  /**
   * Generate a response from the agent (non-streaming)
   * @param input - User input text
   * @param options - Additional options for the agent
   * @returns A complete response from the agent
   */
  async generate(input: string, options: any = {}) {
    logger.info(`Generating response for input: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);
    logger.debug(`Generate options: ${JSON.stringify(options)}`);

    // Set thread and resource IDs from options if provided
    if (options.threadId) {
      this.threadId = options.threadId;
    }
    if (options.resourceId) {
      this.resourceId = options.resourceId;
    }

    // Create a tracer for this operation
    const tracer = getTracer('mastra.agent');
    const span = tracer.startSpan('generate');
    span.setAttribute('agent.type', this.type);
    span.setAttribute('agent.model', this.modelName);
    span.setAttribute('input.length', input.length);
    if (this.threadId) span.setAttribute('thread.id', this.threadId);
    if (this.resourceId) span.setAttribute('resource.id', this.resourceId);

    // Start timing the operation
    const startTime = Date.now();

    // Estimate prompt tokens
    const promptTokens = simpleTokenCounter(input);
    span.setAttribute('prompt.tokens', promptTokens);

    // Handle memory integration
    await this.prepareMemoryContext(input, options);

    try {
      // Validate options with Zod
      const validatedOptions = GenerateOptionsSchema.parse(options);

      // Store the user message in memory if available
      if (this.memory && this.threadId) {
        try {
          await this.storeMessageInMemory(input, 'user', 'text');
        } catch (memoryError) {
          // Log the error but continue with generation
          logger.warn(`Failed to store user message in memory: ${memoryError}`);
          span.setAttribute('memory.store.error', true);
          span.setAttribute('memory.store.error.message', String(memoryError));
        }
      }

      // Set up retry mechanism for generation
      let attempts = 0;
      const maxAttempts = options.maxRetries || 3;
      let response;
      let lastError;

      while (attempts < maxAttempts) {
        try {
          // Use generateText from the 'ai' package
          const generatePromise = generateText({
            model: google(this.modelName),
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            topP: this.topP,
            topK: this.topK,
            prompt: input,
            ...validatedOptions
          });

          // Wait for the promise to resolve
          const generateResult = await generatePromise;

          // Create a response object that matches the expected interface
          response = {
            text: generateResult.text,
            raw: generateResult
          };

          logger.debug('Response generated successfully');
          break; // Exit the retry loop if successful
        } catch (genError) {
          attempts++;
          lastError = genError;
          logger.warn(`Generation attempt ${attempts} failed: ${genError}`);
          span.setAttribute('generation.retry', attempts);

          if (attempts < maxAttempts) {
            // Exponential backoff with jitter
            const backoffMs = Math.min(1000 * Math.pow(2, attempts - 1) + Math.random() * 1000, 10000);
            logger.debug(`Retrying in ${backoffMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        }
      }

      // If all attempts failed, throw the last error
      if (!response) {
        throw lastError || new Error('Failed to generate response after multiple attempts');
      }

      // Calculate completion tokens and latency
      const completionTokens = response.text ? simpleTokenCounter(response.text) : 0;
      const totalTokens = promptTokens + completionTokens;
      const latencyMs = Date.now() - startTime;

      // Calculate cost
      const cost = calculateCost(
        { promptTokens, completionTokens, totalTokens },
        this.modelName
      );

      // Record metrics
      recordLLMMetrics({
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
        latency: latencyMs,
        modelName: this.modelName,
        operationType: 'generate'
      });

      // Add metrics to span
      span.setAttribute('completion.tokens', completionTokens);
      span.setAttribute('total.tokens', totalTokens);
      span.setAttribute('latency.ms', latencyMs);
      span.setAttribute('cost.usd', cost);
      span.setAttribute('response.length', response.text?.length || 0);

      // Store the assistant's response in memory if available
      if (this.memory && this.threadId && response.text) {
        await this.storeMessageInMemory(response.text, 'assistant', 'text');
      }

      span.end();
      return response;
    } catch (error) {
      logger.error(`Error generating response: ${error}`);

      // Record error metrics
      recordLLMMetrics({
        promptTokens,
        error: true,
        modelName: this.modelName,
        operationType: 'generate'
      });

      // Record error in span
      span.recordException({
        name: 'GenerateError',
        message: String(error)
      });
      span.end();

      throw error;
    }

  }

  /**
   * Prepare memory context for the agent
   * @param input - User input for semantic search
   * @param options - Agent options
   */
  private async prepareMemoryContext(input: string, options: any = {}) {
    // If memory is not available, skip context preparation
    if (!this.memory) {
      logger.debug('No memory configured, skipping context preparation');
      return;
    }

    // Validate options with Zod
    const validatedOptions = MemoryContextOptionsSchema.parse(options);

    try {
      // Get or create thread ID
      this.threadId = validatedOptions.threadId || this.threadId;
      this.resourceId = validatedOptions.resourceId || this.resourceId || 'default';

      if (!this.threadId) {
        logger.debug('Creating new thread for agent interaction');
        try {
          // Try to create a thread with the resourceId
          if (typeof this.memory.createThread === 'function') {
            // Use type assertion to handle potential parameter differences
            this.threadId = await (this.memory as any).createThread(this.resourceId);
            logger.debug(`New thread created with ID: ${this.threadId} for resource: ${this.resourceId}`);
          } else {
            logger.warn('Memory instance does not have createThread method');
          }
        } catch (error) {
          logger.error(`Error creating thread: ${error}`);
          // Generate a fallback thread ID if creation fails
          this.threadId = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          logger.debug(`Using fallback thread ID: ${this.threadId}`);
        }
      }

      // Update thread and resource IDs in validated options
      validatedOptions.threadId = this.threadId;
      validatedOptions.resourceId = this.resourceId;

      // Handle semantic search if requested
      if ((validatedOptions.semanticQuery || validatedOptions.vectorSearch) && input) {
        const query = validatedOptions.semanticQuery || input;
        const limit = validatedOptions.semanticLimit || 5;

        logger.debug(`Performing semantic search with query: ${query.substring(0, 50)}${query.length > 50 ? '...' : ''}`);

        try {
          let semanticResults;

          // Try different memory methods based on what's available
          if (typeof (this.memory as any).query === 'function') {
            // Modern memory implementation with query method
            semanticResults = await (this.memory as any).query(this.threadId, {
              vectorSearchString: query,
              topK: limit,
              messageRange: validatedOptions.messageRange || 100
            });
          } else if (typeof (this.memory as any).getMessages === 'function') {
            // Legacy implementation - get all messages and filter locally
            const allMessages = await (this.memory as any).getMessages(this.threadId);
            if (allMessages && allMessages.length > 0) {
              semanticResults = this.filterMessagesByRelevance(allMessages, query, limit);
            }
          }

          if (semanticResults && semanticResults.length > 0) {
            logger.debug(`Found ${semanticResults.length} relevant messages from memory`);
            // Add semantic results to the context
            options.context = options.context || {};
            options.context.semanticResults = semanticResults;
          }
        } catch (error) {
          logger.warn(`Error performing semantic search: ${error}`);
          // Continue execution despite semantic search failure
        }
      }

      // Handle working memory if enabled
      if (validatedOptions.useWorkingMemory) {
        try {
          let workingMemory;

          // Try different memory methods based on what's available
          if (typeof (this.memory as any).getWorkingMemory === 'function') {
            workingMemory = await (this.memory as any).getWorkingMemory(this.threadId || '');
          }

          if (workingMemory) {
            logger.debug('Retrieved working memory for context');
            // Add working memory to the context
            options.context = options.context || {};
            options.context.workingMemory = workingMemory;
          }
        } catch (error) {
          logger.warn(`Error retrieving working memory: ${error}`);
          // Continue execution despite working memory failure
        }
      }

      // Apply memory processors if specified
      if (validatedOptions.applyProcessors) {
        try {
          logger.debug('Applying memory processors');
          // Use type assertion to handle potential method differences
          if (typeof (this.memory as any).applyProcessors === 'function') {
            await (this.memory as any).applyProcessors(this.threadId || '', validatedOptions.processors);
          }
        } catch (error) {
          logger.warn(`Error applying memory processors: ${error}`);
          // Continue execution despite processor failure
        }
      }

      logger.debug('Memory context preparation completed successfully');
    } catch (error) {
      logger.warn(`Error in memory context preparation: ${error}`);
      // Don't throw, just log the error and continue
    }
  }

  /**
   * Filter messages by relevance to a query
   * This is a simplified approach when vector search is not available
   * @param messages - Messages to filter
   * @param query - Query to match against
   * @param limit - Maximum number of messages to return
   * @returns Filtered messages
   */
  private filterMessagesByRelevance(messages: any[], query: string, limit: number): any[] {
    // Simple keyword matching (in a real implementation, use vector similarity)
    const queryTerms = query.toLowerCase().split(/\s+/);

    // Score each message based on term overlap
    const scoredMessages = messages.map(msg => {
      const content = typeof msg.content === 'string' ? msg.content.toLowerCase() : '';
      let score = 0;

      // Count matching terms
      for (const term of queryTerms) {
        if (content.includes(term)) {
          score += 1;
        }
      }

      // Normalize score
      const normalizedScore = queryTerms.length > 0 ? score / queryTerms.length : 0;

      return {
        ...msg,
        relevanceScore: normalizedScore
      };
    });

    // Sort by relevance score (descending)
    scoredMessages.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return top results
    return scoredMessages.slice(0, limit);
  }

  /**
   * Store a message in memory
   * @param content - Message content
   * @param role - Message role (user, assistant, system, tool)
   * @param type - Message type (text, tool-call, tool-result)
   * @returns The stored message
   */
  private async storeMessageInMemory(content: string, role: z.infer<typeof MessageRoleSchema>, type: z.infer<typeof MessageTypeSchema>) {
    if (!this.memory || !this.threadId) {
      return null;
    }

    try {
      // Use type assertion to access the addMessage method
      if (typeof (this.memory as any).addMessage === 'function') {
        const message = await (this.memory as any).addMessage(this.threadId, content, role, type);
        logger.debug(`Stored ${role} message in thread ${this.threadId}`);
        return message;
      } else {
        logger.warn('Memory instance does not have addMessage method');
        return null;
      }
    } catch (error) {
      logger.error(`Error storing message in memory: ${error}`);
      return null;
    }
  }

  /**
   * Register a tool with the agent
   * @param tool - Tool to register
   * @returns The agent instance for chaining
   */
  registerTool(tool: any) {
    if (!tool || !tool.name) {
      logger.warn('Attempted to register a tool without a name');
      return this;
    }

    logger.info(`Registering tool: ${tool.name}`);
    this.tools.push(tool);

    // Convert tools array to record
    const toolsRecord = this.tools.reduce((acc, t) => {
      if (t.name) {
        acc[t.name] = t;
      }
      return acc;
    }, {});

    // Create a new agent with the updated tools
    const newAgent = new Agent({
      name: this.agent.name,
      instructions: this.agent.getInstructions() as string,
      model: google(this.modelName),
      memory: this.memory?.getMemoryInstance?.(),
      tools: toolsRecord
    });

    // Replace the agent
    this.agent = newAgent;

    logger.debug('Agent tools updated successfully');
    logger.info(`Agent now has ${this.tools.length} tools available`);
    logger.debug(`Tool registered successfully: ${tool.name}`);

    return this;
  }

  /**
   * Set the memory instance for the agent
   * @param memory - Memory instance to use
   * @returns The agent instance for chaining
   */
  setMemory(memory: Memory) {
    logger.info('Setting memory for agent');
    this.memory = memory;

    // Get the memory instance
    const memoryInstance = this.memory.getMemoryInstance?.();

    // Create a new agent with the updated memory
    // We need to recreate the agent with all required properties
    const newAgent = new Agent({
      name: this.agent.name,
      instructions: this.agent.getInstructions() as string,
      // Use the Google model with default settings
      // The @ai-sdk/google package handles the configuration internally
      model: google(this.modelName),
      memory: memoryInstance,
      tools: this.tools.length > 0 ? this.tools.reduce((acc, tool) => {
        if (tool.name) {
          acc[tool.name] = tool;
        }
        return acc;
      }, {}) : undefined
    });

    // Replace the agent
    this.agent = newAgent;

    logger.debug('Memory set successfully');
    return this;
  }

  /**
   * Set the thread ID for the agent
   * @param threadId - Thread ID to use
   * @param resourceId - Optional resource ID
   * @returns The agent instance for chaining
   */
  setThread(threadId: string, resourceId?: string) {
    logger.info(`Setting thread ID: ${threadId}`);
    this.threadId = threadId;

    if (resourceId) {
      logger.debug(`Setting resource ID: ${resourceId}`);
      this.resourceId = resourceId;
    }

    return this;
  }

  /**
   * Get the current thread ID
   * @returns The current thread ID or undefined if not set
   */
  getThreadId() {
    return this.threadId;
  }

  /**
   * Get the current resource ID
   * @returns The current resource ID or undefined if not set
   */
  getResourceId() {
    return this.resourceId;
  }

  /**
   * Get the agent type
   * @returns The agent type
   */
  getType() {
    return this.type;
  }

  /**
   * Get the model name
   * @returns The model name
   */
  getModelName() {
    return this.modelName;
  }

  /**
   * Get the underlying agent instance
   * @returns The agent instance
   */
  getAgent() {
    logger.debug('Getting agent instance');
    return this.agent;
  }
}

