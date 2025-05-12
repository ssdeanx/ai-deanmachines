/**
 * SentimentAnalyzer processor for Mastra memory
 *
 * This processor analyzes the sentiment of messages and adds sentiment
 * information as metadata or annotations.
 */

import { Message, MemoryProcessor } from '../types';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the SentimentAnalyzer processor
const logger = createLogger({
  name: 'Mastra-SentimentAnalyzer',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Sentiment score type
 */
export interface SentimentScore {
  score: number;  // -1 to 1 (negative to positive)
  label: 'negative' | 'neutral' | 'positive';
  confidence: number;  // 0 to 1
}

/**
 * SentimentAnalyzer processor for memory messages
 * Analyzes the sentiment of messages
 */
export class SentimentAnalyzer implements MemoryProcessor {
  private addSentimentAnnotations: boolean;
  private extractToMetadata: boolean;
  private analyzeUserMessages: boolean;
  private analyzeAssistantMessages: boolean;
  private analyzeSystemMessages: boolean;
  private analyzeToolMessages: boolean;
  private positiveThreshold: number;
  private negativeThreshold: number;
  private sentimentWords: {
    positive: string[];
    negative: string[];
    intensifiers: string[];
  };

  /**
   * Create a new SentimentAnalyzer
   * @param options - Configuration options
   */
  constructor(options: {
    addSentimentAnnotations?: boolean;
    extractToMetadata?: boolean;
    analyzeUserMessages?: boolean;
    analyzeAssistantMessages?: boolean;
    analyzeSystemMessages?: boolean;
    analyzeToolMessages?: boolean;
    positiveThreshold?: number;
    negativeThreshold?: number;
    sentimentWords?: {
      positive?: string[];
      negative?: string[];
      intensifiers?: string[];
    };
  } = {}) {
    this.addSentimentAnnotations = options.addSentimentAnnotations !== false;
    this.extractToMetadata = options.extractToMetadata !== false;
    this.analyzeUserMessages = options.analyzeUserMessages !== false;
    this.analyzeAssistantMessages = options.analyzeAssistantMessages !== false;
    this.analyzeSystemMessages = options.analyzeSystemMessages || false;
    this.analyzeToolMessages = options.analyzeToolMessages || false;
    this.positiveThreshold = options.positiveThreshold || 0.05;
    this.negativeThreshold = options.negativeThreshold || -0.05;

    // Initialize sentiment word lists
    this.sentimentWords = {
      positive: options.sentimentWords?.positive || this.getDefaultPositiveWords(),
      negative: options.sentimentWords?.negative || this.getDefaultNegativeWords(),
      intensifiers: options.sentimentWords?.intensifiers || this.getDefaultIntensifiers()
    };
  }

  /**
   * Process messages by analyzing sentiment
   * @param messages - Array of messages to process
   * @returns Processed array of messages
   */
  process(messages: Message[]): Message[] {
    if (!messages || messages.length === 0) {
      return messages;
    }

    logger.debug(`SentimentAnalyzer: Processing ${messages.length} messages`);

    return messages.map(message => {
      // Skip messages based on role configuration
      if (
        (message.role === 'user' && !this.analyzeUserMessages) ||
        (message.role === 'assistant' && !this.analyzeAssistantMessages) ||
        (message.role === 'system' && !this.analyzeSystemMessages) ||
        (message.role === 'tool' && !this.analyzeToolMessages)
      ) {
        return message;
      }

      // Skip non-string content
      if (typeof message.content !== 'string') {
        return message;
      }

      // Analyze sentiment
      const sentiment = this.analyzeSentiment(message.content);

      // Create a copy of the message to modify
      const processedMessage = { ...message };

      // Add sentiment to message metadata
      if (this.extractToMetadata) {
        processedMessage._sentiment = sentiment;
      }

      // Add sentiment annotations to content if configured
      if (this.addSentimentAnnotations) {
        processedMessage.content = this.annotateContent(message.content, sentiment);
      }

      return processedMessage;
    });
  }

  /**
   * Analyze sentiment of text content
   * @param content - Text content to analyze
   * @returns Sentiment score
   */
  private analyzeSentiment(content: string): SentimentScore {
    // Normalize text: lowercase and remove punctuation
    const normalizedText = content.toLowerCase().replace(/[^\w\s]/g, '');
    const words = normalizedText.split(/\s+/);

    // Count sentiment words
    let positiveCount = 0;
    let negativeCount = 0;
    let intensifierCount = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      // Check for intensifiers
      const isIntensified = i > 0 && this.sentimentWords.intensifiers.includes(words[i - 1]);
      const intensifierMultiplier = isIntensified ? 2 : 1;

      // Count intensifiers
      if (this.sentimentWords.intensifiers.includes(word)) {
        intensifierCount++;
      }

      // Count positive words
      if (this.sentimentWords.positive.includes(word)) {
        positiveCount += intensifierMultiplier;
      }

      // Count negative words
      if (this.sentimentWords.negative.includes(word)) {
        negativeCount += intensifierMultiplier;
      }
    }

    // Calculate sentiment score
    const totalSentimentWords = positiveCount + negativeCount;
    const score = totalSentimentWords === 0
      ? 0
      : (positiveCount - negativeCount) / (positiveCount + negativeCount);

    // Determine sentiment label
    let label: 'negative' | 'neutral' | 'positive';
    if (score >= this.positiveThreshold) {
      label = 'positive';
    } else if (score <= this.negativeThreshold) {
      label = 'negative';
    } else {
      label = 'neutral';
    }

    // Calculate confidence based on number of sentiment words
    const confidence = Math.min(1, totalSentimentWords / 10);

    return { score, label, confidence };
  }

  /**
   * Annotate content with sentiment information
   * @param content - Original content
   * @param sentiment - Sentiment score
   * @returns Annotated content
   */
  private annotateContent(content: string, sentiment: SentimentScore): string {
    // Format sentiment score as percentage
    const scorePercent = Math.round(sentiment.score * 100);

    // Create emoji based on sentiment
    let emoji = '😐';
    if (sentiment.score >= 0.5) emoji = '😄';
    else if (sentiment.score >= 0.2) emoji = '🙂';
    else if (sentiment.score <= -0.5) emoji = '😠';
    else if (sentiment.score <= -0.2) emoji = '🙁';

    // Create annotation text
    const annotation = `\n\nSentiment: ${emoji} ${sentiment.label} (${scorePercent}%)`;

    return content + annotation;
  }

  /**
   * Get default positive sentiment words
   * @returns Array of positive words
   */
  private getDefaultPositiveWords(): string[] {
    return [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'terrific', 'outstanding', 'superb', 'brilliant', 'awesome',
      'happy', 'glad', 'pleased', 'delighted', 'satisfied', 'content',
      'joy', 'joyful', 'love', 'loving', 'like', 'enjoy', 'enjoyed',
      'positive', 'beautiful', 'perfect', 'best', 'better', 'impressive',
      'thank', 'thanks', 'grateful', 'appreciate', 'appreciated',
      'helpful', 'useful', 'valuable', 'beneficial', 'effective',
      'success', 'successful', 'accomplish', 'accomplished', 'achievement',
      'recommend', 'recommended', 'worth', 'worthy', 'worthwhile'
    ];
  }

  /**
   * Get default negative sentiment words
   * @returns Array of negative words
   */
  private getDefaultNegativeWords(): string[] {
    return [
      'bad', 'terrible', 'horrible', 'awful', 'poor', 'disappointing',
      'disappointed', 'dissatisfied', 'unhappy', 'sad', 'upset', 'angry',
      'annoyed', 'frustrated', 'irritated', 'hate', 'dislike', 'despise',
      'negative', 'ugly', 'worst', 'worse', 'fail', 'failed', 'failure',
      'problem', 'issue', 'trouble', 'difficult', 'hard', 'complicated',
      'confusing', 'confused', 'mistake', 'error', 'wrong', 'incorrect',
      'useless', 'worthless', 'waste', 'wasted', 'ineffective',
      'inadequate', 'insufficient', 'mediocre', 'subpar', 'unacceptable',
      'complaint', 'complain', 'complained', 'sorry', 'apology', 'apologize'
    ];
  }

  /**
   * Get default intensifier words
   * @returns Array of intensifier words
   */
  private getDefaultIntensifiers(): string[] {
    return [
      'very', 'extremely', 'incredibly', 'really', 'truly', 'absolutely',
      'completely', 'totally', 'utterly', 'highly', 'especially',
      'particularly', 'exceptionally', 'remarkably', 'notably',
      'decidedly', 'exceedingly', 'immensely', 'intensely', 'strongly',
      'deeply', 'profoundly', 'thoroughly', 'entirely', 'fully',
      'quite', 'rather', 'somewhat', 'fairly', 'pretty', 'so', 'too'
    ];
  }
}
