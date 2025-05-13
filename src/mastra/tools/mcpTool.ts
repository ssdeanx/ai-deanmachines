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
  serverUrl: z.string().url().optional().describe("URL of the MCP server. If not provided, MCP_SERVER_URL environment variable will be used."),
  toolName: z.string().describe("Name of the tool to use on the MCP server (non-namespaced)"),
  toolInput: z.any().describe("Input for the specified tool"),
});

const mcpToolOutputSchema = z.any().describe("The result returned by the remote MCP tool.");


export const mcpTool = createTool({
  id: "mcpTool",
  description: "Interacts with MCP servers to use external tools.",
  inputSchema: mcpToolInputSchema,
  outputSchema: mcpToolOutputSchema,

  async execute(
    context // Type is inferred by createTool
  ): Promise<z.infer<typeof mcpToolOutputSchema>> {
    const { input, runtime } = context;
    const { logger, toolCallId, abortSignal } = runtime;
    
    logger.info('Executing MCP tool', { input: { ...input, serverUrl: input.serverUrl || 'MCP_SERVER_URL (if set)' }, config, toolCallId });

    let finalServerUrl: string;

    const envServerUrl = process.env.MCP_SERVER_URL;

    if (envServerUrl && envServerUrl.trim() !== "") {
      finalServerUrl = envServerUrl.trim();
      logger.info(`Using MCP_SERVER_URL from environment: ${finalServerUrl}`);
      if (input.serverUrl && input.serverUrl.trim() !== "" && input.serverUrl.trim() !== finalServerUrl) {
        logger.warn(`MCP_SERVER_URL from environment ('${finalServerUrl}') overrides provided input serverUrl ('${input.serverUrl.trim()}').`);
      }
    } else if (input.serverUrl && input.serverUrl.trim() !== "") {
      finalServerUrl = input.serverUrl.trim();
      logger.info(`Using serverUrl from input: ${finalServerUrl}`);
    } else {
      const errorMessage = 'MCP server URL is not defined. Provide it via input.serverUrl or set a non-empty MCP_SERVER_URL environment variable.';
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Validate the determined URL
    try {
      new URL(finalServerUrl);
    } catch (e) {
      const validationError = `Invalid MCP server URL determined: '${finalServerUrl}'. Error: ${e instanceof Error ? e.message : String(e)}`;
      logger.error(validationError);
      throw new Error(validationError);
    }
    
    const serverKey = "dynamicMcpServer";

    const mcpClientOptions: ConstructorParameters<typeof MCPClient>[0] = {
      servers: {
        [serverKey]: {
          url: new URL(finalServerUrl),
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
      logger.debug(`Attempting to fetch tools from MCP server: ${finalServerUrl}`);
      
      const toolsets = await mcpClient.getToolsets();
      const namespacedToolName = `${serverKey}.${input.toolName}`;
      const remoteTool = toolsets[namespacedToolName];

      if (!remoteTool) {
        const availableTools = Object.keys(toolsets).join(", ") || "No tools found";
        logger.error(`Tool '${input.toolName}' (namespaced: '${namespacedToolName}') not found on MCP server '${finalServerUrl}'. Available tools: [${availableTools}]`);
        throw new Error(`Tool '${input.toolName}' not found on MCP server '${finalServerUrl}'. Available: [${availableTools}]`);
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
        serverUrl: finalServerUrl,
      });
      if (error instanceof Error) {
        throw new Error(`MCP Tool execution failed for tool '${input.toolName}' on server '${finalServerUrl}': ${error.message}`, { cause: error });
      }
      throw new Error(`MCP Tool execution failed for tool '${input.toolName}' on server '${finalServerUrl}': ${errorMessage}`);
    } finally {
      logger.debug('Disconnecting MCPClient...');
      await mcpClient.disconnect();
      logger.debug('MCPClient disconnected.');
    }
  },
});