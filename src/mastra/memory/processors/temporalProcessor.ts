/**
 * TemporalProcessor for Mastra memory
 *
 * This processor organizes and filters messages based on time-related criteria,
 * such as recency, time windows, and temporal relevance.
 */

import { Message, MemoryProcessor, MessageRole, MessageType } from '../types';
import { logger } from '../../observability/logger';

/**
 * Time window configuration
 */
export interface TimeWindow {
  start: Date | string | number;
  end?: Date | string | number;
  label?: string;
}

/**
 * TemporalProcessor for memory messages
 * Organizes and filters messages based on time-related criteria
 */
export class TemporalProcessor implements MemoryProcessor {
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
   * @returns Processed array of messages
   */
  process(messages: Message[]): Message[] {
    if (!messages || messages.length === 0) {
      return messages;
    }

    logger.debug(`TemporalProcessor: Processing ${messages.length} messages in ${this.mode} mode`);

    // Convert all messages to have proper timestamp objects
    const messagesWithTimestamps = messages.map(message => {
      const timestamp = message.timestamp
        ? new Date(message.timestamp)
        : message.createdAt
          ? new Date(message.createdAt)
          : new Date();

      return { ...message, _timestamp: timestamp };
    });

    // Process based on mode
    switch (this.mode) {
      case 'filter':
        return this.filterByTime(messagesWithTimestamps);
      case 'group':
        return this.groupByTimeWindow(messagesWithTimestamps);
      case 'annotate':
      default:
        return this.annotateWithTimeInfo(messagesWithTimestamps);
    }
  }

  /**
   * Filter messages based on time criteria
   * @param messages - Messages with timestamp information
   * @returns Filtered messages
   */
  private filterByTime(messages: (Message & { _timestamp: Date })[]): Message[] {
    // If recency threshold is set, filter by recency
    if (this.recencyThreshold !== undefined) {
      const now = new Date();
      const threshold = this.getThresholdDate(now, this.recencyThreshold, this.recencyUnit);

      const filteredMessages = messages.filter(message =>
        message._timestamp >= threshold
      );

      logger.debug(`TemporalProcessor: Filtered to ${filteredMessages.length} messages within recency threshold`);
      return filteredMessages;
    }

    // If time windows are set, filter by time windows
    if (this.timeWindows.length > 0) {
      const filteredMessages = messages.filter(message =>
        this.isInAnyTimeWindow(message._timestamp)
      );

      logger.debug(`TemporalProcessor: Filtered to ${filteredMessages.length} messages within time windows`);
      return filteredMessages;
    }

    // If no filtering criteria, return original messages
    return messages;
  }

  /**
   * Group messages by time window and add headers
   * @param messages - Messages with timestamp information
   * @returns Messages with time window headers
   */
  private groupByTimeWindow(messages: (Message & { _timestamp: Date })[]): Message[] {
    // If no time windows, group by default time periods
    if (this.timeWindows.length === 0) {
      // Create default time windows: today, yesterday, this week, earlier
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeek = new Date(today);
      thisWeek.setDate(thisWeek.getDate() - 7);

      this.timeWindows = [
        { start: today, label: 'Today' },
        { start: yesterday, end: today, label: 'Yesterday' },
        { start: thisWeek, end: yesterday, label: 'This Week' },
        { start: new Date(0), end: thisWeek, label: 'Earlier' }
      ];
    }

    // Sort messages by timestamp
    const sortedMessages = [...messages].sort((a, b) =>
      a._timestamp.getTime() - b._timestamp.getTime()
    );

    // Group messages by time window
    const result: Message[] = [];
    let currentWindowLabel: string | null = null;

    for (const message of sortedMessages) {
      // Find which time window this message belongs to
      const window = this.findTimeWindow(message._timestamp);

      // If window changed, add a header
      if (window && window.label && window.label !== currentWindowLabel) {
        currentWindowLabel = window.label;

        // Add a header message
        result.push({
          id: `timeheader-${currentWindowLabel}-${Date.now()}`,
          thread_id: message.thread_id,
          content: `[Time Period: ${currentWindowLabel}]`,
          role: 'system' as MessageRole,
          type: 'text' as MessageType,
          createdAt: new Date(),
          _timeHeader: true
        } as Message);
      }

      // Add the message
      result.push(message);
    }

    logger.debug(`TemporalProcessor: Grouped messages into ${this.timeWindows.length} time windows`);
    return result;
  }

  /**
   * Annotate messages with time information
   * @param messages - Messages with timestamp information
   * @returns Messages with time annotations
   */
  private annotateWithTimeInfo(messages: (Message & { _timestamp: Date })[]): Message[] {
    const now = new Date();

    return messages.map(message => {
      let content = message.content;

      // Skip non-string content
      if (typeof content !== 'string') {
        return message;
      }

      // Add timestamp if configured
      if (this.addTimestamps) {
        const timestamp = message._timestamp.toISOString();
        content = `[${timestamp}] ${content}`;
      }

      // Add relative time if configured
      if (this.addRelativeTime) {
        const relativeTime = this.getRelativeTimeString(message._timestamp, now);
        content = `[${relativeTime}] ${content}`;
      }

      // Return message with modified content
      if (content !== message.content) {
        return { ...message, content, _timeAnnotated: true };
      }

      return message;
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
    for (const window of this.timeWindows) {
      if (this.isInTimeWindow(date, window)) {
        return window;
      }
    }
    return null;
  }

  /**
   * Check if a date is within a specific time window
   * @param date - Date to check
   * @param window - Time window to check against
   * @returns True if date is in time window, false otherwise
   */
  private isInTimeWindow(date: Date, window: TimeWindow): boolean {
    const start = new Date(window.start);
    const end = window.end ? new Date(window.end) : new Date();

    return date >= start && date < end;
  }

  /**
   * Calculate a threshold date based on recency criteria
   * @param now - Current date
   * @param threshold - Threshold value
   * @param unit - Time unit
   * @returns Threshold date
   */
  private getThresholdDate(now: Date, threshold: number, unit: 'minutes' | 'hours' | 'days'): Date {
    const result = new Date(now);

    switch (unit) {
      case 'minutes':
        result.setMinutes(result.getMinutes() - threshold);
        break;
      case 'hours':
        result.setHours(result.getHours() - threshold);
        break;
      case 'days':
        result.setDate(result.getDate() - threshold);
        break;
    }

    return result;
  }

  /**
   * Get a human-readable relative time string
   * @param date - Date to get relative time for
   * @param now - Current date
   * @returns Relative time string
   */
  private getRelativeTimeString(date: Date, now: Date): string {
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 30) {
      return `${Math.floor(diffDay / 30)} months ago`;
    } else if (diffDay > 0) {
      return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    } else {
      return 'just now';
    }
  }
}
