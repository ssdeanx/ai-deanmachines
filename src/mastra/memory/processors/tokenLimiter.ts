/**
 * TokenLimiter processor for Mastra memory
 *
 * This processor counts tokens in retrieved memory messages and removes
 * oldest messages until the total count is below a specified limit.
 */

import { Message, MemoryProcessor } from '../types';
import { logger } from '../../index';

/**
 * Simple token counting function
 * This is a very rough approximation - in production, use a proper tokenizer
 * @param text - Text to count tokens for
 * @returns Approximate token count
 */
function countTokens(text: string): number {
  // Very rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

/**
 * TokenLimiter processor for memory messages
 * Prevents errors by limiting the total token count of memory messages
 */
export class TokenLimiter implements MemoryProcessor {
  private tokenLimit: number;

  /**
   * Create a new TokenLimiter
   * @param tokenLimit - Maximum number of tokens allowed
   */
  constructor(tokenLimit: number = 127000) {
    this.tokenLimit = tokenLimit;
  }

  /**
   * Process messages to limit token count
   * @param messages - Array of messages to process
   * @returns Filtered array of messages
   */
  process(messages: Message[]): Message[] {
    if (!messages || messages.length === 0) {
      return messages;
    }

    // Count tokens in all messages
    let totalTokens = 0;
    const messagesWithTokens = messages.map(message => {
      const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
      const tokens = countTokens(content);
      totalTokens += tokens;
      return { ...message, _tokens: tokens };
    });

    // If under limit, return original messages
    if (totalTokens <= this.tokenLimit) {
      logger.debug(`TokenLimiter: Total tokens ${totalTokens} is under limit ${this.tokenLimit}`);
      return messages;
    }

    // Sort by timestamp (oldest first) to remove oldest messages first
    const sortedMessages = [...messagesWithTokens].sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return aTime - bTime;
    });

    // Remove oldest messages until under token limit
    let tokensToRemove = totalTokens - this.tokenLimit;
    const removedMessages: Message[] = [];

    while (tokensToRemove > 0 && sortedMessages.length > 0) {
      const oldestMessage = sortedMessages.shift();
      if (oldestMessage) {
        tokensToRemove -= oldestMessage._tokens || 0;
        removedMessages.push(oldestMessage);
      }
    }

    logger.info(`TokenLimiter: Removed ${removedMessages.length} messages to stay under token limit`);

    // Return remaining messages in original order
    const remainingIds = new Set(sortedMessages.map(m => m.id));
    return messages.filter(m => remainingIds.has(m.id));
  }
}
