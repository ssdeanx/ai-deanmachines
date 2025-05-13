import { MemoryProvider, MemoryRecord, Thread, Message, User, Assistant, UpstashMemoryConfig } from './types';

import { UpstashStore, UpstashVector } from '@mastra/upstash';
import { createLogger } from '@mastra/core';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger({
  name: 'Mastra-UpstashMemory',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

export class UpstashMemory implements MemoryProvider {
  private store: UpstashStore;
  private vectorStore?: UpstashVector;
  private storePrefix: string;
  private vectorIndexName: string;

  constructor(config: UpstashMemoryConfig) {
    if (!config.url || !config.token) {
      throw new Error('Upstash URL and Token are required.');
    }

    this.storePrefix = config.storePrefix || 'mastra:';
    this.store = new UpstashStore({
      url: config.url,
      token: config.token,
    });

    const vectorUrl = config.vectorUrl || config.url;
    const vectorToken = config.vectorToken || config.token;

    if (vectorUrl && vectorToken) {
      this.vectorStore = new UpstashVector({
        url: vectorUrl,
        token: vectorToken,
      });
      this.vectorIndexName = config.vectorIndexName || 'mastra-memory-vectors';
      logger.info(`[UpstashMemory] Vector store initialized with URL: ${vectorUrl} and index: ${this.vectorIndexName}`);
    } else {
      logger.warn('[UpstashMemory] Vector store URL or Token not provided. Vector operations will be disabled.');
      this.vectorIndexName = config.vectorIndexName || 'mastra-memory-vectors';
    }

    logger.info('[UpstashMemory] Initialized with UpstashStore.');
  }
  getMessage(messageId: string): Promise<Message | null> {
    throw new Error('Method not implemented.');
  }
  updateMessage(messageId: string, updates: Partial<Message>): Promise<Message | null> {
    throw new Error('Method not implemented.');
  }
  deleteMessage(messageId: string, threadId?: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getMessages(threadId: string, limit?: number, before?: string, after?: string): Promise<Message[]> {
    throw new Error('Method not implemented.');
  }
  findRelatedMessages?(threadId: string, queryEmbedding: number[], options?: { topK?: number; filter?: Record<string, any> | string; }): Promise<MemoryRecord[]> {
    throw new Error('Method not implemented.');
  }
  createUser?(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    throw new Error('Method not implemented.');
  }
  getUser?(userId: string): Promise<User | null> {
    throw new Error('Method not implemented.');
  }
  updateUser?(userId: string, updates: Partial<User>): Promise<User | null> {
    throw new Error('Method not implemented.');
  }
  deleteUser?(userId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  createAssistant?(assistant: Omit<Assistant, 'id' | 'createdAt'>): Promise<Assistant> {
    throw new Error('Method not implemented.');
  }
  getAssistant?(assistantId: string): Promise<Assistant | null> {
    throw new Error('Method not implemented.');
  }
  updateAssistant?(assistantId: string, updates: Partial<Assistant>): Promise<Assistant | null> {
    throw new Error('Method not implemented.');
  }
  deleteAssistant?(assistantId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  saveRecord?(record: MemoryRecord): Promise<MemoryRecord> {
    throw new Error('Method not implemented.');
  }
  getRecord?(recordId: string): Promise<MemoryRecord | null> {
    throw new Error('Method not implemented.');
  }
  deleteRecord?(recordId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  clearAllData?(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private getPrefixedKey(key: string): string {
    return `${this.storePrefix}${key}`;
  }

  private getThreadKey(threadId: string): string {
    return this.getPrefixedKey(`thread:${threadId}`);
  }

  private getMessageKey(messageId: string): string {
    return this.getPrefixedKey(`message:${messageId}`);
  }

  private getThreadMessagesKey(threadId: string): string {
    return this.getPrefixedKey(`thread:${threadId}:messages`);
  }

  private getUserKey(userId: string): string {
    return this.getPrefixedKey(`user:${userId}`);
  }

  private getAssistantKey(assistantId: string): string {
    return this.getPrefixedKey(`assistant:${assistantId}`);
  }

  private getMemoryRecordKey(recordId: string): string {
    return this.getPrefixedKey(`memory-record:${recordId}`);
  }

  async createThread(thread: Partial<Thread>): Promise<Thread> {
    const threadId = thread.id || uuidv4();
    const now = new Date();
    const newThread: Thread = {
      id: threadId,
      createdAt: now,
      updatedAt: now,
      metadata: thread.metadata || {},
      messages: [],
      resourceId: thread.resourceId,
      title: thread.title,
    };

    const { messages, ...threadToStore } = newThread;
    const storableThread = {
      ...threadToStore,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await this.store.redis.set(this.getThreadKey(threadId), JSON.stringify(storableThread));
    await this.store.redis.set(this.getThreadMessagesKey(threadId), JSON.stringify([]));

    logger.debug(`[UpstashMemory] Created thread: ${threadId}`);
    return newThread;
  }

  async getThread(threadId: string): Promise<Thread | null> {
    const threadDataString = await this.store.redis.get(this.getThreadKey(threadId));
    if (!threadDataString) {
      logger.warn(`[UpstashMemory] Thread not found: ${threadId}`);
      return null;
    }

    const storedThread = JSON.parse(threadDataString) as Omit<Thread, 'messages' | 'createdAt' | 'updatedAt'> & { createdAt: string, updatedAt: string };

    const messages: Message[] = [];
    const messageIdsData = await this.store.redis.get(this.getThreadMessagesKey(threadId));

    if (messageIdsData) {
      const messageIds = JSON.parse(messageIdsData as string) as string[];
      for (const msgId of messageIds) {
        const msg = await this.getMessage(msgId);
        if (msg) {
          messages.push(msg);
        }
      }
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    const fullThread: Thread = {
      ...storedThread,
      id: storedThread.id || threadId,
      messages,
      createdAt: new Date(storedThread.createdAt),
      updatedAt: new Date(storedThread.updatedAt),
    };

    logger.debug(`[UpstashMemory] Retrieved thread: ${threadId}`);
    return fullThread;
  }

  async updateThread(threadId: string, updates: Partial<Omit<Thread, 'messages'>>): Promise<Thread | null> {
    const threadKey = this.getThreadKey(threadId);
    const currentThreadString = await this.store.redis.get(threadKey);
    if (!currentThreadString) {
      logger.warn(`[UpstashMemory] Cannot update. Thread not found: ${threadId}`);
      return null;
    }

    const currentStoredThread = JSON.parse(currentThreadString) as Omit<Thread, 'messages' | 'createdAt' | 'updatedAt'> & { createdAt: string, updatedAt: string };
    const newUpdatedAt = new Date();

    const updatedStoredThread = {
      ...currentStoredThread,
      ...updates,
      id: threadId,
      updatedAt: newUpdatedAt.toISOString(),
    };

    await this.store.redis.set(threadKey, JSON.stringify(updatedStoredThread));
    logger.debug(`[UpstashMemory] Updated thread metadata: ${threadId}`);

    return this.getThread(threadId);
  }

  async deleteThread(threadId: string): Promise<void> {
    const messageIdsData = await this.store.redis.get(this.getThreadMessagesKey(threadId));
    if (messageIdsData) {
      const messageIds = JSON.parse(messageIdsData as string) as string[];
      const deletePromises: Promise<void>[] = [];
      for (const messageId of messageIds) {
        deletePromises.push(this.deleteMessage(messageId, threadId));
      }
      await Promise.all(deletePromises);
    }
    await this.store.redis.del(this.getThreadMessagesKey(threadId));
    await this.store.redis.del(this.getThreadKey(threadId));
    logger.debug(`[UpstashMemory] Deleted thread: ${threadId}`);
  }

  async addMessage(threadId: string, message: Omit<Message, 'id' | 'createdAt' | 'thread_id'>): Promise<Message> {
    const threadKey = this.getThreadKey(threadId);
    const threadExistsData = await this.store.redis.get(threadKey);
    if (!threadExistsData) {
      logger.error(`[UpstashMemory] Thread not found: ${threadId}. Cannot add message.`);
      throw new Error(`Thread not found: ${threadId}`);
    }

    const messageId = uuidv4();
    const now = new Date();
    const newMessage: Message = {
      id: messageId,
      thread_id: threadId,
      createdAt: now,
      content: message.content,
          type: newMessage.type,
          content: newMessage.content,
          createdAt: newMessage.createdAt.toISOString(),
        };
        if (newMessage.name) metadataForVector.name = newMessage.name;

        await this.vectorStore.upsert({
          indexName: this.vectorIndexName,
          vectors: newMessage.embedding ? [newMessage.embedding] : [],
          ids: [messageId],
          metadata: [metadataForVector],
        });
        logger.debug(`[UpstashMemory] Message ${messageId} content upserted to vector store.`);
      } catch (error) {
        logger.error(`[UpstashMemory] Error upserting message ${messageId} to vector store: ${error}`);
      }
    }

    return newMessage;
  }

  async getMessage(messageId: string): Promise<Message | null> {
    const messageData = await this.store.get(this.getMessageKey(messageId));
    if (!messageData) {
      logger.warn(`[UpstashMemory] Message not found: ${messageId}`);
      return null;
    }
    const message = JSON.parse(messageData as string) as Message & { createdAt: string };
    logger.debug(`[UpstashMemory] Retrieved message: ${messageId}`);
    return { ...message, createdAt: new Date(message.createdAt) };
  }

  async updateMessage(messageId: string, updates: Partial<Message>): Promise<Message | null> {
    const messageKey = this.getMessageKey(messageId);
    const currentMessageData = await this.store.get(messageKey);
    if (!currentMessageData) {
      logger.warn(`[UpstashMemory] Cannot update. Message not found: ${messageId}`);
      return null;
    }
    const currentMessage = JSON.parse(currentMessageData as string) as Message;
    const updatedMessage = { ...currentMessage, ...updates, id: messageId, createdAt: new Date(currentMessage.createdAt) };

    await this.store.set(messageKey, JSON.stringify(updatedMessage));
    logger.debug(`[UpstashMemory] Updated message: ${messageId}`);

    if (this.vectorStore && (updates.content || updates.embedding)) {
      try {
        const embeddingToUpsert = updates.embedding || currentMessage.embedding;
        if (embeddingToUpsert && typeof updatedMessage.content === 'string') {
          const metadataForVector: Record<string, any> = {
            thread_id: updatedMessage.thread_id,
            messageId: updatedMessage.id,
            role: updatedMessage.role,
            type: updatedMessage.type,
            content: updatedMessage.content,
            createdAt: updatedMessage.createdAt.toISOString(),
          };
          if (updatedMessage.name) metadataForVector.name = updatedMessage.name;

          await this.vectorStore.upsert({
            indexName: this.vectorIndexName,
            vectors: [embeddingToUpsert],
            ids: [messageId],
            metadata: [metadataForVector],
          });
          logger.debug(`[UpstashMemory] Message ${messageId} updated in vector store.`);
        } else {
          logger.warn(`[UpstashMemory] Message ${messageId} updated but no embedding or string content provided for vector store update.`);
        }
      } catch (error) {
        logger.error(`[UpstashMemory] Error updating message ${messageId} in vector store: ${error}`);
      }
    }
    return updatedMessage;
  }

  async deleteMessage(messageId: string, threadId?: string): Promise<void> {
    const message = await this.getMessage(messageId);
    const actualThreadId = threadId || message?.thread_id;

    if (actualThreadId) {
      const threadMessagesKey = this.getThreadMessagesKey(actualThreadId);
      const messageIdsData = await this.store.get(threadMessagesKey);
      if (messageIdsData) {
        let messageIds = JSON.parse(messageIdsData as string) as string[];
        messageIds = messageIds.filter(id => id !== messageId);
        await this.store.set(threadMessagesKey, JSON.stringify(messageIds));
      }
    } else {
      logger.warn(`[UpstashMemory] thread_id not found for message ${messageId}, cannot remove from thread messages list.`);
    }

    await this.store.delete(this.getMessageKey(messageId));
    logger.debug(`[UpstashMemory] Deleted message: ${messageId}`);

    if (this.vectorStore) {
      try {
        await this.vectorStore.delete({ ids: [messageId], indexName: this.vectorIndexName });
        logger.debug(`[UpstashMemory] Message ${messageId} deleted from vector store.`);
      } catch (error) {
        logger.error(`[UpstashMemory] Error deleting message ${messageId} from vector store: ${error}`);
      }
    }
  }

  async getMessages(threadId: string, limit?: number, before?: string, after?: string): Promise<Message[]> {
    const thread = await this.getThread(threadId);
    if (!thread || !thread.messages) {
      logger.warn(`[UpstashMemory] Thread not found or has no messages: ${threadId}`);
      return [];
    }

    let messages = [...thread.messages];

    if (after) {
      const afterIndex = messages.findIndex(m => m.id === after);
      if (afterIndex !== -1) {
        messages = messages.slice(afterIndex + 1);
      } else {
        messages = [];
      }
    }
    if (before) {
      const beforeIndex = messages.findIndex(m => m.id === before);
      if (beforeIndex !== -1) {
        messages = messages.slice(0, beforeIndex);
      } else {
        messages = [];
      }
    }

    if (limit !== undefined && limit >= 0) {
      messages = messages.slice(0, limit);
    }

    logger.debug(`[UpstashMemory] Retrieved ${messages.length} messages for thread: ${threadId}`);
    return messages;
  }

  async findRelatedMessages(
    threadId: string,
    queryEmbedding: number[],
    options?: { topK?: number; filter?: Record<string, any> | string }
  ): Promise<MemoryRecord[]> {
    if (!this.vectorStore) {
      logger.warn('[UpstashMemory] Vector store not initialized. Cannot find related messages.');
      return [];
    }
    try {
      const topK = options?.topK || 5;
      const filter = options?.filter || { thread_id: threadId };

      let filterString: string | undefined = undefined;
      if (typeof filter === 'string') {
        filterString = filter;
      } else if (typeof filter === 'object' && filter !== null) {
        if (filter.thread_id && typeof filter.thread_id === 'string') {
          filterString = `metadata.thread_id = "${filter.thread_id}"`;
        } else {
          const filterParts = Object.entries(filter).map(([key, value]) => {
            if (typeof value === 'string') {
              return `metadata.${key} = "${value}"`;
            } else if (typeof value === 'number' || typeof value === 'boolean') {
              return `metadata.${key} = ${value}`;
            }
            return '';
          }).filter(part => part !== '');
          if (filterParts.length > 0) {
            filterString = filterParts.join(' AND ');
          } else {
            logger.warn(`[UpstashMemory] Complex object filter provided for findRelatedMessages. Could not construct simple filter string. Filter: ${JSON.stringify(filter)}`);
          }
        }
      }

      logger.debug(`[UpstashMemory] Finding related messages for thread ${threadId} with filter: ${filterString || 'none'}`);

      const results = await this.vectorStore.query({
        indexName: this.vectorIndexName,
        queryVector: queryEmbedding,
        topK,
        includeVector: false,
        includeMetadata: true,
        filter: filterString,
      });

      if (!results || results.length === 0) {
        logger.debug('[UpstashMemory] No related messages found from vector store.');
        return [];
      }

      const memoryRecords: MemoryRecord[] = results
        .map((result) => {
          const metadata = result.metadata as Record<string, any> || {};
          return {
            id: result.id,
            content: metadata.content,
            role: metadata.role,
            type: metadata.type,
            thread_id: metadata.thread_id,
            messageId: metadata.messageId,
            metadata: metadata,
            score: result.score,
            createdAt: metadata.createdAt ? new Date(metadata.createdAt) : undefined,
          } as MemoryRecord;
        })
        .filter(record => record.id !== undefined && record.score !== undefined);

      logger.debug(`[UpstashMemory] Found ${memoryRecords.length} related messages.`);
      return memoryRecords;
    } catch (error: any) {
      logger.error('[UpstashMemory] Error finding related messages:', { message: error.message, stack: error.stack });
      return [];
    }
  }

  private getUserKey(userId: string): string {
    return this.getPrefixedKey(`user:${userId}`);
  }

  private getAssistantKey(assistantId: string): string {
    return this.getPrefixedKey(`assistant:${assistantId}`);
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const userId = uuidv4();
    const newUser: User = { id: userId, createdAt: new Date(), ...user };
    await this.store.set(this.getUserKey(userId), JSON.stringify(newUser));
    logger.debug(`[UpstashMemory] Created user: ${userId}`);
    return newUser;
  }

  async getUser(userId: string): Promise<User | null> {
    const userData = await this.store.get(this.getUserKey(userId));
    if (!userData) {
      logger.warn(`[UpstashMemory] User not found: ${userId}`);
      return null;
    }
    const user = JSON.parse(userData as string) as User & { createdAt: string };
    logger.debug(`[UpstashMemory] Retrieved user: ${userId}`);
    return { ...user, createdAt: new Date(user.createdAt) };
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const userKey = this.getUserKey(userId);
    const currentUserData = await this.store.get(userKey);
    if (!currentUserData) {
      logger.warn(`[UpstashMemory] Cannot update. User not found: ${userId}`);
      return null;
    }
    const currentUser = JSON.parse(currentUserData as string) as User;
    const updatedUser = { ...currentUser, ...updates, id: userId, createdAt: new Date(currentUser.createdAt) };
    await this.store.set(userKey, JSON.stringify(updatedUser));
    logger.debug(`[UpstashMemory] Updated user: ${userId}`);
    return updatedUser;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.store.delete(this.getUserKey(userId));
    logger.debug(`[UpstashMemory] Deleted user: ${userId}`);
  }

  async createAssistant(assistant: Omit<Assistant, 'id' | 'createdAt'>): Promise<Assistant> {
    const assistantId = uuidv4();
    const newAssistant: Assistant = { id: assistantId, createdAt: new Date(), ...assistant };
    await this.store.set(this.getAssistantKey(assistantId), JSON.stringify(newAssistant));
    logger.debug(`[UpstashMemory] Created assistant: ${assistantId}`);
    return newAssistant;
  }

  async getAssistant(assistantId: string): Promise<Assistant | null> {
    const assistantData = await this.store.get(this.getAssistantKey(assistantId));
    if (!assistantData) {
      logger.warn(`[UpstashMemory] Assistant not found: ${assistantId}`);
      return null;
    }
    const assistant = JSON.parse(assistantData as string) as Assistant & { createdAt: string };
    logger.debug(`[UpstashMemory] Retrieved assistant: ${assistantId}`);
    return { ...assistant, createdAt: new Date(assistant.createdAt) };
  }

  async updateAssistant(assistantId: string, updates: Partial<Assistant>): Promise<Assistant | null> {
    const assistantKey = this.getAssistantKey(assistantId);
    const currentAssistantData = await this.store.get(assistantKey);
    if (!currentAssistantData) {
      logger.warn(`[UpstashMemory] Cannot update. Assistant not found: ${assistantId}`);
      return null;
    }
    const currentAssistant = JSON.parse(currentAssistantData as string) as Assistant;
    const updatedAssistant = { ...currentAssistant, ...updates, id: assistantId, createdAt: new Date(currentAssistant.createdAt) };
    await this.store.set(assistantKey, JSON.stringify(updatedAssistant));
    logger.debug(`[UpstashMemory] Updated assistant: ${assistantId}`);
    return updatedAssistant;
  }

  async deleteAssistant(assistantId: string): Promise<void> {
    await this.store.delete(this.getAssistantKey(assistantId));
    logger.debug(`[UpstashMemory] Deleted assistant: ${assistantId}`);
  }

  private getMemoryRecordKey(recordId: string): string {
    return this.getPrefixedKey(`memory-record:${recordId}`);
  }

  async saveRecord(record: MemoryRecord): Promise<MemoryRecord> {
    const recordId = record.id || record.messageId || uuidv4();
    const recordToSave: MemoryRecord = {
      ...record,
      id: recordId,
      createdAt: record.createdAt || new Date(),
    };
    const storableRecord = {
      ...recordToSave,
      createdAt: recordToSave.createdAt instanceof Date ? recordToSave.createdAt.toISOString() : recordToSave.createdAt,
    };

    await this.store.set(this.getMemoryRecordKey(recordId), JSON.stringify(storableRecord));
    logger.debug(`[UpstashMemory] Saved memory record: ${recordId}`);

    if (this.vectorStore && recordToSave.vector && recordToSave.content) {
      try {
        const metadataForVector: Record<string, any> = {
          ...(recordToSave.metadata || {}),
          thread_id: recordToSave.thread_id,
          messageId: recordToSave.messageId,
          role: recordToSave.role,
          content: recordToSave.content,
          createdAt: recordToSave.createdAt instanceof Date ? recordToSave.createdAt.toISOString() : recordToSave.createdAt,
        };

        await this.vectorStore.upsert({
          indexName: this.vectorIndexName,
          vectors: [recordToSave.vector],
          ids: [recordId],
          metadata: [metadataForVector],
        });
        logger.debug(`[UpstashMemory] Memory record ${recordId} upserted to vector store.`);
      } catch (error) {
        logger.error(`[UpstashMemory] Error upserting memory record ${recordId} to vector store: ${error}`);
      }
    }
    return recordToSave;
  }

  async getRecord(recordId: string): Promise<MemoryRecord | null> {
    const recordData = await this.store.get(this.getMemoryRecordKey(recordId));
    if (!recordData) {
      logger.warn(`[UpstashMemory] Memory record not found: ${recordId}`);
      return null;
    }
    const record = JSON.parse(recordData as string) as MemoryRecord;
    if (record.createdAt && typeof record.createdAt === 'string') {
      record.createdAt = new Date(record.createdAt);
    }
    logger.debug(`[UpstashMemory] Retrieved memory record: ${recordId}`);
    return record;
  }

  async deleteRecord(recordId: string): Promise<void> {
    await this.store.delete(this.getMemoryRecordKey(recordId));
    logger.debug(`[UpstashMemory] Deleted memory record from store: ${recordId}`);
    if (this.vectorStore) {
      try {
        await this.vectorStore.delete({ ids: [recordId], indexName: this.vectorIndexName });
        logger.debug(`[UpstashMemory] Memory record ${recordId} deleted from vector store.`);
      } catch (error) {
        logger.error(`[UpstashMemory] Error deleting memory record ${recordId} from vector store: ${error}`);
      }
    }
  }

  async clearAllData(): Promise<void> {
    logger.warn(`[UpstashMemory] Attempting to clear all data. This is a complex operation.`);
    logger.info(`[UpstashMemory] Key-value store clearing by prefix '${this.storePrefix}' is not fully implemented due to Redis SCAN/DEL complexity through the current abstraction. Manual cleanup or a more specific store method would be needed.`);

    if (this.vectorStore) {
      try {
        logger.info(`[UpstashMemory] Clearing vector data in index '${this.vectorIndexName}' would require deleting and recreating the index or deleting all vectors, which is not implemented here. Please manage vector index data directly via Upstash console or specific SDK methods if needed.`);
      } catch (error) {
        logger.error(`[UpstashMemory] Error or placeholder for clearing vector index '${this.vectorIndexName}': ${error}`);
      }
    }
    logger.warn(`[UpstashMemory] clearAllData is a partial implementation. Please review Upstash documentation for complete data removal strategies.`);
  }}
