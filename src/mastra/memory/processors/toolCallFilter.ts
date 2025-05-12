/**
 * ToolCallFilter processor for Mastra memory
 *
 * This processor removes tool calls from memory messages to save tokens
 * by excluding potentially verbose tool interactions.
 */

import { Message, MemoryProcessor } from '../types';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the ToolCallFilter processor
const logger = createLogger({
  name: 'Mastra-ToolCallFilter',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * ToolCallFilter processor for memory messages
 * Removes tool calls from memory messages to save tokens
 */
export class ToolCallFilter implements MemoryProcessor {
  private removeAllToolCalls: boolean;
  private keepToolNames: boolean;

  /**
   * Create a new ToolCallFilter
   * @param options - Configuration options
   */
  constructor(options: { removeAllToolCalls?: boolean; keepToolNames?: boolean } = {}) {
    this.removeAllToolCalls = options.removeAllToolCalls ?? false;
    this.keepToolNames = options.keepToolNames ?? true;
  }

  /**
   * Process messages to remove tool calls
   * @param messages - Array of messages to process
   * @returns Filtered array of messages
   */
  process(messages: Message[]): Message[] {
    if (!messages || messages.length === 0) {
      return messages;
    }

    let toolCallsRemoved = 0;

    // Process each message to filter tool calls
    const processedMessages = messages.map(message => {
      // Skip non-tool messages or if we're not removing all tool calls
      if (message.type !== 'tool-call' && !this.removeAllToolCalls) {
        return message;
      }

      // For tool messages, create a simplified version
      if (message.type === 'tool-call') {
        toolCallsRemoved++;

        // If we want to keep tool names, create a simplified message
        if (this.keepToolNames) {
          return {
            ...message,
            content: `[Tool call: ${message.name || 'unknown tool'}]`,
            _filtered: true
          };
        }

        // Otherwise, mark for removal
        return { ...message, _remove: true };
      }

      // For other messages, check if they contain tool calls in content
      if (typeof message.content === 'string' && message.content.includes('```tool')) {
        // Simple regex to find tool call blocks
        const toolCallRegex = /```tool[\s\S]*?```/g;
        const updatedContent = message.content.replace(toolCallRegex, '[Tool call removed]');

        if (updatedContent !== message.content) {
          toolCallsRemoved++;
          return { ...message, content: updatedContent, _filtered: true };
        }
      }

      return message;
    });

    // Filter out messages marked for removal
    const filteredMessages = processedMessages.filter(m => !m._remove);

    if (toolCallsRemoved > 0) {
      logger.debug(`ToolCallFilter: Removed or simplified ${toolCallsRemoved} tool calls`);
    }

    return filteredMessages;
  }
}
