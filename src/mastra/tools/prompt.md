# Manage prompts programmatically

You can use the LangSmith Python and TypeScript SDK to manage prompts programmatically.

note
Previously this functionality lived in the langchainhub package which is now deprecated. All functionality going forward will live in the langsmith package.

Install packages
In Python, you can directly use the LangSmith SDK (recommended, full functionality) or you can use through the LangChain package (limited to pushing and pulling prompts).

In TypeScript, you must use the LangChain npm package for pulling prompts (it also allows pushing). For all other functionality, use the LangSmith package.

Python
LangChain (Python)
TypeScript

pnpm add langsmith langchain 

// langsmith version >= 0.1.99 and langchain version >= 0.2.14

Configure environment variables
If you already have LANGSMITH_API_KEY set to your current workspace's api key from LangSmith, you can skip this step.

Otherwise, get an API key for your workspace by navigating to Settings > API Keys > Create API Key in LangSmith.

Set your environment variable.

export LANGSMITH_API_KEY="lsv2_..."

Terminology
What we refer to as "prompts" used to be called "repos", so any references to "repo" in the code are referring to a prompt.

Push a prompt
To create a new prompt or update an existing prompt, you can use the push prompt method.


TypeScript

```ts
import * as hub from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const prompt = ChatPromptTemplate.fromTemplate("tell me a joke about {topic}");
const url = hub.push("joke-generator", {
  object: prompt,
});
// url is a link to the prompt in the UI
console.log(url);
```

You can also push a prompt as a RunnableSequence of a prompt and a model. This is useful for storing the model configuration you want to use with this prompt. The provider must be supported by the LangSmith playground. (see settings here: Supported Providers)


```ts
import * as hub from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({ model: "gpt-4o-mini" });

const prompt = ChatPromptTemplate.fromTemplate("tell me a joke about {topic}");
const chain = prompt.pipe(model);

await hub.push("joke-generator-with-model", {
  object: chain,
});
```

- Pull a prompt

To pull a prompt, you can use the pull prompt method, which returns a the prompt as a langchain PromptTemplate.

To pull a private prompt you do not need to specify the owner handle (though you can, if you have one set).

To pull a public prompt from the LangChain Hub, you need to specify the handle of the prompt's author.

```ts
import * as hub from "langchain/hub";
import { ChatOpenAI } from "@langchain/openai";

const prompt = await hub.pull("joke-generator");
const model = new ChatOpenAI({ model: "gpt-4o-mini" });

const chain = prompt.pipe(model);
await chain.invoke({ topic: "cats" });
```

Similar to pushing a prompt, you can also pull a prompt as a RunnableSequence of a prompt and a model. Just specify include_model when pulling the prompt. If the stored prompt includes a model, it will be returned as a RunnableSequence. Make sure you have the proper environment variables set for the model you are using.

```ts
import * as hub from "langchain/hub";
import { Runnable } from "@langchain/core/runnables";

const chain = await hub.pull<Runnable>("joke-generator-with-model", {
  includeModel: true,
});
await chain.invoke({ topic: "cats" });
```

When pulling a prompt, you can also specify a specific commit hash or prompt tag to pull a specific version of the prompt.

```ts
const prompt = await hub.pull("joke-generator:12344e88");
```

To pull a public prompt from the LangChain Hub, you need to specify the handle of the prompt's author.

```ts
const prompt = await hub.pull("efriis/my-first-prompt");
```

Important Note for JavaScript Users
For pulling prompts, if you are using Node.js or an environment that supports dynamic imports, we recommend using the langchain/hub/node entrypoint, as it handles deserialization of models associated with your prompt configuration automatically.

If you are in a non-Node environment, "includeModel" is not supported for non-OpenAI models and you should use the base langchain/hub entrypoint.

Use a prompt without LangChain
If you want to store your prompts in LangSmith but use them directly with a model provider's API, you can use our conversion methods. These convert your prompt into the payload required for the OpenAI or Anthropic API.

These conversion methods rely on logic from within LangChain integration packages, and you will need to install the appropriate package as a dependency in addition to your official SDK of choice. Here are some examples:

OpenAI
Python
TypeScript
yarn add @langchain/openai @langchain/core 
// @langchain/openai version >= 0.3.2

Python
TypeScript
import * as hub from "langchain/hub";
import { convertPromptToOpenAI } from "@langchain/openai";

import OpenAI from "openai";

const prompt = await hub.pull("jacob/joke-generator");
const formattedPrompt = await prompt.invoke({
  topic: "cats",
});

const { messages } = convertPromptToOpenAI(formattedPrompt);

const openAIClient = new OpenAI();

const openAIResponse = await openAIClient.chat.completions.create({
  model: "gpt-4o-mini",
  messages,
});

Anthropic
Python
TypeScript
yarn add @langchain/anthropic @langchain/core 
// @langchain/anthropic version >= 0.3.3

Python
TypeScript
import * as hub from "langchain/hub";
import { convertPromptToAnthropic } from "@langchain/anthropic";

import Anthropic from "@anthropic-ai/sdk";

const prompt = await hub.pull("jacob/joke-generator");
const formattedPrompt = await prompt.invoke({
  topic: "cats",
});

const { messages, system } = convertPromptToAnthropic(formattedPrompt);

const anthropicClient = new Anthropic();

const anthropicResponse = await anthropicClient.messages.create({
  model: "claude-3-haiku-20240307",
  system,
  messages,
  max_tokens: 1024,
  stream: false,
});

List, delete, and like prompts
You can also list, delete, and like/unlike prompts using the list prompts, delete prompt, like prompt and unlike prompt methods. See the LangSmith SDK client for extensive documentation on these methods.

Python
TypeScript
// List all prompts in my workspace
import Client from "langsmith";
const client = new Client({ apiKey: "lsv2_..." });
const prompts = client.listPrompts();
for await (const prompt of prompts) {
  console.log(prompt);
}
// List my private prompts that include "joke"
const private_joke_prompts = client.listPrompts({
  query: "joke",
  isPublic: false,
});
// Delete a prompt
client.deletePrompt("joke-generator");
// Like a prompt
client.likePrompt("efriis/my-first-prompt");
// Unlike a prompt
client.unlikePrompt("efriis/my-first-prompt");