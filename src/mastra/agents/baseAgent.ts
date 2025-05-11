import { Agent } from '@mastra/core';
import { google } from '@ai-sdk/google';

// Import types and constants
import { AgentConfig, AgentConfigSchema } from './types';
import { AgentType, DEFAULT_INSTRUCTIONS, DEFAULT_MODEL_NAMES } from './constants';
import { logger } from '../index';
import { Memory, UpstashMemory } from '../memory';

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

    // Handle memory integration
    await this.prepareMemoryContext(input, options);

    try {
      const response = await this.agent.stream(input, options);
      logger.debug('Stream response started successfully');

      // Store the response in memory if available
      if (this.memory && this.threadId) {
        // We can't easily store streaming responses in memory as they're being generated
        // But we can store the input message
        await this.storeMessageInMemory(input, 'user', 'text');
      }

      return response;
    } catch (error) {
      logger.error(`Error streaming response: ${error}`);
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

    // Handle memory integration
    await this.prepareMemoryContext(input, options);

    try {
      // Store the user message in memory if available
      if (this.memory && this.threadId) {
        await this.storeMessageInMemory(input, 'user', 'text');
      }

      // Generate the response
      const response = await this.agent.generate(input, options);
      logger.debug('Response generated successfully');

      // Store the assistant's response in memory if available
      if (this.memory && this.threadId && response.text) {
        await this.storeMessageInMemory(response.text, 'assistant', 'text');
      }

      return response;
    } catch (error) {
      logger.error(`Error generating response: ${error}`);
      throw error;
    }
  }

  /**
   * Prepare memory context for the agent
   * @param _input - User input (not used directly but kept for clarity)
   * @param options - Agent options
   */
  private async prepareMemoryContext(_input: string, options: any = {}) {
    // If memory is available, set up the thread and context
    if (this.memory) {
      // Get or create thread ID
      this.threadId = options.threadId || this.threadId;
      this.resourceId = options.resourceId || this.resourceId || 'default';

      if (!this.threadId) {
        logger.debug('Creating new thread for agent interaction');
        this.threadId = await this.memory.createThread();
        logger.debug(`New thread created with ID: ${this.threadId}`);

        // Save thread metadata if resourceId is provided and method exists
        if (this.resourceId && typeof (this.memory as any).saveThreadMetadata === 'function') {
          try {
            await (this.memory as any).saveThreadMetadata(this.threadId, this.resourceId, {
              agentType: this.type,
              modelName: this.modelName,
              createdAt: new Date().toISOString()
            });
            logger.debug('Thread metadata saved successfully');
          } catch (error) {
            logger.error(`Error saving thread metadata: ${error}`);
          }
        }
      }

      // Add thread and resource IDs to options
      options.threadId = this.threadId;
      options.resourceId = this.resourceId;

      // If semantic search is requested and method exists
      if (options.semanticQuery && typeof (this.memory as any).getMessages === 'function') {
        logger.debug(`Performing semantic search with query: ${options.semanticQuery}`);
        try {
          // Call getMessages with the appropriate parameters
          // Note: We're using a standard approach that works with most memory implementations
          const semanticResults = await (this.memory as any).getMessages(this.threadId);

          if (semanticResults && semanticResults.length > 0) {
            // Filter results based on semantic similarity (simplified approach)
            const filteredResults = this.filterMessagesByRelevance(
              semanticResults,
              options.semanticQuery,
              options.semanticLimit || 5
            );

            if (filteredResults.length > 0) {
              logger.debug(`Found ${filteredResults.length} relevant messages from memory`);
              // Add semantic results to the context
              options.context = options.context || {};
              options.context.semanticResults = filteredResults;
            }
          }
        } catch (error) {
          logger.error(`Error performing semantic search: ${error}`);
        }
      }

      // If working memory is enabled and method exists
      if (options.useWorkingMemory && typeof (this.memory as any).getWorkingMemory === 'function') {
        try {
          const workingMemory = await (this.memory as any).getWorkingMemory(this.threadId);
          if (workingMemory) {
            logger.debug('Retrieved working memory for context');
            // Add working memory to the context
            options.context = options.context || {};
            options.context.workingMemory = workingMemory;
          }
        } catch (error) {
          logger.error(`Error retrieving working memory: ${error}`);
        }
      }
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
  private async storeMessageInMemory(content: string, role: 'user' | 'assistant' | 'system' | 'tool', type: 'text' | 'tool-call' | 'tool-result') {
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