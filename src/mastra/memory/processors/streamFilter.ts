/**
 * StreamFilter processor for Mastra memory
 *
 * This processor filters messages in real-time as they flow through the memory system.
 * It can be used to include or exclude messages based on custom criteria.
 */
// never name message as coremessage fucking idiot.  they are two different things.
import { CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the StreamFilter processor
const logger = createLogger({
  name: 'Mastra-StreamFilter',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Type for filter predicate function
 */
export type FilterPredicate = (message: Message) => boolean;

/**
 * StreamFilter processor for memory messages
 * Filters messages based on custom criteria
 */
export class StreamFilter implements MemoryProcessor {
  private includePredicates: FilterPredicate[];
  private excludePredicates: FilterPredicate[];
  private mode: 'include' | 'exclude';

  /**
   * Create a new StreamFilter
   * @param options - Configuration options
   */
  constructor(options: {
    includePredicates?: FilterPredicate[];
    excludePredicates?: FilterPredicate[];
    mode?: 'include' | 'exclude';
  } = {}) {
    this.includePredicates = options.includePredicates || [];
    this.excludePredicates = options.excludePredicates || [];
    this.mode = options.mode || 'exclude';
  }

  /**
   * Add an include predicate
   * @param predicate - Filter predicate to add
   */
  addIncludePredicate(predicate: FilterPredicate): void {
    this.includePredicates.push(predicate);
  }

  /**
   * Add an exclude predicate
   * @param predicate - Filter predicate to add
   */
  addExcludePredicate(predicate: FilterPredicate): void {
    this.excludePredicates.push(predicate);
  }

  /**
   * Process messages by filtering based on predicates
   * @param messages - Array of messages to process
   * @returns Filtered array of messages
   */
  process(messages: Message[]): Message[] {
    if (!messages || messages.length === 0) {
      return messages;
    }

    const initialCount = messages.length;
    let filteredMessages: Message[];

    if (this.mode === 'include') {
      // Include mode: only include messages that match at least one include predicate
      if (this.includePredicates.length === 0) {
        // If no include predicates, include all messages
        filteredMessages = [...messages];
      } else {
        // Include messages that match at least one include predicate
        filteredMessages = messages.filter(message =>
          this.includePredicates.some(predicate => predicate(message))
        );
      }

      // Then exclude messages that match any exclude predicate
      if (this.excludePredicates.length > 0) {
        filteredMessages = filteredMessages.filter(message =>
          !this.excludePredicates.some(predicate => predicate(message))
        );
      }
    } else {
      // Exclude mode: exclude messages that match any exclude predicate
      filteredMessages = messages.filter(message =>
        !this.excludePredicates.some(predicate => predicate(message))
      );

      // Then include only messages that match at least one include predicate (if any)
      if (this.includePredicates.length > 0) {
        filteredMessages = filteredMessages.filter(message =>
          this.includePredicates.some(predicate => predicate(message))
        );
      }
    }

    const filteredCount = initialCount - filteredMessages.length;
    if (filteredCount > 0) {
      logger.debug(`StreamFilter: Filtered out ${filteredCount} messages`);
    }

    return filteredMessages;
  }
}

/**
 * Common filter predicates
 */
export const CommonFilters = {
  /**
   * Filter by message role
   * @param roles - Array of roles to include/exclude
   * @param include - Whether to include (true) or exclude (false) these roles
   * @returns Filter predicate
   */
  byRole: (roles: string[], include: boolean = true): FilterPredicate => {
    const roleSet = new Set(roles);
    return (message: Message) => {
      const hasRole = roleSet.has(message.role);
      return include ? hasRole : !hasRole;
    };
  },

  /**
   * Filter by message type
   * @param types - Array of types to include/exclude
   * @param include - Whether to include (true) or exclude (false) these types
   * @returns Filter predicate
   */
  byType: (types: string[], include: boolean = true): FilterPredicate => {
    const typeSet = new Set(types);
    return (message: Message) => {
      const hasType = typeSet.has(message.type);
      return include ? hasType : !hasType;
    };
  },

  /**
   * Filter by content containing specific text
   * @param text - Text to search for
   * @param caseSensitive - Whether the search should be case-sensitive
   * @param include - Whether to include (true) or exclude (false) matching messages
   * @returns Filter predicate
   */
  byContent: (text: string, caseSensitive: boolean = false, include: boolean = true): FilterPredicate => {
    return (message: Message) => {
      if (typeof message.content !== 'string') {
        return !include; // If not a string, exclude by default
      }

      const content = caseSensitive ? message.content : message.content.toLowerCase();
      const searchText = caseSensitive ? text : text.toLowerCase();
      const contains = content.includes(searchText);

      return include ? contains : !contains;
    };
  }
};
