import { mcpTool } from './mcpTool';
import { createGraphRAGTool } from './graphRAGTool'; // Assuming it's exported as a creation function
import { vercelWeatherTool } from './vercelWeatherTool';
import { firecrawlTool } from './firecrawlTool';
import { 
  githubGetRepoInfoTool, 
  githubListIssuesTool, 
  githubCreateIssueTool 
} from './githubTool'; // Updated import for specific GitHub tools


// Placeholder instances for GraphRAGTool configuration
// In a real application, these would be properly initialized and configured.


const graphRAGTool = createGraphRAGTool({
    graphStore: {} as any, // Replace with actual
});

export const toolRegistry = {
  mcpTool,
  graphRAGTool,
  vercelWeatherTool,
  firecrawlTool,
  githubGetRepoInfoTool, // Added specific GitHub tool
  githubListIssuesTool,  // Added specific GitHub tool
  githubCreateIssueTool, // Added specific GitHub tool
  // Add other tools here as they are created
};

export type ToolName = keyof typeof toolRegistry;
