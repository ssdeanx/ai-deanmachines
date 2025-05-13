import { mcpTool } from './mcpTool';
import { createGraphRAGTools } from './graphRAGTool'; // Updated import
import { vercelWeatherTool } from './vercelWeatherTool';
import { firecrawlTool } from './firecrawlTool';
import { 
  githubGetRepoInfoTool, 
  githubListIssuesTool, 
  githubCreateIssueTool 
} from './githubTool';

// Placeholder configuration for GraphRAG tools
// In a real application, this would come from a config file or environment variables.
const graphRAGToolsConfig = {
  graphRAGInstanceConfig: {
    // These are placeholders and need to be replaced with actual configuration
    // for your GraphRAG instance (e.g., connection details, model info)
    vectorStoreName: 'defaultVectorStore',
    indexName: 'defaultIndex',
    model: {} as any, // Placeholder for model configuration or instance
    // graphOptions, etc., would go here if needed by your GraphRAG constructor
  },
  defaultMaxResults: 10,
};

const { 
  queryTool: graphRAGQueryTool, 
  addDocumentsTool: graphRAGAddDocumentsTool, 
  getSchemaTool: graphRAGGetSchemaTool 
} = createGraphRAGTools(graphRAGToolsConfig);

export const toolRegistry = {
  mcpTool,
  graphRAGQueryTool,        // Added new GraphRAG query tool
  graphRAGAddDocumentsTool, // Added new GraphRAG add documents tool
  graphRAGGetSchemaTool,    // Added new GraphRAG get schema tool
  vercelWeatherTool,
  firecrawlTool,
  githubGetRepoInfoTool,
  githubListIssuesTool,
  githubCreateIssueTool,
  // Add other tools here as they are created
};

export type ToolName = keyof typeof toolRegistry;
