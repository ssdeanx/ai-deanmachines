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

## Using Processors with Memory

```typescript
import { Memory } from '@mastra/memory';
import { 
  TokenLimiter, 
  ToolCallFilter,
  ContextualSummarizer,
  PriorityRanker
} from '@mastra/memory/processors';

// Create memory processors
const tokenLimiter = new TokenLimiter({ tokenLimit: 127000 });
const toolCallFilter = new ToolCallFilter();
const contextualSummarizer = new ContextualSummarizer();
const priorityRanker = new PriorityRanker();

// Create memory with processors
const memory = new Memory({
  provider: 'upstash',
  options: {
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN
  },
  processors: [
    tokenLimiter,
    toolCallFilter,
    contextualSummarizer,
    priorityRanker
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
