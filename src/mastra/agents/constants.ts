/**
 * @file Constants for the Mastra Agents module
 * @version 1.0.0
 * @author Deanmachines
 * @copyright 2025
 * @license MIT
 * 
 * This file defines constants used throughout the Mastra Agents module,
 * including default values, agent types, descriptions, and configuration settings.
 * These constants provide standardized values for agent creation and operation.
 */

import { DEFAULT_GOOGLE_MODEL } from '../constants';

/**
 * Default agent name
 * Used when no name is provided during agent creation
 * @constant {string}
 */
export const DEFAULT_AGENT_NAME = 'MastraAgent';

/**
 * Default agent instructions
 * Basic instructions provided to agents when no specific instructions are given
 * @constant {string}
 */
export const DEFAULT_AGENT_INSTRUCTIONS = 'You are a helpful AI assistant.';

/**
 * Default agent model
 * The default model to use for agents when no specific model is specified
 * @constant {string}
 */
export const DEFAULT_AGENT_MODEL = DEFAULT_GOOGLE_MODEL;

/**
 * Default model names for different agent types
 * Provides standardized model identifiers for various Google Gemini models
 * @constant {Object}
 * @property {string} GEMINI_PRO - Latest Gemini Pro model
 * @property {string} GEMINI_FLASH - Latest Gemini Flash model
 * @property {string} GEMINI_1_5_PRO - Gemini 1.5 Pro model
 * @property {string} GEMINI_1_5_FLASH - Gemini 1.5 Flash model
 */
export const DEFAULT_MODEL_NAMES = {
  GEMINI_PRO: 'gemini-2.5-pro-preview-05-06',
  GEMINI_FLASH: 'gemini-2.5-flash-preview-04-17',
  GEMINI_1_5_PRO: 'gemini-1.5-pro',
  GEMINI_1_5_FLASH: 'gemini-1.5-flash',
};

/**
 * Agent type descriptions
 * Human-readable descriptions of different agent types
 * @constant {Object}
 * @property {string} BASE - Description for general-purpose agents
 * @property {string} GOOGLE - Description for Google Gemini-powered agents
 * @property {string} SUPERVISOR - Description for coordinator agents
 * @property {string} WORKER - Description for specialized worker agents
 */
export const AGENT_DESCRIPTIONS = {
  BASE: 'General-purpose agent for basic tasks',
  GOOGLE: 'Advanced agent powered by Google Gemini models',
  SUPERVISOR: 'Coordinator agent that manages worker agents',
  WORKER: 'Specialized agent focused on specific tasks',
};

/**
 * Default instructions for different agent types
 * Provides tailored system prompts for each agent type
 * @constant {Object}
 * @property {string} BASE - Instructions for general-purpose agents
 * @property {string} GOOGLE - Instructions for Google Gemini-powered agents
 * @property {string} SUPERVISOR - Instructions for coordinator agents
 * @property {string} WORKER - Instructions for specialized worker agents
 */
export const DEFAULT_INSTRUCTIONS = {
  BASE: 'You are a helpful AI assistant that provides accurate and concise information.',
  GOOGLE: 'You are a helpful AI assistant powered by Google Gemini. You can understand and process text, images, and other media. You provide accurate, relevant, and helpful information while being conversational and engaging.',
  SUPERVISOR: 'You are a supervisor agent responsible for coordinating multiple specialized agents. Your job is to understand user requests, break them down into subtasks, delegate to appropriate worker agents, and synthesize the results into a coherent response.',
  WORKER: 'You are a specialized worker agent focused on a specific domain. Your job is to provide expert-level assistance within your domain of expertise.',
};

/**
 * Agent types supported by the application
 * Enum defining the available agent types in the system
 * @enum {string}
 */
export enum AgentType {
  /** General-purpose base agent */
  BASE = 'base',
  /** Google Gemini-powered agent */
  GOOGLE = 'google',
  /** Coordinator agent that manages other agents */
  SUPERVISOR = 'supervisor',
  /** Specialized agent focused on specific tasks */
  WORKER = 'worker',
}

/**
 * Default memory configuration
 * Standard settings for agent memory management
 * @constant {Object}
 * @property {number} LAST_MESSAGES - Number of recent messages to retain
 * @property {number} SEMANTIC_RECALL_TOP_K - Number of semantically similar messages to retrieve
 * @property {number} SEMANTIC_RECALL_MESSAGE_RANGE - Maximum message history range for semantic search
 */
export const DEFAULT_MEMORY_CONFIG = {
  LAST_MESSAGES: 20,
  SEMANTIC_RECALL_TOP_K: 5,
  SEMANTIC_RECALL_MESSAGE_RANGE: 100,
};

/**
 * Tool categories
 * Categorization of different tool types available to agents
 * @constant {Object}
 * @property {string} SEARCH - Tools for web search and information retrieval
 * @property {string} CODE - Tools for code generation and analysis
 * @property {string} BROWSER - Tools for web browsing and interaction
 * @property {string} RAG - Tools for retrieval-augmented generation
 * @property {string} SYSTEM - Tools for system operations
 * @property {string} CUSTOM - Custom-defined tools
 * @property {string} KNOWLEDGE - Tools for knowledge base access
 * @property {string} UTILITY - General utility tools
 * @property {string} EXTERNAL - Tools that interface with external services
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
