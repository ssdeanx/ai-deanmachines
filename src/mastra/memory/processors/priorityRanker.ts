/**
 * @file PriorityRanker processor for Mastra memory
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This processor ranks messages by importance and keeps only the most important ones
 * when context window size is limited.
 */
import { CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the PriorityRanker processor
const logger = createLogger({
  name: 'Mastra-PriorityRanker',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * PriorityRanker processor for memory messages
 * Ranks messages by importance and keeps only the most important ones
 * 
 * @class PriorityRanker
 * @extends {MemoryProcessor}
 */
export class PriorityRanker extends MemoryProcessor {
  private maxMessages: number;
  private preserveSystemMessages: boolean;
  private preserveRecentMessages: number;
  private importanceFactors: {
    recency: number;
    role: Record<string, number>;
    type: Record<string, number>;
    length: number;
    keywords: string[];
    keywordWeight: number;
  };

  /**
   * Create a new PriorityRanker
   * @param {Object} [options={}] - Configuration options
   * @param {number} [options.maxMessages=50] - Maximum number of messages to keep
   * @param {boolean} [options.preserveSystemMessages=true] - Whether to always preserve system messages
   * @param {number} [options.preserveRecentMessages=5] - Number of most recent messages to always preserve
   * @param {Object} [options.importanceFactors] - Factors to consider when ranking messages
   * @param {number} [options.importanceFactors.recency=0.5] - Weight for message recency
   * @param {Record<string, number>} [options.importanceFactors.role] - Weights for different message roles
   * @param {Record<string, number>} [options.importanceFactors.type] - Weights for different message types
   * @param {number} [options.importanceFactors.length=0.2] - Weight for message length
   * @param {string[]} [options.importanceFactors.keywords=[]] - Keywords to prioritize
   * @param {number} [options.importanceFactors.keywordWeight=0.8] - Weight for keyword matches
   */
  constructor(options: {
    maxMessages?: number;
    preserveSystemMessages?: boolean;
    preserveRecentMessages?: number;
    importanceFactors?: {
      recency?: number;
      role?: Record<string, number>;
      type?: Record<string, number>;
      length?: number;
      keywords?: string[];
      keywordWeight?: number;
    };
  } = {}) {
    super({ name: 'PriorityRanker' });
    this.maxMessages = options.maxMessages || 50;
    this.preserveSystemMessages = options.preserveSystemMessages !== false;
    this.preserveRecentMessages = options.preserveRecentMessages || 5;

    // Default importance factors
    this.importanceFactors = {
      recency: options.importanceFactors?.recency || 0.5,
      role: options.importanceFactors?.role || {
        system: 1.0,
        user: 0.8,
        assistant: 0.7,
        tool: 0.3
      },
      type: options.importanceFactors?.type || {
        text: 0.8,
        'tool-call': 0.4,
        'tool-result': 0.5
      },
      length: options.importanceFactors?.length || 0.2,
      keywords: options.importanceFactors?.keywords || [],
      keywordWeight: options.importanceFactors?.keywordWeight || 0.8
    };
  }

  /**
   * Process messages by ranking and filtering based on importance
   * @param {CoreMessage[]} messages - Array of messages to process
   * @param {MemoryProcessorOpts} [opts={}] - MemoryProcessor options
   * @returns {CoreMessage[]} Filtered array of messages
   * @override
   */
  process(messages: CoreMessage[], opts: MemoryProcessorOpts = {}): CoreMessage[] {
    if (!messages || messages.length === 0 || messages.length <= this.maxMessages) {
      return messages;
    }

    // Use opts to satisfy base signature
    void opts;

    logger.debug(`PriorityRanker: Ranking ${messages.length} messages by importance`);

    // Sort messages by timestamp (oldest first)
    const sortedMessages = [...messages].sort((a, b) => {
      const aTime = (a as any).timestamp ? new Date((a as any).timestamp).getTime() :
                   (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const bTime = (b as any).timestamp ? new Date((b as any).timestamp).getTime() :
                   (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
      return aTime - bTime;
    });

    // Always preserve system messages if configured
    const systemMessages = this.preserveSystemMessages
      ? sortedMessages.filter(m => m.role === 'system')
      : [];

    // Always preserve the most recent messages
    const recentMessages = sortedMessages.slice(-this.preserveRecentMessages);
    const recentIds = new Set(recentMessages.map(m => (m as any).id));

    // Calculate importance scores for remaining messages
    const messagesToRank = sortedMessages.filter(m =>
      (!this.preserveSystemMessages || m.role !== 'system') &&
      !recentIds.has((m as any).id)
    );

    // Calculate importance score for each message
    const scoredMessages = messagesToRank.map((message, index, array) => {
      const score = this.calculateImportance(message, index, array);
      return { ...message, _importanceScore: score };
    });

    // Sort by importance score (highest first)
    scoredMessages.sort((a, b) => (b as any)._importanceScore - (a as any)._importanceScore);

    // Take top messages up to the limit (accounting for system and recent messages)
    const remainingSlots = this.maxMessages - systemMessages.length - recentMessages.length;
    const topMessages = scoredMessages.slice(0, Math.max(0, remainingSlots));

    // Combine and sort by original order
    const result = [
      ...systemMessages,
      ...topMessages,
      ...recentMessages
    ].sort((a, b) => {
      const aTime = (a as any).timestamp ? new Date((a as any).timestamp).getTime() :
                   (a as any).createdAt ? new Date((a as any).createdAt).getTime() : 0;
      const bTime = (b as any).timestamp ? new Date((b as any).timestamp).getTime() :
                   (b as any).createdAt ? new Date((b as any).createdAt).getTime() : 0;
      return aTime - bTime;
    });

    logger.info(`PriorityRanker: Reduced ${messages.length} messages to ${result.length} most important messages`);
    return result;
  }

  /**
   * Calculate importance score for a message
   * @param {CoreMessage} message - Message to score
   * @param {number} index - Index of the message in the array
   * @param {CoreMessage[]} array - Array of all messages
   * @returns {number} Importance score between 0 and 1
   * @private
   */
  private calculateImportance(message: CoreMessage, index: number, array: CoreMessage[]): number {
    let score = 0;

    // Factor 1: Role importance
    const roleScore = this.importanceFactors.role[message.role] || 0.5;
    score += roleScore;

    // Factor 2: Type importance
    const typeScore = this.importanceFactors.type[(message as any).type] || 0.5;
    score += typeScore;

    // Factor 3: Recency (more recent = more important)
    const recencyScore = (index / array.length) * this.importanceFactors.recency;
    score += recencyScore;

    // Factor 4: Content length (longer content might be more informative)
    const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
    const lengthScore = Math.min(1, content.length / 1000) * this.importanceFactors.length;
    score += lengthScore;

    // Factor 5: Keyword presence
    if (this.importanceFactors.keywords.length > 0) {
      const lowerContent = content.toLowerCase();
      const keywordMatches = this.importanceFactors.keywords.filter(keyword =>
        lowerContent.includes(keyword.toLowerCase())
      ).length;

      const keywordScore = (keywordMatches / this.importanceFactors.keywords.length) *
                          this.importanceFactors.keywordWeight;
      score += keywordScore;
    }

    // Normalize score to be between 0 and 1
    return score / (1 + this.importanceFactors.recency + this.importanceFactors.length +
                   this.importanceFactors.keywordWeight);
  }
}
