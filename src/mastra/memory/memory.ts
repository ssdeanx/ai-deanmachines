import { v4 as uuidv4 } from 'uuid';

// Import types and constants
import {
  MemoryConfig,
  MemoryConfigSchema,
  MessageRole,
  MessageType,
  SemanticRecallConfig,
  WorkingMemoryConfig,
  Message,
  MemoryProcessor
} from './types';
import { ENV, DEFAULT_MEMORY } from '../constants';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the Memory module
const logger = createLogger({
  name: 'Mastra-Memory',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Memory class for storing and retrieving conversation history
 */
export class Memory {
  private instance: any;
  protected lastMessages: number;
  protected semanticRecall?: SemanticRecallConfig;
  protected workingMemory?: WorkingMemoryConfig;
  protected processors: MemoryProcessor[] = [];

  /**
   * Create a new Memory instance
   * @param config - Configuration for the memory system
   */
  constructor(config: MemoryConfig) {
    // Validate configuration
    const validatedConfig = MemoryConfigSchema.parse(config);

    // Set memory configuration properties
    this.lastMessages = validatedConfig.lastMessages || 20;
    this.semanticRecall = validatedConfig.semanticRecall;
    this.workingMemory = validatedConfig.workingMemory;

    // Initialize processors if provided
    if (validatedConfig.processors && Array.isArray(validatedConfig.processors)) {
      this.processors = validatedConfig.processors;
      logger.debug(`Initialized ${this.processors.length} memory processors`);
    }

    // Log memory initialization
    logger.info(`Initializing memory with provider: ${validatedConfig.provider}`);
    logger.debug(`Memory configuration: lastMessages=${this.lastMessages}, semanticRecall=${!!this.semanticRecall}, workingMemory=${!!this.workingMemory}, processors=${this.processors.length}`);

    // Create the appropriate memory instance based on the provider
    switch (validatedConfig.provider) {
      case 'upstash':
        this.instance = this.createUpstashMemory(validatedConfig.options);
        break;
      case 'local':
        this.instance = this.createLocalMemory(validatedConfig.options);
        break;
      default:
        logger.error(`Unsupported memory provider: ${validatedConfig.provider}`);
        throw new Error(`Unsupported memory provider: ${validatedConfig.provider}`);
    }
  }

  /**
   * Create an Upstash Redis memory instance
   * @param options - Options for the Upstash Redis memory
   * @returns An Upstash Redis memory instance
   */
  private async createUpstashMemory(options?: Record<string, any>) {
    logger.info(`Creating Upstash memory with options: ${JSON.stringify(options)}`);

    // Import UpstashMemory dynamically to avoid circular dependency
    const { UpstashMemory } = await import('./upstashMemory');

    // Create and return a new UpstashMemory instance with enhanced options
    return new UpstashMemory({
      url: options?.url || process.env[ENV.UPSTASH_REDIS_URL] || '',
      token: options?.token || process.env[ENV.UPSTASH_REDIS_TOKEN] || '',
      prefix: options?.prefix || DEFAULT_MEMORY.PREFIX,
      vectorUrl: options?.vectorUrl || process.env[ENV.UPSTASH_VECTOR_URL],
      vectorToken: options?.vectorToken || process.env[ENV.UPSTASH_VECTOR_TOKEN],
      vectorIndex: options?.vectorIndex || options?.namespace || DEFAULT_MEMORY.NAMESPACE || 'mastra-memory'
    });
  }  /**
   * Create a local memory instance
   * @param options - Options for the local memory
   * @returns A local memory instance
   */
  private createLocalMemory(options?: Record<string, any>) {
    // TODO: Implement local memory
    logger.info(`Creating Local memory with options: ${JSON.stringify(options)}`);

    // For now, return a mock implementation
    return {
      storage: {
        set: async (key: string, value: string) => {
          logger.debug(`[Local] Setting ${key} with value length: ${value.length}`);
          return true;
        },
        get: async (key: string) => {
          logger.debug(`[Local] Getting ${key}`);
          return null;
        },
        lpush: async (key: string, value: string) => {
          logger.debug(`[Local] Pushing ${value} to ${key}`);
          return true;
        },
        lrange: async (key: string, start: number, end: number) => {
          logger.debug(`[Local] Getting range ${start}-${end} from ${key}`);
          return [];
        }
      }
    };
  }

  /**
   * Get the memory instance
   * @returns The memory instance
   */
  getMemoryInstance() {
    return this.instance;
  }

  /**
   * Apply memory processors to a list of messages
   * @param messages - Array of messages to process
   * @returns Processed array of messages
   */
  protected applyProcessors(messages: Message[]): Message[] {
    if (!this.processors || this.processors.length === 0) {
      return messages;
    }

    logger.debug(`Applying ${this.processors.length} processors to ${messages.length} messages`);

    let processedMessages = [...messages];

    // Apply each processor in sequence
    for (const processor of this.processors) {
      try {
        const beforeCount = processedMessages.length;
        processedMessages = processor.process(processedMessages);
        const afterCount = processedMessages.length;

        logger.debug(`Processor ${processor.constructor.name} processed messages: ${beforeCount} -> ${afterCount}`);
      } catch (error) {
        logger.error(`Error applying processor ${processor.constructor.name}: ${error}`);
        // Continue with the next processor if one fails
      }
    }

    logger.debug(`After processing: ${messages.length} -> ${processedMessages.length} messages`);
    return processedMessages;
  }



  /**
   * Add a message to the memory
   * @param threadId - ID of the thread
   * @param content - Content of the message
   * @param role - Role of the message sender
   * @param type - Type of the message
   * @returns The created message
   */
  async addMessage(threadId: string, content: string, role: string, type: string, metadata: { taskType: string; subtaskCount: number; timestamp: string; }, role: MessageRole, type: MessageType) {
    logger.info(`Adding message to thread ${threadId} with role ${role} and type ${type}`);

    const message = {
      id: uuidv4(),
      thread_id: threadId,
      content,
      role,
      type,
      createdAt: new Date()
    };

    // Store message in database
    await this.instance.storage.set(`message:${message.id}`, JSON.stringify(message));

    // Add message to thread's message list
    await this.instance.storage.lpush(`thread:${threadId}:messages`, message.id);

    logger.debug(`Message ${message.id} added to thread ${threadId}`);
    return message;
  }

  /**
   * Get messages from a thread
   * @param threadId - ID of the thread
   * @param limit - Maximum number of messages to retrieve
   * @param semanticQuery - Optional query for semantic search
   * @returns Array of messages
   */
  async getMessages(threadId: string, limit = 10, semanticQuery?: string) {
    logger.info(`Getting messages from thread ${threadId} with limit ${limit}`);

    // If semantic query is provided and semantic recall is enabled, try to use it
    if (semanticQuery && this.semanticRecall?.enabled) {
      logger.debug(`Attempting semantic search with query: ${semanticQuery}`);
      try {
        // Check if the instance has a getMessagesWithSemanticSearch method
        if (typeof this.instance.getMessagesWithSemanticSearch === 'function') {
          const semanticResults = await this.instance.getMessagesWithSemanticSearch(
            threadId,
            semanticQuery,
            this.semanticRecall.topK || 5
          );

          if (semanticResults && semanticResults.length > 0) {
            logger.debug(`Found ${semanticResults.length} messages through semantic search`);
            return semanticResults;
          }
        } else {
          logger.debug('Semantic search not available in the memory instance');
        }
      } catch (error) {
        logger.error(`Error performing semantic search: ${error}`);
      }
    }

    // Fall back to regular message retrieval
    const actualLimit = limit || this.lastMessages;
    logger.debug(`Getting recent messages with limit ${actualLimit}`);

    // Get message IDs from thread
    const messageIds = await this.instance.storage.lrange(`thread:${threadId}:messages`, 0, actualLimit - 1);
    logger.debug(`Found ${messageIds.length} message IDs for thread ${threadId}`);

    // Get message content for each ID
    const messages = [];
    for (const messageId of messageIds) {
      const messageJson = await this.instance.storage.get(`message:${messageId}`);
      if (messageJson) {
        messages.push(JSON.parse(messageJson));
      } else {
        logger.warn(`Message ${messageId} not found for thread ${threadId}`);
      }
    }

    logger.debug(`Retrieved ${messages.length} messages for thread ${threadId}`);

    // Apply processors to the messages
    const processedMessages = this.applyProcessors(messages);

    return processedMessages;
  }

  /**
   * Get working memory for a thread
   * @param threadId - ID of the thread
   * @returns Working memory object
   */
  async getWorkingMemory(threadId: string): Promise<Record<string, any> | null> {
    // If working memory is not enabled, return null
    if (!this.workingMemory?.enabled) {
      logger.debug('Working memory is disabled');
      return null;
    }

    logger.info(`Getting working memory for thread ${threadId}`);

    try {
      // Check if the instance has a getWorkingMemory method
      if (typeof this.instance.getWorkingMemory === 'function') {
        const workingMemory = await this.instance.getWorkingMemory(threadId);
        if (workingMemory) {
          logger.debug(`Found working memory for thread ${threadId}`);
          return workingMemory;
        }
      } else {
        logger.debug('Working memory not available in the memory instance');
      }

      // If no working memory found or method not available, return null
      return null;
    } catch (error) {
      logger.error(`Error getting working memory: ${error}`);
      return null;
    }
  }

  /**
   * Update working memory for a thread
   * @param threadId - ID of the thread
   * @param workingMemory - Working memory object to save
   * @returns Updated working memory object
   */
  async updateWorkingMemory(threadId: string, workingMemory: Record<string, any>): Promise<Record<string, any> | null> {
    // If working memory is not enabled, return null
    if (!this.workingMemory?.enabled) {
      logger.debug('Working memory is disabled');
      return null;
    }

    logger.info(`Updating working memory for thread ${threadId}`);

    try {
      // Check if the instance has an updateWorkingMemory method
      if (typeof this.instance.updateWorkingMemory === 'function') {
        const updatedMemory = await this.instance.updateWorkingMemory(threadId, workingMemory);
        logger.debug(`Working memory updated for thread ${threadId}`);
        return updatedMemory;
      } else {
        logger.debug('Working memory update not available in the memory instance');
        return null;
      }
    } catch (error) {
      logger.error(`Error updating working memory: ${error}`);
      return null;
    }
  }

  /**
   * Create a new thread
   * @returns The created thread ID
   */
  async createThread() {
    const threadId = uuidv4();
    logger.info(`Creating new thread with ID ${threadId}`);

    await this.instance.storage.set(`thread:${threadId}:created`, new Date().toISOString());

    logger.debug(`Thread ${threadId} created successfully`);
    return threadId;
  }
}
