/**
 * MessageTransformer processor for Mastra memory
 * 
 * This processor transforms message content in real-time as it flows through the memory system.
 * It can be used to format, sanitize, or enhance message content before it's sent to the LLM.
 */

import { Message, MemoryProcessor } from '../types';
import { logger } from '../../index';

/**
 * Type for transformation function
 */
export type TransformFunction = (message: Message) => Message;

/**
 * MessageTransformer processor for memory messages
 * Transforms message content in real-time
 */
export class MessageTransformer implements MemoryProcessor {
  private transformFunctions: TransformFunction[];
  private applyToRoles: Set<string>;
  private applyToTypes: Set<string>;

  /**
   * Create a new MessageTransformer
   * @param options - Configuration options
   */
  constructor(options: {
    transformFunctions?: TransformFunction[];
    applyToRoles?: string[];
    applyToTypes?: string[];
  } = {}) {
    this.transformFunctions = options.transformFunctions || [];
    this.applyToRoles = new Set(options.applyToRoles || ['user', 'assistant', 'system', 'tool']);
    this.applyToTypes = new Set(options.applyToTypes || ['text', 'tool-call', 'tool-result']);
  }

  /**
   * Add a transformation function
   * @param fn - Transformation function to add
   */
  addTransform(fn: TransformFunction): void {
    this.transformFunctions.push(fn);
  }

  /**
   * Process messages by applying transformations
   * @param messages - Array of messages to process
   * @returns Transformed array of messages
   */
  process(messages: Message[]): Message[] {
    if (!messages || messages.length === 0 || this.transformFunctions.length === 0) {
      return messages;
    }

    let transformedCount = 0;

    // Apply transformations to each message
    const transformedMessages = messages.map(message => {
      // Skip messages that don't match role or type filters
      if (!this.applyToRoles.has(message.role) || !this.applyToTypes.has(message.type)) {
        return message;
      }

      // Apply each transformation function in sequence
      let transformedMessage = { ...message };
      for (const transformFn of this.transformFunctions) {
        transformedMessage = transformFn(transformedMessage);
      }

      // Count transformed messages
      if (transformedMessage !== message) {
        transformedCount++;
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
 * Common transformation functions
 */
export const CommonTransforms = {
  /**
   * Truncate long content to a maximum length
   * @param maxLength - Maximum content length
   * @returns Transformation function
   */
  truncateContent: (maxLength: number = 1000): TransformFunction => {
    return (message: Message) => {
      if (typeof message.content === 'string' && message.content.length > maxLength) {
        return {
          ...message,
          content: message.content.substring(0, maxLength) + '... [truncated]',
          _transformed: true
        };
      }
      return message;
    };
  },

  /**
   * Remove sensitive information using regex patterns
   * @param patterns - Array of regex patterns to remove
   * @returns Transformation function
   */
  removeSensitiveInfo: (patterns: RegExp[]): TransformFunction => {
    return (message: Message) => {
      if (typeof message.content === 'string') {
        let newContent = message.content;
        for (const pattern of patterns) {
          newContent = newContent.replace(pattern, '[REDACTED]');
        }
        
        if (newContent !== message.content) {
          return {
            ...message,
            content: newContent,
            _transformed: true
          };
        }
      }
      return message;
    };
  },

  /**
   * Format code blocks for better readability
   * @returns Transformation function
   */
  formatCodeBlocks: (): TransformFunction => {
    return (message: Message) => {
      if (typeof message.content === 'string' && message.content.includes('```')) {
        // Simple regex to find and format code blocks
        const formattedContent = message.content.replace(
          /```(\w*)\n([\s\S]*?)```/g, 
          (_, lang, code) => `\`\`\`${lang}\n${code.trim()}\n\`\`\``
        );
        
        if (formattedContent !== message.content) {
          return {
            ...message,
            content: formattedContent,
            _transformed: true
          };
        }
      }
      return message;
    };
  }
};
