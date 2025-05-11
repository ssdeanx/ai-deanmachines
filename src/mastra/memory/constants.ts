/**
 * Constants for the Memory module
 */

/**
 * Default memory provider
 */
export const DEFAULT_MEMORY_PROVIDER = 'upstash';

/**
 * Default key prefix for Redis
 */
export const DEFAULT_KEY_PREFIX = 'mastra:';

/**
 * Default local storage path
 */
export const DEFAULT_LOCAL_STORAGE_PATH = './data/memory';

/**
 * Key patterns for Redis
 */
export const KEY_PATTERNS = {
  MESSAGE: 'message:',
  THREAD: 'thread:',
  THREAD_MESSAGES: 'thread:{threadId}:messages',
  THREAD_CREATED: 'thread:{threadId}:created',
};

/**
 * Default message retrieval limit
 */
export const DEFAULT_MESSAGE_LIMIT = 10;

/**
 * Default TTL for messages in seconds (7 days)
 */
export const DEFAULT_MESSAGE_TTL = 7 * 24 * 60 * 60;
