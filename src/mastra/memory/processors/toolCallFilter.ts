/**
 * @file ToolCallFilter processor for Mastra memory
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This processor removes tool calls from memory messages to save tokens
 * by excluding potentially verbose tool interactions.
 */
import { CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the ToolCallFilter processor
const logger = createLogger({
  name: 'Mastra-ToolCallFilter',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * ToolCallFilter processor for memory messages
 * Removes tool calls from memory messages to save tokens
 * 
 * @class ToolCallFilter
 * @extends {MemoryProcessor}
 */
export class ToolCallFilter extends MemoryProcessor {
  private excludeSet: Set<string>;

  /**
   * Create a new ToolCallFilter
   * @param {Object} [options={}] - Configuration options
   * @param {string[]} [options.exclude] - Array of tool names to remove; all other tool calls/results are preserved
   */
  constructor(options: { exclude?: string[] } = {}) {
    super({ name: 'ToolCallFilter' });
    this.excludeSet = new Set(options.exclude || []);
  }

  /**
   * Process messages to remove tool calls
   * @param {CoreMessage[]} messages - Array of messages to process
   * @param {MemoryProcessorOpts} [_opts={}] - Options for memory processing
   * @returns {CoreMessage[]} Filtered array of messages
   * @override
   */
  process(messages: CoreMessage[], _opts: MemoryProcessorOpts = {}): CoreMessage[] {
    // Use _opts to satisfy base signature
    void _opts;

    if (!messages || messages.length === 0) {
      return messages;
    }

    let removedCount = 0;
    const filtered = messages.filter(message => {
      const t = (message as any).type;
      if (t === 'tool-call' || t === 'tool-result') {
        const name = (message as any).name;
        // Remove only calls/results for tools in excludeSet
        if (this.excludeSet.size === 0 || this.excludeSet.has(name)) {
          removedCount++;
          return false;
        }
        return true;
      }
      return true;
    });

    if (removedCount > 0) {
      logger.debug(`ToolCallFilter: Removed ${removedCount} tool call messages`);
    }

    return filtered;
  }
}