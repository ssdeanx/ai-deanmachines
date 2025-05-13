import { createTool, ToolExecutionContext, ToolRuntime } from "@mastra/core/tools";
import { z } from "zod";
import { createLogger } from "@mastra/core/logger";
import { Embeddings, EmbeddingsConfigSchema } from "../embeddings/embeddings";
import { VectorStore, VectorStoreConfigSchema, QueryResult } from "../knowledge/vectorStore";

const logger = createLogger({ name: "Mastra-VectorQueryTool" });

// Input Schema
const vectorQueryToolInputSchema = z.object({
    queryText: z.string().describe("The text query to search for."),
    vectorStoreConfig: VectorStoreConfigSchema.describe("Configuration for the vector store (e.g., provider, connection details)."),
    embeddingsConfig: EmbeddingsConfigSchema.describe("Configuration for the embeddings model (e.g., provider, model name)."),
    indexName: z.string().optional().describe("Optional: Name of the specific index/namespace to query. If provider is 'upstash', this will be used as the namespace."),
    topK: z.number().int().positive().optional().default(5).describe("Number of top results to retrieve. Defaults to 5."),
    filter: z.record(z.any()).optional().describe("Optional: Metadata filter to apply to the query. The filter format depends on the vector store provider."),
    // includeVector: z.boolean().optional().default(false).describe("Whether to include the vector in the results. Support depends on provider."),
});

// Output Schema
const vectorQueryToolOutputSchema = z.object({
    success: z.boolean().describe("Indicates whether the operation was successful."),
    results: z.array(
        z.object({
            id: z.string().describe("ID of the result document."),
            text: z.string().describe("Text content of the result document."),
            metadata: z.record(z.any()).optional().describe("Metadata associated with the document."),
            score: z.number().optional().describe("Similarity score of the result."),
            vector: z.array(z.number()).optional().describe("Embedding vector of the result (if requested and supported)."),
        })
    ).optional().describe("An array of query results."),
    message: z.string().optional().describe("An optional message, typically used for errors or additional information."),
});

export const vectorQueryTool = createTool({
    id: "vector-query",
    description: "Queries a vector store using a text input. The text is converted to an embedding, which is then used to find similar documents in the specified vector store.",
    inputSchema: vectorQueryToolInputSchema,
    outputSchema: vectorQueryToolOutputSchema,
    execute: async (executionContext: ToolExecutionContext<typeof vectorQueryToolInputSchema, typeof vectorQueryToolOutputSchema>) => {
        const { input, runtime } = executionContext;
        const { queryText, vectorStoreConfig: originalVectorStoreConfig, embeddingsConfig, indexName, topK, filter } = input;
        const toolLogger = runtime.logger || logger; // Use executionContext logger, fallback to module logger

        toolLogger.info(`Executing Vector Query tool for query: "${queryText.substring(0, 100)}..."`);

        try {
            const currentVectorStoreConfig = { ...originalVectorStoreConfig };
            if (indexName && originalVectorStoreConfig.provider === 'upstash') {
                currentVectorStoreConfig.options = {
                    ...originalVectorStoreConfig.options,
                    namespace: indexName,
                };
                toolLogger.debug(`Using Upstash namespace: ${indexName}`);
            }

            // 1. Initialize Embeddings
            toolLogger.debug("Initializing Embeddings service...");
            const embeddings = new Embeddings(embeddingsConfig);

            // 2. Initialize VectorStore
            toolLogger.debug("Initializing VectorStore service...");
            const vectorStore = new VectorStore(currentVectorStoreConfig);

            // 3. Generate Embedding for the query
            toolLogger.debug("Generating embedding for query text...");
            const queryEmbedding = await embeddings.embed(queryText);
            if (!queryEmbedding || queryEmbedding.length === 0) {
                toolLogger.error("Failed to generate query embedding.");
                return { success: false, message: "Failed to generate query embedding." };
            }
            toolLogger.debug(`Generated embedding with dimension: ${queryEmbedding.length}`);

            // 4. Query Vector Store
            const queryOptions: Record<string, any> = { topK };
            if (filter) {
                queryOptions.filter = filter; // Specific format might be needed by the provider
                toolLogger.debug("Applying filter to query:", filter);
            }
            // Example: if you add includeVector to input schema
            // if (input.includeVector) {
            //     queryOptions.includeValues = true; // For Upstash
            // }
            queryOptions.includeMetadata = true; // Generally useful

            toolLogger.debug(`Querying vector store (topK=${topK})...`);
            const searchResults: QueryResult[] = await vectorStore.query(queryEmbedding, queryOptions);
            toolLogger.info(`Found ${searchResults.length} results from vector store.`);

            return {
                success: true,
                results: searchResults.map(r => ({
                    id: r.id,
                    text: r.text,
                    metadata: r.metadata,
                    score: r.score,
                    vector: r.vector,
                })),
            };

        } catch (error: any) {
            toolLogger.error("Error executing vector query tool:", {
                message: error.message,
                stack: error.stack,
                details: error.details || error,
            });
            return { success: false, message: error.message || "An unknown error occurred during vector query." };
        }
    }
});

// Export for toolRegistry
export const vectorQueryToolDefinition = {
    tool: vectorQueryTool,
    // No specific tool-level config schema beyond what's in inputSchema for execution
    configSchema: z.any().optional().describe("Configuration schema for the vector query tool itself (if any, typically managed via input)."),
    // No specific tool-level runtime schema beyond standard ToolRuntime
    runtimeSchema: z.any().optional().describe("Runtime schema for the vector query tool (if any, typically standard ToolRuntime)."),
};
