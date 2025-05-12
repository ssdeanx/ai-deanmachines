# Mastra Memory Processors

Memory processors allow you to modify the list of messages retrieved from memory before they are added to the agent's context window and sent to the LLM. This helps optimize token usage, improve relevance, and enhance the quality of agent responses.

## Types of Processors

There are two types of processors:

1. **Standard Processors** - Process messages in batches
2. **Stream Processors** - Process messages in real-time as they flow through the system

## Standard Processors

### TokenLimiter

Prevents errors by limiting the total token count of memory messages.

```typescript
import { TokenLimiter } from '@mastra/memory/processors';

const tokenLimiter = new TokenLimiter({
  tokenLimit: 127000 // Maximum number of tokens allowed
});
```

### ToolCallFilter

Removes tool calls from memory messages to save tokens by excluding potentially verbose tool interactions.

```typescript
import { ToolCallFilter } from '@mastra/memory/processors';

const toolCallFilter = new ToolCallFilter({
  removeAllToolCalls: false, // Whether to remove all tool calls or just tool-call type messages
  keepToolNames: true // Whether to keep tool names in simplified messages
});
```

### ContextualSummarizer

Summarizes long conversation histories to reduce token usage while preserving the most important context.

```typescript
import { ContextualSummarizer } from '@mastra/memory/processors';

const contextualSummarizer = new ContextualSummarizer({
  maxMessages: 50, // Maximum number of messages before summarization
  summaryInterval: 20, // Number of messages to summarize at once
  preserveSystemMessages: true, // Whether to preserve system messages
  preserveRecentMessages: 10 // Number of recent messages to preserve
});
```

### PriorityRanker

Ranks messages by importance and keeps only the most important ones when context window size is limited.

```typescript
import { PriorityRanker } from '@mastra/memory/processors';

const priorityRanker = new PriorityRanker({
  maxMessages: 50, // Maximum number of messages to keep
  preserveSystemMessages: true, // Whether to preserve system messages
  preserveRecentMessages: 5, // Number of recent messages to preserve
  importanceFactors: {
    recency: 0.5, // Weight for message recency
    role: { // Weights for different roles
      system: 1.0,
      user: 0.8,
      assistant: 0.7,
      tool: 0.3
    },
    type: { // Weights for different types
      text: 0.8,
      'tool-call': 0.4,
      'tool-result': 0.5
    },
    length: 0.2, // Weight for message length
    keywords: ['important', 'critical', 'urgent'], // Keywords to prioritize
    keywordWeight: 0.8 // Weight for keyword matches
  }
});
```

### DuplicateDetector

Identifies and removes duplicate or highly similar messages to reduce redundancy in the context window.

```typescript
import { DuplicateDetector } from '@mastra/memory/processors';

const duplicateDetector = new DuplicateDetector({
  similarityThreshold: 0.9, // Threshold for considering messages similar
  compareContent: true, // Whether to compare message content
  ignoreCase: true, // Whether to ignore case when comparing
  ignoreWhitespace: true, // Whether to ignore whitespace when comparing
  preserveNewest: true // Whether to preserve newest duplicates
});
```

### TemporalProcessor

Organizes and filters messages based on time-related criteria, such as recency, time windows, and temporal relevance.

```typescript
import { TemporalProcessor } from '@mastra/memory/processors';

const temporalProcessor = new TemporalProcessor({
  mode: 'filter', // 'filter', 'group', or 'annotate'
  timeWindows: [
    { start: new Date('2023-01-01'), end: new Date('2023-01-31'), label: 'January' },
    { start: new Date('2023-02-01'), end: new Date('2023-02-28'), label: 'February' }
  ],
  recencyThreshold: 24, // Time threshold for recency filtering
  recencyUnit: 'hours', // 'minutes', 'hours', or 'days'
  addTimestamps: true, // Whether to add timestamps to messages
  addRelativeTime: true // Whether to add relative time to messages
});
```

### EntityExtractor

Identifies and extracts key entities from messages, such as people, organizations, locations, dates, and custom entities.

```typescript
import { EntityExtractor } from '@mastra/memory/processors';

const entityExtractor = new EntityExtractor({
  addEntityAnnotations: true, // Whether to add entity annotations to messages
  extractToMetadata: true, // Whether to extract entities to message metadata
  customEntities: {
    product: ['Widget Pro', 'SuperApp', 'MegaTool'],
    department: ['Sales', 'Marketing', 'Engineering']
  }
});
```

### SentimentAnalyzer

Analyzes the sentiment of messages and adds sentiment information as metadata or annotations.

```typescript
import { SentimentAnalyzer } from '@mastra/memory/processors';

const sentimentAnalyzer = new SentimentAnalyzer({
  addSentimentAnnotations: true, // Whether to add sentiment annotations to messages
  extractToMetadata: true, // Whether to extract sentiment to message metadata
  analyzeUserMessages: true, // Whether to analyze user messages
  analyzeAssistantMessages: true, // Whether to analyze assistant messages
  analyzeSystemMessages: false, // Whether to analyze system messages
  analyzeToolMessages: false, // Whether to analyze tool messages
  positiveThreshold: 0.05, // Threshold for positive sentiment
  negativeThreshold: -0.05 // Threshold for negative sentiment
});
```

### ContextualEnhancer

Enhances messages with additional context, references, and metadata to improve the quality and coherence of agent responses.

```typescript
import { ContextualEnhancer, CommonEnhancements } from '@mastra/memory/processors';

const contextualEnhancer = new ContextualEnhancer({
  enhancementFunctions: [
    CommonEnhancements.addRelatedMessages(0.8),
    CommonEnhancements.addEntityCrossReferences(),
    CommonEnhancements.addKnowledgeBaseReferences('kb')
  ],
  contextSources: [
    async (message) => {
      // Example context source that fetches knowledge base data
      return {
        kb: {
          articles: [
            { id: 'a1', title: 'Getting Started', url: '/docs/getting-started' },
            { id: 'a2', title: 'Advanced Features', url: '/docs/advanced' }
          ]
        }
      };
    }
  ],
  applyToRoles: ['assistant'],
  contextWindow: 10,
  addReferences: true,
  addMetadata: true,
  addAnnotations: true,
  cacheContext: true
});
```

## Stream Processors

### MessageTransformer

Transforms message content in real-time as it flows through the memory system.

```typescript
import { MessageTransformer, CommonTransforms } from '@mastra/memory/processors';

const messageTransformer = new MessageTransformer({
  transformFunctions: [
    CommonTransforms.truncateContent(1000),
    CommonTransforms.removeSensitiveInfo([/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g]), // Credit card pattern
    CommonTransforms.formatCodeBlocks()
  ],
  applyToRoles: ['user', 'assistant'], // Roles to apply transformations to
  applyToTypes: ['text'] // Types to apply transformations to
});
```

### StreamFilter

Filters messages in real-time as they flow through the memory system.

```typescript
import { StreamFilter, CommonFilters } from '@mastra/memory/processors';

const streamFilter = new StreamFilter({
  mode: 'exclude', // 'include' or 'exclude'
  includePredicates: [
    CommonFilters.byRole(['user', 'assistant'], true),
    CommonFilters.byContent('important', false, true)
  ],
  excludePredicates: [
    CommonFilters.byType(['tool-call'], true),
    CommonFilters.byContent('ignore', false, true)
  ]
});
```

### StreamObjectProcessor

Processes stream objects in real-time as they flow through the memory system, handling complex data structures and transforming them into usable formats.

```typescript
import { StreamObjectProcessor, CommonStreamTransforms } from '@mastra/memory/processors';

const streamObjectProcessor = new StreamObjectProcessor({
  transformFunctions: [
    CommonStreamTransforms.extractFields(['text', 'data', 'metadata']),
    CommonStreamTransforms.mergeFields(['title', 'description'], ' - ', 'text'),
    CommonStreamTransforms.formatJsonFields(['data'])
  ],
  applyToRoles: ['user', 'assistant', 'tool'],
  extractTextContent: true,
  preserveOriginalContent: true,
  textContentField: 'text'
});
```

### StreamAggregator

Aggregates and summarizes multiple messages in real-time as they flow through the memory system, reducing noise and combining related messages.

```typescript
import { StreamAggregator, CommonGroupings } from '@mastra/memory/processors';

const streamAggregator = new StreamAggregator({
  groupingFunctions: [
    CommonGroupings.byRoleAndType(),
    CommonGroupings.byContentSimilarity(0.8)
  ],
  applyToRoles: ['user', 'assistant', 'tool'],
  applyToTypes: ['text', 'tool-result'],
  minMessagesToAggregate: 3,
  maxMessagesToAggregate: 10,
  timeWindowMs: 120000 // 2 minutes
});
```

## Using Processors with Memory

```typescript
import { Memory } from '@mastra/memory';
import {
  TokenLimiter,
  ToolCallFilter,
  ContextualSummarizer,
  PriorityRanker,
  StreamObjectProcessor,
  CommonStreamTransforms,
  MessageTransformer,
  CommonTransforms,
  StreamFilter,
  CommonFilters,
  SentimentAnalyzer,
  EntityExtractor,
  DuplicateDetector,
  TemporalProcessor,
  StreamAggregator,
  CommonGroupings,
  ContextualEnhancer,
  CommonEnhancements
} from '@mastra/memory/processors';

// Create standard memory processors
const tokenLimiter = new TokenLimiter({ tokenLimit: 1000000 });
const toolCallFilter = new ToolCallFilter();
const contextualSummarizer = new ContextualSummarizer({
  maxMessages: 50,
  summaryInterval: 20,
  preserveSystemMessages: true,
  preserveRecentMessages: 10
});
const priorityRanker = new PriorityRanker({
  maxMessages: 50,
  preserveSystemMessages: true,
  preserveRecentMessages: 5,
  importanceFactors: {
    recency: 0.6,
    role: { system: 1.0, user: 0.9, assistant: 0.8, tool: 0.4 },
    length: 0.3,
    keywords: ['important', 'critical', 'urgent', 'remember', 'key', 'essential'],
    keywordWeight: 0.9
  }
});
const duplicateDetector = new DuplicateDetector({
  similarityThreshold: 0.85,
  compareContent: true,
  ignoreCase: true,
  ignoreWhitespace: true,
  preserveNewest: true
});
const temporalProcessor = new TemporalProcessor({
  mode: 'annotate',
  addTimestamps: true,
  addRelativeTime: true
});
const entityExtractor = new EntityExtractor({
  addEntityAnnotations: false,
  extractToMetadata: true,
  customEntities: {
    product: ['Widget Pro', 'SuperApp', 'MegaTool'],
    department: ['Sales', 'Marketing', 'Engineering']
  }
});
const sentimentAnalyzer = new SentimentAnalyzer({
  addSentimentAnnotations: false,
  extractToMetadata: true,
  analyzeUserMessages: true,
  analyzeAssistantMessages: true
});

const contextualEnhancer = new ContextualEnhancer({
  enhancementFunctions: [
    CommonEnhancements.addRelatedMessages(0.8),
    CommonEnhancements.addEntityCrossReferences(),
    CommonEnhancements.addKnowledgeBaseReferences('kb')
  ],
  contextSources: [
    async (message) => {
      // Example context source that fetches knowledge base data
      return {
        kb: {
          articles: [
            { id: 'a1', title: 'Getting Started', url: '/docs/getting-started' },
            { id: 'a2', title: 'Advanced Features', url: '/docs/advanced' }
          ]
        }
      };
    }
  ],
  contextWindow: 10,
  addReferences: true,
  cacheContext: true
});

// Create stream processors
const streamObjectProcessor = new StreamObjectProcessor({
  transformFunctions: [
    CommonStreamTransforms.extractFields(['text', 'data', 'metadata']),
    CommonStreamTransforms.mergeFields(['title', 'description'], ' - ', 'text'),
    CommonStreamTransforms.formatJsonFields(['data'])
  ],
  extractTextContent: true,
  preserveOriginalContent: true,
  textContentField: 'text'
});
const streamAggregator = new StreamAggregator({
  groupingFunctions: [
    CommonGroupings.byRoleAndType(),
    CommonGroupings.byContentSimilarity(0.8)
  ],
  applyToRoles: ['user', 'assistant', 'tool'],
  applyToTypes: ['text', 'tool-result'],
  minMessagesToAggregate: 3,
  maxMessagesToAggregate: 10,
  timeWindowMs: 120000 // 2 minutes
});
const messageTransformer = new MessageTransformer({
  transformFunctions: [
    CommonTransforms.truncateContent(8000),
    CommonTransforms.removeSensitiveInfo([
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email pattern
      /\b(?:\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g // Phone number pattern
    ]),
    CommonTransforms.formatCodeBlocks()
  ],
  applyToRoles: ['user', 'assistant', 'tool'],
  applyToTypes: ['text', 'tool-result']
});
const streamFilter = new StreamFilter({
  mode: 'exclude',
  excludePredicates: [
    CommonFilters.byContent('ignore this message', false, true),
    CommonFilters.byContent('confidential', false, true),
    CommonFilters.byContent('private', false, true)
  ]
});

// Create memory with processors
const memory = new Memory({
  provider: 'upstash',
  options: {
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
    vectorUrl: process.env.UPSTASH_VECTOR_URL,
    vectorToken: process.env.UPSTASH_VECTOR_TOKEN
  },
  processors: [
    // Stream processors (process messages as they flow through)
    streamFilter,           // First filter out unwanted messages
    streamObjectProcessor,  // Then process complex objects
    streamAggregator,       // Then aggregate related messages
    messageTransformer,     // Then transform message content

    // Standard processors (process batches of messages)
    toolCallFilter,         // Remove unnecessary tool calls
    duplicateDetector,      // Remove duplicate messages
    contextualSummarizer,   // Summarize long conversations
    priorityRanker,         // Rank messages by importance
    temporalProcessor,      // Add temporal information
    entityExtractor,        // Extract entities
    sentimentAnalyzer,      // Analyze sentiment
    contextualEnhancer,     // Enhance with additional context
    tokenLimiter            // Finally, limit tokens
  ]
});
```

## Processor Execution Order

Processors are executed in the order they are provided in the `processors` array. Consider the following when ordering processors:

1. **Filtering processors** should generally come before transforming processors
2. **Summarization processors** should come before token limiters
3. **Priority rankers** should come after duplicate detectors
4. **Entity and sentiment analyzers** should come last if they add annotations

## Custom Processors

You can create custom processors by implementing the `MemoryProcessor` interface:

```typescript
import { Message, MemoryProcessor } from '@mastra/memory/types';

class CustomProcessor implements MemoryProcessor {
  process(messages: Message[]): Message[] {
    // Your custom processing logic here
    return messages;
  }
}
```
