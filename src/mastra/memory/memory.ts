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
  MemoryProcessor,
  CoreMessage
} from './types';
import { ENV, DEFAULT_MEMORY } from '../constants';
import { createLogger } from '@mastra/core/logger';
import { Memory } from '@mastra/memory';
// Create a logger instance for the Memory module

const logger = createLogger({
  name: 'Mastra-Memory',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});
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
        this.instance = this.createUpstashMemory(validatedConfig.options); // Initialize Upstash memory
        break;
      case 'local':
        this.instance = this.createLocalMemory(validatedConfig.options); // Initialize Local memory
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
    const { UpstashMemory, UpstashMemoryConfigSchema } = await import('./upstashMemory');

    // Validate Upstash specific options
    const upstashSpecificOptions = UpstashMemoryConfigSchema.parse({
      url: options?.url || process.env[ENV.UPSTASH_REDIS_URL] || '',
      token: options?.token || process.env[ENV.UPSTASH_REDIS_TOKEN] || '',
      vectorStoreUrl: options?.vectorStoreUrl || process.env[ENV.UPSTASH_VECTOR_URL],
      vectorStoreToken: options?.vectorStoreToken || process.env[ENV.UPSTASH_VECTOR_TOKEN],
      vectorIndexName: options?.vectorIndexName || options?.namespace || DEFAULT_MEMORY.NAMESPACE || 'mastra-memory',
      storePrefix: options?.storePrefix || 'mastra:'
    });

    if (!upstashSpecificOptions.url || !upstashSpecificOptions.token) {
      logger.error('[Memory] Upstash URL or Token is missing. Cannot initialize UpstashMemory.');
      throw new Error('Upstash URL and Token are required for UpstashMemory.');
    }

    return new UpstashMemory(upstashSpecificOptions);
  }

  /**
   * Create a local memory instance
   * @param options - Options for the local memory
   * @returns A local memory instance
   */
  private createLocalMemory(options?: Record<string, any>) {
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
        processedMessages = processor.process(processedMessages as CoreMessage[], {}) as Message[];
        const afterCount = processedMessages.length;

        logger.debug(`Processor ${processor.constructor.name} processed messages: ${beforeCount} -> ${afterCount}`);
      } catch (error) {
        logger.error(`Error applying processor ${processor.constructor.name}: ${error}`);
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
  async addMessage(threadId: string, content: string | Record<string, any>, role: MessageRole, type: MessageType, metadata?: Record<string, any>) {
    logger.info(`Adding message to thread ${threadId} with role ${role} and type ${type}`);

    const messagePayload = {
      content,
      role,
      type,
      metadata,
    };

    const provider = await this.instance;
    if (!provider || typeof provider.addMessage !== 'function') {
      logger.error('[Memory] Memory provider instance is not correctly initialized or does not support addMessage.');
      throw new Error('Memory provider not available or addMessage not implemented.');
    }

    const createdMessage = await provider.addMessage(threadId, messagePayload);
    logger.debug(`Message ${createdMessage.id} added to thread ${threadId} via provider`);
    return createdMessage;
  }

  /**
   * Get messages from a thread
   * @param threadId - ID of the thread
   * @param limit - Maximum number of messages to retrieve
   * @param semanticQuery - Optional query for semantic search
   * @param before - Pagination parameter
   * @param after - Pagination parameter
   * @returns Array of messages
   */
  async getMessages(threadId: string, limit?: number, semanticQuery?: string, before?: string, after?: string) {
    logger.info(`Getting messages from thread ${threadId} with limit ${limit}`);
    const provider = await this.instance;

    if (!provider || typeof provider.getMessages !== 'function') {
      logger.error('[Memory] Memory provider instance is not correctly initialized or does not support getMessages.');
      throw new Error('Memory provider not available or getMessages not implemented.');
    }

    let messages: Message[];

    if (semanticQuery && this.semanticRecall?.enabled && typeof provider.findRelatedMessages === 'function') {
      logger.debug(`Attempting semantic search with query: ${semanticQuery}`);
      try {
        const queryEmbedding: number[] = [];
        if (queryEmbedding.length > 0) {
          const relatedRecords = await provider.findRelatedMessages(
            threadId,
            queryEmbedding,
            { topK: this.semanticRecall.topK || 5 }
          );
          messages = relatedRecords.map((record: { id: any; thread_id: any; content: any; role: any; type: any; createdAt: string | number | Date; metadata: any; }) => ({
            id: record.id,
            thread_id: record.thread_id || threadId,
            content: record.content || '',
            role: record.role || 'assistant',
            type: record.type || 'text',
            createdAt: record.createdAt ? new Date(record.createdAt) : new Date(),
            metadata: record.metadata,
          }));
          logger.debug(`Found ${messages.length} messages through semantic search`);
        } else {
          logger.warn('Could not generate embedding for semantic query, falling back to regular retrieval.');
          messages = await provider.getMessages(threadId, limit ?? this.lastMessages, before, after);
        }
      } catch (error) {
        logger.error(`Error performing semantic search: ${error}`);
        messages = await provider.getMessages(threadId, limit ?? this.lastMessages, before, after);
      }
    } else {
      messages = await provider.getMessages(threadId, limit ?? this.lastMessages, before, after);
    }

    logger.debug(`Retrieved ${messages.length} messages for thread ${threadId} via provider`);
    return this.applyProcessors(messages);
  }

  /**
   * Get working memory for a thread
   * @param threadId - ID of the thread
   * @returns Working memory object
   */
  async getWorkingMemory(threadId: string): Promise<Record<string, any> | null> {
    if (!this.workingMemory?.enabled) {
      logger.debug('Working memory is disabled');
      return null;
    }
    logger.info(`Getting working memory for thread ${threadId}`);
    const provider = await this.instance;
    if (provider && typeof provider.getWorkingMemory === 'function') {
      try {
        return await provider.getWorkingMemory(threadId);
      } catch (error) {
        logger.error(`Error getting working memory via provider: ${error}`);
        return null;
      }
    }
    logger.debug('Working memory not available in the memory provider instance or getWorkingMemory not implemented.');
    return null;
  }

  /**
   * Update working memory for a thread
   * @param threadId - ID of the thread
   * @param workingMemory - Working memory object to save
   * @returns Updated working memory object
   */
  async updateWorkingMemory(threadId: string, workingMemoryData: Record<string, any>): Promise<Record<string, any> | null> {
    if (!this.workingMemory?.enabled) {
      logger.debug('Working memory is disabled');
      return null;
    }
    logger.info(`Updating working memory for thread ${threadId}`);
    const provider = await this.instance;
    if (provider && typeof provider.updateWorkingMemory === 'function') {
      try {
        return await provider.updateWorkingMemory(threadId, workingMemoryData);
      } catch (error) {
        logger.error(`Error updating working memory via provider: ${error}`);
        return null;
      }
    }
    logger.debug('Working memory update not available in the memory provider instance or updateWorkingMemory not implemented.');
    return null;
  }

  /**
   * Create a new thread
   * @param threadData - Optional initial data for the thread
   * @returns The created thread object
   */
  async createThread(threadData?: Partial<import('./types').Thread>): Promise<import('./types').Thread> {
    logger.info(`Creating new thread`);
    const provider = await this.instance;
    if (!provider || typeof provider.createThread !== 'function') {
      logger.error('[Memory] Memory provider instance is not correctly initialized or does not support createThread.');
      throw new Error('Memory provider not available or createThread not implemented.');
    }
    const newThread = await provider.createThread(threadData || {});
    logger.debug(`Thread ${newThread.id} created successfully via provider`);
    return newThread;
  }

  /**
   * Get a thread by its ID
   * @param threadId - ID of the thread
   * @returns The thread object or null if not found
   */
  async getThread(threadId: string): Promise<import('./types').Thread | null> {
    logger.info(`Getting thread ${threadId}`);
    const provider = await this.instance;
    if (!provider || typeof provider.getThread !== 'function') {
      logger.error('[Memory] Memory provider instance is not correctly initialized or does not support getThread.');
      throw new Error('Memory provider not available or getThread not implemented.');
    }
    return provider.getThread(threadId);
  }

  /**
   * Update a thread
   * @param threadId - ID of the thread to update
   * @param updates - Partial thread data to update
   * @returns The updated thread object or null if not found
   */
  async updateThread(threadId: string, updates: Partial<import('./types').Thread>): Promise<import('./types').Thread | null> {
    logger.info(`Updating thread ${threadId}`);
    const provider = await this.instance;
    if (!provider || typeof provider.updateThread !== 'function') {
      logger.error('[Memory] Memory provider instance is not correctly initialized or does not support updateThread.');
      throw new Error('Memory provider not available or updateThread not implemented.');
    }
    return provider.updateThread(threadId, updates);
  }

  /**
   * Delete a thread
   * @param threadId - ID of the thread to delete
   */
  async deleteThread(threadId: string): Promise<void> {
    logger.info(`Deleting thread ${threadId}`);
    const provider = await this.instance;
    if (!provider || typeof provider.deleteThread !== 'function') {
      logger.error('[Memory] Memory provider instance is not correctly initialized or does not support deleteThread.');
      throw new Error('Memory provider not available or deleteThread not implemented.');
    }
    return provider.deleteThread(threadId);
  }
}
