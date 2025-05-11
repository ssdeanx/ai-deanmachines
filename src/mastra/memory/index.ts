/**
 * Memory module for Mastra AI
 *
 * This module exports all memory implementations and related types.
 */

// Export the Memory class
export { Memory } from './memory';
export { UpstashMemory } from './upstashMemory';

// Export schemas
export {
  MemoryConfigSchema,
  SemanticRecallConfigSchema,
  WorkingMemoryConfigSchema
} from './types';

// Export types
export type {
  MemoryConfig,
  SemanticRecallConfig,
  WorkingMemoryConfig,
  MessageRole,
  MessageType,
  Storage,
  Message,
  Thread
} from './types';

// TODO: Add more memory implementations as they are developed
// export { LocalMemory } from './localMemory';
