/**
 * @file ContextualEnhancer processor for Mastra memory
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This processor enhances messages with additional context, references, and metadata.
 * It can be used to add relevant information, cross-references, and semantic connections
 * to improve the quality and coherence of agent responses.
 */
import { CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the ContextualEnhancer processor
const logger = createLogger({
  name: 'Mastra-ContextualEnhancer',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Type for context enhancement function
 * @typedef {Function} EnhancementFunction
 * @param {CoreMessage} message - The message to enhance
 * @param {EnhancementContext} context - The context for enhancement
 * @returns {CoreMessage} The enhanced message
 */
export type EnhancementFunction = (message: CoreMessage, context: EnhancementContext) => CoreMessage;

/**
 * Type for context source function - synchronous to comply with MemoryProcessor interface
 * @typedef {Function} ContextSourceFunction
 * @param {CoreMessage} message - The message to get context for
 * @returns {Record<string, any>} The context data
 */
export type ContextSourceFunction = (message: CoreMessage) => Record<string, any>;

/**
 * Enhancement context interface
 * @interface EnhancementContext
 * @property {CoreMessage[]} messages - Array of messages in the current context window
 * @property {number} currentIndex - Index of the current message in the context window
 * @property {string} threadId - ID of the current thread
 * @property {Record<string, any>} sources - Context data from source functions
 * @property {Record<string, any>} metadata - Additional metadata for enhancement
 */
export interface EnhancementContext {
  messages: CoreMessage[];
  currentIndex: number;
  threadId: string;
  sources: Record<string, any>;
  metadata: Record<string, any>;
}

/**
 * ContextualEnhancer processor for memory messages
 * Enhances messages with additional context and references
 * 
 * @class ContextualEnhancer
 * @extends {MemoryProcessor}
 */
export class ContextualEnhancer extends MemoryProcessor {
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
   * @param {Object} options - Configuration options
   * @param {EnhancementFunction[]} [options.enhancementFunctions] - Functions to enhance messages
   * @param {ContextSourceFunction[]} [options.contextSources] - Functions to provide context
   * @param {string[]} [options.applyToRoles=['assistant']] - Roles to apply enhancement to
   * @param {string[]} [options.applyToTypes=['text']] - Message types to apply enhancement to
   * @param {number} [options.contextWindow=5] - Number of messages before and after to include in context
   * @param {boolean} [options.addReferences=true] - Whether to add references to enhanced messages
   * @param {boolean} [options.addMetadata=true] - Whether to add metadata to enhanced messages
   * @param {boolean} [options.addAnnotations=false] - Whether to add annotations to message content
   * @param {boolean} [options.cacheContext=true] - Whether to cache context data
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
    super({ name: 'ContextualEnhancer' });
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
   * @param {EnhancementFunction} fn - Enhancement function to add
   * @returns {void}
   */
  addEnhancementFunction(fn: EnhancementFunction): void {
    this.enhancementFunctions.push(fn);
  }

  /**
   * Add a context source function
   * @param {ContextSourceFunction} fn - Context source function to add
   * @returns {void}
   */
  addContextSource(fn: ContextSourceFunction): void {
    this.contextSources.push(fn);
  }

  /**
   * Process messages by enhancing them with context
   * @param {CoreMessage[]} messages - Array of messages to process
   * @param {MemoryProcessorOpts} [opts={}] - MemoryProcessor options
   * @returns {CoreMessage[]} Processed array of messages
   * @override
   */
  process(messages: CoreMessage[], opts: MemoryProcessorOpts = {}): CoreMessage[] {
    if (!messages || messages.length === 0) {
      return messages;
    }
    // Use opts to satisfy base signature
    void opts;

    let enhancedCount = 0;
    const enhancedMessages: CoreMessage[] = [];

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      // Use a unique identifier for the message if available, otherwise use a combination of role and a hash of the content
      const messageId = (message as any).id || `${message.role}-${(typeof message.content === 'string' ? message.content.substring(0, 20) : JSON.stringify(message.content).substring(0,20))}`;
      const messageType = (message as any).type ?? 'text'; // Default to 'text' if type is undefined

      // Skip messages that don't match role or type filters
      if (!this.applyToRoles.has(message.role) || !this.applyToTypes.has(messageType)) {
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
            const cacheKey = `${messageId}:${sourceFunction.name || 'anonymous'}`;

            if (this.cacheContext && this.contextCache.has(cacheKey)) {
              const cachedContext = this.contextCache.get(cacheKey);
              if (cachedContext) {
                Object.assign(sources, cachedContext);
                logger.debug(`Using cached context for message ${messageId} from source ${sourceFunction.name || 'anonymous'}`);
                continue;
              }
            }

            // Call the context source function synchronously
            try {
              const contextData = sourceFunction(message);

              // Cache the context if enabled
              if (this.cacheContext && contextData) {
                this.contextCache.set(cacheKey, contextData);
                logger.debug(`Cached context for message ${messageId} from source ${sourceFunction.name || 'anonymous'}`);
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
          threadId: (message as any).thread_id, // Access thread_id via any
          sources,
          metadata: (message as any).metadata ? { ...(message as any).metadata } : {}
        };

        // Apply enhancement functions
        for (const enhancementFn of this.enhancementFunctions) {
          enhancedMessage = enhancementFn(enhancedMessage, enhancementContext);
        }

        // Add references if configured
        if (this.addReferences && Object.keys(sources).length > 0) {
          (enhancedMessage as any).metadata = (enhancedMessage as any).metadata || {};
          (enhancedMessage as any).metadata.references = sources;
        }

        // Add metadata if configured
        if (this.addMetadata) {
          (enhancedMessage as any).metadata = (enhancedMessage as any).metadata || {};
          (enhancedMessage as any).metadata.enhanced = true;
          (enhancedMessage as any).metadata.enhancedAt = new Date().toISOString();
        }

        // Add annotations if configured
        if (this.addAnnotations && typeof enhancedMessage.content === 'string') {
          const annotations = this.generateAnnotations(enhancedMessage, sources);
          if (annotations) {
            enhancedMessage.content = `${enhancedMessage.content}\n\n${annotations}`;
          }
        }

        enhancedMessages.push(enhancedMessage);
        enhancedCount++;
      } catch (error) {
        logger.error(`Error enhancing message: ${error}`);
        // If enhancement fails, use the original message
        enhancedMessages.push(message);
      }
    }

    if (enhancedCount > 0) {
      logger.debug(`ContextualEnhancer: Enhanced ${enhancedCount} messages`);
    }

    return enhancedMessages;
  }

  /**
   * Generate annotations for a message
   * @param {CoreMessage} message - Message to annotate
   * @param {Record<string, any>} sources - Context sources
   * @returns {string|null} Annotation string or null
   * @private
   */
  private generateAnnotations(message: CoreMessage, sources: Record<string, any>): string | null {
    let annotations = '';
    // Ensure message.content is a string before trying to access its properties
    if (typeof message.content === 'string') {
        // Example: Add source names as annotations
        const sourceNames = Object.keys(sources);
        if (sourceNames.length > 0) {
            annotations += `Context Sources: ${sourceNames.join(', ')}`;
        }
    }
    // Add more sophisticated annotation generation based on message content and sources
    // For example, if sources contain entities, you might list them here.
    return annotations.length > 0 ? annotations : null;
  }
}

/**
 * Common enhancement functions that can be used with ContextualEnhancer
 * @namespace CommonEnhancements
 */
export const CommonEnhancements = {
  /**
   * Add related message references based on content similarity
   * @param {number} [similarityThreshold=0.7] - Similarity threshold (0-1)
   * @returns {EnhancementFunction} Enhancement function
   * @memberof CommonEnhancements
   */
  addRelatedMessages: (similarityThreshold: number = 0.7): EnhancementFunction => {
    return (message: CoreMessage, context: EnhancementContext): CoreMessage => {
      const enhanced: CoreMessage = { ...message };
      if (!context.messages || context.messages.length === 0) {
        return enhanced;
      }
      // Simple similarity: count common words (case-insensitive)
      const messageContentStr = typeof enhanced.content === 'string' ? enhanced.content : JSON.stringify(enhanced.content);
      const messageWords = messageContentStr.toLowerCase().split(/\s+/);
      const relatedMessages = context.messages
        .map((m, idx) => {
          if (idx === context.currentIndex) return null;
          const contextContentStr = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
          const contextWords = contextContentStr.toLowerCase().split(/\s+/);
          const commonWords = messageWords.filter(word => contextWords.includes(word));
          const similarity = commonWords.length / Math.max(messageWords.length, contextWords.length, 1);
          return { message: m, similarity };
        })
        .filter(item => item && item.similarity >= similarityThreshold)
        .sort((a, b) => b!.similarity - a!.similarity);

      if (relatedMessages.length > 0) {
        (enhanced as any).metadata = (enhanced as any).metadata || {};
        (enhanced as any).metadata.relatedMessages = relatedMessages.map(item => ({
          // Use a unique identifier for the message if available, otherwise use a combination of role and a hash of the content
          id: (item!.message as any).id || `${item!.message.role}-${(typeof item!.message.content === 'string' ? item!.message.content.substring(0,20) : JSON.stringify(item!.message.content).substring(0,20))}`,
          similarity: item!.similarity,
        }));
      }
      return enhanced;
    };
  },

  /**
   * Add entity cross-references between messages
   * @returns {EnhancementFunction} Enhancement function
   * @memberof CommonEnhancements
   */
  addEntityCrossReferences: (): EnhancementFunction => {
    return (message: CoreMessage, context: EnhancementContext): CoreMessage => {
      const enhanced: CoreMessage = { ...message };
      const messageEntities = (message as any).metadata?.entities as any[] || [];
      if (messageEntities.length === 0 || !context.messages || context.messages.length === 0) {
        return enhanced;
      }

            const allOtherEntities = context.messages
        .filter((_, idx) => idx !== context.currentIndex)
        .flatMap(m => (((m as any).metadata?.entities as any[] || [])
          .map(e => ({ ...e, originalMessageId: (m as any).id || `${m.role}-${(typeof m.content === 'string' ? m.content.substring(0,20) : JSON.stringify(m.content).substring(0,20))}` })))
        );

      (enhanced as any).metadata = (enhanced as any).metadata || {};
      (enhanced as any).metadata.entityReferences = {};

      for (const entity of messageEntities) {
        const relatedEntities = allOtherEntities
          .filter(otherEntity => otherEntity.type === entity.type && otherEntity.value === entity.value);
        if (relatedEntities.length > 0) {
          (enhanced as any).metadata.entityReferences[entity.value] = relatedEntities;
        }
      }
      return enhanced;
    };
  },

  /**
   * Add knowledge base references to enhanced messages
   * @param {string} [knowledgeBaseField='knowledgeBase'] - Field name in sources containing knowledge base data
   * @returns {EnhancementFunction} Enhancement function
   * @memberof CommonEnhancements
   */
  addKnowledgeBaseReferences: (knowledgeBaseField: string = 'knowledgeBase'): EnhancementFunction => {
    return (message: CoreMessage, context: EnhancementContext): CoreMessage => {
      const enhanced: CoreMessage = { ...message };
      if (context.sources && context.sources[knowledgeBaseField]) {
        (enhanced as any).metadata = (enhanced as any).metadata || {};
        (enhanced as any).metadata.knowledgeReferences = context.sources[knowledgeBaseField];
      }
      return enhanced;
    };
  }
};
