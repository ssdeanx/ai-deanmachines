/**
 * @file EntityExtractor processor for Mastra memory
 * @version 1.1.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This processor identifies and extracts key entities from messages,
 * such as people, organizations, locations, dates, and custom entities.
 * It supports advanced pattern matching, entity relationships, and contextual extraction.
 */
import { CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the EntityExtractor processor
const logger = createLogger({
  name: 'Mastra-EntityExtractor',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Entity type enumeration
 * @typedef {string} EntityType
 */
export type EntityType = 
  | 'person' 
  | 'organization' 
  | 'location' 
  | 'date' 
  | 'time' 
  | 'number' 
  | 'email'
  | 'url'
  | 'phone'
  | 'product'
  | 'event'
  | 'custom';

/**
 * Entity confidence level
 * @typedef {string} ConfidenceLevel
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Entity relationship type
 * @typedef {string} RelationshipType
 */
export type RelationshipType = 
  | 'contains'
  | 'partOf'
  | 'associatedWith'
  | 'locatedIn'
  | 'employedBy'
  | 'createdBy'
  | 'custom';

/**
 * Entity relationship interface
 * @interface EntityRelationship
 * @property {RelationshipType} type - Type of relationship
 * @property {string} targetEntityId - ID of the target entity
 * @property {ConfidenceLevel} [confidence='medium'] - Confidence level of the relationship
 * @property {Record<string, any>} [metadata] - Additional metadata
 */
export interface EntityRelationship {
  type: RelationshipType;
  targetEntityId: string;
  confidence?: ConfidenceLevel;
  metadata?: Record<string, any>;
}

/**
 * Entity definition interface
 * @interface Entity
 * @property {string} id - Unique identifier for the entity
 * @property {EntityType} type - Type of the entity
 * @property {string} value - Value of the entity
 * @property {ConfidenceLevel} [confidence='medium'] - Confidence level of extraction
 * @property {Object} [position] - Position of the entity in the text
 * @property {number} position.start - Start index
 * @property {number} position.end - End index
 * @property {EntityRelationship[]} [relationships] - Relationships to other entities
 * @property {Record<string, any>} [metadata] - Additional metadata
 * @property {string[]} [aliases] - Alternative names or references
 * @property {string} [normalizedValue] - Standardized form of the value
 */
export interface Entity {
  id: string;
  type: EntityType;
  value: string;
  confidence?: ConfidenceLevel;
  position?: { start: number; end: number };
  relationships?: EntityRelationship[];
  metadata?: Record<string, any>;
  aliases?: string[];
  normalizedValue?: string;
}

/**
 * Entity pattern definition interface
 * @interface EntityPattern
 * @property {EntityType} type - Type of the entity
 * @property {RegExp} pattern - Regular expression pattern to match the entity
 * @property {ConfidenceLevel} [confidence='medium'] - Default confidence for matches
 * @property {Function} [validator] - Optional function to validate matches
 * @property {Function} [normalizer] - Optional function to normalize matches
 * @property {Record<string, any>} [metadata] - Additional metadata
 */
export interface EntityPattern {
  type: EntityType;
  pattern: RegExp;
  confidence?: ConfidenceLevel;
  validator?: (match: string, context: string) => boolean;
  normalizer?: (match: string) => string;
  metadata?: Record<string, any>;
}

/**
 * Entity extraction options
 * @interface EntityExtractionOptions
 * @property {boolean} [detectRelationships=false] - Whether to detect relationships between entities
 * @property {boolean} [normalizeValues=true] - Whether to normalize entity values
 * @property {boolean} [deduplicateEntities=true] - Whether to deduplicate entities
 * @property {number} [contextWindow=100] - Number of characters to include as context around entities
 */
export interface EntityExtractionOptions {
  detectRelationships?: boolean;
  normalizeValues?: boolean;
  deduplicateEntities?: boolean;
  contextWindow?: number;
}

/**
 * EntityExtractor processor for memory messages
 * Identifies and extracts key entities from messages with advanced capabilities
 * 
 * @class EntityExtractor
 * @extends {MemoryProcessor}
 */
export class EntityExtractor extends MemoryProcessor {
  private patterns: EntityPattern[];
  private addEntityAnnotations: boolean;
  private extractToMetadata: boolean;
  private customEntities: Record<string, string[]>;
  private extractionOptions: EntityExtractionOptions;
  private entityIdCounter: number = 0;
  private knownEntities: Map<string, Entity> = new Map();

  /**
   * Create a new EntityExtractor
   * @param {Object} [options={}] - Configuration options
   * @param {EntityPattern[]} [options.patterns] - Custom entity patterns
   * @param {boolean} [options.addEntityAnnotations=true] - Whether to add entity annotations to content
   * @param {boolean} [options.extractToMetadata=true] - Whether to add extracted entities to metadata
   * @param {Record<string, string[]>} [options.customEntities] - Custom entities to extract
   * @param {EntityExtractionOptions} [options.extractionOptions] - Advanced extraction options
   */
  constructor(options: {
    patterns?: EntityPattern[];
    addEntityAnnotations?: boolean;
    extractToMetadata?: boolean;
    customEntities?: Record<string, string[]>;
    extractionOptions?: EntityExtractionOptions;
  } = {}) {
    super({ name: 'EntityExtractor' });
    this.patterns = options.patterns || this.getDefaultPatterns();
    this.addEntityAnnotations = options.addEntityAnnotations !== false;
    this.extractToMetadata = options.extractToMetadata !== false;
    this.customEntities = options.customEntities || {};
    this.extractionOptions = {
      detectRelationships: options.extractionOptions?.detectRelationships || false,
      normalizeValues: options.extractionOptions?.normalizeValues !== false,
      deduplicateEntities: options.extractionOptions?.deduplicateEntities !== false,
      contextWindow: options.extractionOptions?.contextWindow || 100
    };

    // Add custom entity patterns
    this.addCustomEntityPatterns();
  }

  /**
   * Process messages by extracting entities
   * @param {CoreMessage[]} messages - Array of messages to process
   * @param {MemoryProcessorOpts} [opts={}] - MemoryProcessor options
   * @returns {CoreMessage[]} Processed array of messages
   * @override
   */
  process(messages: CoreMessage[], opts: MemoryProcessorOpts = {}): CoreMessage[] {
    if (!messages || messages.length === 0) {
      return messages;
    }

    // Use opts to satisfy base signature
    void opts;

    logger.debug(`EntityExtractor: Processing ${messages.length} messages`);

    // Process each message
    const processedMessages = messages.map(message => {
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
        (processedMessage as any).metadata = (processedMessage as any).metadata || {};
        (processedMessage as any).metadata.entities = entities;
      }

      // Add entity annotations to content if configured
      if (this.addEntityAnnotations) {
        processedMessage.content = this.annotateContent(message.content, entities);
      }

      return processedMessage;
    });

    // If relationship detection is enabled, process relationships across messages
    if (this.extractionOptions.detectRelationships) {
      this.detectCrossMessageRelationships(processedMessages);
    }

    return processedMessages;
  }

  /**
   * Extract entities from text content
   * @param {string} content - Text content to extract entities from
   * @returns {Entity[]} Array of extracted entities
   * @private
   */
  private extractEntities(content: string): Entity[] {
    const entities: Entity[] = [];

    // Apply each pattern to the content
    for (const { type, pattern, confidence, validator, normalizer, metadata } of this.patterns) {
      // Reset the regex lastIndex to ensure we start from the beginning
      pattern.lastIndex = 0;

      // Find all matches
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const value = match[0];
        const start = match.index;
        const end = start + value.length;
        
        // Get context around the match
        const contextStart = Math.max(0, start - (this.extractionOptions?.contextWindow ?? 0));
        const contextEnd = Math.min(content.length, end + (this.extractionOptions?.contextWindow ?? 0));
        const context = content.substring(contextStart, contextEnd);
        
        // Validate match if validator is provided
        if (validator && !validator(value, context)) {
          continue;
        }
        
        // Generate a unique ID for the entity
        const id = `entity-${++this.entityIdCounter}`;
        
        // Normalize value if normalizer is provided and normalization is enabled
        const normalizedValue = this.extractionOptions.normalizeValues && normalizer 
          ? normalizer(value) 
          : value;
        
        // Create entity
        const entity: Entity = {
          id,
          type,
          value,
          confidence: confidence || 'medium',
          position: { start, end },
          metadata: { ...metadata },
          normalizedValue
        };
        
        // Add to entities array
        entities.push(entity);
        
        // Add to known entities map for relationship detection
        const key = `${type}:${normalizedValue || value}`;
        this.knownEntities.set(key, entity);
      }
    }

    // Sort entities by position
    entities.sort((a, b) =>
      (a.position?.start || 0) - (b.position?.start || 0)
    );
    
    // Deduplicate entities if configured
    return this.extractionOptions.deduplicateEntities 
      ? this.deduplicateEntities(entities) 
      : entities;
  }
  /**
   * Deduplicate entities based on type and value
   * @param {Entity[]} entities - Array of entities to deduplicate
   * @returns {Entity[]} Deduplicated array of entities
   * @private
   */
  private deduplicateEntities(entities: Entity[]): Entity[] {
    const uniqueEntities: Entity[] = [];
    const seen = new Set<string>();
    
    for (const entity of entities) {
      const key = `${entity.type}:${entity.normalizedValue || entity.value}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueEntities.push(entity);
      }
    }
    
    return uniqueEntities;
  }

  /**
   * Detect relationships between entities across messages
   * @param {CoreMessage[]} messages - Processed messages with entities
   * @private
   */
  private detectCrossMessageRelationships(messages: CoreMessage[]): void {
    // Extract all entities from all messages
    const allEntities: Entity[] = [];
    
    for (const message of messages) {
      const entities = (message as any).metadata?.entities as Entity[] || [];
      allEntities.push(...entities);
    }
    
    // Detect relationships between entities
    for (let i = 0; i < allEntities.length; i++) {
      const entity = allEntities[i];
      
      // Skip if entity already has relationships
      if (entity.relationships && entity.relationships.length > 0) {
        continue;
      }
      
      entity.relationships = [];
      
      // Check for potential relationships with other entities
      for (let j = 0; j < allEntities.length; j++) {
        if (i === j) continue;
        
        const otherEntity = allEntities[j];
        const relationship = this.detectRelationship(entity, otherEntity);
        
        if (relationship) {
          entity.relationships.push(relationship);
        }
      }
    }
  }

  /**
   * Detect relationship between two entities
   * @param {Entity} entity - Source entity
   * @param {Entity} otherEntity - Target entity
   * @returns {EntityRelationship|null} Detected relationship or null
   * @private
   */
  private detectRelationship(entity: Entity, otherEntity: Entity): EntityRelationship | null {
    // Location relationships
    if (entity.type === 'location' && otherEntity.type === 'person') {
      return {
        type: 'locatedIn',
        targetEntityId: otherEntity.id,
        confidence: 'medium'
      };
    }
    
    // Organization relationships
    if (entity.type === 'organization' && otherEntity.type === 'person') {
      return {
        type: 'employedBy',
        targetEntityId: otherEntity.id,
        confidence: 'medium'
      };
    }
    
    // Product relationships
    if (entity.type === 'product' && otherEntity.type === 'organization') {
      return {
        type: 'createdBy',
        targetEntityId: otherEntity.id,
        confidence: 'medium'
      };
    }
    
    // Add more relationship detection logic here
    
    return null;
  }

  /**
   * Annotate content with entity information
   * @param {string} content - Original content
   * @param {Entity[]} entities - Extracted entities
   * @returns {string} Annotated content
   * @private
   */
  private annotateContent(content: string, entities: Entity[]): string {
    // Group entities by type
    const entitiesByType: Record<string, string[]> = {};

    for (const entity of entities) {
      if (!entitiesByType[entity.type]) {
        entitiesByType[entity.type] = [];
      }

      const displayValue = entity.normalizedValue && entity.normalizedValue !== entity.value
        ? `${entity.value} (${entity.normalizedValue})`
        : entity.value;

      if (!entitiesByType[entity.type].includes(displayValue)) {
        entitiesByType[entity.type].push(displayValue);
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
   * @returns {EntityPattern[]} Array of default entity patterns
   * @private
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
   * @private
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
