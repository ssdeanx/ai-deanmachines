/**
 * StreamObjectProcessor for Mastra memory
 *
 * This processor handles stream objects in real-time as they flow through the memory system.
 * It can transform, filter, or enhance stream objects before they're processed further.
 */
// never name message as coremessage fucking idiot.  they are two different things.
import { CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the StreamObjectProcessor
const logger = createLogger({
  name: 'Mastra-StreamObjectProcessor',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Type for stream object transformation function
 */
export type StreamObjectTransformFunction = (content: Record<string, any>) => Record<string, any>;

/**
 * StreamObjectProcessor for memory messages
 * Processes stream objects in real-time
 */
export class StreamObjectProcessor extends MemoryProcessor {
  private transformFunctions: StreamObjectTransformFunction[];
  private applyToRoles: Set<string>;
  private extractTextContent: boolean;
  private preserveOriginalContent: boolean;
  private textContentField: string;

  /**
   * Create a new StreamObjectProcessor
   * @param options - Configuration options
   */
  constructor(options: {
    transformFunctions?: StreamObjectTransformFunction[];
    applyToRoles?: string[];
    extractTextContent?: boolean;
    preserveOriginalContent?: boolean;
    textContentField?: string;
    name?: string;
  } = {}) {
    super({ name: options.name || 'StreamObjectProcessor' });
    this.transformFunctions = options.transformFunctions || [];
    this.applyToRoles = new Set(options.applyToRoles || ['user', 'assistant', 'system', 'tool']);
    this.extractTextContent = options.extractTextContent !== false;
    this.preserveOriginalContent = options.preserveOriginalContent !== false;
    this.textContentField = options.textContentField || 'text';
  }

  /**
   * Add a transformation function
   * @param fn - Transformation function to add
   */
  addTransform(fn: StreamObjectTransformFunction): void {
    this.transformFunctions.push(fn);
  }

  /**
   * Process messages by handling stream objects
   * @param messages - Array of messages to process
   * @param _opts - Optional processor options
   * @returns Processed array of messages
   */
  process(
    messages: CoreMessage[],
    _opts: MemoryProcessorOpts = {}
  ): CoreMessage[] {
    if (!messages || messages.length === 0) {
      return messages;
    }

    let processedCount = 0;

    // Process each message - create a new array to avoid mutating the input
    const processedMessages = messages.map(message => {
      // Skip messages that don't match role filters
      if (!this.applyToRoles.has(message.role)) {
        return message;
      }

      try {
        // Create a copy of the message to modify
        const processedMessage = { ...message } as any;

        // Handle object content if present
        if (typeof message.content !== 'string' && message.content !== null) {
          // Apply transformations to the content object
          let transformedContent = { ...message.content as Record<string, any> };

          // Apply each transformation function in sequence
          for (const transformFn of this.transformFunctions) {
            transformedContent = transformFn(transformedContent);
          }

          // Extract text content if configured
          if (this.extractTextContent && transformedContent[this.textContentField]) {
            // Set the content to the extracted text
            processedMessage.content = transformedContent[this.textContentField] as string;

            // Store original and transformed content in metadata
            if (this.preserveOriginalContent) {
              processedMessage.metadata = processedMessage.metadata || {};
              const meta = processedMessage.metadata as any;
              meta.streamObjectAnnotations = meta.streamObjectAnnotations || [];
              meta.streamObjectAnnotations.push({
                originalContent: message.content,
                transformedContent,
              });
            }
          } else {
            // Just update the content with the transformed object
            processedMessage.content = JSON.stringify(transformedContent);
          }

          processedCount++;
        }

        return processedMessage;
      } catch (error) {
        logger.error(`Error processing message: ${error}`);
        return message;
      }
    });
    if (processedCount > 0) {
      logger.debug(`StreamObjectProcessor: Processed ${processedCount} messages`);
    }

    return processedMessages;
  }}/**
 * Common stream object transformations
 */
export const CommonStreamTransforms = {
  /**
   * Extract specific fields from a stream object
   * @param fields - Array of field names to extract
   * @returns Transformation function
   */
  extractFields: (fields: string[]): StreamObjectTransformFunction => {
    return (content: Record<string, any>) => {
      const result: Record<string, any> = {};

      for (const field of fields) {
        if (content[field] !== undefined) {
          result[field] = content[field];
        }
      }

      return result;
    };
  },

  /**
   * Merge multiple fields into a single text field
   * @param fields - Array of field names to merge
   * @param separator - Separator to use between fields
   * @param targetField - Name of the target field
   * @returns Transformation function
   */
  mergeFields: (fields: string[], separator: string = '\n', targetField: string = 'text'): StreamObjectTransformFunction => {
    return (content: Record<string, any>) => {
      const result = { ...content };
      const parts: string[] = [];

      for (const field of fields) {
        if (content[field] !== undefined) {
          if (typeof content[field] === 'string') {
            parts.push(content[field]);
          } else {
            parts.push(JSON.stringify(content[field]));
          }
        }
      }

      if (parts.length > 0) {
        result[targetField] = parts.join(separator);
      }

      return result;
    };
  },

  /**
   * Format JSON data in a stream object
   * @param fields - Array of field names containing JSON data
   * @returns Transformation function
   */
  formatJsonFields: (fields: string[]): StreamObjectTransformFunction => {
    return (content: Record<string, any>) => {
      const result = { ...content };

      for (const field of fields) {
        if (content[field] !== undefined) {
          try {
            // If it's a string, try to parse it as JSON
            if (typeof content[field] === 'string') {
              result[field] = JSON.parse(content[field]);
            }
            // If it's already an object, format it as a pretty JSON string
            else if (typeof content[field] === 'object') {
              result[field] = JSON.stringify(content[field], null, 2);
            }
          } catch (error) {
            // If parsing fails, leave it as is
            logger.warn(`Failed to format JSON field ${field}: ${error}`);
          }
        }
      }

      return result;
    };
  }
};
