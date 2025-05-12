/**
 * @file MessageTransformer processor for Mastra memory
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This processor transforms message content in real-time as it flows through the memory system.
 * It can be used to format, sanitize, or enhance message content before it's sent to the LLM.
 */
import { CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the MessageTransformer processor
const logger = createLogger({
  name: 'Mastra-MessageTransformer',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Type for transformation function
 * @typedef {Function} TransformFunction
 * @param {CoreMessage} message - Message to transform
 * @returns {CoreMessage} Transformed message
 */
export type TransformFunction = (message: CoreMessage) => CoreMessage;

/**
 * MessageTransformer processor for memory messages
 * Transforms message content in real-time
 * 
 * @class MessageTransformer
 * @extends {MemoryProcessor}
 */
export class MessageTransformer extends MemoryProcessor {
  private transformFunctions: TransformFunction[];
  private applyToRoles: Set<string>;
  private applyToTypes: Set<string>;
  private transformMetadata: boolean;
  private transformContent: boolean;
  private transformOrder: 'sequential' | 'parallel';

  /**
   * Create a new MessageTransformer
   * @param {Object} [options={}] - Configuration options
   * @param {TransformFunction[]} [options.transformFunctions] - Array of transformation functions
   * @param {string[]} [options.applyToRoles=['user', 'assistant', 'system', 'tool']] - Roles to apply transformations to
   * @param {string[]} [options.applyToTypes=['text', 'tool-call', 'tool-result']] - Message types to apply transformations to
   * @param {boolean} [options.transformMetadata=false] - Whether to transform message metadata
   * @param {boolean} [options.transformContent=true] - Whether to transform message content
   * @param {'sequential'|'parallel'} [options.transformOrder='sequential'] - Order to apply transformations
   */
  constructor(options: {
    transformFunctions?: TransformFunction[];
    applyToRoles?: string[];
    applyToTypes?: string[];
    transformMetadata?: boolean;
    transformContent?: boolean;
    transformOrder?: 'sequential' | 'parallel';
  } = {}) {
    super({ name: 'MessageTransformer' });
    this.transformFunctions = options.transformFunctions || [];
    this.applyToRoles = new Set(options.applyToRoles || ['user', 'assistant', 'system', 'tool']);
    this.applyToTypes = new Set(options.applyToTypes || ['text', 'tool-call', 'tool-result']);
    this.transformMetadata = options.transformMetadata || false;
    this.transformContent = options.transformContent !== false;
    this.transformOrder = options.transformOrder || 'sequential';
  }

  /**
   * Add a transformation function
   * @param {TransformFunction} fn - Transformation function to add
   * @returns {void}
   */
  addTransform(fn: TransformFunction): void {
    this.transformFunctions.push(fn);
  }

  /**
   * Process messages by applying transformations
   * @param {CoreMessage[]} messages - Array of messages to process
   * @param {MemoryProcessorOpts} [opts={}] - MemoryProcessor options
   * @returns {CoreMessage[]} Transformed array of messages
   * @override
   */
  process(messages: CoreMessage[], opts: MemoryProcessorOpts = {}): CoreMessage[] {
    if (!messages || messages.length === 0 || this.transformFunctions.length === 0) {
      return messages;
    }

    // Use opts to satisfy base signature
    void opts;

    let transformedCount = 0;

    // Apply transformations to each message
    const transformedMessages = messages.map(message => {
      // Skip messages that don't match role or type filters
      if (!this.applyToRoles.has(message.role) || !this.applyToTypes.has((message as any).type || 'text')) {
        return message;
      }

      // Create a copy of the message to modify
      let transformedMessage = { ...message };
      
      if (this.transformOrder === 'sequential') {
        // Apply each transformation function in sequence
        for (const transformFn of this.transformFunctions) {
          const prevMessage = transformedMessage;
          transformedMessage = transformFn(transformedMessage);
          
          // Track if message was transformed
          if (JSON.stringify(transformedMessage) !== JSON.stringify(prevMessage)) {
            transformedCount++;
          }
        }
      } else {
        // Apply transformations in parallel and merge results
        const transformResults = this.transformFunctions.map(fn => fn({ ...message }));
        
        // Merge content from all transformations if enabled
        if (this.transformContent) {
          const contentTransforms = transformResults
            .filter(result => {
              if (typeof result.content !== typeof message.content) return true;
              return typeof result.content === 'string' && 
                     typeof message.content === 'string' && 
                     result.content !== message.content;
            })
            .map(result => result.content);
            
          if (contentTransforms.length > 0) {
            transformedMessage.content = contentTransforms[contentTransforms.length - 1];
            transformedCount++;
          }
        }
        
        // Merge metadata from all transformations if enabled
        if (this.transformMetadata) {
          (transformedMessage as any).metadata = (transformedMessage as any).metadata || {};
          
          let metadataChanged = false;
          for (const result of transformResults) {
            if ((result as any).metadata) {
              (transformedMessage as any).metadata = {
                ...(transformedMessage as any).metadata,
                ...(result as any).metadata
              };
              metadataChanged = true;
            }
          }
          
          if (metadataChanged) {
            transformedCount++;
          }
        }
      }

      // Add transformation marker
      if (JSON.stringify(transformedMessage) !== JSON.stringify(message)) {
        (transformedMessage as any)._transformed = true;
        (transformedMessage as any)._transformedAt = new Date().toISOString();
      }

      return transformedMessage;
    });

    if (transformedCount > 0) {
      logger.debug(`MessageTransformer: Transformed ${transformedCount} messages`);
    }

    return transformedMessages;
  }
}

/**
 * Common transformation functions that can be used with MessageTransformer
 * @namespace CommonTransforms
 */
export const CommonTransforms = {
  /**
   * Truncate long content to a maximum length
   * @param {number} [maxLength=1000] - Maximum content length
   * @returns {TransformFunction} Transformation function
   * @memberof CommonTransforms
   */
  truncateContent: (maxLength: number = 1000): TransformFunction => {
    return (message: CoreMessage): CoreMessage => {
      if (typeof message.content === 'string' && message.content.length > maxLength) {
        return {
          ...message,
          content: message.content.substring(0, maxLength) + '... [truncated]'
        } as CoreMessage;
      }
      return message;
    };
  },
  /**
   * Remove sensitive information using regex patterns
   * @param {RegExp[]} patterns - Array of regex patterns to remove
   * @returns {TransformFunction} Transformation function
   * @memberof CommonTransforms
   */
  removeSensitiveInfo: (patterns: RegExp[]): TransformFunction => {
    return (message: CoreMessage): CoreMessage => {
      if (typeof message.content === 'string') {
        let newContent = message.content;
        for (const pattern of patterns) {
          newContent = newContent.replace(pattern, '[REDACTED]');
        }

        if (newContent !== message.content) {
          return {
            ...message,
            content: newContent
          } as CoreMessage;
        }
      }
      return message;
    };
  },
  /**
   * Format code blocks for better readability
   * @returns {TransformFunction} Transformation function
   * @memberof CommonTransforms
   */
  formatCodeBlocks: (): TransformFunction => {
    return (message: CoreMessage): CoreMessage => {
      if (typeof message.content === 'string' && message.content.includes('')) {
        // Simple regex to find and format code blocks
        const formattedContent = message.content.replace(
          /(\w*)\n([\s\S]*?)```/g,
          (_, lang, code) => `\`\`\`${lang}\n${code.trim()}\n\`\`\``
        );

        if (formattedContent !== message.content) {
          return {
            ...message,
            content: formattedContent
          } as CoreMessage;
        }
      }
      return message;
    };
  },
  /**
   * Add timestamps to messages
   * @param {string} [format='[HH:MM:SS]'] - Timestamp format
   * @returns {TransformFunction} Transformation function
   * @memberof CommonTransforms
   */
  addTimestamps: (format: string = '[HH:MM:SS]'): TransformFunction => {
    return (message: CoreMessage): CoreMessage => {
      if (typeof message.content === 'string') {
        const now = new Date();
        let timestamp = format;
        
        // Replace format tokens with actual values
        timestamp = timestamp.replace('HH', String(now.getHours()).padStart(2, '0'));
        timestamp = timestamp.replace('MM', String(now.getMinutes()).padStart(2, '0'));
        timestamp = timestamp.replace('SS', String(now.getSeconds()).padStart(2, '0'));
        
        return {
          ...message,
          content: `${timestamp} ${message.content}`
        } as CoreMessage;
      }
      return message;
    };
  },
  /**
   * Enhance URLs with additional information
   * @returns {TransformFunction} Transformation function
   * @memberof CommonTransforms
   */
  enhanceUrls: (): TransformFunction => {
    return (message: CoreMessage): CoreMessage => {
      if (typeof message.content === 'string') {
        // Find URLs in content
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = message.content.match(urlRegex);
        
        if (urls && urls.length > 0) {
          let enhancedContent = message.content;
          
          // Add domain information to each URL
          for (const url of urls) {
            try {
              const domain = new URL(url).hostname;
              enhancedContent = enhancedContent.replace(
                url, 
                `${url} [${domain}]`
              );
            } catch {
              // Skip invalid URLs
            }
          }
          
          if (enhancedContent !== message.content) {
            return {
              ...message,
              content: enhancedContent
            } as CoreMessage;
          }
        }
      }
      return message;

    };  },  
    /**
   * Normalize whitespace in message content
   * @returns {TransformFunction} Transformation function
   * @memberof CommonTransforms
   */
  normalizeWhitespace: (): TransformFunction => {
    return (message: CoreMessage): CoreMessage => {
      if (typeof message.content === 'string') {
        // Replace multiple spaces with a single space
        const normalizedContent = message.content
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace triple+ newlines with double
          .trim();
          
        if (normalizedContent !== message.content) {
          return {
            ...message,
            content: normalizedContent
          } as CoreMessage;
        }
      }
      return message;
    };
  }};
