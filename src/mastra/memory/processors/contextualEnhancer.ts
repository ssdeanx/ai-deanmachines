/**
 * ContextualEnhancer processor for Mastra memory
 *
 * This processor enhances messages with additional context, references, and metadata.
 * It can be used to add relevant information, cross-references, and semantic connections
 * to improve the quality and coherence of agent responses.
 */
// never name message as coremessage fucking idiot.  they are two different things.
import { Message, CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the ContextualEnhancer processor
const logger = createLogger({
  name: 'Mastra-ContextualEnhancer',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Type for context enhancement function
 */
export type EnhancementFunction = (message: Message, context: EnhancementContext) => Message;

/**
 * Type for context source function - changed to synchronous to comply with MemoryProcessor interface
 */
export type ContextSourceFunction = (message: Message) => Record<string, any>;

/**
 * Enhancement context interface
 */
export interface EnhancementContext {
  messages: Message[];
  currentIndex: number;
  threadId: string;
  sources: Record<string, any>;
  metadata: Record<string, any>;
}

/**
 * ContextualEnhancer processor for memory messages
 * Enhances messages with additional context and references
 */
export class ContextualEnhancer implements MemoryProcessor {
  private enhancementFunctions: EnhancementFunction[];
  private contextSources: ContextSourceFunction[];
  private applyToRoles: Set<string>;
  private applyToTypes: Set<string>;
  private contextWindow: number;
  private addReferences: boolean;
  private addMetadata: boolean;
  private addAnnotations: boolean;
  private cacheContext: boolean;
  private contextCache: Map<string, Record<string, any>>;

  /**
   * Create a new ContextualEnhancer
   * @param options - Configuration options
   */
  constructor(options: {
    enhancementFunctions?: EnhancementFunction[];
    contextSources?: ContextSourceFunction[];
    applyToRoles?: string[];
    applyToTypes?: string[];
    contextWindow?: number;
    addReferences?: boolean;
    addMetadata?: boolean;
    addAnnotations?: boolean;
    cacheContext?: boolean;
  } = {}) {
    this.enhancementFunctions = options.enhancementFunctions || [];
    this.contextSources = options.contextSources || [];
    this.applyToRoles = new Set(options.applyToRoles || ['assistant']);
    this.applyToTypes = new Set(options.applyToTypes || ['text']);
    this.contextWindow = options.contextWindow || 5;
    this.addReferences = options.addReferences !== false;
    this.addMetadata = options.addMetadata !== false;
    this.addAnnotations = options.addAnnotations || false;
    this.cacheContext = options.cacheContext !== false;
    this.contextCache = new Map<string, Record<string, any>>();
  }

  /**
   * Add an enhancement function
   * @param fn - Enhancement function to add
   */
  addEnhancementFunction(fn: EnhancementFunction): void {
    this.enhancementFunctions.push(fn);
  }

  /**
   * Add a context source function
   * @param fn - Context source function to add
   */
  addContextSource(fn: ContextSourceFunction): void {
    this.contextSources.push(fn);
  }

  /**
   * Process messages by enhancing them with context
   * @param messages - Array of messages to process
   * @returns Processed array of messages
   */
  process(messages: Message[]): Message[] {
    if (!messages || messages.length === 0) {
      return messages;
    }

    let enhancedCount = 0;
    const enhancedMessages: Message[] = [];

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      // Skip messages that don't match role or type filters
      if (!this.applyToRoles.has(message.role) || !this.applyToTypes.has(message.type)) {
        enhancedMessages.push(message);
        continue;
      }

      // Get the context window
      const startIdx = Math.max(0, i - this.contextWindow);
      const endIdx = Math.min(messages.length - 1, i + this.contextWindow);
      const contextMessages = messages.slice(startIdx, endIdx + 1);

      // Create a copy of the message to modify
      let enhancedMessage = { ...message };

      try {
        // Gather context from sources (using cached data and synchronous calls)
        const sources: Record<string, any> = {};

        for (const sourceFunction of this.contextSources) {
          try {
            // Check cache first if enabled
            const cacheKey = `${message.id}:${sourceFunction.name || 'anonymous'}`;

            if (this.cacheContext && this.contextCache.has(cacheKey)) {
              const cachedContext = this.contextCache.get(cacheKey);
              if (cachedContext) {
                Object.assign(sources, cachedContext);
                logger.debug(`Using cached context for message ${message.id} from source ${sourceFunction.name || 'anonymous'}`);
                continue;
              }
            }

            // Call the context source function synchronously
            try {
              const contextData = sourceFunction(message);

              // Cache the context if enabled
              if (this.cacheContext && contextData) {
                this.contextCache.set(cacheKey, contextData);
                logger.debug(`Cached context for message ${message.id} from source ${sourceFunction.name || 'anonymous'}`);
              }

              // Add to sources
              if (contextData) {
                Object.assign(sources, contextData);
              }
            } catch (error) {
              logger.warn(`Error getting context from source ${sourceFunction.name || 'anonymous'}: ${error}`);
            }
          } catch (error) {
            logger.warn(`Error processing context source: ${error}`);
          }
        }

        // Create enhancement context
        const enhancementContext: EnhancementContext = {
          messages: contextMessages,
          currentIndex: i - startIdx,
          threadId: message.thread_id,
          sources,
          metadata: message.metadata ? { ...message.metadata } : {}
        };

        // Apply enhancement functions
        for (const enhancementFn of this.enhancementFunctions) {
          enhancedMessage = enhancementFn(enhancedMessage, enhancementContext);
        }

        // Add references if configured
        if (this.addReferences && Object.keys(sources).length > 0) {
          enhancedMessage.metadata = enhancedMessage.metadata || {};
          enhancedMessage.metadata.references = sources;
        }

        // Add metadata if configured
        if (this.addMetadata) {
          enhancedMessage.metadata = enhancedMessage.metadata || {};
          enhancedMessage.metadata.enhanced = true;
          enhancedMessage.metadata.enhancedAt = new Date().toISOString();
        }

        // Add annotations if configured
        if (this.addAnnotations && typeof enhancedMessage.content === 'string') {
          const annotations = this.generateAnnotations(enhancedMessage, sources);
          if (annotations) {
            enhancedMessage.content = `${enhancedMessage.content}\n\n${annotations}`;
          }
        }

        enhancedCount++;
      } catch (error) {
        logger.error(`Error enhancing message: ${error}`);
        // If enhancement fails, use the original message
        enhancedMessage = message;
      }

      enhancedMessages.push(enhancedMessage);
    }

    if (enhancedCount > 0) {
      logger.debug(`ContextualEnhancer: Enhanced ${enhancedCount} messages`);
    }

    return enhancedMessages;
  }

  /**
   * Generate annotations for a message
   * @param message - Message to generate annotations for
   * @param sources - Context sources
   * @returns Annotation text
   */
  private generateAnnotations(_message: Message, sources: Record<string, any>): string {
    const annotations: string[] = [];

    // Add source references
    if (Object.keys(sources).length > 0) {
      annotations.push('**References:**');
      for (const [sourceName, sourceData] of Object.entries(sources)) {
        if (typeof sourceData === 'string') {
          annotations.push(`- ${sourceName}: ${sourceData}`);
        } else if (sourceData.title) {
          annotations.push(`- ${sourceName}: ${sourceData.title}`);
        } else {
          annotations.push(`- ${sourceName}`);
        }
      }
    }

    return annotations.join('\n');
  }
}

/**
 * Common enhancement functions
 */
export const CommonEnhancements = {
  /**
   * Add related message references
   * @param similarityThreshold - Similarity threshold (0-1)
   * @returns Enhancement function
   */
  addRelatedMessages: (similarityThreshold: number = 0.7): EnhancementFunction => {
    return (message: Message, context: EnhancementContext) => {
      const enhanced = { ...message };
      enhanced.metadata = enhanced.metadata || {};

      // Find related messages in the context window
      const relatedMessages = context.messages
        .filter((_, idx) => idx !== context.currentIndex) // Exclude current message
        .map(m => ({
          message: m,
          // Simple similarity score (in a real implementation, use a proper similarity algorithm)
          similarity: typeof m.content === 'string' && typeof message.content === 'string'
            ? (m.content.includes(message.content.substring(0, 20)) ? 0.8 : 0.2)
            : 0
        }))
        .filter(item => item.similarity >= similarityThreshold);

      if (relatedMessages.length > 0) {
        enhanced.metadata.relatedMessages = relatedMessages.map(item => ({
          id: item.message.id,
          similarity: item.similarity,
          preview: typeof item.message.content === 'string'
            ? item.message.content.substring(0, 50)
            : 'Non-text content'
        }));
      }

      return enhanced;
    };
  },

  /**
   * Add entity cross-references
   * @returns Enhancement function
   */
  addEntityCrossReferences: (): EnhancementFunction => {
    return (message: Message, context: EnhancementContext) => {
      const enhanced = { ...message };

      // Check if message has entities
      if (message.metadata?.entities) {
        enhanced.metadata = enhanced.metadata || {};
        enhanced.metadata.entityReferences = {};

        // For each entity, find related entities in other messages
        for (const entity of message.metadata.entities) {
          const relatedEntities = context.messages
            .filter((_, idx) => idx !== context.currentIndex) // Exclude current message
            .flatMap(m => (m.metadata?.entities || [])
              .filter((e: any) => e.type === entity.type && e.value !== entity.value)
            );

          if (relatedEntities.length > 0) {
            enhanced.metadata.entityReferences[entity.value] = relatedEntities;
          }
        }
      }

      return enhanced;
    };
  },

  /**
   * Add knowledge base references
   * @param knowledgeBaseField - Field name in sources containing knowledge base data
   * @returns Enhancement function
   */
  addKnowledgeBaseReferences: (knowledgeBaseField: string = 'knowledgeBase'): EnhancementFunction => {
    return (message: Message, context: EnhancementContext) => {
      const enhanced = { ...message };

      // Check if knowledge base data is available
      if (context.sources[knowledgeBaseField]) {
        enhanced.metadata = enhanced.metadata || {};
        enhanced.metadata.knowledgeReferences = context.sources[knowledgeBaseField];
      }

      return enhanced;
    };
  }
};
