/**
 * @file StreamAggregator processor for Mastra memory
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This processor aggregates and summarizes multiple messages in real-time as they flow through the memory system.
 * It can be used to reduce noise, combine related messages, and extract key information from message streams.
 */
import { CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the StreamAggregator processor
const logger = createLogger({
  name: 'Mastra-StreamAggregator',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Type for message grouping function
 * @typedef {Function} GroupingFunction
 * @param {CoreMessage} message - Message to determine group for
 * @returns {string} Group key for the message
 */
export type GroupingFunction = (message: CoreMessage) => string;

/**
 * Type for message aggregation function
 * @typedef {Function} AggregationFunction
 * @param {CoreMessage[]} messages - Array of messages to aggregate
 * @returns {CoreMessage} Aggregated message
 */
export type AggregationFunction = (messages: CoreMessage[]) => CoreMessage;

/**
 * StreamAggregator processor for memory messages
 * Aggregates and summarizes multiple messages in real-time
 * 
 * @class StreamAggregator
 * @extends {MemoryProcessor}
 */
export class StreamAggregator extends MemoryProcessor {
  private groupingFunctions: GroupingFunction[];
  private aggregationFunctions: Record<string, AggregationFunction>;
  private defaultAggregationFunction: AggregationFunction;
  private applyToRoles: Set<string>;
  private applyToTypes: Set<string>;
  private minMessagesToAggregate: number;
  private maxMessagesToAggregate: number;
  private timeWindowMs: number;
  private messageBuffer: Map<string, CoreMessage[]>;
  private lastProcessTime: number;

  /**
   * Create a new StreamAggregator
   * @param {Object} [options={}] - Configuration options
   * @param {GroupingFunction[]} [options.groupingFunctions] - Functions to group messages
   * @param {Record<string, AggregationFunction>} [options.aggregationFunctions] - Functions to aggregate messages by group
   * @param {AggregationFunction} [options.defaultAggregationFunction] - Default function for aggregation
   * @param {string[]} [options.applyToRoles=['user', 'assistant', 'tool']] - Roles to apply aggregation to
   * @param {string[]} [options.applyToTypes=['text', 'tool-result']] - Message types to apply aggregation to
   * @param {number} [options.minMessagesToAggregate=2] - Minimum messages to trigger aggregation
   * @param {number} [options.maxMessagesToAggregate=10] - Maximum messages to aggregate at once
   * @param {number} [options.timeWindowMs=60000] - Time window for aggregation in milliseconds
   * @param {string} [options.name='StreamAggregator'] - Processor name
   */
  constructor(options: {
    groupingFunctions?: GroupingFunction[];
    aggregationFunctions?: Record<string, AggregationFunction>;
    defaultAggregationFunction?: AggregationFunction;
    applyToRoles?: string[];
    applyToTypes?: string[];
    minMessagesToAggregate?: number;
    maxMessagesToAggregate?: number;
    timeWindowMs?: number;
    name?: string;
  } = {}) {
    super({ name: options.name || 'StreamAggregator' });
    this.groupingFunctions = options.groupingFunctions || [
      // Default grouping by role and type
      (message) => `${message.role}:${(message as any).type || 'text'}`
    ];
    this.aggregationFunctions = options.aggregationFunctions || {};
    this.defaultAggregationFunction = options.defaultAggregationFunction || this.defaultAggregate;
    this.applyToRoles = new Set(options.applyToRoles || ['user', 'assistant', 'tool']);
    this.applyToTypes = new Set(options.applyToTypes || ['text', 'tool-result']);
    this.minMessagesToAggregate = options.minMessagesToAggregate || 2;
    this.maxMessagesToAggregate = options.maxMessagesToAggregate || 10;
    this.timeWindowMs = options.timeWindowMs || 60000; // Default: 1 minute
    this.messageBuffer = new Map<string, CoreMessage[]>();
    this.lastProcessTime = Date.now();
  }

  /**
   * Add a grouping function
   * @param {GroupingFunction} fn - Grouping function to add
   * @returns {void}
   */
  addGroupingFunction(fn: GroupingFunction): void {
    this.groupingFunctions.push(fn);
  }

  /**
   * Add an aggregation function for a specific group
   * @param {string} groupKey - Group key to add the function for
   * @param {AggregationFunction} fn - Aggregation function to add
   * @returns {void}
   */
  addAggregationFunction(groupKey: string, fn: AggregationFunction): void {
    this.aggregationFunctions[groupKey] = fn;
  }

  /**
   * Set the default aggregation function
   * @param {AggregationFunction} fn - Default aggregation function
   * @returns {void}
   */
  setDefaultAggregationFunction(fn: AggregationFunction): void {
    this.defaultAggregationFunction = fn;
  }

  /**
   * Process messages by aggregating related ones
   * @param {CoreMessage[]} messages - Array of messages to process
   * @param {MemoryProcessorOpts} [opts={}] - Optional processor options
   * @returns {CoreMessage[]} Processed array of messages
   * @override
   */
  process(messages: CoreMessage[], opts: MemoryProcessorOpts = {}): CoreMessage[] {
    if (!messages || messages.length === 0) {
      return messages;
    }

    // Use opts to satisfy base signature
    void opts;

    // Check if we need to process the buffer due to time window
    const currentTime = Date.now();
    const timeElapsed = currentTime - this.lastProcessTime;
    const forceProcess = timeElapsed >= this.timeWindowMs;

    // Add new messages to the buffer
    for (const message of messages) {
      // Skip messages that don't match role or type filters
      if (!this.applyToRoles.has(message.role) || !this.applyToTypes.has((message as any).type || 'text')) {
        continue;
      }

      // Determine the group key for this message
      for (const groupingFn of this.groupingFunctions) {
        const groupKey = groupingFn(message);
        if (!groupKey) continue;

        // Add message to the appropriate group
        if (!this.messageBuffer.has(groupKey)) {
          this.messageBuffer.set(groupKey, []);
        }
        this.messageBuffer.get(groupKey)?.push(message);
      }
    }

    // Process the buffer if needed
    if (forceProcess) {
      this.lastProcessTime = currentTime;
      return this.processBuffer(messages);
    }

    // Check if any groups have reached the max messages threshold
    let needsProcessing = false;
    for (const [_, groupMessages] of this.messageBuffer.entries()) {
      if (groupMessages.length >= this.maxMessagesToAggregate) {
        needsProcessing = true;
        break;
      }
    }

    if (needsProcessing) {
      return this.processBuffer(messages);
    }

    // If no aggregation needed, return the original messages
    return messages;
  }

  /**
   * Process the message buffer and aggregate messages
   * @param {CoreMessage[]} originalMessages - Original messages
   * @returns {CoreMessage[]} Processed messages
   * @private
   */
  private processBuffer(originalMessages: CoreMessage[]): CoreMessage[] {
    const result: CoreMessage[] = [];
    const processedIds = new Set<string>();

    // Process each group in the buffer
    for (const [groupKey, groupMessages] of this.messageBuffer.entries()) {
      // Skip groups that don't have enough messages
      if (groupMessages.length < this.minMessagesToAggregate) {
        continue;
      }

      // Get the appropriate aggregation function
      const aggregateFn = this.aggregationFunctions[groupKey] || this.defaultAggregationFunction;

      // Aggregate the messages
      const aggregatedMessage = aggregateFn(groupMessages);

      // Add metadata about aggregation using annotations
      if (!Array.isArray((aggregatedMessage as any).annotations)) {
        (aggregatedMessage as any).annotations = [];
      }

      // Add aggregation info as an annotation
      (aggregatedMessage as any).annotations.push({
        type: 'aggregation',
        aggregated: true,
        aggregatedCount: groupMessages.length,
        aggregatedIds: groupMessages.map(m => (m as any).id || '')
      });

      // Add the aggregated message to the result
      result.push(aggregatedMessage);

      // Mark the original messages as processed
      for (const message of groupMessages) {
        processedIds.add((message as any).id || '');
      }

      // Clear the group
      this.messageBuffer.delete(groupKey);
    }

    // Add any unprocessed messages from the original set
    for (const message of originalMessages) {
      if (!processedIds.has((message as any).id || '')) {
        result.push(message);
      }
    }

    logger.debug(`StreamAggregator: Aggregated ${processedIds.size} messages into ${result.length - (originalMessages.length - processedIds.size)} aggregated messages`);
    return result;
  }

  /**
   * Default aggregation function
   * @param {CoreMessage[]} messages - Messages to aggregate
   * @returns {CoreMessage} Aggregated message
   * @private
   */
  private defaultAggregate(messages: CoreMessage[]): CoreMessage {
    if (messages.length === 0) {
      throw new Error('Cannot aggregate empty message array');
    }

    // Use the first message as a template
    const template = messages[0];

    // Combine the string content of all messages
    let combinedStringContent = '';

    for (const message of messages) {
      if (typeof message.content === 'string') {
        if (combinedStringContent) {
          combinedStringContent += '\n\n';
        }
        combinedStringContent += message.content;
      }
      // Note: Non-string content (like ToolContent from tool messages) is effectively
      // ignored by this default string-focused aggregation logic.
      // Users may need to provide custom aggregation functions for complex ToolContent handling.
    }

    // Create the aggregated message
    if (template.role === 'tool') {
      // If the template message (and thus the aggregated message) is a tool message,
      // its content must be ToolContent (an array of tool parts).
      // We'll wrap the combined string content into a single ToolResultPart.
      let toolCallId = `aggregated-tool-call-${(template as any).id || Date.now()}`;
      let toolName = 'aggregatedToolResult';

      // Attempt to use toolCallId and toolName from the template's first tool part if available
      if (Array.isArray(template.content) && template.content.length > 0) {
        const firstPart = template.content[0];
        if (firstPart && typeof firstPart.toolCallId === 'string' && typeof firstPart.toolName === 'string') {
          toolCallId = firstPart.toolCallId; // Reusing ID implies this is a result for that call
          toolName = firstPart.toolName;
        }
      }

      return {
        ...template, // This copies role: 'tool' and other properties
        content: [ // ToolContent must be an array
          {
            type: 'tool-result',
            toolCallId: toolCallId,
            toolName: toolName,
            result: combinedStringContent, // The aggregated string content
          },
        ],
      };
    } else {
      // For other roles (e.g., 'user', 'assistant'), content is typically a string.
      return {
        ...template,
        content: combinedStringContent,
      };
    }
  }
}

  /** 
   * Common grouping functions that can be used with StreamAggregator 
   * @namespace CommonGroupings 
   */
export const CommonGroupings = {  /**
export const CommonGroupings = {  /**
   * Group by role
   * @returns {GroupingFunction} Grouping function
   * @memberof CommonGroupings
   */
  byRole: (): GroupingFunction => {
    return (message: CoreMessage) => message.role;
  },

  /**
   * Group by type
   * @returns {GroupingFunction} Grouping function
   * @memberof CommonGroupings
   */
  byType: (): GroupingFunction => {
    return (message: CoreMessage) => (message as any).type || 'text';
  },

  /**
   * Group by role and type
   * @returns {GroupingFunction} Grouping function
   * @memberof CommonGroupings
   */
  byRoleAndType: (): GroupingFunction => {
    return (message: CoreMessage) => `${message.role}:${(message as any).type || 'text'}`;
  },

  /**
   * Group by name
   * @returns {GroupingFunction} Grouping function
   * @memberof CommonGroupings
   */
  byName: (): GroupingFunction => {
    return (message: CoreMessage) => (message as any).name || 'unnamed';
  },

  /**
   * Group by content similarity
   * @param {number} [threshold=0.7] - Similarity threshold (0-1)
   * @returns {GroupingFunction} Grouping function
   * @memberof CommonGroupings
   */
  byContentSimilarity: (threshold: number = 0.7): GroupingFunction => {
    return (message: CoreMessage) => {
      // This is a placeholder - in a real implementation, you would use
      // a more sophisticated similarity algorithm
      if (typeof message.content === 'string') {
        // Use threshold to determine how much of the content to use for similarity
        // Higher threshold = more precise matching (using more content)
        const prefixLength = Math.max(20, Math.floor(message.content.length * threshold));

        // Simple hash-based grouping using prefix of content
        const hash = message.content.substring(0, prefixLength).toLowerCase().replace(/\s+/g, '');
        return `similarity:${hash.substring(0, 30)}`; // Limit hash length
      }
      return 'non-text';
    };
  }
};