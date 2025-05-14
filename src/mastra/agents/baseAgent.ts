/**
 * BaseAgent implementation for Mastra framework
 * 
 * @file Provides the BaseAgent class which serves as the foundation for all agent types
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 */

import { createLogger } from '@mastra/core/logger';
import { Agent as MastraAgent } from '@mastra/core';
import { Tool as MastraTool } from '@mastra/core/tools';
import { google } from '@ai-sdk/google';
import { 
  generateText, 
  streamText, 
  generateObject, 
  Message
} from 'ai';
import { Memory, createMemory, createAdvancedMemory, sharedMemory, initThreadManager, ThreadManager, ThreadInfo } from '../memory';
import { DefinedAgentConfig } from '../config/agentConfig';
import { getModelInstance } from '../config/models';
import { getTracer, recordLLMMetrics } from '../observability/telemetry';
import { SpanKind } from '@opentelemetry/api';
import { AgentType, DEFAULT_INSTRUCTIONS, TOOL_CATEGORIES } from './constants';
import { 
  StreamOptionsSchema, 
  GenerateOptionsSchema, 
  ToolConfig,
  MessageSchema
} from './types';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// FUTURE_IMPORT: Import tool-related modules here
// import { ToolRegistry, ToolExecutor } from '../tools';

// FUTURE_IMPORT: Import vector database modules here
// import { VectorDB, EmbeddingService } from '../vectordb';

// Create a logger instance for the BaseAgent
const logger = createLogger({
  name: 'Mastra-BaseAgent',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
});

/**
 * Interface for tool call payload
 */
export interface ToolCallPayload {
  /** Name of the tool to call */
  name: string;
  /** Arguments to pass to the tool */
  args: Record<string, any>;
}

/**
 * Type for agent middleware function
 */
export type AgentMiddleware = (
  input: string, 
  context: { 
    agent: BaseAgent, 
    options: any, 
    messages?: Message[] 
  }
) => Promise<{ input: string, options: any } | null>;

/**
 * Runtime context for agent operations
 */
export interface RuntimeContext {
  /** Unique identifier for the conversation thread */
  threadId?: string;
  /** Unique identifier for the resource being processed */
  resourceId?: string;
  /** Additional metadata for the operation */
  metadata?: Record<string, any>;
  /** Additional context properties */
  [key: string]: any;
}

/**
 * BaseAgent class that provides core functionality for all agent types
 * 
 * @class BaseAgent
 * @description Foundation class for all Mastra agents with common functionality for LLM interactions,
 * tool execution, memory management, and middleware processing.
 */
export class BaseAgent {
  /** Name of the agent */
  public name: string;
  
  /** Underlying Mastra agent instance */
  protected agent: MastraAgent;
  
  /** AI SDK model instance */
  protected sdkModel: any;
  
  /** Optional memory instance for conversation history */
  protected memory?: Memory;
  
  /** Array of tools available to the agent */
  protected tools: ToolConfig[] = [];
  
  // FUTURE_PROPERTY: Vector database instance
  // protected vectorDB?: VectorDB;
  
  /** Type of agent (e.g., CHAT, ASSISTANT, etc.) */
  protected type: AgentType;

  /** Temperature parameter for model generation */
  protected temperature: number;
  
  /** Maximum tokens for model output */
  protected maxTokens?: number;
  
  /** Top-p sampling parameter */
  protected topP?: number;
  
  /** Top-k sampling parameter */
  protected topK?: number;
  
  /** Middleware functions to process inputs before sending to the model */
  private middlewares: AgentMiddleware[] = [];
  
  // FUTURE_PROPERTY: Tool registry for managing tools
  // private toolRegistry?: ToolRegistry;

  /**
   * Creates a new BaseAgent instance
   * 
   * @param config - Configuration for the agent
   * @throws {Error} When configuration validation fails
   */
  constructor(config: DefinedAgentConfig) {
    this.name = config.name;
    logger.info(`Creating BaseAgent with name: ${this.name}`);

    const modelInst = getModelInstance(config.agentLLMConfig.modelInstanceId);
    this.sdkModel = google(modelInst.modelIdString);

    this.type = config.type;
    this.temperature = config.agentLLMConfig.temperature ?? config.temperature ?? 0.7;
    this.maxTokens = config.agentLLMConfig.maxTokens ?? config.maxTokens ?? modelInst.maxOutputTokens;
    this.topP = config.agentLLMConfig.topP ?? config.topP;
    this.topK = config.topK;

    if (config.memory) {
      this.memory = config.memory instanceof Memory ? config.memory : new Memory(config.memory);
    } else {
      this.memory = sharedMemory;
    }
    if (config.tools) this.tools = config.tools;
    
    // FUTURE_INITIALIZATION: Initialize vector database if configured
    // if (config.vectorDB) this.vectorDB = new VectorDB(config.vectorDB);
    
    // FUTURE_INITIALIZATION: Initialize tool registry
    // this.toolRegistry = new ToolRegistry(this.tools);

    this.agent = new MastraAgent({
      name: this.name,
      instructions: config.instructions || DEFAULT_INSTRUCTIONS.BASE,
      model: this.sdkModel,
      tools: this.tools.length
        ? this.tools.reduce((acc, t) => ({ ...acc, [t.name]: t }), {})
        : undefined
    });
    logger.info(`BaseAgent '${this.name}' initialized`);
  }

  /**
   * Streams a response from the agent
   * 
   * @param input - User input to process
   * @param options - Stream options
   * @returns An async iterable response with the generated text
   * @throws {Error} When streaming fails and fallback is unsuccessful
   */
  async stream(input: string, options: any = {}) {
    const tracer = getTracer('mastra.agent.stream');
    const span = tracer.startSpan(`${this.name}.stream`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'input.length': input.length,
        'options': JSON.stringify(options)
      },
      startTime: Date.now()
    });

    const opts = StreamOptionsSchema.parse(options);
    const resourceId = opts.resourceId || uuidv4();
    const threadId = opts.threadId || uuidv4();
    
    // Apply middleware
    const processedInput = await this.applyMiddleware(input, opts);
    if (!processedInput) {
      logger.warn('Middleware cancelled the stream operation');
      span.end();
      return { text: '', cancelled: true };
    }
    
    if (this.memory) {
      // Create a properly formatted message object
      const userMessage = MessageSchema.parse({
        content: processedInput.input,
        role: 'user',
        type: 'text',
        timestamp: Date.now()
      });
      
      await this.memory.addMessage(threadId, userMessage.content, userMessage.role, userMessage.type, {
        taskType: 'user_input',
        subtaskCount: 1,
        timestamp: new Date().toISOString()
      }, userMessage.role, userMessage.type);
    }

    try {
      // Get conversation history if memory is available
      let messages: Message[] = [];
      if (this.memory && threadId) {
        const history = await this.memory.getMessages(threadId, 10);
        messages = history.map((msg: { role: any; content: any; type: string; }) => ({
          role: msg.role as any,
          content: msg.content,
          ...(msg.type !== 'text' ? { type: msg.type } : {})
        }));
      }
      
      // FUTURE_FEATURE: Enhance with vector database context retrieval
      // if (this.vectorDB) {
      //   const relevantContext = await this.vectorDB.search(processedInput.input);
      //   processedInput.input = `Context: ${relevantContext}\n\nQuery: ${processedInput.input}`;
      // }
      
      // Use the agent's stream method
      const response = await this.agent.stream(processedInput.input, { 
        ...processedInput.options, 
        resourceId, 
        threadId,
        messages
      });

      // Make response iterable
      const asyncIterableResponse = {
        ...response,
        [Symbol.asyncIterator]() {
          return {
            async next() {
              return { done: true, value: response.text };
            }
          };
        }
      };
      
      // Store the assistant's response in memory if available
      if (this.memory && response.text) {
        // Create a properly formatted message object
        const assistantMessage = MessageSchema.parse({
          content: response.text,
          role: 'assistant',
          type: 'text',
          timestamp: Date.now()
        });
        
         await this.memory.addMessage(threadId, assistantMessage.content, assistantMessage.role, assistantMessage.type, {
          taskType: 'assistant_response',
          subtaskCount: 1,
          timestamp: new Date().toISOString()
        }, assistantMessage.role, assistantMessage.type);
      }
      
      recordLLMMetrics({ modelName: this.sdkModel.modelIdString, operationType: 'stream' });
      return asyncIterableResponse;
    } catch (error) {
      logger.error(`Error streaming response: ${error}`);
      
      // Fallback to direct streaming using the AI package
      try {
        logger.info('Attempting fallback streaming with AI package');
        const stream = streamText({
          model: this.sdkModel,
          prompt: processedInput.input,
          temperature: this.temperature,
          maxTokens: this.maxTokens
        });
        
        // Collect the full text from the stream
        let fullText = '';
        for await (const chunk of stream.textStream) {
          fullText += chunk;
        }
        
        // Store in memory if available
        if (this.memory && fullText) {
          // Create a properly formatted message object
          const assistantMessage = MessageSchema.parse({
            content: fullText,
            role: 'assistant',
            type: 'text',
            timestamp: Date.now()
          });
          
          await this.memory.addMessage(threadId, assistantMessage.content, assistantMessage.role, assistantMessage.type, {
          taskType: 'assistant_response',
          subtaskCount: 1,
          timestamp: new Date().toISOString()
        }, assistantMessage.role, assistantMessage.type);
      }

        return {
          text: fullText,
          fallback: true,
          [Symbol.asyncIterator]() {
            return {
              async next() {
                return { done: true, value: fullText };
              }
            };
          }
        };
      } catch (fallbackError) {
        logger.error(`Fallback streaming failed: ${fallbackError}`);
        throw error; // Throw the original error
      }
    } finally {
      span.end();
    }
  }

  /**
   * Generates a complete response from the agent
   * 
   * @param input - User input to process
   * @param options - Generation options
   * @returns Complete response
   * @throws {Error} When generation fails and fallback is unsuccessful
   */
  async generate(input: string, options: any = {}) {
    const tracer = getTracer('mastra.agent.generate');

    const span = tracer.startSpan(`${this.name}.generate`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'input.length': input.length,
        'options': JSON.stringify(options)
      },
      startTime: Date.now()
    });

    const opts = GenerateOptionsSchema.parse(options);
    const resourceId = opts.resourceId || uuidv4();
    const threadId = opts.threadId || uuidv4();
    
    // Apply middleware
    const processedInput = await this.applyMiddleware(input, opts);
    if (!processedInput) {
      logger.warn('Middleware cancelled the generate operation');
      span.end();
      return { text: '', cancelled: true };
    }
    
    if (this.memory) {
      // Create a properly formatted message object
      const userMessage = MessageSchema.parse({
        content: processedInput.input,
        role: 'user',
        type: 'text',
        timestamp: Date.now()
      });
      
      await this.memory.addMessage(threadId, userMessage.content, userMessage.role, userMessage.type, {
        taskType: 'user_input',
        subtaskCount: 1,
        timestamp: new Date().toISOString()
      }, userMessage.role, userMessage.type);
    }

    // FUTURE_FEATURE: Enhance with vector database context retrieval
    // if (this.vectorDB) {
    //   const relevantContext = await this.vectorDB.search(processedInput.input);
    //   processedInput.input = `Context: ${relevantContext}\n\nQuery: ${processedInput.input}`;
    // }

    try {
      // Get conversation history if memory is available
      let messages: Message[] = [];
      if (this.memory && threadId) {
        // Rely on the default limit in getMessages, as opts.limit is not defined on GenerateOptionsSchema
        const history = await this.memory.getMessages(threadId); 
        messages = history.map((msg: { role: any; content: any; type: string; }) => ({
          role: msg.role as any,
          content: msg.content,
            ...(msg.type !== 'text' ? { type: msg.type } : {})
          }));
        }
        
        // Use the agent's generate method
        const resp = await this.agent.generate(processedInput.input, { 
          ...processedInput.options, 
          resourceId, 
          threadId,
          messages
        });
        
        // Store the assistant's response in memory if available
        if (this.memory && resp.text) {
          // Create a properly formatted message object
          const assistantMessage = MessageSchema.parse({
            content: resp.text,
            role: 'assistant',
            type: 'text',
            timestamp: Date.now()
          });
          
          await this.memory.addMessage(threadId, assistantMessage.content, assistantMessage.role, assistantMessage.type, {
            taskType: 'assistant_response',
            subtaskCount: 1,
            timestamp: new Date().toISOString()
          }, assistantMessage.role, assistantMessage.type);
        }
        
        recordLLMMetrics({ 
          modelName: this.sdkModel.modelIdString, 
          operationType: 'generate',
          promptTokens: resp.usage?.promptTokens,
          completionTokens: resp.usage?.completionTokens,
          totalTokens: resp.usage?.totalTokens
        });
        
        return resp;
      } catch (error) {
        logger.error(`Error generating response: ${error}`);
        
        // Fallback to direct generation using the AI package if agent fails
        try {
          logger.info('Attempting fallback generation with AI package');
          const fallbackResponse = await generateText({
            model: this.sdkModel,
            prompt: processedInput.input,
            temperature: this.temperature,
            maxTokens: this.maxTokens
          });
          
          // Store in memory if available
          if (this.memory && fallbackResponse.text) {
            // Create a properly formatted message object
            const assistantMessage = MessageSchema.parse({
              content: fallbackResponse.text,
              role: 'assistant',
              type: 'text',
              timestamp: Date.now()
            });
            
            await this.memory.addMessage(threadId, assistantMessage.content, assistantMessage.role, assistantMessage.type, {
            taskType: 'assistant_response',
            subtaskCount: 1,
            timestamp: new Date().toISOString()
          }, assistantMessage.role, assistantMessage.type);
        }
          
          return { text: fallbackResponse.text, fallback: true };
        } catch (fallbackError) {
          logger.error(`Fallback generation failed: ${fallbackError}`);
          throw error; // Throw the original error
        }
      } finally {
        span.end();
      }
  }

  /**
   * Generates a structured object response from the agent
   * 
   * @template T - The Zod schema type
   * @param input - User input to process
   * @param schema - Zod schema for the structured output
   * @param options - Generation options
   * @returns Structured object response

   */  async generateStructured<T extends z.ZodType>(
    input: string, 
    schema: T, 
    options: any = {}
  ): Promise<z.infer<T>> {
    const tracer = getTracer('mastra.agent.generateStructured');
    const span = tracer.startSpan(this.name);
    
    try {
      // Apply middleware
      const processedInput = await this.applyMiddleware(input, options);
      if (!processedInput) {
        logger.warn('Middleware cancelled the generateStructured operation');
        span.end();
        throw new Error('Operation cancelled by middleware');
      }
      
      // Use the AI package's generateObject function
      const result = await generateObject({
        model: this.sdkModel,
        prompt: processedInput.input,
        schema,
        temperature: processedInput.options.temperature || this.temperature,
        maxTokens: processedInput.options.maxTokens || this.maxTokens
      });
      
      return result.object;
    } catch (error) {
      logger.error(`Error generating structured object: ${error}`);
      throw error;
    } finally {
      span.end();
    }
  }
  
  /**
   * Executes a tool call
   * 
   * @param toolCall - Tool call payload with name and arguments
   * @param context - Runtime context for tool execution
   * @returns The result of the tool execution
   * @throws {Error} When the tool is not found or execution fails
   */
  async executeTool(
    toolCall: ToolCallPayload, 
    context: RuntimeContext = {}
  ): Promise<any> {
    const tracer = getTracer('mastra.agent.executeTool');
    const span = tracer.startSpan(`${this.name}.executeTool.${toolCall.name}`);
    
    try {
      logger.debug(`Executing tool call: ${toolCall.name} with args: ${JSON.stringify(toolCall.args)}`);
      
      // Find the tool
      const tool = this.tools.find(t => t.name === toolCall.name);
      if (!tool) {
        throw new Error(`Tool '${toolCall.name}' not found`);
      }
      
      // Execute the tool with runtime context
      const result = await tool.handler({
        ...toolCall.args,
        _context: context
      });
      
      // Log tool execution result
      if (typeof result === 'object') {
        logger.debug(`Tool execution result: ${JSON.stringify(result)}`);
      } else {
        logger.debug(`Tool execution result: ${result}`);
      }
      
      // Store tool execution in memory if available
      if (this.memory && context.threadId) {
        // Create a properly formatted tool message
        const toolMessage = MessageSchema.parse({
          content: JSON.stringify({ 
            tool: toolCall.name, 
            args: toolCall.args,
            result 
          }),
          role: 'tool',
          type: 'tool-result',
          timestamp: Date.now()
        });
        
        await this.memory.addMessage(
          context.threadId,
          toolMessage.content,
          'tool',
          'tool-result',
          { taskType: 'tool', subtaskCount: 1, timestamp: new Date().toISOString() },
          'tool',
          'tool-result'
        );
      }
      
      return result;
    } catch (error) {
      logger.error(`Error executing tool '${toolCall.name}': ${error}`);
      
      // Store error in memory if available
      if (this.memory && context.threadId) {
        await this.memory.addMessage(
          context.threadId,
          JSON.stringify({ 
            tool: toolCall.name, 
            args: toolCall.args,
            error: error instanceof Error ? error.message : String(error)
          }),
          'tool',
          'tool-result',
          { taskType: 'tool', subtaskCount: 1, timestamp: new Date().toISOString() },
          'tool',
          'tool-result'
        );
      }
      
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Applies middleware to input and options
   * 
   * @param input - Original input
   * @param options - Original options
   * @returns Processed input and options, or null if operation should be cancelled
   * @private
   */
  private async applyMiddleware(input: string, options: any): Promise<{ input: string, options: any } | null> {
    let currentInput = input;
    let currentOptions = { ...options };
    
    // Get messages if memory is available
    let messages: Message[] = [];
    if (this.memory && options.threadId) {
      try {
        const history = await this.memory.getMessages(options.threadId, options.limit || 10);
        messages = history.map((msg: { role: any; content: any; type: string; }) => ({
          role: msg.role as any,
          content: msg.content,
          ...(msg.type !== 'text' ? { type: msg.type } : {})
        }));
      } catch (error) {
        logger.warn(`Error retrieving messages for middleware: ${error}`);
      }
    }
    
    // Apply each middleware in sequence
    for (const middleware of this.middlewares) {
      try {
        const result = await middleware(currentInput, { 
          agent: this, 
          options: currentOptions,
          messages
        });
        
        // If middleware returns null, cancel the operation
        if (result === null) {
          return null;
        }
        
        // Update input and options
        currentInput = result.input;
        currentOptions = result.options;
      } catch (error) {
        logger.error(`Error in middleware: ${error}`);
        // Continue with other middleware
      }
    }
    
    return { input: currentInput, options: currentOptions };
  }

  /**
   * Adds a middleware function to the agent
   * 
   * @param middleware - Middleware function to add
   * @returns The agent instance for chaining
   */
  public addMiddleware(middleware: AgentMiddleware): this {
    this.middlewares.push(middleware);
    logger.debug(`Added middleware to agent ${this.name}`);
    return this;
  }

  /**
   * Removes a middleware function from the agent
   * 
   * @param middleware - Middleware function to remove
   * @returns The agent instance for chaining
   */
  public removeMiddleware(middleware: AgentMiddleware): this {
    const index = this.middlewares.indexOf(middleware);
    if (index !== -1) {
      this.middlewares.splice(index, 1);
      logger.debug(`Removed middleware from agent ${this.name}`);
    }
    return this;
  }

  /**
   * Clears all middleware functions from the agent
   * 
   * @returns The agent instance for chaining
   */
  public clearMiddlewares(): this {
    this.middlewares = [];
    logger.debug(`Cleared all middlewares from agent ${this.name}`);
    return this;
  }

  /**
   * Adds a tool to the agent
   * 
   * @param tool - Tool configuration to add
   * @returns The agent instance for chaining
   */
  public addTool(tool: ToolConfig): this {
    this.tools.push(tool);
    // Re-instantiate the agent with the updated tools array
    this.agent = new MastraAgent({
      name: this.name,
      instructions: this.agent.getInstructions ? (() => this.agent.getInstructions() as string) : DEFAULT_INSTRUCTIONS.BASE,
      model: this.sdkModel,
      tools: this.tools.length
        ? this.tools.reduce((acc, t) => ({ ...acc, [t.name]: t }), {})
        : undefined
    });
    logger.debug(`Added tool ${tool.name} to agent ${this.name}`);
    return this;
  }

  /**
   * Removes a tool from the agent
   * 
   * @param toolName - Name of the tool to remove
   * @returns The agent instance for chaining
   */
  public removeTool(toolName: string): this {
    const index = this.tools.findIndex(t => t.name === toolName);
    if (index !== -1) {
      this.tools.splice(index, 1);
      // Note: MastraAgent might not support tool removal directly
      logger.debug(`Removed tool ${toolName} from agent ${this.name}`);
    }
    return this;
  }

  /**
   * Gets the underlying Mastra agent instance
   * 
   * @returns The Mastra agent instance
   */
  public getAgentInstance(): MastraAgent {
    return this.agent;
  }

  /**
   * Gets the model name used by this agent
   * 
   * @returns The model name as a string
   */
  public getModelName(): string {
    return this.sdkModel.modelIdString;
  }

  /**
   * Gets the tools available to this agent
   * 
   * @param params - Parameters for tool retrieval
   * @returns Available tools
   */
  public async getTools(params: { runtimeContext?: any } = {}): Promise<any> {
    return this.agent.getTools(params);
  }

  /**
   * Gets the model used by this agent
   * 
   * @param params - Parameters for model retrieval
   * @returns Model information
   */
  public async getModel(params: { runtimeContext?: any } = {}): Promise<any> {
    return this.agent.getModel(params);
  }

  /**
   * Gets the instructions used by this agent
   * 
   * @param params - Parameters for instructions retrieval
   * @returns Agent instructions as a string
   */
  public async getInstructions(params: { runtimeContext?: any } = {}): Promise<string> {
    return this.agent.getInstructions(params);
  }

  /**
   * Gets the underlying Mastra agent instance
   * 
   * @returns The Mastra agent instance
   */
  public getAgent(): MastraAgent {
    return this.agent;
  }

  /**
   * Gets the memory instance used by this agent
   * 
   * @returns Memory instance or undefined if not configured
   */
  public getMemory(): Memory | undefined {
    return this.memory;
  }

  /**
   * Gets the agent type
   * 
   * @returns The agent type enum value
   */
  public getAgentType(): AgentType {
    return this.type;
  }

  /**
   * Gets the agent configuration parameters
   * 
   * @returns Object containing agent configuration parameters
   */
  public getConfig(): Record<string, any> {
    return {
      name: this.name,
      type: this.type,
      modelName: this.getModelName(),
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      topP: this.topP,
      topK: this.topK,
      hasMemory: !!this.memory,
      toolCount: this.tools.length,
      middlewareCount: this.middlewares.length
    };
  }

  /**
   * Checks if the agent has a specific capability
   * 
   * @param capability - Capability to check
   * @returns True if the agent has the capability, false otherwise
   */
  public hasCapability(capability: string): boolean {
    // This is a placeholder implementation
    // In a real implementation, this would check model capabilities
    // or agent-specific features
    switch (capability.toLowerCase()) {
      case 'memory':
        return !!this.memory;
      case 'tools':
        return this.tools.length > 0;
      case 'middleware':
        return this.middlewares.length > 0;
      case 'streaming':
        return true; // Assume all models support streaming
      case 'structured_output':
        return true; // Assume all models support structured output
      default:
        return false;
    }
  }

  /**
   * Resets the agent's state
   * 
   * @param options - Reset options
   * @returns The agent instance for chaining
   */
  public async reset(options: { clearMemory?: boolean, clearTools?: boolean, clearMiddlewares?: boolean } = {}): Promise<this> {
    if (options.clearMemory && this.memory) {
      // This would depend on the Memory implementation
      logger.info(`Clearing memory for agent ${this.name}`);
      // Placeholder for memory reset
    }

    if (options.clearTools) {
      this.tools = [];
      logger.info(`Cleared all tools for agent ${this.name}`);
      // Would need to reinitialize the agent with no tools
    }

    if (options.clearMiddlewares) {
      this.clearMiddlewares();
    }

    logger.info(`Reset agent ${this.name}`);
    return this;
  }

  /**
   * Exposes thread manager for advanced thread operations
   * 
   * @returns ThreadManager instance
   */
  public getThreadManager(): ThreadManager {
    return initThreadManager;
  }
}
