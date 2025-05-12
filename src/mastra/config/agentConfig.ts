/**
 * @file Agent configuration management for Mastra framework
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This file provides functionality for creating, validating, and managing agent configurations.
 * It defines the structure of agent configurations and provides factory methods for creating
 * pre-configured agents with different capabilities and characteristics.
 */
import { AgentConfig as MastraAgentConfig, GoogleAgentConfig, AgentConfigSchema as MastraAgentsTypesAgentConfigSchema } from '../agents/types';
import { AgentLLMConfig, AgentLLMConfigSchema } from './types';
import { getModelInstance } from './models';
import { MemoryConfigSchema } from '../memory/types'; // Added import for MemoryConfigSchema
import { createLogger } from '@mastra/core/logger';
import { z } from 'zod';
import { DEFAULT_INSTRUCTIONS, AgentType } from '../agents/constants';
import { LLM_PROVIDER_CLIENTS } from './providers';

/**
 * Logger for agent configuration operations
 */
const logger = createLogger({
  name: 'MastraConfigAgent',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

/**
 * Extended schema for agent configurations with additional Mastra-specific properties
 * @constant {z.ZodType}
 */
export const DefinedAgentConfigSchema = MastraAgentsTypesAgentConfigSchema.extend({
  /** Unique identifier for the agent configuration */
  id: z.string(),
  /** LLM configuration for the agent */
  agentLLMConfig: AgentLLMConfigSchema,
  /** Optional memory configuration */
  memory: MemoryConfigSchema.optional(), // Changed from z.any() to MemoryConfigSchema
});

/**
 * Type definition for the extended agent configuration
 * @typedef {z.infer<typeof DefinedAgentConfigSchema>} DefinedAgentConfig
 */
export type DefinedAgentConfig = z.infer<typeof DefinedAgentConfigSchema>;

/**
 * Creates a validated agent configuration
 * 
 * @param {string} id - Unique identifier for the agent configuration
 * @param {string} name - Display name for the agent
 * @param {string} modelInstanceId - ID of the model instance to use
 * @param {AgentType} [type=AgentType.GOOGLE] - Type of agent to create
 * @param {string} [instructions] - Custom instructions for the agent
 * @param {Partial<Omit<GoogleAgentConfig, 'name' | 'instructions' | 'modelName' | 'type' | 'agentLLMConfig'>>} [agentSpecificProps] - Additional agent-specific properties
 * @returns {DefinedAgentConfig | null} The validated agent configuration or null if validation fails
 */
function createAgentConfig(
  id: string,
  name: string,
  modelInstanceId: string,
  type: AgentType = AgentType.GOOGLE,
  instructions?: string,
  agentSpecificProps?: Partial<Omit<GoogleAgentConfig, 'name' | 'instructions' | 'modelName' | 'type' | 'agentLLMConfig'>>
): DefinedAgentConfig | null {
  try {
    const modelInstance = getModelInstance(modelInstanceId);
    if (!modelInstance) {
      logger.warn(`Model instance '${modelInstanceId}' not found for agent config '${id}'. Agent config will not be created.`);
      return null;
    }

    // Determine providerId: use specified or default Google provider
    const defaultProvider = LLM_PROVIDER_CLIENTS.find(c => c.type === 'google')?.id;
    const providerId = (agentSpecificProps as any)?.providerId || defaultProvider!;

    const agentLLMConfig: AgentLLMConfig = {
      modelInstanceId: modelInstance.id,
      maxTokens: (agentSpecificProps as any)?.maxTokens,
      temperature: (agentSpecificProps as any)?.temperature,
      topP: (agentSpecificProps as any)?.topP
    };

    const baseConfig: Partial<MastraAgentConfig> = {
      name,
      instructions: instructions || DEFAULT_INSTRUCTIONS.BASE,
      modelName: modelInstance.modelIdString,
      type,
      ...agentSpecificProps,
    };

    let fullConfigData: any = {
      id,
      ...baseConfig,
      agentLLMConfig,
    };

    if (type === AgentType.GOOGLE) {
      fullConfigData = {
        ...fullConfigData,
        multimodal: (agentSpecificProps as Partial<GoogleAgentConfig>)?.multimodal ?? true,
        safetySettings: (agentSpecificProps as Partial<GoogleAgentConfig>)?.safetySettings,
      } as Omit<GoogleAgentConfig, 'memory' | 'tools'> & { id: string, agentLLMConfig: AgentLLMConfig };
    }

    const validatedConfig = DefinedAgentConfigSchema.parse(fullConfigData);
    logger.debug(`Agent configuration created and validated: ${validatedConfig.id}`);
    return validatedConfig;

  } catch (error) {
    const errorDetails = error instanceof z.ZodError ? { errors: error.errors } : (error instanceof Error ? { message: error.message, stack: error.stack } : { error });
    logger.error(`Error creating agent configuration '${id}':`, errorDetails);
    return null;
  }
}

/**
 * Default Google agent configuration using Gemini 2.0 Flash
 * General-purpose agent with balanced performance and speed
 * @constant {DefinedAgentConfig}
 */
export const defaultGoogleAgentConfig = createAgentConfig(
  'google-default-gemini-2.0-flash',
  'Default Google Agent (Gemini 2.0 Flash GenAI)',
  'gemini-2.0-flash-genai', // Updated to a Gemini 2.x model
  AgentType.GOOGLE,
  DEFAULT_INSTRUCTIONS.BASE,
  { multimodal: true }
);

/**
 * Power Google agent configuration using Gemini 2.5 Pro
 * High-capability agent optimized for complex reasoning and precision
 * @constant {DefinedAgentConfig}
 */
export const powerGoogleAgentConfig = createAgentConfig(
  'google-power-gemini-2.5-pro',
  'Power Google Agent (Gemini 2.5 Pro Preview GenAI)',
  'gemini-2.5-pro-preview-genai', // Updated to a Gemini 2.x Pro model
  AgentType.GOOGLE,
  'You are a highly capable AI assistant. Be thorough and precise, leveraging your advanced reasoning and coding abilities.',
  { multimodal: true, temperature: 0.5 }
);

/**
 * Creative Google agent configuration using Gemini 2.5 Flash
 * Agent optimized for creative tasks with higher temperature setting
 * @constant {DefinedAgentConfig}
 */
export const creativeGoogleAgentConfig = createAgentConfig(
  'google-creative-gemini-2.5-flash',
  'Creative Google Agent (Gemini 2.5 Flash Preview GenAI)',
  'gemini-2.5-flash-preview-genai', // Updated to a Gemini 2.x Flash model
  AgentType.GOOGLE,
  'You are a creative AI assistant. Think outside the box and generate novel ideas, utilizing your adaptive thinking.',
  { temperature: 0.9, topP: 0.95 }
);

/**
 * Collection of all available agent configurations
 * @constant {DefinedAgentConfig[]}
 */
export const ALL_AGENT_CONFIGS: DefinedAgentConfig[] = [
  defaultGoogleAgentConfig,
  powerGoogleAgentConfig,
  creativeGoogleAgentConfig,
].filter((config): config is DefinedAgentConfig => config !== null);

if (ALL_AGENT_CONFIGS.length === 0) {
  logger.warn('No agent configurations were successfully created.');
} else {
  logger.info(`Successfully created ${ALL_AGENT_CONFIGS.length} agent configurations.`);
  ALL_AGENT_CONFIGS.forEach(conf => logger.debug(`Available agent config: ${conf.id} (${conf.name}) using model ${conf.agentLLMConfig.modelInstanceId}`));
}

/**
 * Retrieves an agent configuration by its ID
 * 
 * @param {string} id - The ID of the agent configuration to retrieve
 * @returns {DefinedAgentConfig} The requested agent configuration
 * @throws {Error} If the agent configuration is not found
 */
export function getAgentConfig(id: string): DefinedAgentConfig {
  const agentConfig = ALL_AGENT_CONFIGS.find(ac => ac.id === id);
  if (!agentConfig) {
    const errorMessage = `Agent configuration with id '${id}' not found. Available configs: ${ALL_AGENT_CONFIGS.map(c => c.id).join(', ') || 'None configured'}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  return agentConfig;
}
