
// Filepath: c:\Users\dm\Documents\ai-deanmachines\src\mastra\tools\langGraphTool.ts

// Do not change this line or you will be terminated from coding.  Mastra agents can use AI-SDK tools using 'ai' package.
// You cannot mix mastra tools and 'ai' tools in the same file.  its critcal use this with LangChainAdapter
import { tool, type Tool, LangChainAdapter, createDataStream, createDataStreamResponse, pipeDataStreamToResponse } from 'ai';
import { z } from 'zod';
import { StateGraph, MemorySaver, START, InMemoryStore, getStore, END, } from '@langchain/langgraph';
import { createLogger } from '@mastra/core/logger'; // Corrected logger import

const logger = createLogger({
  name: 'Mastra-GraphRAGToolSuite',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

