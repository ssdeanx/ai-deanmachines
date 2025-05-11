/**
 * Constants for the Agents module
 */

import { DEFAULT_GOOGLE_MODEL } from '../constants';

/**
 * Default agent name
 */
export const DEFAULT_AGENT_NAME = 'MastraAgent';

/**
 * Default agent instructions
 */
export const DEFAULT_AGENT_INSTRUCTIONS = 'You are a helpful AI assistant.';

/**
 * Default agent model
 */
export const DEFAULT_AGENT_MODEL = DEFAULT_GOOGLE_MODEL;

/**
 * Default model names for different agent types
 */
export const DEFAULT_MODEL_NAMES = {
  GEMINI_PRO: 'gemini-2.5-pro-preview-05-06',
  GEMINI_FLASH: 'gemini-2.5-flash-preview-04-17',
  GEMINI_1_5_PRO: 'gemini-1.5-pro',
  GEMINI_1_5_FLASH: 'gemini-1.5-flash',
};

/**
 * Agent type descriptions
 */
export const AGENT_DESCRIPTIONS = {
  BASE: 'General-purpose agent for basic tasks',
  GOOGLE: 'Advanced agent powered by Google Gemini models',
  SUPERVISOR: 'Coordinator agent that manages worker agents',
  WORKER: 'Specialized agent focused on specific tasks',
};

/**
 * Default instructions for different agent types
 */
export const DEFAULT_INSTRUCTIONS = {
  BASE: 'You are a helpful AI assistant that provides accurate and concise information.',
  GOOGLE: 'You are a helpful AI assistant powered by Google Gemini. You can understand and process text, images, and other media. You provide accurate, relevant, and helpful information while being conversational and engaging.',
  SUPERVISOR: 'You are a supervisor agent responsible for coordinating multiple specialized agents. Your job is to understand user requests, break them down into subtasks, delegate to appropriate worker agents, and synthesize the results into a coherent response.',
  WORKER: 'You are a specialized worker agent focused on a specific domain. Your job is to provide expert-level assistance within your domain of expertise.',
};

/**
 * Agent types supported by the application
 */
export enum AgentType {
  BASE = 'base',
  GOOGLE = 'google',
  SUPERVISOR = 'supervisor',
  WORKER = 'worker',
}

/**
 * Default memory configuration
 */
export const DEFAULT_MEMORY_CONFIG = {
  LAST_MESSAGES: 20,
  SEMANTIC_RECALL_TOP_K: 5,
  SEMANTIC_RECALL_MESSAGE_RANGE: 100,
};

/**
 * Tool categories
 */
export const TOOL_CATEGORIES = {
  SEARCH: 'search',
  CODE: 'code',
  BROWSER: 'browser',
  RAG: 'rag',
  SYSTEM: 'system',
  CUSTOM: 'custom',
  KNOWLEDGE: 'knowledge',
  UTILITY: 'utility',
  EXTERNAL: 'external',
};
