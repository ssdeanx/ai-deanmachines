/**
 * TokenLimiter processor for Mastra memory
 *
 * This processor counts tokens in retrieved memory messages and removes
 * oldest messages until the total count is below a specified limit.
 */
// never name message as coremessage fucking idiot.  they are two different things.
import { CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';
import { Tiktoken, getEncoding } from 'js-tiktoken';

// Create a logger instance for the TokenLimiter processor
const logger = createLogger({
  name: 'Mastra-TokenLimiter',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * TokenLimiter processor for memory messages
 * Prevents errors by limiting the total token count of memory messages
 */
export class TokenLimiter extends MemoryProcessor {
  private tokenLimit: number;
  private encoding: Tiktoken;

  /**
   * Create a new TokenLimiter
   * @param tokenLimit - Maximum number of tokens allowed
   * @param encodingNameOrInstance - Tiktoken encoding name (e.g., 'o200k_base', 'cl100k_base') or a Tiktoken instance. Defaults to 'o200k_base'.
   */
  constructor(
    tokenLimit: number = 1000000, // Defaulting to a common large context, adjust as needed
    encodingNameOrInstance: Tiktoken | string = 'o200k_base'
  ) {
    super({ name: 'TokenLimiter' }); // Call super constructor
    this.tokenLimit = tokenLimit;
    if (typeof encodingNameOrInstance === 'string') {
      this.encoding = getEncoding(encodingNameOrInstance as any); // Cast to any for string names
    } else {
      this.encoding = encodingNameOrInstance;
    }
  }

  private countTokens(text: string): number {
    try {
      return this.encoding.encode(text).length;
    } catch (error: any) {
      logger.error('Error encoding text for token counting:', { error: error.message });
      return text.length / 4; // Fallback to rough estimate
    }
  }

  /**
   * Process messages to limit token count
   * @param messages - Array of messages to process
   * @param _opts - Options for memory processing (currently unused by this processor)
   * @returns Filtered array of messages
   */
  process(messages: CoreMessage[], _opts?: MemoryProcessorOpts): CoreMessage[] {
    void _opts; // Indicate _opts is intentionally unused

    if (!messages || messages.length === 0) {
      return messages;
    }

    let totalTokens = 0;
    const messagesWithTokens = messages.map((message, index) => {
      const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
      const tokens = this.countTokens(content);
      totalTokens += tokens;
      // Ensure a unique ID and a valid timestamp for sorting
      const id = (message as any).id || `msg-${index}-${new Date().getTime()}`;
      const timestamp = (message as any).createdAt || (message as any).timestamp || new Date(0);
      return { ...message, id, _tokens: tokens, _timestamp: new Date(timestamp) };
    });

    if (totalTokens <= this.tokenLimit) {
      logger.debug(`TokenLimiter: Total tokens ${totalTokens} is within limit ${this.tokenLimit}. No messages removed.`);
      return messages; // Return original messages if within limit
    }

    // Sort by timestamp (oldest first)
    const sortedMessages = [...messagesWithTokens].sort((a, b) => {
      return a._timestamp.getTime() - b._timestamp.getTime();
    });

    let removedCount = 0;
    const messagesToKeep: Array<typeof sortedMessages[0]> = [];
    let tokensForKeptMessages = 0;

    // Iterate from newest to oldest (end of sortedMessages to beginning) to decide what to keep
    for (let i = sortedMessages.length - 1; i >= 0; i--) {
      const message = sortedMessages[i];
      if (tokensForKeptMessages + (message._tokens || 0) <= this.tokenLimit) {
        messagesToKeep.unshift(message); // Add to the beginning to maintain newest first, then reverse for original-like order
        tokensForKeptMessages += message._tokens || 0;
      } else {
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      logger.info(`TokenLimiter: Removed ${removedCount} older messages to stay under token limit of ${this.tokenLimit}. Kept ${messagesToKeep.length} messages with ${tokensForKeptMessages} tokens.`);
    }

    // messagesToKeep is currently sorted newest-to-oldest because of unshift and reverse iteration.
    // To restore an order similar to the original (based on the subset of messages kept),
    // we filter the original 'messages' array using the IDs of messages in 'messagesToKeep'.
    const keptMessageIds = new Set(messagesToKeep.map(m => m.id));
    
    // Filter original messages to maintain their relative order
    const finalMessages = messages.filter(m => {
        // Need to find the corresponding ID used in messagesWithTokens if original message doesn't have one
        const mappedId = (m as any).id || messagesWithTokens.find(mwt => mwt.content === m.content && mwt.role === m.role)?.id;
        return keptMessageIds.has(mappedId);
    });


    // Fallback if ID mapping is imperfect, return the messagesToKeep directly (order will be newest to oldest)
    // This might happen if messages lack unique IDs and content/role isn't unique enough.
    if (finalMessages.length !== messagesToKeep.length) {
        logger.warn(`TokenLimiter: ID-based filtering resulted in a mismatch. Returning messages sorted by recency. Kept: ${messagesToKeep.length}, Filtered: ${finalMessages.length}`);
        // messagesToKeep is newest to oldest. If original order is critical and IDs are unreliable,
        // this part needs a more robust strategy (e.g. original index tracking).
        // For now, returning the content, even if order is just newest-first for the kept items.
        return messagesToKeep.map(m => {
          const { _tokens, _timestamp, ...rest } = m;
          return rest as CoreMessage;
        });
    }
    
    return finalMessages;
  }

  /**
   * Cleans up resources used by the Tiktoken encoding.
   * Call this when the processor is no longer needed.
   */
  free(): void {
    if (this.encoding && typeof (this.encoding as any).free === 'function') {
      (this.encoding as any).free();
    }
  }
}
