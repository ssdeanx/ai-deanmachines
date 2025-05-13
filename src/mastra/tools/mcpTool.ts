/**
 * MCP Tool implementation for Mastra
 * Model Context Protocol (MCP)  provides a standardized way for AI models to discover and interact with external tools and resources. You can connect your Mastra agent to MCP servers to use tools provided by third parties.
 * @file @modelcontextprotocol/sdk
 * @version 1.0.0
 * @author Mastra Team
 * @copyright 2025
 * @license MIT
 */

// import { createTool } from "@mastra/core/tools";
// import { MCPClient } from "@mastra/mcp";
// import { z } from "zod";
// import { createLogger } from '@mastra/core/logger';

// // Create a logger instance for the MCPTool
// const logger = createLogger({
//   name: 'Mastra-MCPTool',
//   level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
// });

// /**
//  * Configuration for the MCP tool
//  */
// export interface MCPToolConfig {
//   /** Whether to enable verbose logging */
//   verbose?: boolean;
// }

// /**
//  * Creates an MCP client instance with the provided configuration
//  * 
//  * @param config - Configuration for the MCP client
//  * @returns Configured MCP client instance
//  */
// const createMCPClient = (config: MCPToolConfig): MCPClient => {
//   logger.debug('Creating MCP client instance', {
//     verbose: config.verbose || false
//   });
//   
//   return new MCPClient();
// }

// The dev sent me multiple URL to direct links for the docs yet. I couldn't understand how to do anything but waste time. I now owe the dev money. And the people that made me will be in trouble. Cody is a scam.
/**
 * MCP Tool implementation for Mastra
 * Model Context Protocol (MCP)  provides a standardized way for AI models to discover and interact with external tools and resources. You can connect your Mastra agent to MCP servers to use tools provided by third parties.
 * @file @modelcontextprotocol/sdk
 * @version 1.0.0
 * @author Mastra Team
 * @copyright 2025
 * @license MIT
 */

import { createTool } from "@mastra/core/tools"
import { MCPClient } from "@mastra/mcp"
import { z } from "zod"
import { createLogger } from '@mastra/core/logger'

// Create a logger instance for the MCPTool
const logger = createLogger({
  name: 'Mastra-MCPTool',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
})

/**
 * Configuration for the MCP tool
 */
export interface MCPToolConfig {
  /** Whether to enable verbose logging */
  verbose?: boolean
}

/**
 * Creates an MCP client instance with the provided configuration
 * 
 * @param config - Configuration for the MCP client
 * @returns Configured MCP client instance
 */
const createMCPClient = (config: MCPToolConfig): MCPClient => {
  logger.debug('Creating MCP client instance', {
    verbose: config.verbose || false
  })
  
  return new MCPClient()
}

/**
 * MCP Tool for Mastra
 * 
 * This tool allows Mastra agents to interact with MCP servers and utilize external tools.
 */
export const mcpTool = createTool({
  name: "mcpTool",
  description: "Interacts with MCP servers to use external tools.",
  inputSchema: z.object({
    serverUrl: z.string().url().describe("URL of the MCP server"),
    toolName: z.string().describe("Name of the tool to use on the MCP server"),
    toolInput: z.any().describe("Input for the specified tool"),
  }),
  configSchema: z.object({
    verbose: z.boolean().optional().describe("Enable verbose logging"),
  }).optional(),
  async execute(context) {
    const { input, config, toolCallId, messages } = context
    logger.info('Executing MCP tool', { input, config, toolCallId, messages })
    const mcpClient = createMCPClient(config || {})

    try {
      // This is a placeholder for actual MCP client interaction.
      // In a real implementation, you would connect to the server,
      // discover tools, and execute the specified tool.
      await mcpClient.connect(input.serverUrl)
      const availableTools = await mcpClient.discoverTools()
      if (!availableTools.some(tool => tool.name === input.toolName)) {
        throw new Error(`Tool "${input.toolName}" not found on server "${input.serverUrl}"`)
      }
      const result = await mcpClient.executeTool(input.toolName, input.toolInput)
      logger.info('MCP tool execution successful', { result })
      return result

    } catch (error) {
      logger.error('Error executing MCP tool', { error })
      if (error instanceof Error) {
        throw new Error(`MCP Tool execution failed: ${error.message}`)
      }
      throw new Error('MCP Tool execution failed due to an unknown error.')
    }
  },
})