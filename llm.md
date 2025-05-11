# Mastra AI with Google Integration - Knowledge Graph Architecture (2025)

## System Overview

This document describes the modular architecture of a Mastra AI application with Google integration. The system is designed with a focus on maintainability, extensibility, and clean separation of concerns. Rather than implementing numerous features at once, this architecture establishes a solid foundation that can be incrementally enhanced over time.

## Core Architecture

### Directory Structure

```bash
project/
├── src/
│   ├── agents/             # Agent definitions and configurations
│   ├── memory/             # Memory system implementations
│   ├── tools/              # Tool implementations
│   ├── embeddings/         # Embedding models and utilities
│   ├── workflows/          # LangGraph workflows
│   ├── knowledge/          # Knowledge graph and RAG components
│   ├── voice/              # Voice processing components
│   ├── utils/              # Shared utilities
│   └── config/             # Configuration management
├── tests/                  # Test suite
├── .env                    # Environment variables
├── .env.example            # Environment variables
├── llm.md                  # Documentation for LLM integration
├── llm.json                # JSON representation of the LLM architecture
├── README.md               # Documentation
└── package.json            # Node.js package configuration
```

### Modular Components

Each component is designed to be:

- **Self-contained**: Minimal dependencies on other components
- **Well-defined interfaces**: Clear APIs for integration
- **Independently testable**: Can be tested in isolation
- **Configurable**: Customizable through configuration rather than code changes
- **Extensible**: Easy to add new capabilities without modifying existing code

## Core Components

### Agent System

- **Type**: Modular Agent Framework
- **Description**: Core agent system with pluggable capabilities
- **Location**: `src/agents/`
- **Key Files**:
  - `baseAgent.ts`: Base agent implementation
  - `complexAgent.ts`: Agent optimized for complex reasoning
  - `balancedAgent.ts`: Agent balancing performance and cost
  - `realtimeAgent.ts`: Agent for real-time applications
- **Data Schema**: See [data-schema.md](data-schema.md) for the complete schema definitions
- **Implementation**:

  ```typescript
  import { Agent } from "@mastra/core/agent";
  import { google } from "@ai-sdk/google";
  import { Memory } from "../memory/memory";
  import { ToolRegistry } from "../tools/registry";
  import { z } from "zod"; // For schema validation

  // Configuration schema
  const AgentConfigSchema = z.object({
    name: z.string().optional().default("BaseAgent"),
    instructions: z.string().optional().default("You are a helpful assistant."),
    modelName: z.string().optional().default("gemini-2.5-pro-preview-05-06"),
    memory: z.any().optional(),
    // Add other configuration options as needed
  });

  // Infer the type from the schema
  type AgentConfig = z.infer<typeof AgentConfigSchema>;

  export class BaseAgent {
    protected agent: Agent;
    protected memory?: Memory;
    protected tools: ToolRegistry;

    constructor(config: AgentConfig) {
      // Validate configuration
      const validatedConfig = AgentConfigSchema.parse(config);
      
      this.tools = new ToolRegistry();
      
      if (validatedConfig.memory) {
        this.memory = validatedConfig.memory;
      }
      
      this.agent = new Agent({
        name: validatedConfig.name,
        instructions: validatedConfig.instructions,
        model: google(validatedConfig.modelName),
        memory: this.memory?.getMemoryInstance(),
        tools: this.tools.getEnabledTools(),
      });
    }

    async stream(input: string, options = {}) {
      return this.agent.stream(input, options);
    }

    registerTool(tool: any) {
      this.tools.register(tool);
      return this;
    }
  }
  ```

### Memory System

- **Type**: Modular Memory Architecture
- **Description**: Pluggable memory system with different storage backends
- **Location**: `src/memory/`
- **Key Files**:
  - `memory.ts`: Memory interface and factory
  - `upstashMemory.ts`: Upstash Redis implementation
  - `localMemory.ts`: Local storage implementation for development
- **Data Schema**: See [data-schema.md](data-schema.md) for the complete schema definitions
- **Implementation**:

  ```typescript
  import { z } from "zod";
  import { v4 as uuidv4 } from "uuid";

  // Memory configuration schema
  const MemoryConfigSchema = z.object({
    provider: z.enum(["upstash", "local"]),
    options: z.record(z.any()).optional(),
  });

  // Infer the type from the schema
  export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;

  export class Memory {
    private instance;
    
    constructor(config: MemoryConfig) {
      // Validate configuration
      const validatedConfig = MemoryConfigSchema.parse(config);
      this.instance = this.createMemoryInstance(validatedConfig);
    }
    
    private createMemoryInstance(config: MemoryConfig) {
      switch (config.provider) {
        case "upstash":
          return this.createUpstashMemory(config.options);
        case "local":
          return this.createLocalMemory(config.options);
        default:
          // This should never happen due to zod validation
          throw new Error(`Unsupported memory provider: ${config.provider}`);
      }
    }
    
    private createUpstashMemory(options?: Record<string, any>) {
      const { Memory } = require("@mastra/memory");
      const { UpstashStore } = require("@mastra/memory/upstash");
      
      return new Memory({
        storage: new UpstashStore({
          url: options?.url || process.env.UPSTASH_REDIS_REST_URL,
          token: options?.token || process.env.UPSTASH_REDIS_REST_TOKEN,
        })
      });
    }
    
    private createLocalMemory(options?: Record<string, any>) {
      const { Memory } = require("@mastra/memory");
      const { LocalStore } = require("@mastra/memory/local");
      
      return new Memory({
        storage: new LocalStore({
          path: options?.path || "./data/memory",
        })
      });
    }
    
    getMemoryInstance() {
      return this.instance;
    }

    async createThread(resourceId: string, title: string, metadata: Record<string, any> = {}) {
      const thread = {
        id: uuidv4(),
        resourceId,
        title,
        metadata: JSON.stringify(metadata),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store thread in database
      await this.instance.storage.set(`thread:${thread.id}`, JSON.stringify(thread));
      
      return thread;
    }

    async addMessage(threadId: string, content: string, role: 'system' | 'user' | 'assistant' | 'tool', type: 'text' | 'tool-call' | 'tool-result') {
      const message = {
        id: uuidv4(),
        thread_id: threadId,
        content,
        role,
        type,
        createdAt: new Date()
      };
      
      // Store message in database
      await this.instance.storage.set(`message:${message.id}`, JSON.stringify(message));
      
      // Add message to thread's message list
      await this.instance.storage.lpush(`thread:${threadId}:messages`, message.id);
      
      return message;
    }

    async getThreadMessages(threadId: string, limit = 10) {
      // Get message IDs from thread's message list
      const messageIds = await this.instance.storage.lrange(`thread:${threadId}:messages`, 0, limit - 1);
      
      // Get messages by IDs
      const messages = [];
      for (const messageId of messageIds) {
        const messageJson = await this.instance.storage.get(`message:${messageId}`);
        if (messageJson) {
          messages.push(JSON.parse(messageJson));
        }
      }
      
      return messages;
    }
  }
  ```

### Tool System

- **Type**: Modular Tool Registry
- **Description**: Centralized registry for tools with dynamic loading
- **Location**: `src/tools/`
- **Key Files**:
  - `registry.ts`: Tool registration and management
  - `search/`: Search-related tools
  - `code/`: Code execution tools
  - `browser/`: Web browsing tools
  - `rag/`: RAG-related tools
- **Implementation**:

  ```typescript
  export class ToolRegistry {
    private tools: Map<string, any> = new Map();
    private enabledTools: Set<string> = new Set();
    
    register(tool: any) {
      if (!tool.name) {
        throw new Error("Tool must have a name property");
      }
      this.tools.set(tool.name, tool);
      // Auto-enable tools when registered
      this.enabledTools.add(tool.name);
      return this;
    }
    
    enable(toolName: string) {
      if (this.tools.has(toolName)) {
        this.enabledTools.add(toolName);
      } else {
        throw new Error(`Tool not found: ${toolName}`);
      }
      return this;
    }
    
    disable(toolName: string) {
      this.enabledTools.delete(toolName);
      return this;
    }
    
    getEnabledTools() {
      return Array.from(this.enabledTools)
        .map(name => this.tools.get(name))
        .filter(Boolean);
    }
    
    getAllTools() {
      return Array.from(this.tools.values());
    }
  }
  ```

  ```typescript
  // Example tool implementation
  import { z } from "zod";

  // Tool parameter schema
  const BraveSearchParamsSchema = z.object({
    query: z.string(),
    limit: z.number().optional().default(5),
  });

  export function createBraveSearchTool(config: { apiKey?: string }) {
    return {
      name: "braveSearch",
      description: "Search the web using Brave Search",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query"
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return"
          }
        },
        required: ["query"]
      },
      execute: async (params: unknown) => {
        // Validate parameters
        const { query, limit } = BraveSearchParamsSchema.parse(params);
        
        const apiKey = config?.apiKey || process.env.BRAVE_API_KEY;
        if (!apiKey) {
          throw new Error("Brave API key is required");
        }
        
        // TODO: Implement Brave search API call
        // For now, return mock results
        const results = [
          { title: "Result 1", url: "https://example.com/1", snippet: "This is the first result" },
          { title: "Result 2", url: "https://example.com/2", snippet: "This is the second result" },
        ].slice(0, limit);
        
        return results;
      }
    };
  }
  ```

### Embedding System

- **Type**: Modular Embedding Framework
- **Description**: Pluggable embedding system with different models
- **Location**: `src/embeddings/`
- **Key Files**:
  - `embeddingProvider.ts`: Provider interface and factory
  - `geminiEmbedding.ts`: Google Gemini embedding implementation
  - `localEmbedding.ts`: Local transformer model implementation
- **Implementation**:

  ```typescript
  import { z } from "zod";

  // Embedding configuration schema
  const EmbeddingConfigSchema = z.object({
    provider: z.enum(["gemini", "local"]),
    options: z.record(z.any()).optional(),
  });

  // Infer the type from the schema
  export type EmbeddingConfig = z.infer<typeof EmbeddingConfigSchema>;

  export class EmbeddingProvider {
    private provider;
    
    constructor(config: EmbeddingConfig) {
      // Validate configuration
      const validatedConfig = EmbeddingConfigSchema.parse(config);
      this.provider = this.createProvider(validatedConfig);
    }
    
    private createProvider(config: EmbeddingConfig) {
      switch (config.provider) {
        case "gemini":
          return this.createGeminiProvider(config.options);
        case "local":
          return this.createLocalProvider(config.options);
        default:
          // This should never happen due to zod validation
          throw new Error(`Unsupported embedding provider: ${config.provider}`);
      }
    }
    
    private createGeminiProvider(options?: Record<string, any>) {
      // TODO: Implement Gemini embedding provider
      throw new Error("Gemini embedding provider not implemented yet");
    }
    
    private createLocalProvider(options?: Record<string, any>) {
      // TODO: Implement local embedding provider
      throw new Error("Local embedding provider not implemented yet");
    }
    
    async embed(text: string): Promise<number[]> {
      return this.provider.embed(text);
    }
  }
  ```

### Workflow System

- **Type**: LangGraph Workflow Framework
- **Description**: Graph-based workflow orchestration
- **Location**: `src/workflows/`
- **Key Files**:
  - `workflowBuilder.ts`: Workflow construction utilities
  - `ragWorkflow.ts`: RAG-specific workflow
  - `agentWorkflow.ts`: Agent-based workflow
- **Implementation**:

  ```typescript
  import { StateGraph, END } from "@langchain/langgraph";

  export class WorkflowBuilder<T> {
    private graph: StateGraph<T>;
    private nodes: Map<string, Function> = new Map();
    private edges: Array<[string, string]> = [];
    
    constructor(channels: Record<string, any>) {
      this.graph = new StateGraph<T>({ channels });
    }
    
    addNode(name: string, handler: Function) {
      this.nodes.set(name, handler);
      this.graph.addNode(name, handler);
      return this;
    }
    
    addEdge(from: string, to: string) {
      this.edges.push([from, to]);
      this.graph.addEdge(from, to === "END" ? END : to);
      return this;
    }
    
    build() {
      return this.graph.compile();
    }
  }
  ```

### Knowledge System

- **Type**: Modular Knowledge Framework
- **Description**: RAG and knowledge graph components
- **Location**: `src/knowledge/`
- **Key Files**:
  - `vectorStore.ts`: Vector database abstraction
  - `ragSystem.ts`: RAG implementation
  - `graphProcessor.ts`: Knowledge graph processor
- **Data Schema**: See [data-schema.md](data-schema.md) for the complete schema definitions
- **Implementation**:

  ```typescript
  import { z } from "zod";

  // Vector store configuration schema
  const VectorStoreConfigSchema = z.object({
    provider: z.enum(["upstash", "local"]),
    options: z.record(z.any()).optional(),
  });

  // Infer the type from the schema
  export type VectorStoreConfig = z.infer<typeof VectorStoreConfigSchema>;

  export class VectorStore {
    private store;
    
    constructor(config: VectorStoreConfig) {
      // Validate configuration
      const validatedConfig = VectorStoreConfigSchema.parse(config);
      this.store = this.createStore(validatedConfig);
    }
    
    private createStore(config: VectorStoreConfig) {
      switch (config.provider) {
        case "upstash":
          return this.createUpstashStore(config.options);
        case "local":
          return this.createLocalStore(config.options);
        default:
          // This should never happen due to zod validation
          throw new Error(`Unsupported vector store provider: ${config.provider}`);
      }
    }
    
    private createUpstashStore(options?: Record<string, any>) {
      // TODO: Implement Upstash vector store
      throw new Error("Upstash vector store not implemented yet");
    }
    
    private createLocalStore(options?: Record<string, any>) {
      // TODO: Implement local vector store
      throw new Error("Local vector store not implemented yet");
    }
    
    async query(vector: number[], options?: Record<string, any>) {
      return this.store.query(vector, options);
    }
    
    async upsert(documents: Array<Record<string, any>>) {
      return this.store.upsert(documents);
    }
  }
  ```

### Voice System

- **Type**: Modular Voice Framework
- **Description**: Voice input and output capabilities
- **Location**: `src/voice/`
- **Key Files**:
  - `voiceProvider.ts`: Voice provider interface and factory
  - `googleVoice.ts`: Google voice implementation
  - `elevenLabsVoice.ts`: ElevenLabs voice implementation
- **Implementation**:

  ```typescript
  import { z } from "zod";

  // Voice configuration schema
  const VoiceConfigSchema = z.object({
    provider: z.enum(["google", "elevenlabs", "composite"]),
    options: z.record(z.any()).optional(),
  });

  // Infer the type from the schema
  export type VoiceConfig = z.infer<typeof VoiceConfigSchema>;

  export class VoiceProvider {
    private provider;
    
    constructor(config: VoiceConfig)
  ```

### Configuration System

- **Type**: Centralized Configuration Management
- **Description**: Manages application configuration
- **Location**: `src/config/`
- **Key Files**:
  - `config.ts`: Configuration loading and validation
  - `defaults.ts`: Default configuration values
  - `schema.ts`: Configuration schema validation
- **Implementation**:

  ```typescript:src/config/config.ts
  import { z } from "zod";
  import { defaultConfig } from "./defaults";
  import { configSchema } from "./schema";

  export class Config {
    private static instance: Config;
    private config: Record<string, any>;
    
    private constructor() {
      this.config = this.loadConfig();
    }
    
    static getInstance() {
      if (!Config.instance) {
        Config.instance = new Config();
      }
      return Config.instance;
    }
    
    private loadConfig() {
      // Load from environment, files, etc.
      const config = { ...defaultConfig };
      
      // Override with environment variables
      // Override with config files
      
      // Validate
      return configSchema.parse(config);
    }
    
    get(path: string) {
      // Get config value by path
    }
    
    getAll() {
      return this.config;
    }
  }
  ```

## Usage Examples

### Basic Agent Setup

```typescript:src/examples/basicAgent.ts
import { BaseAgent } from "../agents/baseAgent";
import { Memory } from "../memory/memory";

// Create memory
const memory = new Memory({
  provider: "upstash",
  options: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  }
});

// Create agent
const agent = new BaseAgent({
  name: "BasicAgent",
  instructions: "You are a helpful assistant.",
  modelName: "gemini-2.5-pro-preview-05-06",
  memory
});

// Use agent
const response = await agent.stream("Hello, how can you help me?", {
  resourceId: "user_123",
  threadId: "conversation_1"
});
```

### Adding Tools to an Agent

```ts
import { BaseAgent } from "../agents/baseAgent";
import { createBraveSearchTool } from "../tools/search/braveSearch";
import { createCodeExecutionTool } from "../tools/code/codeExecution";

// Create agent
const agent = new BaseAgent({
  name: "ToolAgent",
  instructions: "You are a helpful assistant with search and code execution capabilities.",
  modelName: "gemini-2.5-pro-preview-05-06"
});

// Create and register tools
const searchTool = createBraveSearchTool({
  apiKey: process.env.BRAVE_API_KEY
});

const codeTool = createCodeExecutionTool({
  apiKey: process.env.E2B_API_KEY
});

// Register and enable tools
agent.registerTool(searchTool).registerTool(codeTool);

// Use agent with tools
const response = await agent.stream("Can you search for the latest JavaScript frameworks and show me a code example of using one?", {
  resourceId: "user_123",
  threadId: "conversation_1"
});
```

### Creating a RAG Workflow

```ts
import { WorkflowBuilder } from "../workflows/workflowBuilder";
import { EmbeddingProvider } from "../embeddings/embeddingProvider";
import { VectorStore } from "../knowledge/vectorStore";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Initialize components
const embeddings = new EmbeddingProvider({
  provider: "gemini",
  options: {
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
  }
});

const vectorStore = new VectorStore({
  provider: "upstash",
  options: {
    url: process.env.UPSTASH_VECTOR_REST_URL,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    index: "knowledge-index"
  }
});

const model = new ChatGoogleGenerativeAI({
  modelName: "gemini-2.5-pro-preview-05-06",
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY
});

// Define state type
type RAGState = {
  query: string;
  context?: string;
  response?: string;
};

// Create workflow
const workflow = new WorkflowBuilder<RAGState>({
  channels: {
    query: { value: "" },
    context: { value: undefined },
    response: { value: undefined }
  }
});

// Add nodes
workflow.addNode("retriever", async (state) => {
  // Embed the query
  const queryEmbedding = await embeddings.embed(state.query);
  
  // Retrieve relevant documents
  const results = await vectorStore.query(queryEmbedding, { topK: 5 });
  
  // Format context
  const context = results.map(doc => doc.text).join("\n\n");
  
  return { context };
});

workflow.addNode("generator", async (state) => {
  // Generate response using context
  const prompt = `
    Answer the following question based on the provided context.
    
    Context:
    ${state.context || "No context available."}
    
    Question:
    ${state.query}
  `;
  
  const response = await model.invoke(prompt);
  
  return { response: response.content };
});

// Define edges
workflow.addEdge("retriever", "generator");
workflow.addEdge("generator", "END");

// Build and export the workflow
const ragWorkflow = workflow.build();

// Example usage
const result = await ragWorkflow.invoke({
  query: "What are the key features of knowledge graphs?"
});

console.log(result.response);
```

### Voice-Enabled Agent

```ts
import { BaseAgent } from "../agents/baseAgent";
import { VoiceProvider } from "../voice/voiceProvider";

// Create voice provider
const voice = new VoiceProvider({
  provider: "composite",
  options: {
    input: {
      provider: "google",
      options: {
        apiKey: process.env.GOOGLE_CLOUD_TTS_KEY
      }
    },
    output: {
      provider: "elevenlabs",
      options: {
        apiKey: process.env.ELEVENLABS_API
      }
    }
  }
});

// Create agent with voice capabilities
const agent = new BaseAgent({
  name: "VoiceAgent",
  instructions: "You are a helpful assistant with voice capabilities.",
  modelName: "gemini-2.5-pro-preview-05-06",
  voice
});

// Example voice interaction
const audioInput = await getAudioFromMicrophone(); // Implementation depends on your platform
const transcription = await voice.listen(audioInput);
const response = await agent.stream(transcription, {
  resourceId: "user_123",
  threadId: "conversation_1"
});
const audioOutput = await voice.speak(response);
playAudio(audioOutput); // Implementation depends on your platform
```

### Environment Configuration

Create a .env file in your project root with the following variables:

#### LLM API

GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key

#### Memory Storage

UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

#### Vector Database

UPSTASH_VECTOR_REST_URL=your-upstash-vector-url
UPSTASH_VECTOR_REST_TOKEN=your-upstash-vector-token

#### Voice APIs

GOOGLE_CLOUD_TTS_KEY=your-google-cloud-tts-key
ELEVENLABS_API=your-elevenlabs-api-key

#### Tool APIs

BRAVE_API_KEY=your-brave-search-api-key
E2B_API_KEY=your-e2b-code-interpreter-key
HYPERBROWSER_API_KEY=your-hyperbrowser-api-key

#### Next Steps

This architecture provides a solid foundation for building a modular, maintainable AI application. Here are the recommended next steps:

Implement the core components outlined in this document
Create basic tests for each component to ensure they work as expected
Start with a minimal agent with basic memory and a few essential tools
Add capabilities incrementally as needed for your specific use case
Document APIs for each component to facilitate collaboration
Remember that the goal is to establish a solid foundation rather than implementing numerous features at once. This approach will make it easier to maintain and extend the application over time.
