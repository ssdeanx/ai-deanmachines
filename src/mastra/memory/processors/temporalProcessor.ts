/**
 * TemporalProcessor for Mastra memory
 *
 * This processor organizes and filters messages based on time-related criteria,
 * such as recency, time windows, and temporal relevance.
 */
import { CoreMessage } from 'ai';
import { MemoryProcessor, MemoryProcessorOpts } from '@mastra/core/memory';
import { createLogger } from '@mastra/core/logger';
// Import date-fns for robust date manipulation
import { isValid, formatDistanceToNowStrict } from 'date-fns';

// Create a logger instance for the TemporalProcessor processor
const logger = createLogger({
  name: 'Mastra-TemporalProcessor',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Time window configuration
 */
export interface TimeWindow {
  start: Date | string | number;
  end?: Date | string | number;
  label?: string;
}

// Define an extended message type for internal processing
type TemporalExtendedMessage = CoreMessage & {
  timestamp?: Date | string | number; // Original timestamp from source if available
  createdAt?: Date | string | number; // Original createdAt from source if available
  thread_id?: string; // Original thread_id from source if available
  _timestamp: Date; // Normalized, internal Date object for processing
  _timeHeader?: boolean; // Flag if this message is a time header
  _timeAnnotated?: boolean; // Flag if this message has been time-annotated
  // Allow any other properties that might exist on CoreMessage or its variants
  [key: string]: any;
};

/**
 * TemporalProcessor for memory messages
 * Organizes and filters messages based on time-related criteria
 */
export class TemporalProcessor extends MemoryProcessor { // Extend MemoryProcessor
  private mode: 'filter' | 'group' | 'annotate';
  private timeWindows: TimeWindow[];
  private recencyThreshold?: number;
  private recencyUnit: 'minutes' | 'hours' | 'days';
  private addTimestamps: boolean;
  private addRelativeTime: boolean;

  /**
   * Create a new TemporalProcessor
   * @param options - Configuration options
   */
  constructor(options: {
    mode?: 'filter' | 'group' | 'annotate';
    timeWindows?: TimeWindow[];
    recencyThreshold?: number;
    recencyUnit?: 'minutes' | 'hours' | 'days';
    addTimestamps?: boolean;
    addRelativeTime?: boolean;
  } = {}) {
    super({ name: 'TemporalProcessor' }); // Call super constructor
    this.mode = options.mode || 'annotate';
    this.timeWindows = options.timeWindows || [];
    this.recencyThreshold = options.recencyThreshold;
    this.recencyUnit = options.recencyUnit || 'hours';
    this.addTimestamps = options.addTimestamps !== false;
    this.addRelativeTime = options.addRelativeTime !== false;
  }

  /**
   * Process messages based on temporal criteria
   * @param messages - Array of messages to process
   * @param _opts - Options for memory processing (currently unused)
   * @returns Processed array of messages
   */
  process(messages: CoreMessage[], _opts?: MemoryProcessorOpts): CoreMessage[] {
    void _opts; // Indicate _opts is intentionally unused

    if (!messages || messages.length === 0) {
      return messages;
    }

    logger.debug(`TemporalProcessor: Processing ${messages.length} messages in ${this.mode} mode`);

    const messagesWithTimestamps = messages.map(msg => {
      const specificMessage = msg as TemporalExtendedMessage;
      let parsedTimestamp: Date | undefined;

      if (specificMessage.timestamp) {
        if (specificMessage.timestamp instanceof Date && isValid(specificMessage.timestamp)) {
          parsedTimestamp = specificMessage.timestamp;
        } else if (typeof specificMessage.timestamp === 'string' || typeof specificMessage.timestamp === 'number') {
          const d = new Date(specificMessage.timestamp);
          if (isValid(d)) parsedTimestamp = d;
        }
      }
      if (!parsedTimestamp && specificMessage.createdAt) {
         if (specificMessage.createdAt instanceof Date && isValid(specificMessage.createdAt)) {
          parsedTimestamp = specificMessage.createdAt;
        } else if (typeof specificMessage.createdAt === 'string' || typeof specificMessage.createdAt === 'number') {
          const d = new Date(specificMessage.createdAt);
          if (isValid(d)) parsedTimestamp = d;
        }
      }
      // Fallback to current time if no valid timestamp found
      const finalTimestamp = parsedTimestamp || new Date();
      return { ...specificMessage, _timestamp: finalTimestamp };
    });

    let processedMessages: TemporalExtendedMessage[];

    switch (this.mode) {
      case 'filter':
        processedMessages = this.filterByTime(messagesWithTimestamps);
        break;
      case 'group':
        processedMessages = this.groupByTimeWindow(messagesWithTimestamps);
        break;
      case 'annotate':
      default:
        processedMessages = this.annotateWithTimeInfo(messagesWithTimestamps);
        break;
    }
    
    // Strip internal _timestamp before returning, ensure it's CoreMessage[]
    return processedMessages.map(m => m as CoreMessage);
  }

  /**
   * Filter messages based on time criteria
   * @param messages - Messages with timestamp information
   * @returns Filtered messages
   */
  private filterByTime(messages: TemporalExtendedMessage[]): TemporalExtendedMessage[] {
    let filtered = [...messages];
    const now = new Date();

    // If recency threshold is set, filter by recency
    if (this.recencyThreshold !== undefined && this.recencyThreshold > 0) {
      const thresholdDate = this.getThresholdDate(now, this.recencyThreshold, this.recencyUnit);
      logger.debug(`TemporalProcessor: Filtering for messages after ${thresholdDate.toISOString()}`);
      filtered = filtered.filter(m => m._timestamp.getTime() >= thresholdDate.getTime());
    }

    // If time windows are set, filter by time windows
    if (this.timeWindows.length > 0) {
      logger.debug(`TemporalProcessor: Filtering by ${this.timeWindows.length} time window(s)`);
      filtered = filtered.filter(m => this.isInAnyTimeWindow(m._timestamp));
    }
    
    logger.debug(`TemporalProcessor: Filtered ${messages.length - filtered.length} messages`);
    return filtered;
  }

  /**
   * Group messages by time window and add headers
   * @param messages - Messages with timestamp information
   * @returns Messages with time window headers
   */
  private groupByTimeWindow(messages: TemporalExtendedMessage[]): TemporalExtendedMessage[] {
    if (this.timeWindows.length === 0) {
      logger.debug("TemporalProcessor: No time windows defined for grouping. Returning messages as is.");
      return messages;
    }

    const sortedMessages = [...messages].sort((a, b) =>
      a._timestamp.getTime() - b._timestamp.getTime()
    );

    const result: TemporalExtendedMessage[] = [];
    let lastHeaderLabel: string | null = null;

    for (const message of sortedMessages) {
      const window = this.findTimeWindow(message._timestamp);
      const currentLabel = window?.label || 'Other'; // Default label if not in a defined window

      if (currentLabel !== lastHeaderLabel) {
        result.push({
          id: `timeheader-${currentLabel.replace(/\s+/g, '-')}-${Date.now()}`, // Ensure ID is unique
          role: 'system',
          content: `[Time Period: ${currentLabel}]`,
          _timestamp: message._timestamp, // Header takes timestamp of first message in group
          _timeHeader: true,
          // Ensure all required CoreMessage fields are present or any other fields your system expects
          // For example, if 'ui' or 'tool_call' etc. are possible, handle them or ensure they are not expected for headers
        } as TemporalExtendedMessage);
        lastHeaderLabel = currentLabel;
      }
      result.push(message);
    }
    logger.debug(`TemporalProcessor: Grouped messages, added ${result.length - messages.length} headers.`);
    return result;
  }

  /**
   * Annotate messages with time information
   * @param messages - Messages with timestamp information
   * @returns Messages with time annotations
   */
  private annotateWithTimeInfo(messages: TemporalExtendedMessage[]): TemporalExtendedMessage[] {
    return messages.map(message => {
      const annotatedMessage = { ...message, _timeAnnotated: true } as TemporalExtendedMessage;
      let timeAnnotation = '';

      if (this.addTimestamps) {
        timeAnnotation += `[${annotatedMessage._timestamp.toISOString()}] `;
      }
      if (this.addRelativeTime) {
        timeAnnotation += `(${this.getRelativeTimeString(annotatedMessage._timestamp)}) `;
      }

      if (timeAnnotation.length > 0 && typeof annotatedMessage.content === 'string') {
        annotatedMessage.content = `${timeAnnotation.trim()} ${annotatedMessage.content}`;
      } else if (timeAnnotation.length > 0) {
         // If content is not a string, add annotation to metadata
        annotatedMessage.metadata = { ...(annotatedMessage.metadata || {}), timeAnnotation: timeAnnotation.trim() };
      }
      return annotatedMessage;
    });
  }

  /**
   * Check if a date is within any of the configured time windows
   * @param date - Date to check
   * @returns True if date is in any time window, false otherwise
   */
  private isInAnyTimeWindow(date: Date): boolean {
    return this.timeWindows.some(window => this.isInTimeWindow(date, window));
  }

  /**
   * Find which time window a date belongs to
   * @param date - Date to check
   * @returns Time window object or null if not in any window
   */
  private findTimeWindow(date: Date): TimeWindow | null {
    return this.timeWindows.find(window => this.isInTimeWindow(date, window)) || null;
  }

  /**
   * Check if a date is within a specific time window
   * @param date - Date to check
   * @param window - Time window to check against
   * @returns True if date is in time window, false otherwise
   */
  private isInTimeWindow(date: Date, window: TimeWindow): boolean {
    const startTime = new Date(window.start).getTime();
    const endTime = window.end ? new Date(window.end).getTime() : Infinity;
    const targetTime = date.getTime();
    return targetTime >= startTime && targetTime <= endTime;
  }

  /**
   * Calculate a threshold date based on recency criteria
   * @param now - Current date
   * @param threshold - Threshold value
   * @param unit - Time unit
   * @returns Threshold date
   */
  private getThresholdDate(now: Date, threshold: number, unit: 'minutes' | 'hours' | 'days'): Date {
    const d = new Date(now);
    if (unit === 'minutes') d.setMinutes(d.getMinutes() - threshold);
    else if (unit === 'hours') d.setHours(d.getHours() - threshold);
    else if (unit === 'days') d.setDate(d.getDate() - threshold);
    return d;
  }

  /**
   * Get a human-readable relative time string
   * @param date - Date to get relative time for
   * @returns Relative time string
   */
  private getRelativeTimeString(date: Date): string {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }
}
