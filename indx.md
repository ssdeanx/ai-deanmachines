## tools-mcp/overview.mdx

---
title: "Tools Overview | Tools & MCP | Mastra Docs"
description: Understand what tools are in Mastra, how to add them to agents, and best practices for designing effective tools.
---

# Tools Overview

Tools are functions that agents can execute to perform specific tasks or access external information. They extend an agent's capabilities beyond simple text generation, allowing interaction with APIs, databases, or other systems.

Each tool typically defines:

- **Inputs:** What information the tool needs to run (defined with an `inputSchema`, often using Zod).
- **Outputs:** The structure of the data the tool returns (defined with an `outputSchema`).
- **Execution Logic:** The code that performs the tool's action.
- **Description:** Text that helps the agent understand what the tool does and when to use it.

## Creating Tools

In Mastra, you create tools using the [`createTool`](/reference/tools/create-tool) function from the `@mastra/core/tools` package.

```typescript filename="src/mastra/tools/weatherInfo.ts" copy
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const getWeatherInfo = async (city: string) => {
  // Replace with an actual API call to a weather service
  console.log(`Fetching weather for ${city}...`);
  // Example data structure
  return { temperature: 20, conditions: "Sunny" };
};

export const weatherTool = createTool({
  id: "Get Weather Information",
  description: `Fetches the current weather information for a given city`,
  inputSchema: z.object({
    city: z.string().describe("City name"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
  }),
  execute: async ({ context: { city } }) => {
    console.log("Using tool to fetch weather information for", city);
    return await getWeatherInfo(city);
  },
});
```

This example defines a `weatherTool` with an input schema for the city, an output schema for the weather data, and an `execute` function that contains the tool's logic.

When creating tools, keep tool descriptions simple and focused on **what** the tool does and **when** to use it, emphasizing its primary use case. Technical details belong in the parameter schemas, guiding the agent on _how_ to use the tool correctly with descriptive names, clear descriptions, and explanations of default values.

## Adding Tools to an Agent

To make tools available to an agent, you configure them in the agent's definition. Mentioning available tools and their general purpose in the agent's system prompt can also improve tool usage. For detailed steps and examples, see the guide on [Using Tools and MCP with Agents](/docs/agents/using-tools-and-mcp#add-tools-to-an-agent).

## Compatibility Layer for Tool Schemas

Different models interpret schemas differely. Some error when certain schema properties are passed and some ignore certain schema properties but don't throw an error. Mastra adds a compatibility layer for tool schemas, ensuring tools work consistently across different model providers and that the schema constraints are respected.

Some providers that we include this layer for:

- **Google Gemini & Anthropic:** Remove unsupported schema properties and append relevant constraints to the tool description.
- **OpenAI (including reasoning models):** Strip or adapt schema fields that are ignored or unsupported, and add instructions to the description for agent guidance.
- **DeepSeek & Meta:** Apply similar compatibility logic to ensure schema alignment and tool usability.

This approach makes tool usage more reliable and model-agnostic for both custom and MCP tools.



---

## tools-mcp/dynamic-context.mdx

---
title: "Dynamic Tool Context | Tools & MCP | Mastra Docs"
description: Learn how to use Mastra's RuntimeContext to provide dynamic, request-specific configuration to tools.
---

import { Callout } from "nextra/components";

# Dynamic Tool Context

Mastra provides `RuntimeContext`, a system based on dependency injection, that allows you to pass dynamic, request-specific configuration to your tools during execution. This is useful when a tool's behavior needs to change based on user identity, request headers, or other runtime factors, without altering the tool's core code.

<Callout>
  **Note:** `RuntimeContext` is primarily used for passing data *into* tool executions. It's distinct from agent memory, which handles conversation history and state persistence across multiple calls.
</Callout>

## Basic Usage

To use `RuntimeContext`, first define a type structure for your dynamic configuration. Then, create an instance of `RuntimeContext` typed with your definition and set the desired values. Finally, include the `runtimeContext` instance in the options object when calling `agent.generate()` or `agent.stream()`.

```typescript
import { RuntimeContext } from "@mastra/core/di";
// Assume 'agent' is an already defined Mastra Agent instance

// Define the context type
type WeatherRuntimeContext = {
  "temperature-scale": "celsius" | "fahrenheit";
};

// Instantiate RuntimeContext and set values
const runtimeContext = new RuntimeContext<WeatherRuntimeContext>();
runtimeContext.set("temperature-scale", "celsius");

// Pass to agent call
const response = await agent.generate("What's the weather like today?", {
  runtimeContext, // Pass the context here
});

console.log(response.text);
```

## Accessing Context in Tools

Tools receive the `runtimeContext` as part of the second argument to their `execute` function. You can then use the `.get()` method to retrieve values.

```typescript filename="src/mastra/tools/weather-tool.ts"
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
// Assume WeatherRuntimeContext is defined as above and accessible here

// Dummy fetch function
async function fetchWeather(
  location: string,
  options: { temperatureUnit: "celsius" | "fahrenheit" }
): Promise<any> {
  console.log(`Fetching weather for ${location} in ${options.temperatureUnit}`);
  // Replace with actual API call
  return { temperature: options.temperatureUnit === "celsius" ? 20 : 68 };
}

export const weatherTool = createTool({
  id: "getWeather",
  description: "Get the current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("The location to get weather for"),
  }),
  // The tool's execute function receives runtimeContext
  execute: async ({ context, runtimeContext }) => {
    // Type-safe access to runtimeContext variables
    const temperatureUnit = runtimeContext.get("temperature-scale");

    // Use the context value in the tool logic
    const weather = await fetchWeather(context.location, {
      temperatureUnit,
    });

    return { result: `The temperature is ${weather.temperature}°${temperatureUnit === "celsius" ? "C" : "F"}` };
  },
});
```

When the agent uses `weatherTool`, the `temperature-scale` value set in the `runtimeContext` during the `agent.generate()` call will be available inside the tool's `execute` function.

## Using with Server Middleware

In server environments (like Express or Next.js), you can use middleware to automatically populate `RuntimeContext` based on incoming request data, such as headers or user sessions.

Here's an example using Mastra's built-in server middleware support (which uses Hono internally) to set the temperature scale based on the Cloudflare `CF-IPCountry` header:

```typescript filename="src/mastra/index.ts"
import { Mastra } from "@mastra/core";
import { RuntimeContext } from "@mastra/core/di";
import { weatherAgent } from "./agents/weather"; // Assume agent is defined elsewhere

// Define RuntimeContext type
type WeatherRuntimeContext = {
  "temperature-scale": "celsius" | "fahrenheit";
};

export const mastra = new Mastra({
  agents: {
    weather: weatherAgent,
  },
  server: {
    middleware: [
      async (c, next) => {
        // Get the RuntimeContext instance
        const runtimeContext = c.get<RuntimeContext<WeatherRuntimeContext>>("runtimeContext");

        // Get country code from request header
        const country = c.req.header("CF-IPCountry");

        // Set temperature scale based on country
        runtimeContext.set(
          "temperature-scale",
          country === "US" ? "fahrenheit" : "celsius",
        );

        // Continue request processing
        await next();
      },
    ],
  },
});
```

With this middleware in place, any agent call handled by this Mastra server instance will automatically have the `temperature-scale` set in its `RuntimeContext` based on the user's inferred country, and tools like `weatherTool` will use it accordingly.


---

## reference/core/mastra-class.mdx

---
title: "Mastra Core"
description: Documentation for the Mastra Class, the core entry point for managing agents, workflows, and server endpoints.
---

# The Mastra Class

The Mastra class is the core entry point for your application. It manages agents, workflows, and server endpoints.

## Constructor Options

<PropertiesTable
  content={[
    {
      name: "agents",
      type: "Agent[]",
      description: "Array of Agent instances to register",
      isOptional: true,
      defaultValue: "[]",
    },
    {
      name: "tools",
      type: "Record<string, ToolApi>",
      description:
        "Custom tools to register. Structured as a key-value pair, with keys being the tool name and values being the tool function.",
      isOptional: true,
      defaultValue: "{}",
    },
    {
      name: "storage",
      type: "MastraStorage",
      description: "Storage engine instance for persisting data",
      isOptional: true,
    },
    {
      name: "vectors",
      type: "Record<string, MastraVector>",
      description:
        "Vector store instance, used for semantic search and vector-based tools (eg Pinecone, PgVector or Qdrant)",
      isOptional: true,
    },
    {
      name: "logger",
      type: "Logger",
      description: "Logger instance created with createLogger()",
      isOptional: true,
      defaultValue: "Console logger with INFO level",
    },
    {
      name: "workflows",
      type: "Record<string, Workflow>",
      description: "Workflows to register. Structured as a key-value pair, with keys being the workflow name and values being the workflow instance.",
      isOptional: true,
      defaultValue: "{}",
    },
    {
      name: "server",
      type: "ServerConfig",
      description: "Server configuration including port, host, timeout, API routes, middleware, CORS settings, and build options for Swagger UI, API request logging, and OpenAPI docs.",
      isOptional: true,
      defaultValue: "{ port: 4111, host: localhost,  cors: { origin: '*', allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization', 'x-mastra-client-type'], exposeHeaders: ['Content-Length', 'X-Requested-With'], credentials: false } }",
    },
  ]}
/>

## Initialization

The Mastra class is typically initialized in your `src/mastra/index.ts` file:

```typescript copy filename=src/mastra/index.ts
import { Mastra } from "@mastra/core";
import { createLogger } from "@mastra/core/logger";

// Basic initialization
export const mastra = new Mastra({});

// Full initialization with all options
export const mastra = new Mastra({
  agents: {},
  workflows: [],
  integrations: [],
  logger: createLogger({
    name: "My Project",
    level: "info",
  }),
  storage: {},
  tools: {},
  vectors: {},
});
```

You can think of the `Mastra` class as a top-level registry. When you register tools with Mastra, your registered agents and workflows can use them. When you register integrations with Mastra, agents, workflows, and tools can use them.

## Methods

<PropertiesTable
  content={[
    {
      name: "getAgent(name)",
      type: "Agent",
      description:
        "Returns an agent instance by id. Throws if agent not found.",
      example: 'const agent = mastra.getAgent("agentOne");',
    },
    {
      name: "getAgents()",
      type: "Record<string, Agent>",
      description:
        "Returns all registered agents as a key-value object.",
      example: 'const agents = mastra.getAgents();',
    },
    {
      name: "getWorkflow(id, { serialized })",
      type: "Workflow",
      description:
        "Returns a workflow instance by id. The serialized option (default: false) returns a simplified representation with just the name.",
      example: 'const workflow = mastra.getWorkflow("myWorkflow");',
    },
    {
      name: "getWorkflows({ serialized })",
      type: "Record<string, Workflow>",
      description:
        "Returns all registered workflows. The serialized option (default: false) returns simplified representations.",
      example: 'const workflows = mastra.getWorkflows();',
    },
    {
      name: "getVector(name)",
      type: "MastraVector",
      description:
        "Returns a vector store instance by name. Throws if not found.",
      example: 'const vectorStore = mastra.getVector("myVectorStore");',
    },
    {
      name: "getVectors()",
      type: "Record<string, MastraVector>",
      description:
        "Returns all registered vector stores as a key-value object.",
      example: 'const vectorStores = mastra.getVectors();',
    },
    {
      name: "getDeployer()",
      type: "MastraDeployer | undefined",
      description:
        "Returns the configured deployer instance, if any.",
      example: 'const deployer = mastra.getDeployer();',
    },
    {
      name: "getStorage()",
      type: "MastraStorage | undefined",
      description:
        "Returns the configured storage instance.",
      example: 'const storage = mastra.getStorage();',
    },
    {
      name: "getMemory()",
      type: "MastraMemory | undefined",
      description:
        "Returns the configured memory instance. Note: This is deprecated, memory should be added to agents directly.",
      example: 'const memory = mastra.getMemory();',
    },
    {
      name: "getServer()",
      type: "ServerConfig | undefined",
      description:
        "Returns the server configuration including port, timeout, API routes, middleware, CORS settings, and build options.",
      example: 'const serverConfig = mastra.getServer();',
    },
    {
      name: "setStorage(storage)",
      type: "void",
      description:
        "Sets the storage instance for the Mastra instance.",
      example: 'mastra.setStorage(new DefaultStorage());',
    },
    {
      name: "setLogger({ logger })",
      type: "void",
      description:
        "Sets the logger for all components (agents, workflows, etc.).",
      example: 'mastra.setLogger({ logger: createLogger({ name: "MyLogger" }) });',
    },
    {
      name: "setTelemetry(telemetry)",
      type: "void",
      description:
        "Sets the telemetry configuration for all components.",
      example: 'mastra.setTelemetry({ export: { type: "console" } });',
    },
    {
      name: "getLogger()",
      type: "Logger",
      description:
        "Gets the configured logger instance.",
      example: 'const logger = mastra.getLogger();',
    },
    {
      name: "getTelemetry()",
      type: "Telemetry | undefined",
      description:
        "Gets the configured telemetry instance.",
      example: 'const telemetry = mastra.getTelemetry();',
    },
    {
      name: "getLogsByRunId({ runId, transportId })",
      type: "Promise<any>",
      description:
        "Retrieves logs for a specific run ID and transport ID.",
      example: 'const logs = await mastra.getLogsByRunId({ runId: "123", transportId: "456" });',
    },
    {
      name: "getLogs(transportId)",
      type: "Promise<any>",
      description:
        "Retrieves all logs for a specific transport ID.",
      example: 'const logs = await mastra.getLogs("transportId");',
    },
  ]}
/>

## Error Handling

The Mastra class methods throw typed errors that can be caught:

```typescript copy
try {
  const tool = mastra.getTool("nonexistentTool");
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message); // "Tool with name nonexistentTool not found"
  }
}
```


---

## reference/tools/

Directory contents of reference/tools/:

No subdirectories.

Files in this directory:
- client.mdx
- create-tool.mdx
- document-chunker-tool.mdx
- graph-rag-tool.mdx
- mcp-client.mdx
- mcp-server.mdx
- vector-query-tool.mdx

---