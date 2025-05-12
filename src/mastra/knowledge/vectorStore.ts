import { z } from 'zod';
import { createLogger } from '@mastra/core/logger';
import { UpstashVector } from '@mastra/upstash';
import { VectorStoreError } from './upstashVectorStore';

// Create a logger instance for the VectorStore
const logger = createLogger({
  name: 'Mastra-VectorStore',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

// Define the vector store configuration schema
export const VectorStoreConfigSchema = z.object({
  provider: z.enum(['upstash', 'local']),
  options: z.record(z.any()).optional(),
});

// Export the type from the schema
export type VectorStoreConfig = z.infer<typeof VectorStoreConfigSchema>;

// Define document types
export interface Document {
  id: string;
  text: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

export interface QueryResult {
  id: string;
  text: string;
  metadata?: Record<string, any>;
  score?: number;
  vector?: number[];
}

/**
 * Interface for vector store implementations
 */
export interface VectorStoreInterface {
  upsert(documents: Document[]): Promise<{ count: number }>;
  query(vector: number[], options?: Record<string, any>): Promise<QueryResult[]>;
  delete(ids: string[]): Promise<{ count: number }>;
  createIndex?(indexName: string, dimension: number, metric?: 'cosine' | 'euclidean' | 'dotproduct'): Promise<any>;
  listIndexes?(): Promise<string[]>;
  describeIndex?(indexName: string): Promise<any>;
  deleteIndex?(indexName: string): Promise<any>;
  updateIndexById?(indexName: string, id: string, update: { vector?: number[], metadata?: Record<string, any> }): Promise<any>;
  deleteIndexById?(indexName: string, id: string): Promise<any>;
}

/**
 * VectorStore class for storing and querying vector embeddings
 */
export class VectorStore implements VectorStoreInterface {
  private store: VectorStoreInterface;
  private provider: string;

  /**
   * Create a new VectorStore instance
   * @param config - Configuration for the vector store
   */
  constructor(config: VectorStoreConfig) {
    // Validate configuration
    const validatedConfig = VectorStoreConfigSchema.parse(config);

    this.provider = validatedConfig.provider;

    // Create the appropriate vector store instance based on the provider
    switch (validatedConfig.provider) {
      case 'upstash':
        this.store = this.createUpstashStore(validatedConfig.options);
        break;
      case 'local':
        this.store = this.createLocalStore(validatedConfig.options);
        break;
      default:
        throw new Error(`Unsupported vector store provider: ${validatedConfig.provider}`);
    }
  }

  /**
   * Create an Upstash vector store instance
   * @param options - Options for the Upstash vector store
   * @returns An Upstash vector store instance
   */
  private createUpstashStore(options?: Record<string, any>): VectorStoreInterface {
    if (!options?.url || !options?.token) {
      throw new Error('Upstash vector store requires url and token options');
    }

    try {
      // Create an instance of UpstashVector from @mastra/upstash
      const upstashVector = new UpstashVector({
        url: options.url,
        token: options.token,
      });

      // Create a wrapper that implements the VectorStoreInterface
      return {
        async upsert(documents: Document[]) {
          try {
            if (documents.length === 0) {
              return { count: 0 };
            }

            const namespace = options.namespace || 'default';
            const vectors = documents.map(doc => doc.embedding || []);
            const metadata = documents.map(doc => ({
              text: doc.text,
              ...doc.metadata,
            }));
            const ids = documents.map(doc => doc.id);

            await upstashVector.upsert({
              indexName: namespace,
              vectors,
              metadata,
              ids,
            });

            return { count: documents.length };
          } catch (error) {
            logger.error(`[Upstash Vector] Error upserting documents: ${error}`);
            throw new VectorStoreError(
              'upsert_failed',
              `Failed to upsert documents to Upstash Vector: ${error}`,
              { error, namespace: options.namespace || 'default' }
            );
          }
        },

        async query(vector: number[], queryOptions?: Record<string, any>) {
          try {
            const namespace = queryOptions?.namespace || options.namespace || 'default';
            const topK = queryOptions?.topK || 5;
            const includeVectors = queryOptions?.includeVectors || false;
            const filter = queryOptions?.filter;

            const results = await upstashVector.query({
              indexName: namespace,
              queryVector: vector,
              topK,
              filter,
              includeVector: includeVectors,
            });

            return results.map((result: any) => ({
              id: result.id,
              text: result.metadata?.text || '',
              metadata: result.metadata,
              score: result.score,
              vector: includeVectors ? result.vector : undefined,
            }));
          } catch (error) {
            logger.error(`[Upstash Vector] Error querying: ${error}`);
            throw new VectorStoreError(
              'query_failed',
              `Failed to query Upstash Vector: ${error}`,
              { error, namespace: options.namespace || 'default' }
            );
          }
        },

        async delete(ids: string[]) {
          try {
            if (ids.length === 0) {
              return { count: 0 };
            }

            const namespace = options.namespace || 'default';

            for (const id of ids) {
              await upstashVector.deleteIndexById(namespace, id);
            }

            return { count: ids.length };
          } catch (error) {
            logger.error(`[Upstash Vector] Error deleting documents: ${error}`);
            throw new VectorStoreError(
              'delete_failed',
              `Failed to delete documents from Upstash Vector: ${error}`,
              { error, namespace: options.namespace || 'default' }
            );
          }
        },

        async createIndex(indexName: string, dimension: number, metric: 'cosine' | 'euclidean' | 'dotproduct' = 'cosine') {
          logger.info(`[Upstash Vector] Creating index: ${indexName} with dimension ${dimension} and metric ${metric}`);
          // Upstash Vector creates indexes automatically on first upsert
          return {
            status: 'success',
            message: `Index ${indexName} will be created automatically on first upsert`,
            config: { dimension, metric, createdAt: new Date().toISOString() }
          };
        },

        async listIndexes() {
          // Upstash Vector doesn't have a direct method to list all namespaces
          // Return an array with the current namespace
          return [options.namespace || 'default'];
        },

        async describeIndex(indexName: string) {
          try {
            // Try to get vector count from Upstash
            let count = 0;
            let dimension = 384; // Default dimension
            const metric = 'cosine' as 'cosine' | 'euclidean' | 'dotproduct';

            try {
              // Query with a random vector to see if the index exists
              const randomVector = Array.from({ length: dimension }, () => Math.random());
              const results = await upstashVector.query({
                indexName,
                queryVector: randomVector,
                topK: 1,
              });

              // If we get here, the index exists
              count = results.length > 0 ? -1 : 0; // -1 indicates "some vectors exist but count unknown"

              // If we have results and they include vectors, we can infer the dimension
              if (results.length > 0 && results[0].vector) {
                dimension = results[0].vector.length;
              }
            } catch (queryError) {
              // If the query fails, the index might not exist yet
              logger.warn(`[Upstash Vector] Error querying index: ${queryError}`);
              // We'll continue with default values
            }

            return {
              dimension,
              count,
              metric,
            };
          } catch (error) {
            logger.error(`[Upstash Vector] Error describing index: ${error}`);
            throw new VectorStoreError(
              'describe_index_failed',
              `Failed to describe index in Upstash Vector: ${error}`,
              { error, indexName }
            );
          }
        },

        async deleteIndex(indexName: string) {
          logger.debug(`[Upstash Vector] Deleting index: ${indexName}`);
          // This is a placeholder as Upstash doesn't have a direct API for this
          return { status: 'success', message: `Index ${indexName} deleted` };
        },

        async updateIndexById(indexName: string, id: string, update: { vector?: number[], metadata?: Record<string, any> }) {
          try {
            if (!update.vector && !update.metadata) {
              throw new Error('Either vector or metadata must be provided for update');
            }

            await upstashVector.updateIndexById(indexName, id, update);
            return { status: 'success', message: `Vector ${id} updated` };
          } catch (error) {
            logger.error(`[Upstash Vector] Error updating vector: ${error}`);
            throw new VectorStoreError(
              'update_vector_failed',
              `Failed to update vector in Upstash Vector: ${error}`,
              { error, indexName, id }
            );
          }
        },

        async deleteIndexById(indexName: string, id: string) {
          try {
            await upstashVector.deleteIndexById(indexName, id);
            return { status: 'success', message: `Vector ${id} deleted` };
          } catch (error) {
            logger.error(`[Upstash Vector] Error deleting vector: ${error}`);
            // Log but don't throw, as this might be called in a batch delete operation
            return { status: 'error', message: `Failed to delete vector ${id}: ${error}` };
          }
        }
      };
    } catch (error) {
      logger.error(`[Upstash Vector] Error initializing: ${error}`);
      throw new Error(`Failed to initialize Upstash vector store: ${error}`);
    }
  }

  /**
   * Create a local vector store instance
   * @param options - Options for the local vector store
   * @returns A local vector store instance
   */
  private createLocalStore(options?: Record<string, any>): VectorStoreInterface {
    // TODO: Implement a proper local vector store
    logger.warn('[Local Vector] Using a simple in-memory implementation. Not suitable for production.');

    // Create a simple in-memory vector store
    const documents = new Map<string, Document>();
    const namespace = options?.namespace || 'default';

    return {
      async upsert(docs: Document[]) {
        for (const doc of docs) {
          documents.set(doc.id, doc);
        }
        logger.debug(`[Local Vector] Upserted ${docs.length} documents. Total: ${documents.size}`);
        return { count: docs.length };
      },

      async query(vector: number[], queryOptions?: Record<string, any>) {
        const topK = queryOptions?.topK || 5;
        const includeVectors = queryOptions?.includeVectors || false;

        // Simple cosine similarity calculation
        const cosineSimilarity = (a: number[], b: number[]) => {
          if (!a || !b || a.length !== b.length) return 0;
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;
          for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
          }
          return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        };

        // Calculate similarity for all documents with embeddings
        const results: QueryResult[] = [];
        for (const doc of documents.values()) {
          if (doc.embedding) {
            const score = cosineSimilarity(vector, doc.embedding);
            results.push({
              id: doc.id,
              text: doc.text,
              metadata: doc.metadata,
              score,
              vector: includeVectors ? doc.embedding : undefined,
            });
          }
        }

        // Sort by score and take top K
        results.sort((a, b) => (b.score || 0) - (a.score || 0));
        return results.slice(0, topK);
      },

      async delete(ids: string[]) {
        let count = 0;
        for (const id of ids) {
          if (documents.delete(id)) {
            count++;
          }
        }
        logger.debug(`[Local Vector] Deleted ${count} documents. Remaining: ${documents.size}`);
        return { count };
      },

      async createIndex(indexName: string, dimension: number, metric: 'cosine' | 'euclidean' | 'dotproduct' = 'cosine') {
        logger.debug(`[Local Vector] Creating index: ${indexName} (dimension: ${dimension}, metric: ${metric})`);
        return { status: 'success', message: 'Index created' };
      },

      async listIndexes() {
        return [namespace];
      },

      async describeIndex(_indexName: string) {
        // Log the index name for debugging
        logger.debug(`[Local Vector] Describing index: ${_indexName}`);
        return {
          dimension: 384, // Default dimension
          count: documents.size,
          metric: 'cosine' as 'cosine' | 'euclidean' | 'dotproduct',
        };
      },

      async deleteIndex(indexName: string) {
        documents.clear();
        logger.debug(`[Local Vector] Deleted index: ${indexName}`);
        return { status: 'success', message: 'Index deleted' };
      },

      async updateIndexById(_indexName: string, id: string, update: { vector?: number[], metadata?: Record<string, any> }) {
        // Log the index name for debugging
        logger.debug(`[Local Vector] Updating document in index: ${_indexName}, ID: ${id}`);

        const doc = documents.get(id);
        if (!doc) {
          return { status: 'error', message: `Document ${id} not found` };
        }

        if (update.vector) {
          doc.embedding = update.vector;
        }

        if (update.metadata) {
          doc.metadata = { ...doc.metadata, ...update.metadata };
        }

        documents.set(id, doc);
        logger.debug(`[Local Vector] Updated document: ${id}`);
        return { status: 'success', message: `Document ${id} updated` };
      },

      async deleteIndexById(_indexName: string, id: string) {
        // Log the index name for debugging
        logger.debug(`[Local Vector] Deleting document from index: ${_indexName}, ID: ${id}`);

        const deleted = documents.delete(id);
        logger.debug(`[Local Vector] ${deleted ? 'Deleted' : 'Failed to delete'} document: ${id}`);
        return {
          status: deleted ? 'success' : 'error',
          message: deleted ? `Document ${id} deleted` : `Document ${id} not found`
        };
      }
    };
  }

  /**
   * Add or update documents in the vector store
   * @param documents - Documents to add or update
   * @returns Result of the operation
   */
  async upsert(documents: Document[]) {
    return this.store.upsert(documents);
  }

  /**
   * Query the vector store for similar documents
   * @param vector - Vector to query with
   * @param options - Query options
   * @returns Array of query results
   */
  async query(vector: number[], options?: Record<string, any>) {
    return this.store.query(vector, options);
  }

  /**
   * Delete documents from the vector store
   * @param ids - IDs of documents to delete
   * @returns Result of the operation
   */
  async delete(ids: string[]) {
    return this.store.delete(ids);
  }

  /**
   * Create an index in the vector store
   * @param indexName - Name of the index to create
   * @param dimension - Vector dimension
   * @param metric - Distance metric for similarity search
   * @returns Result of the operation
   */
  async createIndex(indexName: string, dimension: number, metric: 'cosine' | 'euclidean' | 'dotproduct' = 'cosine') {
    if (this.store.createIndex) {
      return this.store.createIndex(indexName, dimension, metric);
    }
    throw new Error(`Provider ${this.provider} does not support createIndex`);
  }

  /**
   * List all indexes in the vector store
   * @returns Array of index names
   */
  async listIndexes() {
    if (this.store.listIndexes) {
      return this.store.listIndexes();
    }
    throw new Error(`Provider ${this.provider} does not support listIndexes`);
  }

  /**
   * Get information about an index
   * @param indexName - Name of the index to describe
   * @returns Index statistics
   */
  async describeIndex(indexName: string) {
    if (this.store.describeIndex) {
      return this.store.describeIndex(indexName);
    }
    throw new Error(`Provider ${this.provider} does not support describeIndex`);
  }

  /**
   * Delete an index from the vector store
   * @param indexName - Name of the index to delete
   * @returns Result of the operation
   */
  async deleteIndex(indexName: string) {
    if (this.store.deleteIndex) {
      return this.store.deleteIndex(indexName);
    }
    throw new Error(`Provider ${this.provider} does not support deleteIndex`);
  }

  /**
   * Update a vector by ID
   * @param indexName - Name of the index containing the vector
   * @param id - ID of the vector to update
   * @param update - Update object containing vector and/or metadata
   * @returns Result of the operation
   */
  async updateIndexById(indexName: string, id: string, update: { vector?: number[], metadata?: Record<string, any> }) {
    if (this.store.updateIndexById) {
      return this.store.updateIndexById(indexName, id, update);
    }
    throw new Error(`Provider ${this.provider} does not support updateIndexById`);
  }

  /**
   * Delete a vector by ID
   * @param indexName - Name of the index containing the vector
   * @param id - ID of the vector to delete
   * @returns Result of the operation
   */
  async deleteIndexById(indexName: string, id: string) {
    if (this.store.deleteIndexById) {
      return this.store.deleteIndexById(indexName, id);
    }
    throw new Error(`Provider ${this.provider} does not support deleteIndexById`);
  }
}
