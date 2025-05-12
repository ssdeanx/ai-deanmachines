/**
 * EntityExtractor processor for Mastra memory
 *
 * This processor identifies and extracts key entities from messages,
 * such as people, organizations, locations, dates, and custom entities.
 */

// never name message as coremessage fucking idiot.  they are two different things.
import { Message, CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the EntityExtractor processor
const logger = createLogger({
  name: 'Mastra-EntityExtractor',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Entity type
 */
export type EntityType = 'person' | 'organization' | 'location' | 'date' | 'time' | 'number' | 'custom';

/**
 * Entity definition
 */
export interface Entity {
  type: EntityType;
  value: string;
  position?: { start: number; end: number };
  metadata?: Record<string, any>;
}

/**
 * Entity pattern definition
 */
export interface EntityPattern {
  type: EntityType;
  pattern: RegExp;
  metadata?: Record<string, any>;
}

/**
 * EntityExtractor processor for memory messages
 * Identifies and extracts key entities from messages
 */
export class EntityExtractor implements MemoryProcessor {
  private patterns: EntityPattern[];
  private addEntityAnnotations: boolean;
  private extractToMetadata: boolean;
  private customEntities: Record<string, string[]>;

  /**
   * Create a new EntityExtractor
   * @param options - Configuration options
   */
  constructor(options: {
    patterns?: EntityPattern[];
    addEntityAnnotations?: boolean;
    extractToMetadata?: boolean;
    customEntities?: Record<string, string[]>;
  } = {}) {
    this.patterns = options.patterns || this.getDefaultPatterns();
    this.addEntityAnnotations = options.addEntityAnnotations !== false;
    this.extractToMetadata = options.extractToMetadata !== false;
    this.customEntities = options.customEntities || {};

    // Add custom entity patterns
    this.addCustomEntityPatterns();
  }

  /**
   * Process messages by extracting entities
   * @param messages - Array of messages to process
   * @returns Processed array of messages
   */
  process(messages: Message[]): Message[] {
    if (!messages || messages.length === 0) {
      return messages;
    }

    logger.debug(`EntityExtractor: Processing ${messages.length} messages`);

    return messages.map(message => {
      // Skip non-string content
      if (typeof message.content !== 'string') {
        return message;
      }

      // Extract entities from message content
      const entities = this.extractEntities(message.content);

      if (entities.length === 0) {
        return message;
      }

      // Create a copy of the message to modify
      const processedMessage = { ...message };

      // Add entities to message metadata
      if (this.extractToMetadata) {
        processedMessage._entities = entities;
      }

      // Add entity annotations to content if configured
      if (this.addEntityAnnotations) {
        processedMessage.content = this.annotateContent(message.content, entities);
      }

      return processedMessage;
    });
  }

  /**
   * Extract entities from text content
   * @param content - Text content to extract entities from
   * @returns Array of extracted entities
   */
  private extractEntities(content: string): Entity[] {
    const entities: Entity[] = [];

    // Apply each pattern to the content
    for (const { type, pattern, metadata } of this.patterns) {
      // Reset the regex lastIndex to ensure we start from the beginning
      pattern.lastIndex = 0;

      // Find all matches
      let match;
      while ((match = pattern.exec(content)) !== null) {
        entities.push({
          type,
          value: match[0],
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          metadata
        });
      }
    }

    // Sort entities by position
    entities.sort((a, b) =>
      (a.position?.start || 0) - (b.position?.start || 0)
    );

    return entities;
  }

  /**
   * Annotate content with entity information
   * @param content - Original content
   * @param entities - Extracted entities
   * @returns Annotated content
   */
  private annotateContent(content: string, entities: Entity[]): string {
    // Group entities by type
    const entitiesByType: Record<string, string[]> = {};

    for (const entity of entities) {
      if (!entitiesByType[entity.type]) {
        entitiesByType[entity.type] = [];
      }

      if (!entitiesByType[entity.type].includes(entity.value)) {
        entitiesByType[entity.type].push(entity.value);
      }
    }

    // Create annotation text
    let annotation = '\n\nEntities:';
    for (const type in entitiesByType) {
      annotation += `\n- ${type}: ${entitiesByType[type].join(', ')}`;
    }

    return content + annotation;
  }

  /**
   * Get default entity patterns
   * @returns Array of default entity patterns
   */
  private getDefaultPatterns(): EntityPattern[] {
    return [
      // Person names (simplified pattern)
      {
        type: 'person',
        pattern: /\b[A-Z][a-z]+ (?:[A-Z][a-z]+ )?[A-Z][a-z]+\b/g
      },

      // Organizations (simplified pattern)
      {
        type: 'organization',
        pattern: /\b[A-Z][a-zA-Z]*(?: [A-Z][a-zA-Z]*){1,5}(?:,? (?:Inc|LLC|Ltd|Corp|Corporation|Company))?\.?\b/g
      },

      // Locations (simplified pattern)
      {
        type: 'location',
        pattern: /\b(?:[A-Z][a-z]+(?: [A-Z][a-z]+)*(?: City| Island| County| State)?|[A-Z]{2})\b/g
      },

      // Dates (various formats)
      {
        type: 'date',
        pattern: /\b(?:\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4}|\d{4}-\d{2}-\d{2})\b/g
      },

      // Times
      {
        type: 'time',
        pattern: /\b(?:\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\b/g
      },

      // Numbers (including currency)
      {
        type: 'number',
        pattern: /\b(?:\$\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d+)?)\b/g
      },

      // Email addresses
      {
        type: 'custom',
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
        metadata: { subtype: 'email' }
      },

      // URLs
      {
        type: 'custom',
        pattern: /\bhttps?:\/\/[^\s]+\b/g,
        metadata: { subtype: 'url' }
      },

      // Phone numbers (simplified pattern)
      {
        type: 'custom',
        pattern: /\b(?:\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b/g,
        metadata: { subtype: 'phone' }
      }
    ];
  }
  /**
   * Add patterns for custom entities
   */
  private addCustomEntityPatterns(): void {
    for (const type in this.customEntities) {
      const values = this.customEntities[type];

      // Create a regex pattern that matches any of the values
      const escapedValues = values.map(value =>
        value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      );

      const pattern = new RegExp(`\\b(?:${escapedValues.join('|')})\\b`, 'g');

      // Add the pattern
      this.patterns.push({
        type: 'custom',
        pattern,
        metadata: { subtype: type }
      });
    }
  }
}
