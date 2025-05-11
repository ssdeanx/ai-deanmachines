/**
 * Example demonstrating how to export all agents and import them into the main Mastra index
 * 
 * This example shows:
 * 1. How to create different types of agents
 * 2. How to export all agents from the system
 * 3. How to import agents into the main Mastra index
 */

import { mastra, getAllAgents, importAgents } from '../src/mastra';
import { BaseAgent, GoogleAgent, SupervisorAgent, WorkerAgent } from '../src/mastra/agents';
import { Memory, UpstashMemory } from '../src/mastra/memory';
import { AgentType } from '../src/mastra/agents/constants';

// Create a memory instance for the agents
const createMemory = () => {
  // Check if Upstash credentials are available
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.log('Creating Upstash memory');
    return new UpstashMemory({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      vectorUrl: process.env.UPSTASH_VECTOR_REST_URL,
      vectorToken: process.env.UPSTASH_VECTOR_REST_TOKEN
    });
  } else {
    console.log('Creating default memory');
    return new Memory({
      provider: 'local'
    });
  }
};

// Create a shared memory instance
const memory = createMemory();

// Create different types of agents
const createAgents = () => {
  // Create a base agent
  const baseAgent = new BaseAgent({
    name: 'BaseAgent',
    instructions: 'You are a helpful assistant.',
    modelName: 'gemini-2.5-pro-preview-05-06',
    memory
  });

  // Create a Google agent
  const googleAgent = new GoogleAgent({
    name: 'GoogleAgent',
    instructions: 'You are a helpful assistant powered by Google Gemini.',
    modelName: 'gemini-2.5-pro-preview-05-06',
    multimodal: true,
    memory
  });

  // Create worker agents
  const codeWorker = new WorkerAgent({
    name: 'CodeWorker',
    domain: 'programming',
    expertise: ['JavaScript', 'TypeScript', 'Node.js'],
    memory
  });

  const researchWorker = new WorkerAgent({
    name: 'ResearchWorker',
    domain: 'research',
    expertise: ['data analysis', 'literature review', 'summarization'],
    memory
  });

  // Create a supervisor agent
  const supervisorAgent = new SupervisorAgent({
    name: 'SupervisorAgent',
    instructions: 'You are a supervisor that coordinates multiple worker agents.',
    workerAgents: [codeWorker, researchWorker],
    memory
  });

  return {
    baseAgent,
    googleAgent,
    codeWorker,
    researchWorker,
    supervisorAgent
  };
};

// Main function to demonstrate agent export and import
const main = async () => {
  console.log('Creating agents...');
  const agents = createAgents();
  
  console.log('Agents created:');
  Object.entries(agents).forEach(([name, agent]) => {
    console.log(`- ${name} (${agent.getAgent().name})`);
  });

  // Get all available agent classes
  console.log('\nAvailable agent classes:');
  const agentClasses = getAllAgents();
  Object.keys(agentClasses).forEach(className => {
    console.log(`- ${className}`);
  });

  // Import agents into Mastra
  console.log('\nImporting agents into Mastra...');
  importAgents(agents);
  
  // Example of using an agent
  console.log('\nTesting an agent...');
  try {
    const response = await agents.baseAgent.generate('Hello, what can you do?');
    console.log('Agent response:', response.text);
  } catch (error) {
    console.error('Error testing agent:', error);
  }

  console.log('\nDone!');
};

// Run the example
if (require.main === module) {
  main().catch(error => {
    console.error('Error running example:', error);
    process.exit(1);
  });
}
