import { createTool } from '@mastra/core/tools';
import { z } from "zod";
import { createLogger } from "@mastra/core/logger";
import { Client as QStashClient } from "@upstash/qstash";

const logger = createLogger({ name: "Mastra-UpstashQStashTool" });
const upstashQStashToolInputSchema = z.object({
  key: z.string().describe("The key for the QStash item."),
  value: z.string().describe("The value for the QStash item."),
});
const qstashClient = new QStashClient({
  token: process.env.UPSTASH_API_KEY,
});
export const upstashQStashTool = createTool({
  id: "upstash-qstash-tool",
  description: "A tool for interacting with Upstash QStash",
  inputSchema: upstashQStashToolInputSchema,
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: z.any().optional(), // Added to match the return type in execute
  }),
  execute: async ({ context, runtimeContext }, options) => {
    const { key, value } = context;
    logger.info(`Executing Upstash QStash tool for key: ${key}`, { runtimeContext });

    try {
      if (options?.abortSignal?.aborted) {
        logger.warn("Upstash QStash operation aborted before start.");
        return { success: false, message: "Operation aborted." };
      }

      const result = await qstashClient.publishJSON({
        url: key,
        body: value
      });

      if (options?.abortSignal?.aborted) {
        logger.warn("Upstash QStash operation aborted during execution.");
        return { success: false, message: "Operation aborted during execution." };
      }

      logger.info(`Upstash QStash tool completed successfully for key: ${key}`);
      return { success: true, data: result };

    } catch (error: any) {
      logger.error(`Error executing Upstash QStash tool for key ${key}: ${error.message}`, { errorName: error.name, stack: error.stack });
      if (error.name === 'AbortError' || options?.abortSignal?.aborted) {
        return { success: false, message: "Operation aborted by signal." };
      }
      return { success: false, message: error.message || "An unknown error occurred during Upstash QStash tool execution." };
    }
  },});

// Remove the old class-based tool if it's no longer needed or comment it out.
/*
export class UpstashQStashTool extends BaseTool {
  static getMetadata(): ToolMetadata {
    return {
      name: "upstash-qstash-tool",
      description: "A tool for interacting with Upstash QStash",
    };
  }

  async execute(input: string): Promise<string> {
    // Implement the logic for interacting with Upstash QStash
    return `Executed with input: ${input}`;
  }
}
*/