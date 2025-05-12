/**
 * @file ContextualSummarizer processor for Mastra memory
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This processor summarizes long conversation histories to reduce token usage
 * while preserving the most important context.
 */
import { CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the ContextualSummarizer processor
const logger = createLogger({
  name: 'Mastra-ContextualSummarizer',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * ContextualSummarizer processor for memory messages
 * Summarizes long conversation histories to reduce token usage
 * 
 * @class ContextualSummarizer
 * @extends {MemoryProcessor}
 */
export class ContextualSummarizer extends MemoryProcessor {
  private maxMessages: number;
  private summaryInterval: number;
  private preserveSystemMessages: boolean;
  private preserveRecentMessages: number;

  /**
   * Create a new ContextualSummarizer
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.maxMessages=50] - Maximum number of messages before summarization
   * @param {number} [options.summaryInterval=20] - Number of messages to summarize at once
   * @param {boolean} [options.preserveSystemMessages=true] - Whether to preserve system messages
   * @param {number} [options.preserveRecentMessages=10] - Number of recent messages to preserve
   */
  constructor(options: {
    maxMessages?: number;
    summaryInterval?: number;
    preserveSystemMessages?: boolean;
    preserveRecentMessages?: number;
  } = {}) {
    super({ name: 'ContextualSummarizer' });
    this.maxMessages = options.maxMessages || 50;
    this.summaryInterval = options.summaryInterval || 20;
    this.preserveSystemMessages = options.preserveSystemMessages !== false;
    this.preserveRecentMessages = options.preserveRecentMessages || 10;
  }

  /**
   * Process messages by summarizing older conversations
   * @param {CoreMessage[]} messages - Array of messages to process
   * @param {MemoryProcessorOpts} [opts={}] - MemoryProcessor options
   * @returns {CoreMessage[]} Processed array of messages with summaries
   * @override
   */
  process(messages: CoreMessage[], opts: MemoryProcessorOpts = {}): CoreMessage[] {
    if (!messages || messages.length === 0 || messages.length <= this.maxMessages) {
      return messages;
    }

    // Use opts to satisfy base signature
    void opts;

    logger.debug(`ContextualSummarizer: Processing ${messages.length} messages`);

    // Sort messages by timestamp (oldest first)
    const sortedMessages = [...messages].sort((a, b) => {
      const aTime = (a as any).timestamp ? new Date((a as any).timestamp).getTime() :
                   (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const bTime = (b as any).timestamp ? new Date((b as any).timestamp).getTime() :
                   (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
      return aTime - bTime;
    });

    // Preserve system messages if configured
    const systemMessages = this.preserveSystemMessages
      ? sortedMessages.filter(m => m.role === 'system')
      : [];

    // Preserve the most recent messages
    const recentMessages = sortedMessages.slice(-this.preserveRecentMessages);

    // Calculate how many older messages we need to summarize
    const messagesToSummarize = sortedMessages.slice(
      0,
      sortedMessages.length - this.preserveRecentMessages
    ).filter(m => m.role !== 'system' || !this.preserveSystemMessages);

    // If we don't have enough messages to summarize, return original messages
    if (messagesToSummarize.length <= this.summaryInterval) {
      return messages;
    }

    // Group older messages into chunks for summarization
    const chunks = [];
    for (let i = 0; i < messagesToSummarize.length; i += this.summaryInterval) {
      chunks.push(messagesToSummarize.slice(i, i + this.summaryInterval));
    }

    // Create summaries for each chunk
    const summaries = chunks.map(chunk => this.summarizeChunk(chunk))
      .filter((summary): summary is CoreMessage => summary !== null);

    // Combine system messages, summaries, and recent messages
    const result = [
      ...systemMessages,
      ...summaries,
      ...recentMessages
    ];

    logger.info(`ContextualSummarizer: Reduced ${messages.length} messages to ${result.length} messages with summaries`);
    return result;
  }

  /**
   * Summarize a chunk of messages
   * @param {CoreMessage[]} chunk - Array of messages to summarize
   * @returns {CoreMessage | null} A summary message or null if chunk is empty
   * @private
   */
  private summarizeChunk(chunk: CoreMessage[]): CoreMessage | null {
    if (chunk.length === 0) {
      return null;
    }

    // Get the first and last message timestamps for the summary timeframe
    const firstMessage = chunk[0];
    const lastMessage = chunk[chunk.length - 1];

    const firstTime = (firstMessage as any).timestamp ? new Date((firstMessage as any).timestamp) :
                     (firstMessage as any).createdAt ? new Date((firstMessage as any).createdAt) : new Date();

    const lastTime = (lastMessage as any).timestamp ? new Date((lastMessage as any).timestamp) :
                    (lastMessage as any).createdAt ? new Date((lastMessage as any).createdAt) : new Date();

    // Create a simple text summary of the conversation
    const userMessages = chunk.filter(m => m.role === 'user');
    const assistantMessages = chunk.filter(m => m.role === 'assistant');
    const toolMessages = chunk.filter(m => m.role === 'tool');

    // Extract key topics from messages (simple implementation)
    const allContent = chunk
      .map(m => typeof m.content === 'string' ? m.content : JSON.stringify(m.content))
      .join(' ');

    // Simple keyword extraction (in a real implementation, use NLP)
    const words = allContent.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    // Get top keywords
    const topKeywords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    // Create a summary message
    const summaryContent = `[SUMMARY: Conversation from ${firstTime.toISOString()} to ${lastTime.toISOString()}]
- ${userMessages.length} user messages, ${assistantMessages.length} assistant messages, ${toolMessages.length} tool interactions
- Key topics: ${topKeywords.join(', ')}
- This summary replaces ${chunk.length} messages to save context space`;

    // Create a summary message with the first message's thread ID
    return {
      id: `summary-${(firstMessage as any).id || ''}-${(lastMessage as any).id || ''}`,
      thread_id: (firstMessage as any).thread_id,
      content: summaryContent,
      role: 'system',
      name: 'summarizer',
      createdAt: new Date(),
      _summary: true,
      summarizedMessages: chunk.length
    } as CoreMessage; // Cast to CoreMessage to allow custom/extended properties
  }
}
