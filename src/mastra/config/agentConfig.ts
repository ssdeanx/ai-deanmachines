import { AgentConfig as MastraAgentConfig, GoogleAgentConfig, AgentConfigSchema as MastraAgentsTypesAgentConfigSchema } from '../agents/types';
import { AgentLLMConfig, AgentLLMConfigSchema } from './types';
import { getModelInstance } from './models';
import { MemoryConfigSchema } from '../memory/types'; // Added import for MemoryConfigSchema
import { createLogger } from '@mastra/core/logger';
import { z } from 'zod';
import { DEFAULT_INSTRUCTIONS, AgentType } from '../agents/constants';

const logger = createLogger({
  name: 'MastraConfigAgent',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

export const DefinedAgentConfigSchema = MastraAgentsTypesAgentConfigSchema.extend({
  id: z.string(),
  agentLLMConfig: AgentLLMConfigSchema,
  memory: MemoryConfigSchema.optional(), // Changed from z.any() to MemoryConfigSchema
});
export type DefinedAgentConfig = z.infer<typeof DefinedAgentConfigSchema>;

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

    const agentLLMConfig: AgentLLMConfig = {
      modelInstanceId: modelInstance.id,
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

export const defaultGoogleAgentConfig = createAgentConfig(
  'google-default-gemini-2.0-flash',
  'Default Google Agent (Gemini 2.0 Flash GenAI)',
  'gemini-2.0-flash-genai', // Updated to a Gemini 2.x model
  AgentType.GOOGLE,
  DEFAULT_INSTRUCTIONS.BASE,
  { multimodal: true }
);

export const powerGoogleAgentConfig = createAgentConfig(
  'google-power-gemini-2.5-pro',
  'Power Google Agent (Gemini 2.5 Pro Preview GenAI)',
  'gemini-2.5-pro-preview-genai', // Updated to a Gemini 2.x Pro model
  AgentType.GOOGLE,
  'You are a highly capable AI assistant. Be thorough and precise, leveraging your advanced reasoning and coding abilities.',
  { multimodal: true, temperature: 0.5 }
);

export const creativeGoogleAgentConfig = createAgentConfig(
  'google-creative-gemini-2.5-flash',
  'Creative Google Agent (Gemini 2.5 Flash Preview GenAI)',
  'gemini-2.5-flash-preview-genai', // Updated to a Gemini 2.x Flash model
  AgentType.GOOGLE,
  'You are a creative AI assistant. Think outside the box and generate novel ideas, utilizing your adaptive thinking.',
  { temperature: 0.9, topP: 0.95 }
);

// Consolidate all agent configurations
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

export function getAgentConfig(id: string): DefinedAgentConfig {
  const agentConfig = ALL_AGENT_CONFIGS.find(ac => ac.id === id);
  if (!agentConfig) {
    const errorMessage = `Agent configuration with id '${id}' not found. Available configs: ${ALL_AGENT_CONFIGS.map(c => c.id).join(', ') || 'None configured'}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
  return agentConfig;
}
