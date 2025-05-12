export * from './types';
export * from './providers';
export * from './models';
export * from './agentConfig';

import { createLogger } from '@mastra/core/logger';
import { LLM_PROVIDER_CLIENTS } from './providers'; // Corrected import name
import { ALL_MODEL_INSTANCES } from './models';
import { ALL_AGENT_CONFIGS } from './agentConfig';

const logger = createLogger({
  name: 'MastraConfigIndex',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

logger.info('Mastra Configuration Module Initialized');
logger.info(`Loaded ${LLM_PROVIDER_CLIENTS.length} provider clients.`);
logger.info(`Loaded ${ALL_MODEL_INSTANCES.length} model instances.`);
logger.info(`Loaded ${ALL_AGENT_CONFIGS.length} agent configurations.`);

// You can add a function here to get a fully hydrated agent config with model instance if needed
// For example:
/*
import { DefinedAgentConfig, getAgentConfig } from './agentConfig';
import { ModelInstanceConfig, getModelInstance } from './models';

export interface HydratedAgentConfig extends Omit<DefinedAgentConfig, 'agentLLMConfig'> {
  modelInstance: ModelInstanceConfig;
  agentLLMConfig: DefinedAgentConfig['agentLLMConfig'];
}

export function getHydratedAgentConfig(id: string): HydratedAgentConfig | null {
  try {
    const agentConfig = getAgentConfig(id);
    const modelInstance = getModelInstance(agentConfig.agentLLMConfig.modelInstanceId);
    return {
      ...agentConfig,
      modelInstance,
    };
  } catch (error) {
    logger.error(`Error getting hydrated agent config for '${id}':`, error);
    return null;
  }
}
*/
