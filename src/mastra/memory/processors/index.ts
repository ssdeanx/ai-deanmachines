/**
 * Memory processors for Mastra
 *
 * Memory processors allow you to modify the list of messages retrieved from memory
 * before they are added to the agent's context window and sent to the LLM.
 *
 * There are two types of processors:
 * 1. Standard processors - Process messages in batches
 * 2. Stream processors - Process messages in real-time as they flow through the system
 *
 * Changelog:
 * - v0.0.2 (2025-05-11): Added ContextualSummarizer, PriorityRanker, DuplicateDetector,
 *                        TemporalProcessor, EntityExtractor, and SentimentAnalyzer
 * - v0.0.1 (2025-05-11): Initial implementation with TokenLimiter, ToolCallFilter,
 *                        MessageTransformer, and StreamFilter
 */

// Import standard processors
import { TokenLimiter } from './tokenLimiter';
import { ToolCallFilter } from './toolCallFilter';
import { ContextualSummarizer } from './contextualSummarizer';
import { PriorityRanker } from './priorityRanker';
import { DuplicateDetector } from './duplicateDetector';
import { TemporalProcessor, TimeWindow } from './temporalProcessor';
import { EntityExtractor, EntityType, Entity, EntityPattern } from './entityExtractor';
import { SentimentAnalyzer, SentimentScore } from './sentimentAnalyzer';
import {
  ContextualEnhancer,
  CommonEnhancements,
  EnhancementFunction,
  ContextSourceFunction,
  EnhancementContext
} from './contextualEnhancer';

// Import stream processors
import { MessageTransformer, CommonTransforms } from './messageTransformer';
import { StreamFilter, CommonFilters } from './streamFilter';
import {
  StreamObjectProcessor,
  CommonStreamTransforms,
  StreamObjectTransformFunction
} from './streamObjectProcessor';
import {
  StreamAggregator,
  CommonGroupings,
  GroupingFunction,
  AggregationFunction
} from './streamAggregator';

// Export all processors
export {
  // Standard processors
  TokenLimiter,
  ToolCallFilter,
  ContextualSummarizer,
  PriorityRanker,
  DuplicateDetector,
  TemporalProcessor,
  EntityExtractor,
  SentimentAnalyzer,
  ContextualEnhancer,
  CommonEnhancements,

  // Stream processors
  MessageTransformer,
  CommonTransforms,
  StreamFilter,
  CommonFilters,
  StreamObjectProcessor,
  CommonStreamTransforms,
  StreamAggregator,
  CommonGroupings
};

// Export types
export type {
  TimeWindow,
  EntityType,
  Entity,
  EntityPattern,
  SentimentScore,
  StreamObjectTransformFunction,
  GroupingFunction,
  AggregationFunction,
  EnhancementFunction,
  ContextSourceFunction,
  EnhancementContext
};
