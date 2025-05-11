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
  WorkingMemoryConfig,
  MemoryProcessor,
  Message
} from './types';
import { logger } from '../index';
import { DEFAULT_EMBEDDING_DIMENSIONS, DEFAULT_MEMORY, DEFAULT_VECTOR_SEARCH } from '../constants';

// Import for embeddings
let pipeline: any;
let embeddingModel: any;

// Lazy load the transformers package to avoid issues in environments where it's not available
async function getEmbeddingPipeline() {
  if (!pipeline) {
    try {
      // Dynamic import to avoid issues in environments where the package is not available
      const { pipeline: transformersPipeline } = await import('@xenova/transformers');
      pipeline = transformersPipeline;
      logger.info('Successfully loaded @xenova/transformers');
    } catch (error) {
      logger.error(`Failed to load @xenova/transformers: ${error}`);
      return null;
    }
  }

  if (!embeddingModel) {
    try {
      // Initialize the embedding model
      embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      logger.info('Successfully loaded embedding model: Xenova/all-MiniLM-L6-v2');
    } catch (error) {
      logger.error(`Failed to load embedding model: ${error}`);
      return null;
    }
  }

  return embeddingModel;
}

// Define the Upstash memory configuration schema
export const UpstashMemoryConfigSchema = z.object({
  url: z.string(),
  token: z.string(),
  prefix: z.string().optional(),
  vectorUrl: z.string().optional(),
  vectorToken: z.string().optional(),
  vectorIndex: z.string().optional(),
  dimensions: z.number().optional(),
  metric: z.enum(['cosine', 'euclidean', 'dotproduct']).optional(),
  processors: z.array(z.any()).optional(),
  workingMemoryTemplate: z.string().optional(),
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
  protected semanticRecall?: SemanticRecallConfig;
  protected workingMemory?: WorkingMemoryConfig;
  protected processors: MemoryProcessor[] = [];

  /**
   * Create a new UpstashMemory instance
   * @param config - Configuration for the Upstash memory
   */
  constructor(config: UpstashMemoryConfig) {
    // Get default working memory template
    const defaultTemplate = `# User Profile
## Personal Information
- Name:
- Location:
- Timezone:

## Preferences
- Communication Style:
- Interests:
- Goals:

## Session Context
- Current Task:
- Progress:
- Next Steps:

## Notes
- Important Details:
- Follow-up Items:
`;

    // Set default memory configuration with enhanced options
    const memoryConfig = {
      provider: 'upstash' as const,
      options: config,
      lastMessages: DEFAULT_MEMORY.LAST_MESSAGES,
      semanticRecall: {
        enabled: true,
        topK: DEFAULT_VECTOR_SEARCH.TOP_K,
        messageRange: DEFAULT_MEMORY.SEMANTIC_RECALL_MESSAGE_RANGE,
        threshold: 0.7,
      },
      workingMemory: {
        enabled: true,
        template: config.workingMemoryTemplate || defaultTemplate,
        updateFrequency: 5,
      },
      processors: config.processors || []
    };

    super(memoryConfig);

    // Store processors for later use
    this.processors = config.processors || [];

    // Validate configuration
    const validatedConfig = UpstashMemoryConfigSchema.parse(config);

    // Set basic properties
    this.url = validatedConfig.url;
    this.token = validatedConfig.token;
    this.prefix = validatedConfig.prefix || DEFAULT_MEMORY.PREFIX;

    // Initialize Upstash Redis client for operations not covered by UpstashStore
    logger.info(`Initializing Upstash Redis client with URL: ${this.url}`);
    this.redis = new Redis({
      url: this.url,
      token: this.token,
      automaticDeserialization: false, // We'll handle serialization ourselves
    });

    // Initialize Upstash Store from Mastra package
    logger.info(`Initializing Upstash Store from @mastra/upstash`);
    this.upstashStore = new UpstashStore({
      url: this.url,
      token: this.token,
    });

    // Initialize Upstash Vector for semantic search capabilities
    // If specific vector credentials are provided, use them, otherwise use the same as Redis
    const vectorUrl = validatedConfig.vectorUrl || this.url;
    const vectorToken = validatedConfig.vectorToken || this.token;

    if (vectorUrl && vectorToken) {
      logger.info(`Initializing Upstash Vector with URL: ${vectorUrl}`);
      this.upstashVector = new UpstashVector({
        url: vectorUrl,
        token: vectorToken,
      });
      this.vectorIndex = validatedConfig.vectorIndex || DEFAULT_MEMORY.NAMESPACE;
      logger.debug(`Using vector index: ${this.vectorIndex}`);

      // Create the vector index if it doesn't exist
      const dimensions = validatedConfig.dimensions || DEFAULT_EMBEDDING_DIMENSIONS.XENOVA;
      const metric = validatedConfig.metric || 'cosine';

      this.createIndex(this.vectorIndex)
        .then(success => {
          if (success) {
            logger.info(`Vector index ${this.vectorIndex} is ready for use with ${dimensions} dimensions and ${metric} metric`);
          } else {
            logger.warn(`Failed to create vector index ${this.vectorIndex}, semantic search may not work properly`);
          }
        })
        .catch(error => {
          logger.error(`Error creating vector index: ${error}`);
        });
    } else {
      logger.warn('Vector search configuration not provided. Semantic search will not be available.');
    }

    // Create storage interface that uses both UpstashStore and direct Redis client
    // We use direct Redis client for operations not covered by UpstashStore
    this.storage = {
      set: async (key: string, value: string) => {
        logger.debug(`[Upstash] Setting ${key}`);
        try {
          // Try to use UpstashStore if possible
          if (key.startsWith('message:')) {
            // For message storage, use direct Redis since UpstashStore might have different API
            await this.redis.set(`${this.prefix}${key}`, value);
          } else if (key.startsWith('thread:') && key.endsWith(':metadata')) {
            // For thread metadata, use direct Redis
            await this.redis.set(`${this.prefix}${key}`, value);

            // Also try to update the thread in UpstashStore if possible
            try {
              const metadata = JSON.parse(value);
              const threadId = key.split(':')[1];
              // Create a minimal thread object with required fields
              const thread = {
                id: threadId,
                resourceId: metadata.resourceId || 'default',
                createdAt: new Date(),
                updatedAt: new Date(),
                metadata
              };

              // Try to save the thread using UpstashStore
              if (typeof this.upstashStore.saveThread === 'function') {
                await this.upstashStore.saveThread({ thread });
                logger.debug(`Thread ${threadId} saved to UpstashStore`);
              }
            } catch (threadError) {
              logger.warn(`Failed to save thread to UpstashStore: ${threadError}`);
              // Continue with Redis storage only
            }
          } else {
            // For all other keys, use direct Redis
            await this.redis.set(`${this.prefix}${key}`, value);
          }
          return true;
        } catch (error) {
          logger.error(`Error in storage.set: ${error}`);
          // Fall back to direct Redis as a last resort
          try {
            await this.redis.set(`${this.prefix}${key}`, value);
            return true;
          } catch (fallbackError) {
            logger.error(`Fallback Redis set also failed: ${fallbackError}`);
            return false;
          }
        }
      },
      get: async (key: string) => {
        logger.debug(`[Upstash] Getting ${key}`);
        try {
          // For all keys, use direct Redis for consistency
          const result = await this.redis.get(`${this.prefix}${key}`);
          return result as string | null;
        } catch (error) {
          logger.error(`Error in storage.get: ${error}`);
          return null;
        }
      },
      lpush: async (key: string, value: string) => {
        logger.debug(`[Upstash] Pushing to ${key}`);
        try {
          // Use direct Redis client for list operations
          await this.redis.lpush(`${this.prefix}${key}`, value);
          return true;
        } catch (error) {
          logger.error(`Error in storage.lpush: ${error}`);
          return false;
        }
      },
      lrange: async (key: string, start: number, end: number) => {
        logger.debug(`[Upstash] Getting range ${start}-${end} from ${key}`);
        try {
          // Use direct Redis client for list range operations
          const result = await this.redis.lrange(`${this.prefix}${key}`, start, end);
          return result as string[];
        } catch (error) {
          logger.error(`Error in storage.lrange: ${error}`);
          return [];
        }
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

    // Store embedding for the message if vector search is enabled
    if (this.upstashVector && this.vectorIndex && this.semanticRecall?.enabled) {
      try {
        // Generate embedding for the message
        const embedding = await this.getEmbedding(content);
        if (embedding) {
          logger.debug(`Generated embedding for message ${message.id} with ${embedding.length} dimensions`);

          // Create metadata for the vector
          const metadata = {
            thread_id: threadId,
            message_id: message.id,
            content_preview: content.substring(0, 100),
            role: role,
            type: type,
            timestamp: new Date().toISOString()
          };

          // Try different approaches to store the embedding
          let success = false;

          // Approach 1: Using index method and upsert
          if (!success && typeof (this.upstashVector as any).index === 'function') {
            try {
              const index = (this.upstashVector as any).index(this.vectorIndex);
              if (typeof index.upsert === 'function') {
                await index.upsert([{
                  id: message.id,
                  vector: embedding,
                  metadata
                }]);
                logger.debug(`Successfully stored embedding using index.upsert method`);
                success = true;
              }
            } catch (error) {
              logger.debug(`Error using index.upsert: ${error}`);
            }
          }

          // Approach 2: Using direct upsert method
          if (!success && typeof (this.upstashVector as any).upsert === 'function') {
            try {
              await (this.upstashVector as any).upsert([{
                id: message.id,
                vector: embedding,
                metadata
              }], this.vectorIndex);
              logger.debug(`Successfully stored embedding using direct upsert method`);
              success = true;
            } catch (error) {
              logger.debug(`Error using direct upsert: ${error}`);
            }
          }

          // Approach 3: Using add method
          if (!success && typeof (this.upstashVector as any).add === 'function') {
            try {
              await (this.upstashVector as any).add(
                this.vectorIndex,
                message.id,
                embedding,
                metadata
              );
              logger.debug(`Successfully stored embedding using add method`);
              success = true;
            } catch (error) {
              logger.debug(`Error using add method: ${error}`);
            }
          }

          if (success) {
            logger.info(`Successfully stored embedding for message ${message.id} in vector store`);
          } else {
            logger.warn(`Failed to store embedding for message ${message.id} - no compatible method found`);
          }
        }
      } catch (error) {
        // Log the error but don't fail the message creation
        logger.error(`Error storing embedding for message: ${error}`);
      }
    }

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
      logger.debug(`Processing semantic query: ${query}`);

      // Preprocess and enhance the query for better search results
      const enhancedQuery = this.enhanceSearchQuery(query);
      logger.debug(`Enhanced query: ${enhancedQuery}`);

      // Get the embeddings for the query
      const queryEmbedding = await this.getEmbedding(enhancedQuery);
      if (!queryEmbedding) {
        logger.warn('Failed to generate embedding for query');
        return this.getMessages(threadId, limit);
      }

      // Search for similar messages in the vector store
      const topK = this.semanticRecall?.topK || 5;
      const threshold = this.semanticRecall?.threshold || 0.7;

      try {
        // Use the Upstash Vector API to search for similar messages
        let searchResults = await this.performVectorSearch(threadId, queryEmbedding, topK);

        logger.debug(`Found ${searchResults.length} semantic search results`);

        if (searchResults.length === 0) {
          // Try with a more relaxed search if no results found
          logger.debug('No results found with initial search, trying with relaxed parameters');
          searchResults = await this.performVectorSearch(threadId, queryEmbedding, topK * 2, threshold * 0.8);

          if (searchResults.length === 0) {
            // Fall back to regular message retrieval if still no results
            logger.debug('No results found with relaxed search, falling back to regular message retrieval');
            return this.getMessages(threadId, limit);
          }
        }

        // Extract message IDs from search results
        const messageIds = searchResults.map((result: any) => result.id);

        // Get the full message content for each result
        const messages = [];
        for (const messageId of messageIds) {
          const messageJson = await this.storage.get(`${this.prefix}message:${messageId}`);
          if (messageJson) {
            const message = JSON.parse(messageJson);
            // Add relevance score from search results
            const resultItem = searchResults.find((r: any) => r.id === messageId);
            if (resultItem) {
              message.relevance = resultItem.score;

              // Add semantic match information for debugging/transparency
              message._semanticMatch = {
                query: enhancedQuery,
                score: resultItem.score,
                threshold: threshold,
                matchedAt: new Date().toISOString()
              };
            }
            messages.push(message);
          }
        }

        // Sort messages by relevance score (highest first)
        messages.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));

        // Take only the top results if we have more than the limit
        const topMessages = messages.slice(0, limit);

        // Get context around the most relevant messages if needed
        if (this.semanticRecall?.messageRange && this.semanticRecall.messageRange > 0) {
          const messagesWithContext = await this.addContextToSemanticResults(threadId, topMessages);
          // Apply processors to the messages
          return this.applyProcessors(messagesWithContext);
        }

        // Apply processors to the messages
        return this.applyProcessors(topMessages);
      } catch (vectorError) {
        logger.error(`Error querying vector store: ${vectorError}`);
        return this.fallbackSemanticSearch(threadId, query, limit);
      }
    } catch (error) {
      logger.error(`Error performing semantic search: ${error}`);
      // Fall back to regular message retrieval
      return this.getMessages(threadId, limit);
    }
  }

  /**
   * Perform vector search using multiple approaches
   * @param threadId - ID of the thread
   * @param queryEmbedding - Query embedding vector
   * @param topK - Maximum number of results to return
   * @param threshold - Optional similarity threshold
   * @returns Array of search results
   */
  private async performVectorSearch(
    threadId: string,
    queryEmbedding: number[],
    topK: number,
    threshold?: number
  ): Promise<any[]> {
    let searchResults = [];
    let success = false;

    // Try different approaches to query the vector store
    const approaches = [
      this.vectorSearchApproach1.bind(this),
      this.vectorSearchApproach2.bind(this),
      this.vectorSearchApproach3.bind(this),
      this.vectorSearchApproach4.bind(this)
    ];

    // Try each approach until one succeeds
    for (const approach of approaches) {
      if (success) break;

      try {
        const result = await approach(threadId, queryEmbedding, topK, threshold);
        if (result && result.length > 0) {
          searchResults = result;
          success = true;
        }
      } catch (error) {
        logger.debug(`Vector search approach failed: ${error}`);
        // Continue to the next approach
      }
    }

    if (!success) {
      logger.warn(`All vector query approaches failed.`);
      throw new Error('No compatible vector query method found');
    }

    return searchResults;
  }

  /**
   * Vector search approach 1: Using index method and query
   */
  private async vectorSearchApproach1(
    threadId: string,
    queryEmbedding: number[],
    topK: number,
    threshold?: number
  ): Promise<any[]> {
    if (typeof (this.upstashVector as any).index !== 'function') {
      return [];
    }

    const index = (this.upstashVector as any).index(this.vectorIndex);
    if (typeof index.query !== 'function') {
      return [];
    }

    const queryParams: any = {
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: { thread_id: threadId }
    };

    // Add threshold if provided
    if (threshold !== undefined) {
      queryParams.threshold = threshold;
    }

    const result = await index.query(queryParams);

    if (result && Array.isArray(result.matches)) {
      logger.debug(`Successfully queried vector store using index.query method`);
      return result.matches;
    }

    return [];
  }

  /**
   * Vector search approach 2: Using direct query method with object parameter
   */
  private async vectorSearchApproach2(
    threadId: string,
    queryEmbedding: number[],
    topK: number,
    threshold?: number
  ): Promise<any[]> {
    if (typeof (this.upstashVector as any).query !== 'function') {
      return [];
    }

    const queryParams: any = {
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: { thread_id: threadId },
      namespace: this.vectorIndex
    };

    // Add threshold if provided
    if (threshold !== undefined) {
      queryParams.threshold = threshold;
    }

    const result = await (this.upstashVector as any).query(queryParams);

    // Handle different result formats
    if (result) {
      if (Array.isArray(result)) {
        logger.debug(`Successfully queried vector store using direct query with object parameter (array result)`);
        return result;
      } else if (Array.isArray(result.matches)) {
        logger.debug(`Successfully queried vector store using direct query with object parameter (matches result)`);
        return result.matches;
      } else if (Array.isArray(result.results)) {
        logger.debug(`Successfully queried vector store using direct query with object parameter (results property)`);
        return result.results;
      }
    }

    return [];
  }

  /**
   * Vector search approach 3: Using direct query method with separate parameters
   */
  private async vectorSearchApproach3(
    _threadId: string, // Unused but kept for consistent interface
    queryEmbedding: number[],
    topK: number,
    threshold?: number
  ): Promise<any[]> {
    if (typeof (this.upstashVector as any).query !== 'function') {
      return [];
    }

    // Create query parameters
    const queryParams: any[] = [this.vectorIndex, queryEmbedding, topK];

    // Add threshold if provided
    if (threshold !== undefined) {
      const options: any = { threshold };
      queryParams.push(options);
    }

    const result = await (this.upstashVector as any).query(...queryParams);

    // Handle different result formats
    if (result) {
      if (Array.isArray(result)) {
        logger.debug(`Successfully queried vector store using direct query with separate parameters (array result)`);
        return result;
      } else if (Array.isArray(result.matches)) {
        logger.debug(`Successfully queried vector store using direct query with separate parameters (matches result)`);
        return result.matches;
      } else if (Array.isArray(result.results)) {
        logger.debug(`Successfully queried vector store using direct query with separate parameters (results property)`);
        return result.results;
      }
    }

    return [];
  }

  /**
   * Vector search approach 4: Using search method
   */
  private async vectorSearchApproach4(
    _threadId: string, // Unused but kept for consistent interface
    queryEmbedding: number[],
    topK: number,
    threshold?: number
  ): Promise<any[]> {
    if (typeof (this.upstashVector as any).search !== 'function') {
      return [];
    }

    // Create search parameters
    const searchParams: any[] = [this.vectorIndex, queryEmbedding, topK];

    // Add threshold if provided
    if (threshold !== undefined) {
      const options: any = { threshold };
      searchParams.push(options);
    }

    const result = await (this.upstashVector as any).search(...searchParams);

    // Handle different result formats
    if (result) {
      if (Array.isArray(result)) {
        logger.debug(`Successfully queried vector store using search method (array result)`);
        return result;
      } else if (Array.isArray(result.matches)) {
        logger.debug(`Successfully queried vector store using search method (matches result)`);
        return result.matches;
      } else if (Array.isArray(result.results)) {
        logger.debug(`Successfully queried vector store using search method (results property)`);
        return result.results;
      }
    }

    return [];
  }

  /**
   * Enhance search query for better results
   * @param query - Original search query
   * @returns Enhanced search query
   */
  private enhanceSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    // Remove common filler words
    const fillerWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'about'];
    let enhancedQuery = query.split(' ')
      .filter(word => !fillerWords.includes(word.toLowerCase()))
      .join(' ');

    // If query is too short after filtering, use original
    if (enhancedQuery.length < 3) {
      enhancedQuery = query;
    }

    return enhancedQuery;
  }

  /**
   * Fallback semantic search implementation when vector search fails
   * @param threadId - ID of the thread
   * @param query - Search query
   * @param limit - Maximum number of results to return
   * @returns Array of messages sorted by relevance
   */
  private async fallbackSemanticSearch(threadId: string, query: string, limit: number): Promise<any[]> {
    logger.info('Falling back to basic semantic search implementation');

    try {
      // Get recent messages
      const recentMessages = await this.getMessages(threadId, Math.max(20, limit * 2));

      if (!recentMessages || recentMessages.length === 0) {
        logger.warn(`No messages found for thread ${threadId} in fallback search`);
        return [];
      }

      // Assign relevance scores based on simple text matching
      const scoredMessages = recentMessages.map(msg => {
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

        // Calculate relevance
        const baseRelevance = queryWords.length > 0 ? matchCount / queryWords.length : 0;

        // Boost score for exact phrase matches
        const exactPhraseBoost = content.toLowerCase().includes(query.toLowerCase()) ? 0.3 : 0;

        // Boost score for recent messages
        const recencyBoost = 0.1; // Small boost for recency

        // Calculate final score
        const relevance = Math.min(1, baseRelevance + exactPhraseBoost + recencyBoost);

        return {
          ...msg,
          relevance,
          _semanticMatch: {
            query,
            score: relevance,
            method: 'fallback',
            matchedAt: new Date().toISOString()
          }
        };
      });

      // Sort by relevance (highest first)
      scoredMessages.sort((a: any, b: any) => b.relevance - a.relevance);

      // Take top results
      const topK = this.semanticRecall?.topK || 5;
      const topResults = scoredMessages.slice(0, topK);

      // Get context around the most relevant messages if needed
      if (this.semanticRecall?.messageRange && this.semanticRecall.messageRange > 0) {
        try {
          const resultsWithContext = await this.addContextToSemanticResults(threadId, topResults);
          // Apply processors to the messages
          return this.applyProcessors(resultsWithContext);
        } catch (contextError) {
          logger.error(`Error adding context to semantic results: ${contextError}`);
          // Continue with just the top results
        }
      }

      // Apply processors to the messages
      return this.applyProcessors(topResults);
    } catch (error) {
      logger.error(`Error in fallback semantic search: ${error}`);
      return [];
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
   * Generate an embedding for a text string
   * @param text - Text to generate embedding for
   * @returns Embedding vector or null if generation fails
   */
  private async getEmbedding(text: string): Promise<number[] | null> {
    try {
      logger.debug(`Generating embedding for text: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);

      // Preprocess text for better embedding quality
      const preprocessedText = this.preprocessTextForEmbedding(text);

      // Try multiple embedding approaches in order of preference

      // Approach 1: Use Xenova transformers model (preferred)
      try {
        const model = await getEmbeddingPipeline();

        if (model) {
          // Generate embeddings using the model
          const result = await model(preprocessedText, {
            pooling: 'mean',
            normalize: true,
            truncation: true,
            max_length: 512 // Prevent token limit issues
          });

          // Extract the embedding from the result
          const embedding = Array.from(result.data) as number[];

          logger.debug(`Generated embedding with ${embedding.length} dimensions using Xenova model`);
          return embedding;
        }
      } catch (modelError) {
        logger.warn(`Error using Xenova model for embeddings: ${modelError}. Trying alternative approaches.`);
      }

      // Approach 2: Try to use a cached embedding if available
      // This would be implemented in a production system

      // Approach 3: Fallback to deterministic embeddings based on text hash
      // This is better than random embeddings as it will produce the same vector for the same text
      try {
        logger.info('Using deterministic hash-based embeddings as fallback');

        const dimensions = 384; // Match MiniLM model dimensions
        const embedding = this.generateDeterministicEmbedding(preprocessedText, dimensions);

        logger.debug(`Generated deterministic embedding with ${dimensions} dimensions`);
        return embedding;
      } catch (hashError) {
        logger.warn(`Error generating deterministic embeddings: ${hashError}. Using random embeddings.`);
      }

      // Approach 4: Last resort - random embeddings
      logger.info('Using random embeddings as last resort');
      const dimensions = 384;
      const embedding = Array.from({ length: dimensions }, () => Math.random() * 2 - 1);

      // Normalize the vector to unit length (cosine similarity)
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      const normalizedEmbedding = embedding.map(val => val / magnitude);

      logger.debug(`Generated random embedding with ${dimensions} dimensions`);
      return normalizedEmbedding;
    } catch (error) {
      logger.error(`Error generating embedding: ${error}`);
      return null;
    }
  }

  /**
   * Preprocess text before generating embeddings
   * @param text - Text to preprocess
   * @returns Preprocessed text
   */
  private preprocessTextForEmbedding(text: string): string {
    // Convert to string if not already
    if (typeof text !== 'string') {
      try {
        text = JSON.stringify(text);
      } catch (e) {
        text = String(text);
      }
    }

    // Normalize whitespace
    let processed = text.replace(/\s+/g, ' ').trim();

    // Truncate if too long (most embedding models have token limits)
    const maxChars = 10000; // Approximate character limit
    if (processed.length > maxChars) {
      processed = processed.substring(0, maxChars);
      logger.debug(`Truncated text for embedding from ${text.length} to ${maxChars} characters`);
    }

    return processed;
  }

  /**
   * Generate a deterministic embedding based on text hash
   * @param text - Text to generate embedding for
   * @param dimensions - Number of dimensions for the embedding
   * @returns Deterministic embedding vector
   */
  private generateDeterministicEmbedding(text: string, dimensions: number): number[] {
    // Simple string hash function
    const hashString = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash;
    };

    // Generate a seeded random number
    const seededRandom = (seed: number): () => number => {
      let state = seed;
      return () => {
        state = (state * 9301 + 49297) % 233280;
        return state / 233280;
      };
    };

    // Generate embedding using text hash as seed
    const seed = hashString(text);
    const random = seededRandom(seed);

    // Generate vector components
    const embedding = Array.from({ length: dimensions }, () => random() * 2 - 1);

    // Normalize to unit length
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Create a vector index if it doesn't exist
   * @param indexName - Name of the index to create
   * @returns True if successful, false otherwise
   */
  private async createIndex(indexName: string): Promise<boolean> {
    if (!this.upstashVector) {
      logger.warn('Vector capabilities not available, skipping index creation');
      return false;
    }

    try {
      logger.info(`Creating vector index: ${indexName}`);

      // Use constants for vector dimensions
      const dimensions = DEFAULT_EMBEDDING_DIMENSIONS.XENOVA || 384;

      // Try to create the index using the Upstash Vector API from @mastra/upstash
      try {
        // Check if the index exists using a safe approach with type assertion
        let indexExists = false;

        try {
          // Try the most common method name first
          if (typeof (this.upstashVector as any).indexExists === 'function') {
            indexExists = await (this.upstashVector as any).indexExists(indexName);
          } else if (typeof (this.upstashVector as any).exists === 'function') {
            indexExists = await (this.upstashVector as any).exists(indexName);
          } else {
            // If no exists method is found, assume we need to create it
            indexExists = false;
          }
        } catch (checkError) {
          logger.debug(`Error checking if index exists: ${checkError}. Assuming it doesn't exist.`);
          indexExists = false;
        }

        if (!indexExists) {
          // Create the index with appropriate dimensions for the embedding model
          logger.info(`Creating vector index ${indexName} with ${dimensions} dimensions`);

          // Try different method names that might be used in the implementation
          if (typeof (this.upstashVector as any).createIndex === 'function') {
            await (this.upstashVector as any).createIndex(indexName, {
              dimensions,
              metric: 'cosine'
            });
          } else if (typeof (this.upstashVector as any).create === 'function') {
            await (this.upstashVector as any).create(indexName, {
              dimensions,
              metric: 'cosine'
            });
          } else {
            // If no create method is found, try to use the index method which might create it
            if (typeof (this.upstashVector as any).index === 'function') {
              await (this.upstashVector as any).index(indexName, {
                dimensions,
                metric: 'cosine'
              });
            } else {
              throw new Error('No method found to create vector index');
            }
          }

          logger.info(`Successfully created vector index: ${indexName}`);
        } else {
          logger.info(`Vector index ${indexName} already exists`);
        }

        return true;
      } catch (error) {
        logger.error(`Error creating vector index: ${error}`);
        return false;
      }
    } catch (error) {
      logger.error(`Error creating vector index: ${error}`);
      return false;
    }
  }



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
   * Create default working memory based on template
   * @returns Default working memory object
   */
  private createDefaultWorkingMemory(): Record<string, any> {
    // Use template if provided, otherwise use a basic structure
    if (this.workingMemory?.template) {
      try {
        // For JSON templates
        if (this.workingMemory.template.trim().startsWith('{')) {
          return JSON.parse(this.workingMemory.template);
        }

        // For Markdown templates, create a structured object
        return {
          content: this.workingMemory.template,
          lastUpdated: new Date().toISOString()
        };
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

  /**
   * Get thread by ID
   * @param threadId - ID of the thread
   * @returns Thread object or null if not found
   */
  async getThreadById(threadId: string) {
    logger.info(`Getting thread with ID ${threadId}`);

    try {
      // Use the UpstashStore to get the thread
      const thread = await this.upstashStore.getThreadById({ threadId });

      if (thread) {
        logger.debug(`Thread retrieved with ID ${threadId}`);
        return thread;
      }

      // If the thread doesn't exist in the UpstashStore, check if it exists in Redis
      const createdAt = await this.storage.get(`${this.prefix}thread:${threadId}:created`);
      if (createdAt) {
        // Thread exists in Redis but not in UpstashStore
        // Create a minimal thread object
        const threadObj = {
          id: threadId,
          createdAt: new Date(createdAt),
          metadata: await this.getThreadMetadata(threadId) || {}
        };
        logger.debug(`Thread ${threadId} found in Redis but not in UpstashStore`);
        return threadObj;
      }

      logger.debug(`No thread found with ID ${threadId}`);
      return null;
    } catch (error) {
      logger.error(`Error getting thread by ID: ${error}`);
      return null;
    }
  }

  /**
   * Get threads by resource ID
   * @param resourceId - Resource ID to search for
   * @returns Array of thread objects
   */
  async getThreadsByResourceId(resourceId: string) {
    logger.info(`Getting threads for resource ${resourceId}`);

    try {
      // Use the UpstashStore to get threads by resource ID
      const threads = await this.upstashStore.getThreadsByResourceId({ resourceId });
      logger.debug(`Found ${threads.length} threads for resource ${resourceId}`);
      return threads;
    } catch (error) {
      logger.error(`Error getting threads by resource ID: ${error}`);
      // Fall back to an empty array if there's an error
      return [];
    }
  }

  /**
   * Query messages from a thread with various filtering options
   * @param threadId - ID of the thread
   * @param options - Query options
   * @returns Array of messages matching the query
   */
  async query(threadId: string, options: any = {}) {
    logger.info(`Querying thread ${threadId} with options: ${JSON.stringify(options)}`);

    try {
      // Extract options
      const limit = options.limit || this.lastMessages;
      const semanticQuery = options.vectorSearchString;
      const selectBy = options.selectBy || 'recent';

      // If semantic search is requested and available
      if (semanticQuery && this.upstashVector && this.vectorIndex && this.semanticRecall?.enabled) {
        logger.debug(`Performing semantic search with query: ${semanticQuery}`);
        const messages = await this.getMessagesWithSemanticSearch(threadId, semanticQuery, limit);
        return {
          messages,
          threadId,
          resourceId: options.resourceId
        };
      }

      // Handle different selection methods
      let resultMessages = [];

      switch (selectBy) {
        case 'recent': {
          // Get most recent messages
          logger.debug(`Getting ${limit} most recent messages from thread ${threadId}`);
          resultMessages = await this.getMessages(threadId, limit);
          break;
        }

        case 'messageIds': {
          // Get specific messages by IDs
          if (!options.messageIds || !Array.isArray(options.messageIds)) {
            logger.warn('No message IDs provided for messageIds selection');
            resultMessages = [];
            break;
          }

          logger.debug(`Getting ${options.messageIds.length} specific messages from thread ${threadId}`);
          const specificMessages = [];
          for (const messageId of options.messageIds) {
            const messageJson = await this.storage.get(`${this.prefix}message:${messageId}`);
            if (messageJson) {
              specificMessages.push(JSON.parse(messageJson));
            }
          }
          resultMessages = specificMessages;
          break;
        }

        default: {
          // Default to recent messages
          logger.debug(`Unknown selection method '${selectBy}', defaulting to recent messages`);
          resultMessages = await this.getMessages(threadId, limit);
          break;
        }
      }

      // Apply processors to the messages
      const processedMessages = this.applyProcessors(resultMessages);

      return {
        messages: processedMessages,
        threadId,
        resourceId: options.resourceId
      };
    } catch (error) {
      logger.error(`Error querying thread: ${error}`);
      return {
        messages: [],
        threadId,
        resourceId: options.resourceId,
        error: `Failed to query thread: ${error}`
      };
    }
  }
}
