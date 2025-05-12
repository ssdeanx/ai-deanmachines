/**
 * ToolCallFilter processor for Mastra memory
 *
 * This processor removes tool calls from memory messages to save tokens
 * by excluding potentially verbose tool interactions.
 */
// never name message as coremessage fucking idiot.  they are two different things.
import { Message, CoreMessage } from 'ai';
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
 */
export class ToolCallFilter extends MemoryProcessor {
  private removeAllToolCalls: boolean;
  private keepToolNames: boolean;

  /**
   * Create a new ToolCallFilter
   * @param options.removeAllToolCalls - Whether to remove all tool calls
   * @param options.keepToolNames - Whether to keep tool names in simplified messages
   */
  constructor(options: { removeAllToolCalls?: boolean; keepToolNames?: boolean } = {}) {
    super({ name: 'ToolCallFilter' });
    // Initialize options
    this.removeAllToolCalls = options.removeAllToolCalls ?? false;
    this.keepToolNames = options.keepToolNames ?? true;
  }

  /**
   * Process messages to remove tool calls
   * @param messages - Array of messages to process
   * @param _opts - Options for memory processing
   * @returns Filtered array of messages
   */
  process(messages: CoreMessage[], _opts: MemoryProcessorOpts = {}): CoreMessage[] {
    // Use _opts to satisfy base signature
    void _opts;

    if (!messages || messages.length === 0) {
      return messages;
    }

    let removedCount = 0;
    const processedMessages: Array<CoreMessage | null> = messages.map(message => {
      // Skip non-tool messages or if not removing all tool calls
      const t = (message as any).type;
      if (t !== 'tool-call' && (!this.removeAllToolCalls || t !== 'tool-result')) {
        return message;
      }

      // Handle explicit tool-call messages
      if ((message as any).type === 'tool-call') {
        if (this.keepToolNames) {
          // Simplify tool-call to a text message preserving tool name
          return {
            role: message.role,
            content: `[Tool call: ${(message as any).name || 'unknown tool'}]`,
            type: 'text'
          } as CoreMessage;
        }
        // Otherwise, remove message completely
        return null;
      }

      // Remove any code blocks from non-tool messages
      if (typeof message.content === 'string' && message.content.includes('```')) {
        const toolCallRegex = /```[\s\S]*?```/g;
        const updatedContent = message.content.replace(toolCallRegex, '');
        if (updatedContent !== message.content) {
          return {
            role: message.role,
            content: updatedContent
          } as CoreMessage;
        }
      }

      return message;
    });

    // Filter out removed messages
    const filteredMessages = processedMessages.filter((m): m is CoreMessage => m !== null);

    if (removedCount > 0) {
      logger.debug(`ToolCallFilter: Removed ${removedCount} tool call messages`);
    }

    return filteredMessages;
  }
}