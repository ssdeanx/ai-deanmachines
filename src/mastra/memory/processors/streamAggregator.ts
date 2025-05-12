/**
 * StreamAggregator processor for Mastra memory
 *
 * This processor aggregates and summarizes multiple messages in real-time as they flow through the memory system.
 * It can be used to reduce noise, combine related messages, and extract key information from message streams.
 */
// never name message as coremessage fucking idiot.  they are two different things.
import { Message, CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the StreamAggregator processor
const logger = createLogger({
  name: 'Mastra-StreamAggregator',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Type for message grouping function
 */
export type GroupingFunction = (message: CoreMessage) => string;

/**
 * Type for message aggregation function
 */
export type AggregationFunction = (messages: CoreMessage[]) => CoreMessage;

/**
 * StreamAggregator processor for memory messages
 * Aggregates and summarizes multiple messages in real-time
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
   * @param options - Configuration options
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
      (message) => `${message.role}:${message.role}`
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
   * @param fn - Grouping function to add
   */
  addGroupingFunction(fn: GroupingFunction): void {
    this.groupingFunctions.push(fn);
  }

  /**
   * Add an aggregation function for a specific group
   * @param groupKey - Group key to add the function for
   * @param fn - Aggregation function to add
   */
  addAggregationFunction(groupKey: string, fn: AggregationFunction): void {
    this.aggregationFunctions[groupKey] = fn;
  }

  /**
   * Set the default aggregation function
   * @param fn - Default aggregation function
   */
  setDefaultAggregationFunction(fn: AggregationFunction): void {
    this.defaultAggregationFunction = fn;
  }

  /**
   * Process messages by aggregating related ones
   * @param messages - Array of messages to process
   * @param _opts - Optional processor options
   * @returns Processed array of messages
   */
  process(messages: CoreMessage[], _opts: MemoryProcessorOpts = {}): CoreMessage[] {
    if (!messages || messages.length === 0) {
      return messages;
    }

    // Check if we need to process the buffer due to time window
    const currentTime = Date.now();
    const timeElapsed = currentTime - this.lastProcessTime;
    const forceProcess = timeElapsed >= this.timeWindowMs;

    // Add new messages to the buffer
    for (const message of messages) {
      // Skip messages that don't match role or type filters
      if (!this.applyToRoles.has(message.role) || !this.applyToTypes.has(message.type)) {
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
   * @param originalMessages - Original messages
   * @returns Processed messages
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
        processedIds.add(message.id);
      }

      // Clear the group
      this.messageBuffer.delete(groupKey);
    }

    // Add any unprocessed messages from the original set
    for (const message of originalMessages) {
      if (!processedIds.has(message.id)) {
        result.push(message);
      }
    }

    logger.debug(`StreamAggregator: Aggregated ${processedIds.size} messages into ${result.length - (originalMessages.length - processedIds.size)} aggregated messages`);
    return result;
  }

  /**
   * Default aggregation function
   * @param messages - Messages to aggregate
   * @returns Aggregated message
   */
  private defaultAggregate(messages: CoreMessage[]): CoreMessage {
    if (messages.length === 0) {
      throw new Error('Cannot aggregate empty message array');
    }

    // Use the first message as a template
    const template = messages[0];

    // Combine the content of all messages
    let combinedContent = '';

    for (const message of messages) {
      if (typeof message.content === 'string') {
        if (combinedContent) {
          combinedContent += '\n\n';
        }
        combinedContent += message.content;
      }
    }

    // Create the aggregated message
    return {
      role: template.role,
      content: combinedContent,
      // Add any additional properties needed for CoreMessage
      name: (template as any).name,
      function_call: (template as any).function_call,
      tool_calls: (template as any).tool_calls,
      tool_call_id: (template as any).tool_call_id,
      annotations: (template as any).annotations || []
    };
  }
}

/**
 * Common grouping functions
 */
export const CommonGroupings = {
  /**
   * Group by role
   * @returns Grouping function
   */
  byRole: (): GroupingFunction => {
    return (message: CoreMessage) => message.role;
  },

  /**
   * Group by type
   * @returns Grouping function
   */
  byType: (): GroupingFunction => {
    return (message: CoreMessage) => (message as any).type || 'text';
  },

  /**
   * Group by role and type
   * @returns Grouping function
   */
  byRoleAndType: (): GroupingFunction => {
    return (message: CoreMessage) => `${message.role}:${(message as any).type || 'text'}`;
  },

  /**
   * Group by name
   * @returns Grouping function
   */
  byName: (): GroupingFunction => {
    return (message: CoreMessage) => message.name || 'unnamed';
  },

  /**
   * Group by content similarity
   * @param threshold - Similarity threshold (0-1)
   * @returns Grouping function
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
