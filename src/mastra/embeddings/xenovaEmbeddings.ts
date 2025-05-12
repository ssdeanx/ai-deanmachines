import { z } from 'zod';
import { Embeddings } from './embeddings';
import { createLogger } from '@mastra/core/logger';
// Import the pipeline function directly
import { pipeline } from '@xenova/transformers';

// Create a logger instance for the XenovaEmbeddings class
const logger = createLogger({
  name: 'Mastra-XenovaEmbeddings',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

// Define the Xenova embeddings configuration schema
export const XenovaEmbeddingsConfigSchema = z.object({
  modelName: z.string().default('all-MiniLM-L6-v2'),
  quantization: z.enum(['int8', 'none']).default('int8'),
  dimensions: z.number().default(384),
});

// Export the type from the schema
export type XenovaEmbeddingsConfig = z.infer<typeof XenovaEmbeddingsConfigSchema>;

/**
 * XenovaEmbeddings class for generating vector embeddings using Xenova Transformers
 */
export class XenovaEmbeddings extends Embeddings {
  private modelName: string;
  private quantization: string;
  private dimensions: number;
  private pipeline: any;
  private isModelLoaded: boolean = false;

  /**
   * Create a new XenovaEmbeddings instance
   * @param config - Configuration for the Xenova embeddings
   */
  constructor(config: XenovaEmbeddingsConfig) {
    super({
      provider: 'xenova',
      options: config,
    });

    // Validate configuration
    const validatedConfig = XenovaEmbeddingsConfigSchema.parse(config);

    this.modelName = validatedConfig.modelName;
    this.quantization = validatedConfig.quantization;
    this.dimensions = validatedConfig.dimensions;

    // Pipeline will be loaded on first use
    this.pipeline = null;
  }

  /**
   * Load the embedding model if not already loaded
   */
  private async loadModel() {
    if (this.isModelLoaded) {
      return;
    }

    try {
      logger.info(`[Xenova] Loading model: ${this.modelName}`);

      // Set quantization options based on configuration
      const quantizationOptions = this.quantization === 'int8'
        ? { quantized: true }
        : { quantized: false };

      // Create the feature extraction pipeline
      this.pipeline = await pipeline('feature-extraction', this.modelName, {
        ...quantizationOptions,
        revision: 'main',
      });

      this.isModelLoaded = true;
      logger.info(`[Xenova] Model loaded: ${this.modelName}`);
    } catch (error) {
      logger.error(`[Xenova] Error loading model: ${error}`);

      // Try fallback approach - simpler model
      try {
        logger.warn(`[Xenova] Trying fallback model: all-MiniLM-L6-v2`);
        this.pipeline = await pipeline('feature-extraction', 'all-MiniLM-L6-v2', {
          quantized: true,
          revision: 'main',
        });
        this.isModelLoaded = true;
        logger.info(`[Xenova] Fallback model loaded: all-MiniLM-L6-v2`);
      } catch (fallbackError) {
        logger.error(`[Xenova] Error loading fallback model: ${fallbackError}`);
        throw new Error(`Failed to load Xenova model: ${error}. Fallback also failed: ${fallbackError}`);
      }
    }
  }

  /**
   * Generate an embedding for a text
   * @param text - Text to embed
   * @returns Vector embedding
   */
  async embed(text: string) {
    try {
      // Load the model if not already loaded
      if (!this.isModelLoaded) {
        await this.loadModel();
      }

      // Generate the embedding using the pipeline
      const result = await this.pipeline(text, {
        pooling: 'mean',
        normalize: true,
        truncation: true,
        max_length: 512 // Prevent token limit issues
      });

      // Extract the embedding from the result
      const embedding = Array.from(result.data) as number[];

      logger.debug(`[Xenova] Generated embedding with ${embedding.length} dimensions`);
      return embedding;
    } catch (error) {
      logger.error(`[Xenova] Error generating embedding: ${error}`);

      // Fallback to deterministic hash-based embedding
      try {
        logger.warn(`[Xenova] Using deterministic hash-based embedding as fallback`);
        return this.generateDeterministicEmbedding(text, this.dimensions);
      } catch (fallbackError) {
        logger.error(`[Xenova] Error generating deterministic embedding: ${fallbackError}`);

        // Last resort - random embedding
        logger.warn(`[Xenova] Using random embedding as last resort`);
        const embedding = Array.from({ length: this.dimensions }, () => Math.random() * 2 - 1);

        // Normalize the vector to unit length (cosine similarity)
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        const normalizedEmbedding = embedding.map(val => val / magnitude);

        return normalizedEmbedding;
      }
    }
  }

  /**
   * Generate embeddings for multiple texts
   * @param texts - Array of texts to embed
   * @returns Array of vector embeddings
   */
  async embedBatch(texts: string[]) {
    try {
      // Load the model if not already loaded
      if (!this.isModelLoaded) {
        await this.loadModel();
      }

      // Generate embeddings for each text
      const embeddings = [];
      const batchSize = 16; // Process in smaller batches for better memory management

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchPromises = batch.map(text => this.embed(text));
        const batchResults = await Promise.all(batchPromises);
        embeddings.push(...batchResults);
      }

      return embeddings;
    } catch (error) {
      logger.error(`[Xenova] Error generating batch embeddings: ${error}`);

      // Fallback to individual embedding
      logger.warn(`[Xenova] Falling back to individual embedding generation`);
      const embeddings = [];
      for (const text of texts) {
        embeddings.push(await this.embed(text));
      }

      return embeddings;
    }
  }

  /**
   * Generate a deterministic embedding based on text hash
   * @param text - Text to generate embedding for
   * @param dimensions - Number of dimensions for the embedding
   * @returns Deterministic embedding vector
   */
  private generateDeterministicEmbedding(text: string, dimensions: number): number[] {
    // Simple hash function to generate a seed
    const hashString = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      return hash;
    };

    // Generate a deterministic random number using a seed
    const seededRandom = (seed: number): () => number => {
      let state = seed;
      return () => {
        state = (state * 9301 + 49297) % 233280;
        return state / 233280;
      };
    };

    // Generate embedding using seeded random function
    const seed = hashString(text);
    const random = seededRandom(seed);
    const embedding = Array.from({ length: dimensions }, () => random() * 2 - 1);

    // Normalize the vector to unit length (cosine similarity)
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedEmbedding = embedding.map(val => val / magnitude);

    return normalizedEmbedding;
  }
}
