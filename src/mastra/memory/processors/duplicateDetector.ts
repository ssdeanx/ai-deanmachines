/**
 * DuplicateDetector processor for Mastra memory
 *
 * This processor identifies and removes duplicate or highly similar messages
 * to reduce redundancy in the context window.
 */

import { Message, MemoryProcessor } from '../types';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the DuplicateDetector processor
const logger = createLogger({
  name: 'Mastra-DuplicateDetector',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * DuplicateDetector processor for memory messages
 * Identifies and removes duplicate or highly similar messages
 */
export class DuplicateDetector implements MemoryProcessor {
  private similarityThreshold: number;
  private compareContent: boolean;
  private ignoreCase: boolean;
  private ignoreWhitespace: boolean;
  private preserveNewest: boolean;

  /**
   * Create a new DuplicateDetector
   * @param options - Configuration options
   */
  constructor(options: {
    similarityThreshold?: number;
    compareContent?: boolean;
    ignoreCase?: boolean;
    ignoreWhitespace?: boolean;
    preserveNewest?: boolean;
  } = {}) {
    this.similarityThreshold = options.similarityThreshold || 0.9;
    this.compareContent = options.compareContent !== false;
    this.ignoreCase = options.ignoreCase !== false;
    this.ignoreWhitespace = options.ignoreWhitespace !== false;
    this.preserveNewest = options.preserveNewest !== false;
  }

  /**
   * Process messages by removing duplicates
   * @param messages - Array of messages to process
   * @returns Filtered array of messages
   */
  process(messages: Message[]): Message[] {
    if (!messages || messages.length <= 1) {
      return messages;
    }

    logger.debug(`DuplicateDetector: Checking ${messages.length} messages for duplicates`);

    // Sort messages by timestamp (newest first if preserveNewest, otherwise oldest first)
    const sortedMessages = [...messages].sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() :
                   a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() :
                   b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return this.preserveNewest ? bTime - aTime : aTime - bTime;
    });

    // Track which messages to keep
    const uniqueMessages: Message[] = [];
    const duplicateIds: Set<string> = new Set();

    // Process each message
    for (const message of sortedMessages) {
      // Skip if already marked as duplicate
      if (duplicateIds.has(message.id)) {
        continue;
      }

      // Check if this message is similar to any we're keeping
      let isDuplicate = false;
      for (const uniqueMessage of uniqueMessages) {
        if (this.isSimilar(message, uniqueMessage)) {
          isDuplicate = true;
          duplicateIds.add(message.id);
          break;
        }
      }

      // If not a duplicate, add to unique messages
      if (!isDuplicate) {
        uniqueMessages.push(message);
      }
    }

    // If we're preserving newest, we need to sort back to chronological order
    if (this.preserveNewest) {
      uniqueMessages.sort((a, b) => {
        const aTime = a.timestamp ? new Date(a.timestamp).getTime() :
                     a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.timestamp ? new Date(b.timestamp).getTime() :
                     b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return aTime - bTime;
      });
    }

    const removedCount = messages.length - uniqueMessages.length;
    if (removedCount > 0) {
      logger.info(`DuplicateDetector: Removed ${removedCount} duplicate messages`);
    }

    return uniqueMessages;
  }

  /**
   * Check if two messages are similar
   * @param a - First message
   * @param b - Second message
   * @returns True if messages are similar, false otherwise
   */
  private isSimilar(a: Message, b: Message): boolean {
    // If messages have different roles or types, they're not duplicates
    if (a.role !== b.role || a.type !== b.type) {
      return false;
    }

    // If not comparing content, only check for exact ID match
    if (!this.compareContent) {
      return a.id === b.id;
    }

    // Get content strings
    const contentA = typeof a.content === 'string' ? a.content : JSON.stringify(a.content);
    const contentB = typeof b.content === 'string' ? b.content : JSON.stringify(b.content);

    // Normalize content if needed
    let normalizedA = contentA;
    let normalizedB = contentB;

    if (this.ignoreCase) {
      normalizedA = normalizedA.toLowerCase();
      normalizedB = normalizedB.toLowerCase();
    }

    if (this.ignoreWhitespace) {
      normalizedA = normalizedA.replace(/\s+/g, ' ').trim();
      normalizedB = normalizedB.replace(/\s+/g, ' ').trim();
    }

    // Check for exact match after normalization
    if (normalizedA === normalizedB) {
      return true;
    }

    // Check similarity using Levenshtein distance
    const similarity = this.calculateSimilarity(normalizedA, normalizedB);
    return similarity >= this.similarityThreshold;
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * @param a - First string
   * @param b - Second string
   * @returns Similarity score between 0 and 1
   */
  private calculateSimilarity(a: string, b: string): number {
    // For very long strings, use a simpler approach
    if (a.length > 1000 || b.length > 1000) {
      return this.calculateSimpleSimilarity(a, b);
    }

    // Calculate Levenshtein distance
    const distance = this.levenshteinDistance(a, b);
    const maxLength = Math.max(a.length, b.length);

    // Convert distance to similarity (1 - normalized distance)
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  /**
   * Calculate a simpler similarity metric for long strings
   * @param a - First string
   * @param b - Second string
   * @returns Similarity score between 0 and 1
   */
  private calculateSimpleSimilarity(a: string, b: string): number {
    // Use character frequency comparison for long strings
    const freqA = this.getCharFrequency(a);
    const freqB = this.getCharFrequency(b);

    // Calculate cosine similarity of character frequencies
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (const char in freqA) {
      magnitudeA += freqA[char] * freqA[char];
    }

    for (const char in freqB) {
      magnitudeB += freqB[char] * freqB[char];
    }

    for (const char in freqA) {
      if (freqB[char]) {
        dotProduct += freqA[char] * freqB[char];
      }
    }

    const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Get character frequency map for a string
   * @param str - Input string
   * @returns Map of character frequencies
   */
  private getCharFrequency(str: string): Record<string, number> {
    const freq: Record<string, number> = {};
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param a - First string
   * @param b - Second string
   * @returns Levenshtein distance
   */
  private levenshteinDistance(a: string, b: string): number {
    // Create matrix
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = a[j - 1] === b[i - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  }
}
