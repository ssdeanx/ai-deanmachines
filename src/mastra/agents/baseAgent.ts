import { z } from 'zod';
import { createLogger } from '@mastra/core/logger';
import { Agent } from '@mastra/core';
import { google } from '@ai-sdk/google';
import { streamText, CoreMessage } from 'ai';

import { Memory, MemoryConfig } from '../memory';
import { DefinedAgentConfig } from '../config/agentConfig';
import { getModelInstance, ModelInstanceConfig } from '../config/models';
import { getProviderClient, ProviderClientConfig } from '../config/providers';
import { getTracer, recordLLMMetrics } from '../observability/telemetry';
import { TokenLimiter } from '../memory/processors/index';
import {
  AgentType,
  DEFAULT_MODEL_NAMES,
  DEFAULT_INSTRUCTIONS,
  StreamOptionsSchema,
  MessageRoleSchema,
  MessageTypeSchema
} from './constants';

const logger = createLogger({
  name: 'Mastra-BaseAgent',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

export class BaseAgent {
  public name: string;
  protected agent: Agent;
  protected sdkModel: any;
  protected memory?: Memory;
  protected tools: any[] = [];
  protected type: AgentType;
  protected threadId?: string;
  protected resourceId?: string;
  protected modelInstanceConfig: ModelInstanceConfig;
  protected providerClientConfig: ProviderClientConfig;

  protected temperature: number;
  protected maxTokens?: number;
  protected topP?: number;
  protected topK?: number;

  constructor(config: DefinedAgentConfig) {
    this.name = config.name;
    logger.info(`Creating BaseAgent with name: ${this.name}`);

    this.modelInstanceConfig = getModelInstance(config.agentLLMConfig.modelInstanceId);
    this.providerClientConfig = getProviderClient(config.agentLLMConfig.providerId);

    if (!this.modelInstanceConfig) {
      throw new Error(`Model instance with ID '${config.agentLLMConfig.modelInstanceId}' not found.`);
    }
    if (!this.providerClientConfig) {
      throw new Error(`Provider client with ID '${config.agentLLMConfig.providerId}' not found.`);
    }

    logger.info(`Initializing agent with model ID: ${this.modelInstanceConfig.modelIdString} from provider: ${this.providerClientConfig.name}`);

    if (this.providerClientConfig.type === 'google') {
      this.sdkModel = google(this.modelInstanceConfig.modelIdString);
    } else {
      throw new Error(`Unsupported provider type: ${this.providerClientConfig.type}`);
    }

    this.type = config.type || AgentType.BASE;
    this.temperature = config.temperature ?? this.modelInstanceConfig.defaultTemperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? this.modelInstanceConfig.maxOutputTokens;
    this.topP = config.topP ?? this.modelInstanceConfig.defaultTopP;
    this.topK = config.topK ?? this.modelInstanceConfig.defaultTopK;

    if (config.memory) {
      logger.debug(`Setting memory for agent: ${this.name}`);
      this.memory = new Memory(config.memory as MemoryConfig);
    }

    if (config.tools) {
      logger.debug(`Setting ${config.tools.length} tools for agent: ${this.name}`);
      this.tools = config.tools;
    }

    const generationOptions: any = {
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      topP: this.topP,
      topK: this.topK,
    };
    Object.keys(generationOptions).forEach(key => generationOptions[key] === undefined && delete generationOptions[key]);

    this.agent = new Agent({
      name: this.name,
      instructions: config.instructions || DEFAULT_INSTRUCTIONS.BASE,
      model: this.sdkModel,
      tools: this.tools.length > 0 ? this.tools.reduce((acc, tool) => {
        if (tool.name) {
          logger.debug(`Adding tool to @mastra/core Agent: ${tool.name}`);
          acc[tool.name] = tool;
        }
        return acc;
      }, {}) : undefined,
    });

    logger.info(`BaseAgent ${this.name} created successfully with type: ${this.type}, using model: ${this.modelInstanceConfig.name}`);
  }

  async stream(input: string, options: any = {}) {
    logger.info(`Streaming response for input: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);
    logger.debug(`Stream options: ${JSON.stringify(options)}`);

    const tracer = getTracer('mastra.agent.stream');
    const span = tracer.startSpan(this.name);
    span.setAttributes({
      'agent.name': this.name,
      'agent.type': this.type,
      'agent.model': this.modelInstanceConfig.modelIdString,
      'input.length': input.length,
      'operation': 'stream'
    });

    const startTime = Date.now();
    let promptTokens = 0;
    try {
      promptTokens = simpleTokenCounter(input);
      span.setAttribute('prompt.tokens', promptTokens);
    } catch (e) {
      logger.warn('Could not count prompt tokens for stream method.', e);
    }

    await this.prepareMemoryContext(input, options);

    try {
      const validatedOptions = StreamOptionsSchema.parse(options);

      if (this.memory && this.threadId) {
        await this.storeMessageInMemory(input, 'user', 'text');
      }

      const streamResponse = await streamText({
        model: this.sdkModel,
        temperature: validatedOptions.temperature ?? this.temperature,
        maxTokens: validatedOptions.maxTokens ?? this.maxTokens,
        topP: validatedOptions.topP ?? this.topP,
        topK: validatedOptions.topK ?? this.topK,
        prompt: input,
        tools: this.tools.length > 0 ? this.tools.reduce((acc, tool) => {
          if (tool.name && tool.description && tool.parameters) {
            acc[tool.name] = { description: tool.description, parameters: tool.parameters };
          }
          return acc;
        }, {}) : undefined,
      });

      logger.debug('Stream response started successfully');

      recordLLMMetrics({
        promptTokens,
        modelName: this.modelInstanceConfig.modelIdString,
        operationType: 'stream',
      });

      let fullText = '';
      let completionTokens = 0;

      const textStream = streamResponse.textStream;
      const toolCallsStream = streamResponse.toolCallsStream;
      const toolResultsStream = streamResponse.toolResultsStream;

      const streamCompletePromise = (async () => {
        try {
          for await (const chunk of textStream) {
            fullText += chunk;
          }
          completionTokens = simpleTokenCounter(fullText);

          if (toolCallsStream) {
            const toolCalls: any[] = [];
            for await (const toolCall of toolCallsStream) {
              toolCalls.push(toolCall);
              logger.info(`Tool call received: ${toolCall.toolName}`, toolCall.args);
            }
          }
        } catch (error) {
          logger.error('Error processing stream content:', error);
          span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
          recordLLMMetrics({
            error: true,
            modelName: this.modelInstanceConfig.modelIdString,
            operationType: 'stream',
            latency: Date.now() - startTime,
            promptTokens,
          });
          throw error;
        } finally {
          const latency = Date.now() - startTime;
          span.setAttributes({
            'completion.tokens': completionTokens,
            'total.tokens': promptTokens + completionTokens,
            'latency.ms': latency,
          });
          span.end();
          recordLLMMetrics({
            promptTokens,
            completionTokens,
            totalTokens: promptTokens + completionTokens,
            latency,
            modelName: this.modelInstanceConfig.modelIdString,
            operationType: 'stream',
          });
          if (this.memory && this.threadId && fullText) {
            await this.storeMessageInMemory(fullText, 'assistant', 'text');
          }
        }
      })();

      return {
        text: streamResponse.text,
        textStream: streamResponse.textStream,
        toolCalls: streamResponse.toolCalls,
        toolCallsStream: streamResponse.toolCallsStream,
        toolResults: streamResponse.toolResults,
        toolResultsStream: streamResponse.toolResultsStream,
        finishReason: streamResponse.finishReason,
        usage: streamResponse.usage,
        rawResponse: streamResponse.rawResponse,
        streamComplete: streamCompletePromise,
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error(`Error streaming response: ${error instanceof Error ? error.message : String(error)}`);
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      recordLLMMetrics({
        error: true,
        modelName: this.modelInstanceConfig.modelIdString,
        operationType: 'stream',
        latency,
        promptTokens,
      });
      throw error;
    }
  }

  async generate(input: string, options: any = {}) {
    logger.info(`Generating response for input: ${input.substring(0, 50)}${input.length > 50 ? '...' : ''}`);
    logger.debug(`Generate options: ${JSON.stringify(options)}`);

    const tracer = getTracer('mastra.agent.generate');
    const span = tracer.startSpan(this.name);
    span.setAttributes({
      'agent.name': this.name,
      'agent.type': this.type,
      'agent.model': this.modelInstanceConfig.modelIdString,
      'input.length': input.length,
      'operation': 'generate'
    });

    const startTime = Date.now();
    let promptTokens = 0;
    try {
      promptTokens = simpleTokenCounter(input);
      span.setAttribute('prompt.tokens', promptTokens);
    } catch (e) {
      logger.warn('Could not count prompt tokens for generate method.', e);
    }

    await this.prepareMemoryContext(input, options);

    try {
      const validatedOptions = options;

      if (this.memory && this.threadId) {
        await this.storeMessageInMemory(input, 'user', 'text');
      }

      const { text, toolCalls, toolResults, finishReason, usage, rawResponse } = await streamText({
        model: this.sdkModel,
        temperature: validatedOptions.temperature ?? this.temperature,
        maxTokens: validatedOptions.maxTokens ?? this.maxTokens,
        topP: validatedOptions.topP ?? this.topP,
        topK: validatedOptions.topK ?? this.topK,
        prompt: input,
        tools: this.tools.length > 0 ? this.tools.reduce((acc, tool) => {
          if (tool.name && tool.description && tool.parameters) {
            acc[tool.name] = { description: tool.description, parameters: tool.parameters };
          }
          return acc;
        }, {}) : undefined,
      });

      const fullText = await text;
      const completionTokens = simpleTokenCounter(fullText);
      const latency = Date.now() - startTime;

      logger.debug('Generate response completed successfully');
      span.setAttributes({
        'completion.tokens': completionTokens,
        'total.tokens': promptTokens + completionTokens,
        'latency.ms': latency,
      });
      span.setStatus({ code: 1 });
      span.end();

      recordLLMMetrics({
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        latency,
        modelName: this.modelInstanceConfig.modelIdString,
        operationType: 'generate',
      });

      if (this.memory && this.threadId && fullText) {
        await this.storeMessageInMemory(fullText, 'assistant', 'text');
      }

      if (toolCalls && (await toolCalls).length > 0) {
        logger.info('Tool calls received in generate:', await toolCalls);
      }

      return {
        text: fullText,
        toolCalls: await toolCalls,
        toolResults: await toolResults,
        finishReason: await finishReason,
        usage: await usage,
        rawResponse: await rawResponse,
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      logger.error(`Error generating response: ${error instanceof Error ? error.message : String(error)}`);
      span.setStatus({ code: 2, message: error instanceof Error ? error.message : String(error) });
      span.end();
      recordLLMMetrics({
        error: true,
        modelName: this.modelInstanceConfig.modelIdString,
        operationType: 'generate',
        latency,
        promptTokens,
      });
      throw error;
    }
  }

  private async prepareMemoryContext(input: string, options: any = {}) {
    if (!this.memory) return;

    this.threadId = options.threadId || this.threadId;
    this.resourceId = options.resourceId || this.resourceId;

    if (!this.threadId) {
      if (options.createThreadIfNotExists !== false) {
        this.threadId = await this.memory.createThread();
        logger.info(`New thread created for agent ${this.name}: ${this.threadId}`);
      } else {
        logger.warn("Memory is enabled, but no threadId provided and createThreadIfNotExists is false.");
        return;
      }
    }
  }

  private filterMessagesByRelevance(messages: any[], query: string, limit: number): any[] {
    logger.debug(`Filtering messages by relevance (placeholder). Query: ${query}, Limit: ${limit}`);
    return messages.slice(-limit);
  }

  private async storeMessageInMemory(
    content: string,
    role: z.infer<typeof MessageRoleSchema>,
    type: z.infer<typeof MessageTypeSchema>
  ) {
    if (this.memory && this.threadId) {
      try {
        await this.memory.addMessage(this.threadId, content, role, type);
        logger.debug(`Message stored in memory. Thread: ${this.threadId}, Role: ${role}`);
      } catch (error) {
        logger.error(`Error storing message in memory: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  public getAgentInstance(): Agent {
    return this.agent;
  }

  public getModelName(): string {
    return this.modelInstanceConfig.name;
  }

  public getModelId(): string {
    return this.modelInstanceConfig.modelIdString;
  }

  public getInstructions(): string {
    return this.agent.instructions || '';
  }

  public getTools(): any[] {
    return this.tools;
  }

  public getCurrentThreadId(): string | undefined {
    return this.threadId;
  }

  public setThreadId(threadId: string): void {
    this.threadId = threadId;
    logger.info(`Thread ID for agent ${this.name} set to: ${threadId}`);
  }
}

