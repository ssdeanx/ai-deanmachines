import { Memory } from '@mastra/memory';
import { ThreadManager, ThreadInfo, Thread } from './types';
import { createLogger } from '@mastra/core/logger';

const logger = createLogger({ name: 'ThreadManagerImpl', level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' });

/**
 * Adapts a Thread object (from memory store) to a ThreadInfo object.
 * @param thread The Thread object.
 * @returns A ThreadInfo object.
 */
function adaptThreadToThreadInfo(thread: Thread): ThreadInfo {
  return {
    id: thread.id,
    title: thread.title || `Thread ${thread.id}`,
    createdAt: new Date(thread.createdAt),
    lastModified: new Date(thread.updatedAt),
    metadata: thread.metadata,
  };
}

export class ThreadManagerImpl implements ThreadManager {
  private memory: Memory;

  constructor(memory: Memory) {
    this.memory = memory;
  }

  async getOrCreateThread(threadId: string, initialTitle?: string): Promise<ThreadInfo> {
    logger.debug(`getOrCreateThread called for threadId: ${threadId}`);
    try {
      const existingThread = await this.memory.getThreadById({ threadId });
      if (existingThread) {
        logger.debug(`Found existing thread: ${threadId}`);
        return adaptThreadToThreadInfo(existingThread as Thread); // Adapt if StorageThreadType differs significantly
      }
      logger.debug(`Creating new thread: ${threadId}`);
      const createThreadPayload = {
        threadId: threadId,
        resourceId: threadId, // Assuming threadId is also used as resourceId based on original code
        title: initialTitle || `Thread ${threadId}`,
        metadata: {},
      };
      const newThread = await this.memory.createThread(createThreadPayload);
      return adaptThreadToThreadInfo(newThread as Thread); // Adapt if StorageThreadType differs significantly
    } catch (error) {
      logger.error(`Error in getOrCreateThread for ${threadId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
  async getThread(threadId: string): Promise<ThreadInfo | undefined> {
    logger.debug(`getThread called for threadId: ${threadId}`);
    const thread = await this.memory.getThreadById({ threadId });
    return thread ? adaptThreadToThreadInfo(thread as Thread) : undefined; // Adapt if StorageThreadType differs
  }

  async listThreads(limit?: number, offset?: number): Promise<ThreadInfo[]> {
    logger.debug(`listThreads called with limit: ${limit}, offset: ${offset}`);
    try {
      // This assumes `this.memory` has a method to list threads or can be adapted.
      // The @mastra/memory Memory class might not have a direct `getThreads` method.
      // It typically manages messages within threads. Listing all threads might require
      // interacting with the underlying storage mechanism if not exposed on Memory itself.
      // For now, this is a placeholder for the correct implementation based on @mastra/memory capabilities.
      if (typeof (this.memory.storage as any).listThreadIds === 'function') { // Hypothetical method
        const threadIds = await (this.memory.storage as any).listThreadIds({ limit, offset });
        const threads: ThreadInfo[] = [];
        for (const id of threadIds) {
          const thread = await this.getThread(id);
          if (thread) threads.push(thread);
        }
        return threads;
      } else if (typeof (this.memory as any).getAllThreads === 'function') { // Another hypothetical
         const allThreads = await (this.memory as any).getAllThreads({ limit, offset });
         return allThreads.map(adaptThreadToThreadInfo);
      }
      logger.warn('listThreads: No direct method to list threads found on memory or storage. Returning empty array.');
      return [];
    } catch (error) {
      logger.error(`Error in listThreads: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async updateThread(threadId: string, updates: Partial<Pick<ThreadInfo, 'title' | 'metadata'>>): Promise<ThreadInfo | undefined> {
    logger.debug(`updateThread called for threadId: ${threadId} with updates:`, updates);
    try {
      const currentThread = await this.memory.getThreadById({ threadId });
      if (!currentThread) {
        logger.warn(`updateThread: Thread not found: ${threadId}`);
        return undefined;
      }

      const threadUpdates: Partial<Thread> = {};
      if (updates.title !== undefined) {
        threadUpdates.title = updates.title;
      }
      if (updates.metadata !== undefined) {
        threadUpdates.metadata = { ...currentThread.metadata, ...updates.metadata };
      }
      
      if (Object.keys(threadUpdates).length === 0) {
        return adaptThreadToThreadInfo(currentThread as Thread);
      }

      // Construct the payload for memory.updateThread, ensuring 'title' is always a string (never undefined).
      const updatePayload = {
        id: threadId,
        // Always provide a string for title (never undefined)
        title: (threadUpdates.title !== undefined ? threadUpdates.title : currentThread.title) ?? '',
        metadata: threadUpdates.metadata ?? (currentThread.metadata || {}),
      };

      const updatedThread = await this.memory.updateThread(updatePayload);
      return updatedThread ? adaptThreadToThreadInfo(updatedThread as Thread) : undefined;
    } catch (error) {
      logger.error(`Error in updateThread for ${threadId}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }

  }  async deleteThread(threadId: string): Promise<boolean> {
    logger.debug(`deleteThread called for threadId: ${threadId}`);
    try {
      await this.memory.deleteThread(threadId);
      return true;
    } catch (error) {
      logger.error(`Error in deleteThread for ${threadId}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}
