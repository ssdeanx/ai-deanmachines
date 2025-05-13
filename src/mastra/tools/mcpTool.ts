/**
 * MCP Tool implementation for Mastra
 * Model Context Protocol (MCP) provides a standardized way for AI models to discover and interact with external tools and resources. You can connect your Mastra agent to MCP servers to use tools provided by third parties.
 * @file @modelcontextprotocol/sdk
 * @version 1.0.0
 * @author Mastra Team
 * @copyright 2025
 * @license MIT
 */

import { createTool, type ToolExecutionContext } from "@mastra/core/tools";
import { z } from "zod";
import { MCPClient } from "@mastra/mcp";
import type { LogMessage, MastraMCPServerDefinition } from "@mastra/mcp";
import { createLogger } from '@mastra/core/logger'; // Corrected logger import

const logger = createLogger({
  name: 'MCP',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

const mcpToolInputSchema = z.object({
  serverUrl: z.string().url().describe("URL of the MCP server"),
  toolName: z.string().describe("Name of the tool to use on the MCP server (non-namespaced)"),
  toolInput: z.any().describe("Input for the specified tool"),
});

const mcpToolOutputSchema = z.any().describe("The result returned by the remote MCP tool.");

const mcpToolConfigSchema = z.object({
  verbose: z.boolean().optional().describe("Enable verbose logging for the MCP client and server communication."),
  serverRequestInit: z.any().optional().describe("RequestInit object for the MCP server connection (e.g., for headers). Passed to the server definition."),
  serverTimeout: z.number().int().positive().optional().describe("Timeout in milliseconds for the specific MCP server communication."),
  clientTimeout: z.number().int().positive().optional().describe("Global timeout in milliseconds for the MCPClient instance itself.")
}).optional();

export const mcpTool = createTool({
  id: "mcpTool",
  description: "Interacts with MCP servers to use external tools.",
  inputSchema: mcpToolInputSchema,
  outputSchema: mcpToolOutputSchema,
  configSchema: mcpToolConfigSchema,

  async execute(
    context: ToolExecutionContext<
      typeof mcpToolInputSchema,
      typeof mcpToolOutputSchema,
      typeof mcpToolConfigSchema
    >
  ): Promise<z.infer<typeof mcpToolOutputSchema>> {
    const { input, config, runtime } = context;
    const { logger, toolCallId, abortSignal } = runtime;
    
    logger.info('Executing MCP tool', { input, config, toolCallId });

    const serverKey = "dynamicMcpServer";

    const mcpClientOptions: ConstructorParameters<typeof MCPClient>[0] = {
      servers: {
        [serverKey]: {
          url: new URL(input.serverUrl),
          requestInit: config?.serverRequestInit,
          timeout: config?.serverTimeout,
          enableServerLogs: config?.verbose,
          logger: config?.verbose
            ? (logMessage: LogMessage) => {
                const level = logMessage.level || 'info';
                const message = `[MCP Server: ${logMessage.serverName || serverKey}] ${logMessage.message}`;
                if (typeof (logger as any)[level] === 'function') {
                  ((logger as any)[level] as Function)(message, logMessage.details);
                } else {
                  logger.info(message, logMessage.details);
                }
              }
            : undefined,
        } as MastraMCPServerDefinition,
      },
      timeout: config?.clientTimeout,
    };

    if (config?.verbose) {
      logger.debug('MCPTool verbose mode enabled. MCPClient options:', mcpClientOptions);
    }

    const mcpClient = new MCPClient(mcpClientOptions);

    try {
      logger.debug(`Attempting to fetch tools from MCP server: ${input.serverUrl}`);
      
      const toolsets = await mcpClient.getToolsets();
      const namespacedToolName = `${serverKey}.${input.toolName}`;
      const remoteTool = toolsets[namespacedToolName];

      if (!remoteTool) {
        const availableTools = Object.keys(toolsets).join(", ") || "No tools found";
        logger.error(`Tool '${input.toolName}' (namespaced: '${namespacedToolName}') not found on MCP server '${input.serverUrl}'. Available tools: [${availableTools}]`);
        throw new Error(`Tool '${input.toolName}' not found on MCP server '${input.serverUrl}'. Available: [${availableTools}]`);
      }

      logger.debug(`Found remote tool '${namespacedToolName}'. Executing with input:`, input.toolInput);

      const result = await remoteTool.execute({
        input: input.toolInput,
        runtime: { 
          logger, 
          toolCallId,
        },
        abortSignal,
      });

      logger.info('MCP tool execution successful', { result });
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error executing MCP tool', {
        error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : error,
        toolName: input.toolName,
        serverUrl: input.serverUrl,
      });
      if (error instanceof Error) {
        throw new Error(`MCP Tool execution failed for tool '${input.toolName}' on server '${input.serverUrl}': ${error.message}`, { cause: error });
      }
      throw new Error(`MCP Tool execution failed for tool '${input.toolName}' on server '${input.serverUrl}': ${errorMessage}`);
    } finally {
      logger.debug('Disconnecting MCPClient...');
      await mcpClient.disconnect();
      logger.debug('MCPClient disconnected.');
    }
  },
});