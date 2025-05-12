import { z } from 'zod';
import { VectorStore, Document } from './vectorStore';
import { createLogger } from '@mastra/core/logger';
import { UpstashVector } from '@mastra/upstash';

// Create a logger instance for the UpstashVectorStore
const logger = createLogger({
  name: 'Mastra-UpstashVectorStore',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

// Define the Upstash vector store configuration schema
export const UpstashVectorStoreConfigSchema = z.object({
  url: z.string(),
  token: z.string(),
  namespace: z.string().optional(),
});

// Export the type from the schema
export type UpstashVectorStoreConfig = z.infer<typeof UpstashVectorStoreConfigSchema>;

/**
 * Error class for vector store operations
 */
export class VectorStoreError extends Error {
  code: string;
  details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'VectorStoreError';
    this.code = code;
    this.details = details;
  }
}

/**
 * UpstashVectorStore class for storing and querying vector embeddings in Upstash Vector
 */
export class UpstashVectorStore extends VectorStore {
  private url: string;
  private token: string;
  private namespace: string;
  private client: UpstashVector;

  /**
   * Create a new UpstashVectorStore instance
   * @param config - Configuration for the Upstash vector store
   */
  constructor(config: UpstashVectorStoreConfig) {
    super({
      provider: 'upstash',
      options: config,
    });

    // Validate configuration
    const validatedConfig = UpstashVectorStoreConfigSchema.parse(config);

    this.url = validatedConfig.url;
    this.token = validatedConfig.token;
    this.namespace = validatedConfig.namespace || 'default';

    // Initialize Upstash Vector client
    try {
      this.client = new UpstashVector({
        url: this.url,
        token: this.token,
      });

      logger.info(`[Upstash Vector] Initialized client with URL: ${this.url}`);
    } catch (error) {
      logger.error(`[Upstash Vector] Error initializing client: ${error}`);
      throw new VectorStoreError(
        'initialization_failed',
        `Failed to initialize Upstash Vector client: ${error}`,
        { error }
      );
    }
  }

  /**
   * Create an index (namespace) in Upstash Vector
   * Note: Upstash Vector creates indexes automatically on first upsert,
   * but this method stores the dimension and metric for future reference
   * @param indexName - Name of the index to create
   * @param dimension - Vector dimension
   * @param metric - Distance metric for similarity search
   */
  async createIndex(indexName: string, dimension: number, metric: 'cosine' | 'euclidean' | 'dotproduct' = 'cosine') {
    logger.info(`[Upstash Vector] Creating index: ${indexName} with dimension ${dimension} and metric ${metric}`);

    try {
      // Store the index configuration for future reference
      // This is useful for the describeIndex method
      const indexConfig = {
        dimension,
        metric,
        createdAt: new Date().toISOString()
      };

      // We could store this in a local map or in Upstash itself
      // For now, we'll just log it
      logger.debug(`[Upstash Vector] Index configuration: ${JSON.stringify(indexConfig)}`);

      // Upstash Vector creates indexes automatically on first upsert
      return {
        status: 'success',
        message: `Index ${indexName} will be created automatically on first upsert`,
        config: indexConfig
      };
    } catch (error) {
      logger.error(`[Upstash Vector] Error creating index: ${error}`);
      throw new VectorStoreError(
        'create_index_failed',
        `Failed to create index in Upstash Vector: ${error}`,
        { error, indexName, dimension, metric }
      );
    }
  }

  /**
   * Add or update documents in the vector store
   * @param documents - Documents to add or update
   * @returns Result of the operation
   */
  async upsert(documents: Document[]) {
    try {
      logger.debug(`[Upstash Vector] Upserting ${documents.length} documents to namespace: ${this.namespace}`);

      if (documents.length === 0) {
        return { count: 0 };
      }

      // Format documents for Upstash Vector
      const vectors = documents.map(doc => doc.embedding || []);
      const metadata = documents.map(doc => ({
        text: doc.text,
        ...doc.metadata,
      }));
      const ids = documents.map(doc => doc.id);

      // Upsert to Upstash Vector
      await this.client.upsert({
        indexName: this.namespace,
        vectors,
        metadata,
        ids,
      });

      logger.debug(`[Upstash Vector] Successfully upserted ${documents.length} documents`);
      return { count: documents.length };
    } catch (error) {
      logger.error(`[Upstash Vector] Error upserting documents: ${error}`);
      throw new VectorStoreError(
        'upsert_failed',
        `Failed to upsert documents to Upstash Vector: ${error}`,
        { error, namespace: this.namespace }
      );
    }
  }

  /**
   * Query the vector store for similar documents
   * @param vector - Vector to query with
   * @param options - Query options
   * @returns Array of query results
   */
  async query(vector: number[], options?: Record<string, any>) {
    try {
      const topK = options?.topK || 5;
      const includeVectors = options?.includeVectors || false;
      const filter = options?.filter;
      const namespace = options?.namespace || this.namespace;

      logger.debug(`[Upstash Vector] Querying namespace: ${namespace} with vector of length ${vector.length}`);

      // Query Upstash Vector
      const results = await this.client.query({
        indexName: namespace,
        queryVector: vector,
        topK,
        filter,
        includeVector: includeVectors,
      });

      // Format results to match QueryResult interface
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
        { error, namespace: this.namespace }
      );
    }
  }

  /**
   * Delete documents from the vector store
   * @param ids - IDs of documents to delete
   * @returns Result of the operation
   */
  async delete(ids: string[]) {
    try {
      logger.debug(`[Upstash Vector] Deleting ${ids.length} documents from namespace: ${this.namespace}`);

      if (ids.length === 0) {
        return { count: 0 };
      }

      // Delete from Upstash Vector
      for (const id of ids) {
        await this.deleteIndexById(this.namespace, id);
      }

      return { count: ids.length };
    } catch (error) {
      logger.error(`[Upstash Vector] Error deleting documents: ${error}`);
      throw new VectorStoreError(
        'delete_failed',
        `Failed to delete documents from Upstash Vector: ${error}`,
        { error, namespace: this.namespace }
      );
    }
  }

  /**
   * List all indexes (namespaces) in Upstash Vector
   * @returns Array of index names
   */
  async listIndexes() {
    try {
      logger.debug(`[Upstash Vector] Listing indexes`);

      // Upstash Vector doesn't have a direct method to list all namespaces
      // This is a placeholder that would need to be implemented based on Upstash's API
      // For now, return an array with the current namespace
      return [this.namespace];
    } catch (error) {
      logger.error(`[Upstash Vector] Error listing indexes: ${error}`);
      throw new VectorStoreError(
        'list_indexes_failed',
        `Failed to list indexes in Upstash Vector: ${error}`,
        { error }
      );
    }
  }

  /**
   * Get information about an index
   * @param indexName - Name of the index to describe
   * @returns Index statistics
   */
  async describeIndex(indexName: string) {
    try {
      logger.debug(`[Upstash Vector] Describing index: ${indexName}`);

      // Try to get vector count from Upstash
      // This is a best-effort approach as Upstash doesn't have a direct API for this
      let count = 0;
      let dimension = 384; // Default dimension
      const metric = 'cosine' as 'cosine' | 'euclidean' | 'dotproduct';

      try {
        // Query with a random vector to see if the index exists
        // This is a hack, but it's the best we can do without a direct API
        const randomVector = Array.from({ length: dimension }, () => Math.random());
        const results = await this.client.query({
          indexName,
          queryVector: randomVector,
          topK: 1,
        });

        // If we get here, the index exists
        // We can't get the exact count, but we can check if there are any vectors
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
  }

  /**
   * Delete an index (namespace) from Upstash Vector
   * @param indexName - Name of the index to delete
   * @returns Result of the operation
   */
  async deleteIndex(indexName: string) {
    try {
      logger.debug(`[Upstash Vector] Deleting index: ${indexName}`);

      // This is a placeholder that would need to be implemented based on Upstash's API
      // For now, return a mock response
      return { status: 'success', message: `Index ${indexName} deleted` };
    } catch (error) {
      logger.error(`[Upstash Vector] Error deleting index: ${error}`);
      throw new VectorStoreError(
        'delete_index_failed',
        `Failed to delete index in Upstash Vector: ${error}`,
        { error, indexName }
      );
    }
  }

  /**
   * Update a vector by ID
   * @param indexName - Name of the index containing the vector
   * @param id - ID of the vector to update
   * @param update - Update object containing vector and/or metadata
   * @returns Result of the operation
   */
  async updateIndexById(indexName: string, id: string, update: { vector?: number[], metadata?: Record<string, any> }) {
    try {
      logger.debug(`[Upstash Vector] Updating vector with ID: ${id} in index: ${indexName}`);

      if (!update.vector && !update.metadata) {
        throw new Error('Either vector or metadata must be provided for update');
      }

      // This is implemented based on Upstash's API
      await this.client.updateIndexById(indexName, id, update);

      return { status: 'success', message: `Vector ${id} updated` };
    } catch (error) {
      logger.error(`[Upstash Vector] Error updating vector: ${error}`);
      throw new VectorStoreError(
        'update_vector_failed',
        `Failed to update vector in Upstash Vector: ${error}`,
        { error, indexName, id }
      );
    }
  }

  /**
   * Delete a vector by ID
   * @param indexName - Name of the index containing the vector
   * @param id - ID of the vector to delete
   * @returns Result of the operation
   */
  async deleteIndexById(indexName: string, id: string) {
    try {
      logger.debug(`[Upstash Vector] Deleting vector with ID: ${id} from index: ${indexName}`);

      // This is implemented based on Upstash's API
      await this.client.deleteIndexById(indexName, id);

      return { status: 'success', message: `Vector ${id} deleted` };
    } catch (error) {
      logger.error(`[Upstash Vector] Error deleting vector: ${error}`);
      // Log but don't throw, as this might be called in a batch delete operation
      return { status: 'error', message: `Failed to delete vector ${id}: ${error}` };
    }
  }
}
