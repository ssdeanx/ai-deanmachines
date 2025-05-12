/**
 * @file SentimentAnalyzer processor for Mastra memory
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This processor analyzes the sentiment of messages and adds sentiment scores
 * to message metadata for use in memory processing and agent responses.
 */
import { CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the SentimentAnalyzer processor
const logger = createLogger({
  name: 'Mastra-SentimentAnalyzer',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Sentiment score interface
 * @interface SentimentScore
 * @property {number} positive - Positive sentiment score (0-1)
 * @property {number} negative - Negative sentiment score (0-1)
 * @property {number} neutral - Neutral sentiment score (0-1)
 * @property {string} overall - Overall sentiment classification ('positive', 'negative', 'neutral')
 * @property {number} compound - Compound sentiment score (-1 to 1)
 */
export interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
  overall: 'positive' | 'negative' | 'neutral';
  compound: number;
}

/**
 * Sentiment analysis options
 * @interface SentimentAnalysisOptions
 * @property {boolean} [addToMetadata=true] - Whether to add sentiment scores to message metadata
 * @property {boolean} [addToContent=false] - Whether to add sentiment annotations to message content
 * @property {string[]} [applyToRoles=['user', 'assistant']] - Message roles to analyze
 * @property {number} [positiveThreshold=0.05] - Threshold for positive sentiment classification
 * @property {number} [negativeThreshold=-0.05] - Threshold for negative sentiment classification
 */
export interface SentimentAnalysisOptions {
  addToMetadata?: boolean;
  addToContent?: boolean;
  applyToRoles?: string[];
  positiveThreshold?: number;
  negativeThreshold?: number;
}

/**
 * SentimentAnalyzer processor for memory messages
 * Analyzes sentiment of messages and adds scores to metadata
 * 
 * @class SentimentAnalyzer
 * @extends {MemoryProcessor}
 */
export class SentimentAnalyzer extends MemoryProcessor {
  private options: SentimentAnalysisOptions;
  private applyToRoles: Set<string>;
  private positiveWords: Set<string>;
  private negativeWords: Set<string>;
  private intensifiers: Set<string>;
  private negators: Set<string>;

  /**
   * Create a new SentimentAnalyzer
   * @param {SentimentAnalysisOptions} [options={}] - Configuration options
   */
  constructor(options: SentimentAnalysisOptions = {}) {
    super({ name: 'SentimentAnalyzer' });
    this.options = {
      addToMetadata: options.addToMetadata !== false,
      addToContent: options.addToContent || false,
      positiveThreshold: options.positiveThreshold || 0.05,
      negativeThreshold: options.negativeThreshold || -0.05
    };
    this.applyToRoles = new Set(options.applyToRoles || ['user', 'assistant']);
    
    // Initialize sentiment lexicons
    this.positiveWords = new Set(this.getPositiveWords());
    this.negativeWords = new Set(this.getNegativeWords());
    this.intensifiers = new Set(this.getIntensifiers());
    this.negators = new Set(this.getNegators());
  }

  /**
   * Process messages by analyzing sentiment
   * @param {CoreMessage[]} messages - Array of messages to process
   * @param {MemoryProcessorOpts} [opts={}] - MemoryProcessor options
   * @returns {CoreMessage[]} Processed array of messages with sentiment analysis
   * @override
   */
  process(messages: CoreMessage[], opts: MemoryProcessorOpts = {}): CoreMessage[] {
    if (!messages || messages.length === 0) {
      return messages;
    }

    // Use opts to satisfy base signature
    void opts;

    logger.debug(`SentimentAnalyzer: Analyzing ${messages.length} messages`);

    // Process each message
    return messages.map(message => {
      // Skip messages with non-string content or not in applyToRoles
      if (typeof message.content !== 'string' || !this.applyToRoles.has(message.role)) {
        return message;
      }

      // Analyze sentiment
      const sentiment = this.analyzeSentiment(message.content);

      // Create a copy of the message to modify
      const processedMessage = { ...message };

      // Add sentiment to metadata if configured
      if (this.options.addToMetadata) {
        (processedMessage as any).metadata = (processedMessage as any).metadata || {};
        (processedMessage as any).metadata.sentiment = sentiment;
      }

      // Add sentiment annotation to content if configured
      if (this.options.addToContent) {
        processedMessage.content = this.addSentimentAnnotation(message.content, sentiment);
      }

      return processedMessage;
    });
  }

  /**
   * Analyze sentiment of text content
   * @param {string} content - Text content to analyze
   * @returns {SentimentScore} Sentiment analysis results
   * @private
   */
  private analyzeSentiment(content: string): SentimentScore {
    // Tokenize and normalize text
    const words = content.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0);

    if (words.length === 0) {
      return {
        positive: 0,
        negative: 0,
        neutral: 1,
        overall: 'neutral',
        compound: 0
      };
    }

    let positiveScore = 0;
    let negativeScore = 0;
    let negationActive = false;
    let intensifierActive = 1;

    // Analyze each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      
      // Check for negators
      if (this.negators?.has(word)) {
        negationActive = true;
        continue;
      }
      
      // Check for intensifiers
      if (this.intensifiers?.has(word)) {
        intensifierActive = 1.5;
        continue;
      }
      
      // Check sentiment
      if (this.positiveWords?.has(word)) {
        if (negationActive) {
          negativeScore += 1 * intensifierActive;
        } else {
          positiveScore += 1 * intensifierActive;
        }
      } else if (this.negativeWords?.has(word)) {
        if (negationActive) {
          positiveScore += 0.5 * intensifierActive; // Negated negative is less positive
        } else {
          negativeScore += 1 * intensifierActive;
        }
      }
      
      // Reset modifiers after 3 words or at punctuation
      if (i > 0 && (i % 3 === 0 || word.match(/[.!?;]/))) {
        negationActive = false;
        intensifierActive = 1;
      }
    }

    // Normalize scores
    const total = words.length;
    const normalizedPositive = positiveScore / total;
    const normalizedNegative = negativeScore / total;
    const normalizedNeutral = 1 - (normalizedPositive + normalizedNegative);
    
    // Calculate compound score (-1 to 1)
    const compound = (normalizedPositive - normalizedNegative) * 
                     (1 - Math.pow(Math.E, -(positiveScore + negativeScore)));
    
    // Determine overall sentiment
    let overall: 'positive' | 'negative' | 'neutral';
    if (compound >= (this.options?.positiveThreshold ?? 0.05)) {
      overall = 'positive';
    } else if (compound <= (this.options?.negativeThreshold ?? -0.05)) {
      overall = 'negative';
    } else {
      overall = 'neutral';
    }

    return {
      positive: normalizedPositive,
      negative: normalizedNegative,
      neutral: normalizedNeutral,
      overall,
      compound
    };
  }
  /**
   * Add sentiment annotation to message content
   * @param {string} content - Original message content
   * @param {SentimentScore} sentiment - Sentiment analysis results
   * @returns {string} Content with sentiment annotation
   * @private
   */
  private addSentimentAnnotation(content: string, sentiment: SentimentScore): string {
    const emoji = sentiment.overall === 'positive' ? '😊' : 
                 sentiment.overall === 'negative' ? '😟' : '😐';
                 
    const annotation = `\n\n[Sentiment: ${sentiment.overall} ${emoji} (${sentiment.compound.toFixed(2)})]`;
    
    return content + annotation;
  }

  /**
   * Get list of positive sentiment words
   * @returns {string[]} Array of positive words
   * @private
   */
  private getPositiveWords(): string[] {
    return [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
      'happy', 'glad', 'pleased', 'delighted', 'joyful', 'excited',
      'love', 'like', 'enjoy', 'appreciate', 'admire', 'adore',
      'beautiful', 'brilliant', 'perfect', 'outstanding', 'superb',
      'helpful', 'useful', 'beneficial', 'valuable', 'effective',
      'success', 'successful', 'achievement', 'accomplish', 'win',
      'best', 'better', 'improve', 'improved', 'improving',
      'recommend', 'recommended', 'positive', 'optimistic',
      'thank', 'thanks', 'thankful', 'gratitude', 'grateful',
      'impressive', 'impressed', 'impress', 'awesome', 'cool',
      'nice', 'pleasant', 'pleasing', 'satisfying', 'satisfied'
    ];
  }

  /**
   * Get list of negative sentiment words
   * @returns {string[]} Array of negative words
   * @private
   */
  private getNegativeWords(): string[] {
    return [
      'bad', 'terrible', 'horrible', 'awful', 'poor', 'disappointing',
      'sad', 'unhappy', 'upset', 'angry', 'frustrated', 'annoyed',
      'hate', 'dislike', 'despise', 'detest', 'loathe', 'abhor',
      'ugly', 'disgusting', 'gross', 'nasty', 'offensive', 'repulsive',
      'useless', 'worthless', 'ineffective', 'inefficient', 'inadequate',
      'failure', 'fail', 'failed', 'failing', 'lose', 'lost', 'losing',
      'worst', 'worse', 'worsen', 'worsening', 'deteriorate',
      'avoid', 'negative', 'pessimistic', 'cynical', 'skeptical',
      'complain', 'complaint', 'criticize', 'criticism', 'critical',
      'disappoint', 'disappointed', 'disappointing', 'disappointment',
      'problem', 'issue', 'trouble', 'difficult', 'hard', 'complicated',
      'expensive', 'costly', 'overpriced', 'pricey', 'exorbitant',
      'slow', 'sluggish', 'tedious', 'boring', 'dull', 'uninteresting'
    ];
  }

  /**
   * Get list of intensifier words
   * @returns {string[]} Array of intensifier words
   * @private
   */
  private getIntensifiers(): string[] {
    return [
      'very', 'extremely', 'incredibly', 'really', 'truly', 'absolutely',
      'completely', 'totally', 'utterly', 'thoroughly', 'entirely',
      'highly', 'especially', 'particularly', 'exceptionally',
      'so', 'too', 'quite', 'rather', 'somewhat', 'fairly',
      'almost', 'nearly', 'virtually', 'practically', 'essentially',
      'indeed', 'certainly', 'definitely', 'undoubtedly', 'unquestionably'
    ];
  }

  /**
   * Get list of negation words
   * @returns {string[]} Array of negation words
   * @private
   */
  private getNegators(): string[] {
    return [
      'not', 'no', 'never', 'none', 'nobody', 'nothing', 'nowhere',
      'neither', 'nor', 'hardly', 'scarcely', 'barely', 'rarely',
      'seldom', 'don\'t', 'doesn\'t', 'didn\'t', 'won\'t', 'wouldn\'t',
      'can\'t', 'cannot', 'couldn\'t', 'shouldn\'t', 'isn\'t', 'aren\'t',
      'wasn\'t', 'weren\'t', 'hasn\'t', 'haven\'t', 'hadn\'t',
      'without', 'lack', 'lacking', 'absent', 'absence', 'miss', 'missing'
    ];
  }
}
