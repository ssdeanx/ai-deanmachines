/**
 * Agents module for Mastra AI
 *
 * This module exports all agent implementations and related types.
 */

// Export the BaseAgent
export { BaseAgent } from './baseAgent';

// Export constants
export { AgentType, DEFAULT_MODEL_NAMES, DEFAULT_INSTRUCTIONS } from './constants';

// Export types and schemas
export {
  AgentConfigSchema,
  GoogleAgentConfigSchema,
  SupervisorAgentConfigSchema,
  WorkerAgentConfigSchema
} from './types';

export type {
  AgentConfig,
  GoogleAgentConfig,
  SupervisorAgentConfig,
  WorkerAgentConfig,
  ToolConfig
} from './types';

// Export specialized agent implementations
export { GoogleAgent } from './googleAgent';
export { SupervisorAgent } from './supervisorAgent';
export { WorkerAgent } from './workerAgent';