# Mastra AI with Google Integration

A modular AI application built with Mastra framework, featuring Google AI integration, knowledge graph capabilities, and a focus on extensibility.

## Overview

This project implements a modular architecture for AI applications with a focus on maintainability, extensibility, and clean separation of concerns. Rather than implementing numerous features at once, this architecture establishes a solid foundation that can be incrementally enhanced over time.

## Features

- **Modular Agent Framework**: Core agent system with pluggable capabilities
- **Memory System**: Pluggable memory system with different storage backends (Upstash Redis)
- **Embedding System**: Flexible embedding providers (Xenova Transformers)
- **Knowledge Graph**: RAG and vector store components for knowledge integration
- **Google AI Integration**: Leverages Google's Gemini models for advanced reasoning
- **Voice Processing**: Optional voice input/output capabilities

## Directory Structure

```bash
project/
├── src/
│   ├── mastra/
│   │   ├── agents/             # Agent definitions and configurations
│   │   ├── memory/             # Memory system implementations
│   │   ├── tools/              # Tool implementations
│   │   ├── embeddings/         # Embedding models and utilities
│   │   ├── workflows/          # LangGraph workflows
│   │   ├── knowledge/          # Knowledge graph and RAG components
│   │   ├── voice/              # Voice processing components
│   │   ├── utils/              # Shared utilities
│   │   └── config/             # Configuration management
│   └── index.ts                # Main entry point
├── tests/                      # Test suite
├── .env                        # Environment variables
├── .env.example                # Environment variables example
├── README.md                   # Project documentation
└── CHANGELOG.md                # Version history
```

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- Upstash account (for Redis and Vector DB)
- Google AI API key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/mastra-ai-google.git
   cd mastra-ai-google
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and add your API keys
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

## Usage Examples

### Basic Agent Setup

```typescript
import { BaseAgent } from "./src/mastra/agents/baseAgent";
import { Memory } from "./src/mastra/memory/memory";

// Create memory
const memory = new Memory({
  provider: "upstash",
  options: {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
  }
});

// Create agent
const agent = new BaseAgent({
  name: "BasicAgent",
  instructions: "You are a helpful assistant.",
  modelName: "gemini-2.5-pro-preview-05-06",
  memory
});

// Use agent
const response = await agent.stream("Hello, how can you help me?", {
  resourceId: "user_123",
  threadId: "conversation_1"
});
```

## Environment Configuration

Create a `.env` file in your project root with the following variables:

```
# LLM API
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key

# Memory Storage
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

# Vector Database
UPSTASH_VECTOR_REST_URL=your-upstash-vector-url
UPSTASH_VECTOR_REST_TOKEN=your-upstash-vector-token
```

## License

ISC

## Acknowledgments

- Mastra Framework
- Google AI
- Upstash
- Xenova Transformers
