import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Redis } from '@upstash/redis';
import { UpstashStore, UpstashVector } from '@mastra/upstash';
import { Memory } from './memory';
import {
  MessageRole,
  MessageType,
  Storage,
  SemanticRecallConfig,
  WorkingMemoryConfig
} from './types';
import { logger } from '../index';

// Define the Upstash memory configuration schema
export const UpstashMemoryConfigSchema = z.object({
  url: z.string(),
  token: z.string(),
  prefix: z.string().optional(),
  vectorUrl: z.string().optional(),
  vectorToken: z.string().optional(),
  vectorIndex: z.string().optional(),
});

// Export the type from the schema
export type UpstashMemoryConfig = z.infer<typeof UpstashMemoryConfigSchema>;

/**
 * UpstashMemory class for storing and retrieving conversation history in Upstash Redis
 */
export class UpstashMemory extends Memory {
  private url: string;
  private token: string;
  private prefix: string;
  private redis: Redis;
  private upstashStore: UpstashStore;
  private storage: Storage;

  // Vector search capabilities
  private upstashVector?: UpstashVector;
  private vectorIndex?: string;

  // Memory configuration
  private lastMessages: number;
  private semanticRecall?: SemanticRecallConfig;
  private workingMemory?: WorkingMemoryConfig;

  /**
   * Create a new UpstashMemory instance
   * @param config - Configuration for the Upstash memory
   */
  constructor(config: UpstashMemoryConfig) {
    // Set default memory configuration
    const memoryConfig = {
      provider: 'upstash' as const,
      options: config,
      lastMessages: 20, // Default value
      semanticRecall: {
        enabled: true,
        topK: 5,
        messageRange: 100,
      },
      workingMemory: {
        enabled: true,
        updateFrequency: 5,
      }
    };

    super(memoryConfig);

    // Validate configuration
    const validatedConfig = UpstashMemoryConfigSchema.parse(config);

    // Set basic properties
    this.url = validatedConfig.url;
    this.token = validatedConfig.token;
    this.prefix = validatedConfig.prefix || 'mastra:';
    this.lastMessages = memoryConfig.lastMessages;
    this.semanticRecall = memoryConfig.semanticRecall;
    this.workingMemory = memoryConfig.workingMemory;

    // Initialize Upstash Redis client
    logger.info(`Initializing Upstash Redis client with URL: ${this.url}`);
    this.redis = new Redis({
      url: this.url,
      token: this.token,
    });

    // Initialize Upstash Store from Mastra
    this.upstashStore = new UpstashStore({
      url: this.url,
      token: this.token,
    });

    // Initialize Upstash Vector if vector configuration is provided
    if (validatedConfig.vectorUrl && validatedConfig.vectorToken) {
      logger.info(`Initializing Upstash Vector with URL: ${validatedConfig.vectorUrl}`);
      this.upstashVector = new UpstashVector({
        url: validatedConfig.vectorUrl,
        token: validatedConfig.vectorToken,
      });
      this.vectorIndex = validatedConfig.vectorIndex || 'mastra-memory';
      logger.debug(`Using vector index: ${this.vectorIndex}`);
    } else {
      logger.warn('Vector search configuration not provided. Semantic search will not be available.');
    }

    // Create storage interface that uses both UpstashStore and direct Redis client
    // We use direct Redis client for all operations since UpstashStore doesn't have
    // direct key-value methods but is used for higher-level operations
    this.storage = {
      set: async (key: string, value: string) => {
        logger.debug(`[Upstash] Setting ${this.prefix}${key}`);
        // Use direct Redis client for key-value operations
        await this.redis.set(`${this.prefix}${key}`, value);
        return true;
      },
      get: async (key: string) => {
        logger.debug(`[Upstash] Getting ${this.prefix}${key}`);
        // Use direct Redis client for key-value operations
        const result = await this.redis.get(`${this.prefix}${key}`);
        return result as string | null;
      },
      lpush: async (key: string, value: string) => {
        logger.debug(`[Upstash] Pushing to ${this.prefix}${key}`);
        // Use direct Redis client for list operations
        await this.redis.lpush(`${this.prefix}${key}`, value);
        return true;
      },
      lrange: async (key: string, start: number, end: number) => {
        logger.debug(`[Upstash] Getting range ${start}-${end} from ${this.prefix}${key}`);
        // Use direct Redis client for list range operations
        const result = await this.redis.lrange(`${this.prefix}${key}`, start, end);
        return result as string[];
      }
    };
  }

  /**
   * Add a message to the memory
   * @param threadId - ID of the thread
   * @param content - Content of the message
   * @param role - Role of the message sender
   * @param type - Type of the message
   * @returns The created message
   */
  async addMessage(threadId: string, content: string, role: MessageRole, type: MessageType) {
    const message = {
      id: uuidv4(),
      thread_id: threadId,
      content,
      role,
      type,
      createdAt: new Date()
    };

    // Store message in database with prefix
    await this.storage.set(`${this.prefix}message:${message.id}`, JSON.stringify(message));

    // Add message to thread's message list with prefix
    await this.storage.lpush(`${this.prefix}thread:${threadId}:messages`, message.id);

    return message;
  }

  /**
   * Get messages from a thread
   * @param threadId - ID of the thread
   * @param limit - Maximum number of messages to retrieve
   * @param semanticQuery - Optional query for semantic search
   * @returns Array of messages
   */
  async getMessages(threadId: string, limit = 10, semanticQuery?: string): Promise<any[]> {
    logger.info(`Getting messages from thread ${threadId} with limit ${limit}`);

    // If semantic query is provided and vector search is available, use semantic search
    if (semanticQuery && this.upstashVector && this.semanticRecall?.enabled) {
      logger.info(`Performing semantic search with query: ${semanticQuery}`);
      return this.getMessagesWithSemanticSearch(threadId, semanticQuery, limit);
    }

    // Otherwise, get recent messages
    logger.debug(`Getting recent messages from thread ${threadId}`);

    // Get message IDs from thread with prefix
    const messageIds = await this.storage.lrange(`${this.prefix}thread:${threadId}:messages`, 0, limit - 1);
    logger.debug(`Found ${messageIds.length} message IDs for thread ${threadId}`);

    // Get message content for each ID with prefix
    const messages = [];
    for (const messageId of messageIds) {
      const messageJson = await this.storage.get(`${this.prefix}message:${messageId}`);
      if (messageJson) {
        messages.push(JSON.parse(messageJson));
      }
    }

    logger.debug(`Retrieved ${messages.length} messages for thread ${threadId}`);
    return messages;
  }

  /**
   * Get messages using semantic search
   * @param threadId - ID of the thread
   * @param query - Semantic search query
   * @param limit - Maximum number of messages to retrieve
   * @returns Array of messages sorted by relevance
   */
  private async getMessagesWithSemanticSearch(threadId: string, query: string, limit = 10): Promise<any[]> {
    if (!this.upstashVector || !this.vectorIndex) {
      logger.warn('Attempted semantic search without vector capabilities');
      return this.getMessages(threadId, limit);
    }

    try {
      // In a real implementation, you would get embeddings for the query
      // and use them for vector search
      logger.debug(`Processing query: ${query}`);

      // Search for similar messages in the vector store
      const topK = this.semanticRecall?.topK || 5;

      // Create a mock implementation for demonstration purposes
      // In a real implementation, you would use the actual UpstashVector API
      logger.info('Using mock semantic search implementation');

      // Get recent messages
      const recentMessages = await this.getMessages(threadId, 20);

      // Assign random relevance scores based on simple text matching
      // This is a very basic simulation of semantic search
      const mockMessages = recentMessages.map(msg => {
        // Calculate a simple relevance score based on word overlap
        const content = typeof msg.content === 'string' ? msg.content : '';
        const queryWords = query.toLowerCase().split(/\s+/);
        const contentWords = content.toLowerCase().split(/\s+/);

        // Count matching words
        let matchCount = 0;
        for (const word of queryWords) {
          if (contentWords.includes(word)) {
            matchCount++;
          }
        }

        // Calculate relevance (with some randomness for variety)
        const baseRelevance = queryWords.length > 0 ? matchCount / queryWords.length : 0;
        const relevance = baseRelevance + (Math.random() * 0.3); // Add some randomness

        return {
          ...msg,
          relevance: Math.min(1, relevance) // Ensure relevance is at most 1
        };
      });

      // Sort by relevance (highest first)
      mockMessages.sort((a: any, b: any) => b.relevance - a.relevance);

      // Take top results
      const topResults = mockMessages.slice(0, topK);

      // Get context around the most relevant messages if needed
      if (this.semanticRecall?.messageRange && this.semanticRecall.messageRange > 0) {
        return this.addContextToSemanticResults(threadId, topResults);
      }

      return topResults;
    } catch (error) {
      logger.error(`Error performing semantic search: ${error}`);
      // Fall back to regular message retrieval
      return this.getMessages(threadId, limit);
    }
  }

  /**
   * Add context messages around semantic search results
   * @param threadId - ID of the thread
   * @param semanticResults - Messages found through semantic search
   * @returns Array of messages with context
   */
  private async addContextToSemanticResults(threadId: string, semanticResults: any[]) {
    if (semanticResults.length === 0) {
      return [];
    }

    // Get all message IDs for the thread
    const allMessageIds = await this.storage.lrange(`${this.prefix}thread:${threadId}:messages`, 0, -1);

    // Create a map of message IDs to their positions in the thread
    const messagePositions = new Map();
    allMessageIds.forEach((id, index) => {
      messagePositions.set(id, index);
    });

    // Get the context range
    const contextRange = Math.floor((this.semanticRecall?.messageRange || 2) / 2);

    // Create a set to track which messages we've already included
    const includedMessageIds = new Set();
    const resultWithContext = [];

    // For each semantic result, add context messages
    for (const message of semanticResults) {
      const messageId = message.id;

      // Skip if we've already included this message
      if (includedMessageIds.has(messageId)) {
        continue;
      }

      // Get the position of this message in the thread
      const position = messagePositions.get(messageId);
      if (position === undefined) {
        continue;
      }

      // Calculate the range of messages to include
      const startPos = Math.max(0, position - contextRange);
      const endPos = Math.min(allMessageIds.length - 1, position + contextRange);

      // Get the message IDs in the context range
      const contextMessageIds = allMessageIds.slice(startPos, endPos + 1);

      // Get the full message content for each context message
      for (const contextId of contextMessageIds) {
        // Skip if we've already included this message
        if (includedMessageIds.has(contextId)) {
          continue;
        }

        const messageJson = await this.storage.get(`${this.prefix}message:${contextId}`);
        if (messageJson) {
          const contextMessage = JSON.parse(messageJson);
          // Add to results and mark as included
          resultWithContext.push(contextMessage);
          includedMessageIds.add(contextId);
        }
      }
    }

    // Sort messages by their position in the thread
    resultWithContext.sort((a, b) => {
      const posA = messagePositions.get(a.id) || 0;
      const posB = messagePositions.get(b.id) || 0;
      return posA - posB;
    });

    return resultWithContext;
  }

  /**
   * In a real implementation, you would add methods for:
   * 1. Generating embeddings for messages
   * 2. Storing embeddings in the vector store
   * 3. Performing semantic search with proper vector similarity
   *
   * For now, we're using a simplified mock implementation
   */

  /**
   * Create a new thread
   * @returns The created thread ID
   */
  async createThread() {
    const threadId = uuidv4();
    await this.storage.set(`${this.prefix}thread:${threadId}:created`, new Date().toISOString());
    return threadId;
  }

  /**
   * Save thread metadata using UpstashStore
   * This method demonstrates how to use the UpstashStore for higher-level operations
   * @param threadId - ID of the thread
   * @param resourceId - Resource ID (user ID or other identifier)
   * @param metadata - Metadata to save
   */
  async saveThreadMetadata(threadId: string, resourceId: string, metadata: Record<string, any>) {
    logger.info(`Saving metadata for thread ${threadId}`);

    // Create a thread object in the format expected by UpstashStore
    const now = new Date();
    const thread = {
      id: threadId,
      resourceId,
      createdAt: now,
      updatedAt: now,
      metadata
    };

    try {
      // Use the UpstashStore to save the thread
      // We're using a try-catch block because the UpstashStore might have additional requirements
      // that we're not aware of from our limited inspection of the code
      await this.upstashStore.saveThread({ thread });
      logger.debug(`Metadata saved for thread ${threadId}`);
      return thread;
    } catch (error) {
      // If the UpstashStore method fails, fall back to using the Redis client directly
      logger.warn(`Failed to save thread metadata using UpstashStore: ${error}. Falling back to direct Redis.`);
      const threadKey = `${this.prefix}thread:${threadId}:metadata`;
      await this.redis.set(threadKey, JSON.stringify(metadata));
      logger.debug(`Metadata saved for thread ${threadId} using direct Redis`);
      return thread;
    }
  }

  /**
   * Get or create working memory for a thread
   * Working memory stores persistent information across conversations
   * @param threadId - ID of the thread
   * @returns Working memory object
   */
  async getWorkingMemory(threadId: string): Promise<Record<string, any>> {
    if (!this.workingMemory?.enabled) {
      logger.debug('Working memory is disabled');
      return {};
    }

    logger.info(`Getting working memory for thread ${threadId}`);

    try {
      // Try to get existing working memory
      const workingMemoryKey = `${this.prefix}thread:${threadId}:working_memory`;
      const workingMemoryJson = await this.redis.get(workingMemoryKey);

      if (workingMemoryJson) {
        logger.debug(`Found existing working memory for thread ${threadId}`);
        return JSON.parse(workingMemoryJson as string);
      }

      // If no working memory exists, create a new one with default template
      logger.debug(`Creating new working memory for thread ${threadId}`);
      const defaultWorkingMemory = this.createDefaultWorkingMemory();

      // Save the new working memory
      await this.redis.set(workingMemoryKey, JSON.stringify(defaultWorkingMemory));

      return defaultWorkingMemory;
    } catch (error) {
      logger.error(`Error getting working memory: ${error}`);
      return {};
    }
  }

  /**
   * Update working memory for a thread
   * @param threadId - ID of the thread
   * @param workingMemory - Working memory object to save
   * @returns Updated working memory object
   */
  async updateWorkingMemory(threadId: string, workingMemory: Record<string, any>): Promise<Record<string, any>> {
    if (!this.workingMemory?.enabled) {
      logger.debug('Working memory is disabled');
      return workingMemory;
    }

    logger.info(`Updating working memory for thread ${threadId}`);

    try {
      // Save the working memory
      const workingMemoryKey = `${this.prefix}thread:${threadId}:working_memory`;
      await this.redis.set(workingMemoryKey, JSON.stringify(workingMemory));
      logger.debug(`Working memory updated for thread ${threadId}`);

      return workingMemory;
    } catch (error) {
      logger.error(`Error updating working memory: ${error}`);
      return workingMemory;
    }
  }

  /**
   * Create default working memory based on template
   * @returns Default working memory object
   */
  private createDefaultWorkingMemory(): Record<string, any> {
    // Use template if provided, otherwise use a basic structure
    if (this.workingMemory?.template) {
      try {
        return JSON.parse(this.workingMemory.template);
      } catch (error) {
        logger.error(`Error parsing working memory template: ${error}`);
      }
    }

    // Default basic structure
    return {
      user: {
        preferences: {},
        context: {}
      },
      conversation: {
        topics: [],
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Get thread metadata using UpstashStore
   * This method demonstrates how to use the UpstashStore for higher-level operations
   * @param threadId - ID of the thread
   * @returns Thread metadata or null if not found
   */
  async getThreadMetadata(threadId: string) {
    logger.info(`Getting metadata for thread ${threadId}`);

    try {
      // Use the UpstashStore to get the thread
      const thread = await this.upstashStore.getThreadById({ threadId });

      if (thread) {
        logger.debug(`Metadata retrieved for thread ${threadId}`);
        return thread.metadata || {};
      }

      logger.debug(`No thread found with ID ${threadId}`);
      return null;
    } catch (error) {
      // If the UpstashStore method fails, fall back to using the Redis client directly
      logger.warn(`Failed to get thread metadata using UpstashStore: ${error}. Falling back to direct Redis.`);

      const threadKey = `${this.prefix}thread:${threadId}:metadata`;
      const metadata = await this.redis.get(threadKey);

      if (metadata) {
        try {
          const parsedMetadata = JSON.parse(metadata as string);
          logger.debug(`Metadata retrieved for thread ${threadId} using direct Redis`);
          return parsedMetadata;
        } catch (parseError) {
          logger.error(`Failed to parse thread metadata: ${parseError}`);
          return null;
        }
      }

      logger.debug(`No metadata found for thread ${threadId}`);
      return null;
    }
  }
}
