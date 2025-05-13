---
aliases:
  - LangGraph SDK (JS/TS)
---

 
# LangGraph SDK (JS/TS)

**[@langchain/langgraph-sdk](https://github.com/langchain-ai/langgraph/tree/main/libs/sdk-js)**

---

## [@langchain/langgraph-sdk](https://github.com/langchain-ai/langgraph/tree/main/libs/sdk-js)[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#langchainlanggraph-sdk "Permanent link")

### Classes[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classes "Permanent link")

- [AssistantsClient](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesassistantsclientmd)
- [Client](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesclientmd)
- [CronsClient](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classescronsclientmd)
- [RunsClient](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesrunsclientmd)
- [StoreClient](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesstoreclientmd)
- [ThreadsClient](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesthreadsclientmd)

### Interfaces[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interfaces "Permanent link")

- [ClientConfig](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interfacesclientconfigmd)

### Functions[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#functions "Permanent link")

- [getApiKey](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#functionsgetapikeymd)

**[langchain/langgraph-sdk](https://github.com/langchain/langgraph-sdk "GitHub Repository: langchain/langgraph-sdk")**

---

## [langchain/langgraph-sdk](https://github.com/langchain/langgraph-sdk "GitHub Repository: langchain/langgraph-sdk")/auth[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#langchainlanggraph-sdkauth "Permanent link")

### Classes[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classes_1 "Permanent link")

- [Auth](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authclassesauthmd)
- [HTTPException](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authclasseshttpexceptionmd)

### Interfaces[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interfaces_1 "Permanent link")

- [AuthEventValueMap](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authinterfacesautheventvaluemapmd)

### Type Aliases[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-aliases "Permanent link")

- [AuthFilters](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authtype-aliasesauthfiltersmd)

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authreadmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authreadmemd) / Auth

## Class: Auth\<TExtra, TAuthReturn, TUser>[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#class-authtextra-tauthreturn-tuser "Permanent link")

Defined in: [src/auth/index.ts:11](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/index.ts#L11)

### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters "Permanent link")

• **TExtra** = {}

• **TAuthReturn** _extends_ `BaseAuthReturn` = `BaseAuthReturn`

• **TUser** _extends_ `BaseUser` = `ToUserLike`\<`TAuthReturn`>

### Constructors[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#constructors "Permanent link")

#### new Auth()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#new-auth "Permanent link")

> **new Auth**\<`TExtra`, `TAuthReturn`, `TUser`>(): [`Auth`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authclassesauthmd)\<`TExtra`, `TAuthReturn`, `TUser`>

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns "Permanent link")

[`Auth`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authclassesauthmd)\<`TExtra`, `TAuthReturn`, `TUser`>

### Methods[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#methods "Permanent link")

#### authenticate()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authenticate "Permanent link")

> **authenticate**\<`T`>(`cb`): [`Auth`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authclassesauthmd)\<`TExtra`, `T`>

Defined in: [src/auth/index.ts:25](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/index.ts#L25)

##### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_1 "Permanent link")

• **T** _extends_ `BaseAuthReturn`

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters "Permanent link")

###### cb[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cb "Permanent link")

`AuthenticateCallback`\<`T`>

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_1 "Permanent link")

[`Auth`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authclassesauthmd)\<`TExtra`, `T`>

---

#### on()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#on "Permanent link")

> **on**\<`T`>(`event`, `callback`): `this`

Defined in: [src/auth/index.ts:32](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/index.ts#L32)

##### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_2 "Permanent link")

• **T** _extends_ `CallbackEvent`

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_1 "Permanent link")

###### event[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#event "Permanent link")

`T`

###### callback[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#callback "Permanent link")

`OnCallback`\<`T`, `TUser`>

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_2 "Permanent link")

`this`

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authreadmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authreadmemd) / HTTPException

## Class: HTTPException[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#class-httpexception "Permanent link")

Defined in: [src/auth/error.ts:66](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/error.ts#L66)

### Extends[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#extends "Permanent link")

- `Error`

### Constructors[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#constructors_1 "Permanent link")

#### new HTTPException()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#new-httpexception "Permanent link")

> **new HTTPException**(`status`, `options`?): [`HTTPException`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authclasseshttpexceptionmd)

Defined in: [src/auth/error.ts:70](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/error.ts#L70)

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_2 "Permanent link")

###### status[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#status "Permanent link")

`number`

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options "Permanent link")

###### # cause?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cause "Permanent link")

`unknown`

###### # headers?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#headers "Permanent link")

`HeadersInit`

###### # message?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#message "Permanent link")

`string`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_3 "Permanent link")

[`HTTPException`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authclasseshttpexceptionmd)

##### Overrides[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#overrides "Permanent link")

`Error.constructor`

### Properties[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#properties "Permanent link")

#### cause?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cause_1 "Permanent link")

> `optional` **cause**: `unknown`

Defined in: node_modules/typescript/lib/lib.es2022.error.d.ts:24

##### Inherited from[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#inherited-from "Permanent link")

`Error.cause`

---

#### headers[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#headers_1 "Permanent link")

> **headers**: `HeadersInit`

Defined in: [src/auth/error.ts:68](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/error.ts#L68)

---

#### message[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#message_1 "Permanent link")

> **message**: `string`

Defined in: node_modules/typescript/lib/lib.es5.d.ts:1077

##### Inherited from[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#inherited-from_1 "Permanent link")

`Error.message`

---

#### name[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#name "Permanent link")

> **name**: `string`

Defined in: node_modules/typescript/lib/lib.es5.d.ts:1076

##### Inherited from[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#inherited-from_2 "Permanent link")

`Error.name`

---

#### stack?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#stack "Permanent link")

> `optional` **stack**: `string`

Defined in: node_modules/typescript/lib/lib.es5.d.ts:1078

##### Inherited from[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#inherited-from_3 "Permanent link")

`Error.stack`

---

#### status[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#status_1 "Permanent link")

> **status**: `number`

Defined in: [src/auth/error.ts:67](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/error.ts#L67)

---

#### prepareStackTrace()?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#preparestacktrace "Permanent link")

> `static` `optional` **prepareStackTrace**: (`err`, `stackTraces`) => `any`

Defined in: node_modules/[types/node](https://github.com/types/node "GitHub Repository: types/node")/globals.d.ts:28

Optional override for formatting stack traces

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_3 "Permanent link")

###### err[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#err "Permanent link")

`Error`

###### stackTraces[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#stacktraces "Permanent link")

`CallSite`[]

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_4 "Permanent link")

`any`

##### See[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#see "Permanent link")

[https://v8.dev/docs/stack-trace-api#customizing-stack-traces](https://v8.dev/docs/stack-trace-api#customizing-stack-traces)

##### Inherited from[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#inherited-from_4 "Permanent link")

`Error.prepareStackTrace`

---

#### stackTraceLimit[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#stacktracelimit "Permanent link")

> `static` **stackTraceLimit**: `number`

Defined in: node_modules/[types/node](https://github.com/types/node "GitHub Repository: types/node")/globals.d.ts:30

##### Inherited from[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#inherited-from_5 "Permanent link")

`Error.stackTraceLimit`

### Methods[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#methods_1 "Permanent link")

#### captureStackTrace()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#capturestacktrace "Permanent link")

> `static` **captureStackTrace**(`targetObject`, `constructorOpt`?): `void`

Defined in: node_modules/[types/node](https://github.com/types/node "GitHub Repository: types/node")/globals.d.ts:21

Create .stack property on a target object

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_4 "Permanent link")

###### targetObject[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#targetobject "Permanent link")

`object`

###### constructorOpt?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#constructoropt "Permanent link")

`Function`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_5 "Permanent link")

`void`

##### Inherited from[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#inherited-from_6 "Permanent link")

`Error.captureStackTrace`

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authreadmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authreadmemd) / AuthEventValueMap

## Interface: AuthEventValueMap[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interface-autheventvaluemap "Permanent link")

Defined in: [src/auth/types.ts:218](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L218)

### Properties[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#properties_1 "Permanent link")

#### assistants:create[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantscreate "Permanent link")

> **assistants:create**: `object`

Defined in: [src/auth/types.ts:226](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L226)

##### assistant_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistant_id "Permanent link")

> `optional` **assistant_id**: `Maybe`\<`string`>

##### config?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#config "Permanent link")

> `optional` **config**: `Maybe`\<`AssistantConfig`>

##### graph_id[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#graph_id "Permanent link")

> **graph_id**: `string`

##### if_exists?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#if_exists "Permanent link")

> `optional` **if_exists**: `Maybe`\<`"raise"` | `"do_nothing"`>

##### metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata "Permanent link")

> `optional` **metadata**: `Maybe`\<`Record`\<`string`, `unknown`>>

##### name?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#name_1 "Permanent link")

> `optional` **name**: `Maybe`\<`string`>

---

#### assistants:delete[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantsdelete "Permanent link")

> **assistants:delete**: `object`

Defined in: [src/auth/types.ts:229](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L229)

##### assistant_id[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistant_id_1 "Permanent link")

> **assistant_id**: `string`

---

#### assistants:read[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantsread "Permanent link")

> **assistants:read**: `object`

Defined in: [src/auth/types.ts:227](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L227)

##### assistant_id[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistant_id_2 "Permanent link")

> **assistant_id**: `string`

##### metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_1 "Permanent link")

> `optional` **metadata**: `Maybe`\<`Record`\<`string`, `unknown`>>

---

#### assistants:search[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantssearch "Permanent link")

> **assistants:search**: `object`

Defined in: [src/auth/types.ts:230](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L230)

##### graph_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#graph_id_1 "Permanent link")

> `optional` **graph_id**: `Maybe`\<`string`>

##### limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit "Permanent link")

> `optional` **limit**: `Maybe`\<`number`>

##### metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_2 "Permanent link")

> `optional` **metadata**: `Maybe`\<`Record`\<`string`, `unknown`>>

##### offset?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#offset "Permanent link")

> `optional` **offset**: `Maybe`\<`number`>

---

#### assistants:update[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantsupdate "Permanent link")

> **assistants:update**: `object`

Defined in: [src/auth/types.ts:228](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L228)

##### assistant_id[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistant_id_3 "Permanent link")

> **assistant_id**: `string`

##### config?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#config_1 "Permanent link")

> `optional` **config**: `Maybe`\<`AssistantConfig`>

##### graph_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#graph_id_2 "Permanent link")

> `optional` **graph_id**: `Maybe`\<`string`>

##### metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_3 "Permanent link")

> `optional` **metadata**: `Maybe`\<`Record`\<`string`, `unknown`>>

##### name?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#name_2 "Permanent link")

> `optional` **name**: `Maybe`\<`string`>

##### version?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#version "Permanent link")

> `optional` **version**: `Maybe`\<`number`>

---

#### crons:create[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cronscreate "Permanent link")

> **crons:create**: `object`

Defined in: [src/auth/types.ts:232](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L232)

##### cron_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cron_id "Permanent link")

> `optional` **cron_id**: `Maybe`\<`string`>

##### end_time?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#end_time "Permanent link")

> `optional` **end_time**: `Maybe`\<`string`>

##### payload?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload "Permanent link")

> `optional` **payload**: `Maybe`\<`Record`\<`string`, `unknown`>>

##### schedule[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#schedule "Permanent link")

> **schedule**: `string`

##### thread_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#thread_id "Permanent link")

> `optional` **thread_id**: `Maybe`\<`string`>

##### user_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#user_id "Permanent link")

> `optional` **user_id**: `Maybe`\<`string`>

---

#### crons:delete[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cronsdelete "Permanent link")

> **crons:delete**: `object`

Defined in: [src/auth/types.ts:235](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L235)

##### cron_id[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cron_id_1 "Permanent link")

> **cron_id**: `string`

---

#### crons:read[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cronsread "Permanent link")

> **crons:read**: `object`

Defined in: [src/auth/types.ts:233](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L233)

##### cron_id[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cron_id_2 "Permanent link")

> **cron_id**: `string`

---

#### crons:search[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cronssearch "Permanent link")

> **crons:search**: `object`

Defined in: [src/auth/types.ts:236](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L236)

##### assistant_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistant_id_4 "Permanent link")

> `optional` **assistant_id**: `Maybe`\<`string`>

##### limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit_1 "Permanent link")

> `optional` **limit**: `Maybe`\<`number`>

##### offset?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#offset_1 "Permanent link")

> `optional` **offset**: `Maybe`\<`number`>

##### thread_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#thread_id_1 "Permanent link")

> `optional` **thread_id**: `Maybe`\<`string`>

---

#### crons:update[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cronsupdate "Permanent link")

> **crons:update**: `object`

Defined in: [src/auth/types.ts:234](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L234)

##### cron_id[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cron_id_3 "Permanent link")

> **cron_id**: `string`

##### payload?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_1 "Permanent link")

> `optional` **payload**: `Maybe`\<`Record`\<`string`, `unknown`>>

##### schedule?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#schedule_1 "Permanent link")

> `optional` **schedule**: `Maybe`\<`string`>

---

#### store:delete[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#storedelete "Permanent link")

> **store:delete**: `object`

Defined in: [src/auth/types.ts:242](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L242)

##### key[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#key "Permanent link")

> **key**: `string`

##### namespace?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#namespace "Permanent link")

> `optional` **namespace**: `Maybe`\<`string`[]>

---

#### store:get[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#storeget "Permanent link")

> **store:get**: `object`

Defined in: [src/auth/types.ts:239](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L239)

##### key[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#key_1 "Permanent link")

> **key**: `string`

##### namespace[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#namespace_1 "Permanent link")

> **namespace**: `Maybe`\<`string`[]>

---

#### store:list_namespaces[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#storelist_namespaces "Permanent link")

> **store:list_namespaces**: `object`

Defined in: [src/auth/types.ts:241](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L241)

##### limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit_2 "Permanent link")

> `optional` **limit**: `Maybe`\<`number`>

##### max_depth?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#max_depth "Permanent link")

> `optional` **max_depth**: `Maybe`\<`number`>

##### namespace?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#namespace_2 "Permanent link")

> `optional` **namespace**: `Maybe`\<`string`[]>

##### offset?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#offset_2 "Permanent link")

> `optional` **offset**: `Maybe`\<`number`>

##### suffix?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#suffix "Permanent link")

> `optional` **suffix**: `Maybe`\<`string`[]>

---

#### store:put[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#storeput "Permanent link")

> **store:put**: `object`

Defined in: [src/auth/types.ts:238](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L238)

##### key[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#key_2 "Permanent link")

> **key**: `string`

##### namespace[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#namespace_3 "Permanent link")

> **namespace**: `string`[]

##### value[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#value "Permanent link")

> **value**: `Record`\<`string`, `unknown`>

---

#### store:search[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#storesearch "Permanent link")

> **store:search**: `object`

Defined in: [src/auth/types.ts:240](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L240)

##### filter?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#filter "Permanent link")

> `optional` **filter**: `Maybe`\<`Record`\<`string`, `unknown`>>

##### limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit_3 "Permanent link")

> `optional` **limit**: `Maybe`\<`number`>

##### namespace?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#namespace_4 "Permanent link")

> `optional` **namespace**: `Maybe`\<`string`[]>

##### offset?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#offset_3 "Permanent link")

> `optional` **offset**: `Maybe`\<`number`>

##### query?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#query "Permanent link")

> `optional` **query**: `Maybe`\<`string`>

---

#### threads:create[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadscreate "Permanent link")

> **threads:create**: `object`

Defined in: [src/auth/types.ts:219](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L219)

##### if_exists?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#if_exists_1 "Permanent link")

> `optional` **if_exists**: `Maybe`\<`"raise"` | `"do_nothing"`>

##### metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_4 "Permanent link")

> `optional` **metadata**: `Maybe`\<`Record`\<`string`, `unknown`>>

##### thread_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#thread_id_2 "Permanent link")

> `optional` **thread_id**: `Maybe`\<`string`>

---

#### threads:create_run[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadscreate_run "Permanent link")

> **threads:create_run**: `object`

Defined in: [src/auth/types.ts:224](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L224)

##### after_seconds?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#after_seconds "Permanent link")

> `optional` **after_seconds**: `Maybe`\<`number`>

##### assistant_id[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistant_id_5 "Permanent link")

> **assistant_id**: `string`

##### if_not_exists?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#if_not_exists "Permanent link")

> `optional` **if_not_exists**: `Maybe`\<`"reject"` | `"create"`>

##### kwargs[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#kwargs "Permanent link")

> **kwargs**: `Record`\<`string`, `unknown`>

##### metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_5 "Permanent link")

> `optional` **metadata**: `Maybe`\<`Record`\<`string`, `unknown`>>

##### multitask_strategy?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#multitask_strategy "Permanent link")

> `optional` **multitask_strategy**: `Maybe`\<`"reject"` | `"interrupt"` | `"rollback"` | `"enqueue"`>

##### prevent_insert_if_inflight?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#prevent_insert_if_inflight "Permanent link")

> `optional` **prevent_insert_if_inflight**: `Maybe`\<`boolean`>

##### run_id[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#run_id "Permanent link")

> **run_id**: `string`

##### status[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#status_2 "Permanent link")

> **status**: `Maybe`\<`"pending"` | `"running"` | `"error"` | `"success"` | `"timeout"` | `"interrupted"`>

##### thread_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#thread_id_3 "Permanent link")

> `optional` **thread_id**: `Maybe`\<`string`>

---

#### threads:delete[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadsdelete "Permanent link")

> **threads:delete**: `object`

Defined in: [src/auth/types.ts:222](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L222)

##### run_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#run_id_1 "Permanent link")

> `optional` **run_id**: `Maybe`\<`string`>

##### thread_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#thread_id_4 "Permanent link")

> `optional` **thread_id**: `Maybe`\<`string`>

---

#### threads:read[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadsread "Permanent link")

> **threads:read**: `object`

Defined in: [src/auth/types.ts:220](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L220)

##### thread_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#thread_id_5 "Permanent link")

> `optional` **thread_id**: `Maybe`\<`string`>

---

#### threads:search[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadssearch "Permanent link")

> **threads:search**: `object`

Defined in: [src/auth/types.ts:223](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L223)

##### limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit_4 "Permanent link")

> `optional` **limit**: `Maybe`\<`number`>

##### metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_6 "Permanent link")

> `optional` **metadata**: `Maybe`\<`Record`\<`string`, `unknown`>>

##### offset?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#offset_4 "Permanent link")

> `optional` **offset**: `Maybe`\<`number`>

##### status?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#status_3 "Permanent link")

> `optional` **status**: `Maybe`\<`"error"` | `"interrupted"` | `"idle"` | `"busy"` | `string` & `object`>

##### thread_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#thread_id_6 "Permanent link")

> `optional` **thread_id**: `Maybe`\<`string`>

##### values?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#values "Permanent link")

> `optional` **values**: `Maybe`\<`Record`\<`string`, `unknown`>>

---

#### threads:update[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadsupdate "Permanent link")

> **threads:update**: `object`

Defined in: [src/auth/types.ts:221](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L221)

##### action?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#action "Permanent link")

> `optional` **action**: `Maybe`\<`"interrupt"` | `"rollback"`>

##### metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_7 "Permanent link")

> `optional` **metadata**: `Maybe`\<`Record`\<`string`, `unknown`>>

##### thread_id?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#thread_id_7 "Permanent link")

> `optional` **thread_id**: `Maybe`\<`string`>

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authreadmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#authreadmemd) / AuthFilters

## Type Alias: AuthFilters\<TKey>[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-alias-authfilterstkey "Permanent link")

> **AuthFilters**\<`TKey`>: { [key in TKey]: string | { [op in "\(contains" \| "\)eq"]?: string } }

Defined in: [src/auth/types.ts:367](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/auth/types.ts#L367)

### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_3 "Permanent link")

• **TKey** _extends_ `string` | `number` | `symbol`

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd) / AssistantsClient

## Class: AssistantsClient[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#class-assistantsclient "Permanent link")

Defined in: [client.ts:294](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L294)

### Extends[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#extends_1 "Permanent link")

- `BaseClient`

### Constructors[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#constructors_2 "Permanent link")

#### new AssistantsClient()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#new-assistantsclient "Permanent link")

> **new AssistantsClient**(`config`?): [`AssistantsClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesassistantsclientmd)

Defined in: [client.ts:88](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L88)

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_5 "Permanent link")

###### config?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#config_2 "Permanent link")

[`ClientConfig`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interfacesclientconfigmd)

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_6 "Permanent link")

[`AssistantsClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesassistantsclientmd)

##### Inherited from[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#inherited-from_7 "Permanent link")

`BaseClient.constructor`

### Methods[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#methods_2 "Permanent link")

#### create()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#create "Permanent link")

> **create**(`payload`): `Promise`\<`Assistant`>

Defined in: [client.ts:359](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L359)

Create a new assistant.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_6 "Permanent link")

###### payload[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_2 "Permanent link")

Payload for creating an assistant.

###### # assistantId?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid "Permanent link")

`string`

###### # config?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#config_3 "Permanent link")

`Config`

###### # description?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#description "Permanent link")

`string`

###### # graphId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#graphid "Permanent link")

`string`

###### # ifExists?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#ifexists "Permanent link")

`OnConflictBehavior`

###### # metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_8 "Permanent link")

`Metadata`

###### # name?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#name_3 "Permanent link")

`string`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_7 "Permanent link")

`Promise`\<`Assistant`>

The created assistant.

---

#### delete()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#delete "Permanent link")

> **delete**(`assistantId`): `Promise`\<`void`>

Defined in: [client.ts:415](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L415)

Delete an assistant.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_7 "Permanent link")

###### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_1 "Permanent link")

`string`

ID of the assistant.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_8 "Permanent link")

`Promise`\<`void`>

---

#### get()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#get "Permanent link")

> **get**(`assistantId`): `Promise`\<`Assistant`>

Defined in: [client.ts:301](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L301)

Get an assistant by ID.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_8 "Permanent link")

###### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_2 "Permanent link")

`string`

The ID of the assistant.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_9 "Permanent link")

`Promise`\<`Assistant`>

Assistant

---

#### getGraph()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#getgraph "Permanent link")

> **getGraph**(`assistantId`, `options`?): `Promise`\<`AssistantGraph`>

Defined in: [client.ts:311](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L311)

Get the JSON representation of the graph assigned to a runnable

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_9 "Permanent link")

###### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_3 "Permanent link")

`string`

The ID of the assistant.

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_1 "Permanent link")

###### # xray?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#xray "Permanent link")

`number` | `boolean`

Whether to include subgraphs in the serialized graph representation. If an integer value is provided, only subgraphs with a depth less than or equal to the value will be included.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_10 "Permanent link")

`Promise`\<`AssistantGraph`>

Serialized graph

---

#### getSchemas()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#getschemas "Permanent link")

> **getSchemas**(`assistantId`): `Promise`\<`GraphSchema`>

Defined in: [client.ts:325](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L325)

Get the state and config schema of the graph assigned to a runnable

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_10 "Permanent link")

###### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_4 "Permanent link")

`string`

The ID of the assistant.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_11 "Permanent link")

`Promise`\<`GraphSchema`>

Graph schema

---

#### getSubgraphs()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#getsubgraphs "Permanent link")

> **getSubgraphs**(`assistantId`, `options`?): `Promise`\<`Subgraphs`>

Defined in: [client.ts:336](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L336)

Get the schemas of an assistant by ID.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_11 "Permanent link")

###### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_5 "Permanent link")

`string`

The ID of the assistant to get the schema of.

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_2 "Permanent link")

Additional options for getting subgraphs, such as namespace or recursion extraction.

###### # namespace?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#namespace_5 "Permanent link")

`string`

###### # recurse?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#recurse "Permanent link")

`boolean`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_12 "Permanent link")

`Promise`\<`Subgraphs`>

The subgraphs of the assistant.

---

#### getVersions()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#getversions "Permanent link")

> **getVersions**(`assistantId`, `payload`?): `Promise`\<`AssistantVersion`[]>

Defined in: [client.ts:453](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L453)

List all versions of an assistant.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_12 "Permanent link")

###### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_6 "Permanent link")

`string`

ID of the assistant.

###### payload?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_3 "Permanent link")

###### # limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit_5 "Permanent link")

`number`

###### # metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_9 "Permanent link")

`Metadata`

###### # offset?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#offset_5 "Permanent link")

`number`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_13 "Permanent link")

`Promise`\<`AssistantVersion`[]>

List of assistant versions.

---

#### search()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#search "Permanent link")

> **search**(`query`?): `Promise`\<`Assistant`[]>

Defined in: [client.ts:426](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L426)

List assistants.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_13 "Permanent link")

###### query?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#query_1 "Permanent link")

Query options.

###### # graphId?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#graphid_1 "Permanent link")

`string`

###### # limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit_6 "Permanent link")

`number`

###### # metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_10 "Permanent link")

`Metadata`

###### # offset?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#offset_6 "Permanent link")

`number`

###### # sortBy?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#sortby "Permanent link")

`AssistantSortBy`

###### # sortOrder?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#sortorder "Permanent link")

`SortOrder`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_14 "Permanent link")

`Promise`\<`Assistant`[]>

List of assistants.

---

#### setLatest()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#setlatest "Permanent link")

> **setLatest**(`assistantId`, `version`): `Promise`\<`Assistant`>

Defined in: [client.ts:481](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L481)

Change the version of an assistant.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_14 "Permanent link")

###### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_7 "Permanent link")

`string`

ID of the assistant.

###### version[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#version_1 "Permanent link")

`number`

The version to change to.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_15 "Permanent link")

`Promise`\<`Assistant`>

The updated assistant.

---

#### update()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#update "Permanent link")

> **update**(`assistantId`, `payload`): `Promise`\<`Assistant`>

Defined in: [client.ts:388](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L388)

Update an assistant.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_15 "Permanent link")

###### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_8 "Permanent link")

`string`

ID of the assistant.

###### payload[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_4 "Permanent link")

Payload for updating the assistant.

###### # config?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#config_4 "Permanent link")

`Config`

###### # description?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#description_1 "Permanent link")

`string`

###### # graphId?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#graphid_2 "Permanent link")

`string`

###### # metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_11 "Permanent link")

`Metadata`

###### # name?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#name_4 "Permanent link")

`string`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_16 "Permanent link")

`Promise`\<`Assistant`>

The updated assistant.

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd) / Client

## Class: Client\<TStateType, TUpdateType, TCustomEventType>[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#class-clienttstatetype-tupdatetype-tcustomeventtype "Permanent link")

Defined in: [client.ts:1448](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1448)

### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_4 "Permanent link")

• **TStateType** = `DefaultValues`

• **TUpdateType** = `TStateType`

• **TCustomEventType** = `unknown`

### Constructors[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#constructors_3 "Permanent link")

#### new Client()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#new-client "Permanent link")

> **new Client**\<`TStateType`, `TUpdateType`, `TCustomEventType`>(`config`?): [`Client`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesclientmd)\<`TStateType`, `TUpdateType`, `TCustomEventType`>

Defined in: [client.ts:1484](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1484)

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_16 "Permanent link")

###### config?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#config_5 "Permanent link")

[`ClientConfig`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interfacesclientconfigmd)

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_17 "Permanent link")

[`Client`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesclientmd)\<`TStateType`, `TUpdateType`, `TCustomEventType`>

### Properties[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#properties_2 "Permanent link")

#### ~ui[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#ui "Permanent link")

> **~ui**: `UiClient`

Defined in: [client.ts:1482](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1482)

**`Internal`**

The client for interacting with the UI. Used by LoadExternalComponent and the API might change in the future.

---

#### assistants[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistants "Permanent link")

> **assistants**: [`AssistantsClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesassistantsclientmd)

Defined in: [client.ts:1456](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1456)

The client for interacting with assistants.

---

#### crons[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#crons "Permanent link")

> **crons**: [`CronsClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classescronsclientmd)

Defined in: [client.ts:1471](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1471)

The client for interacting with cron runs.

---

#### runs[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#runs "Permanent link")

> **runs**: [`RunsClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesrunsclientmd)\<`TStateType`, `TUpdateType`, `TCustomEventType`>

Defined in: [client.ts:1466](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1466)

The client for interacting with runs.

---

#### store[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#store "Permanent link")

> **store**: [`StoreClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesstoreclientmd)

Defined in: [client.ts:1476](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1476)

The client for interacting with the KV store.

---

#### threads[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threads "Permanent link")

> **threads**: [`ThreadsClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesthreadsclientmd)\<`TStateType`, `TUpdateType`>

Defined in: [client.ts:1461](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1461)

The client for interacting with threads.

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd) / CronsClient

## Class: CronsClient[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#class-cronsclient "Permanent link")

Defined in: [client.ts:197](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L197)

### Extends[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#extends_2 "Permanent link")

- `BaseClient`

### Constructors[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#constructors_4 "Permanent link")

#### new CronsClient()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#new-cronsclient "Permanent link")

> **new CronsClient**(`config`?): [`CronsClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classescronsclientmd)

Defined in: [client.ts:88](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L88)

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_17 "Permanent link")

###### config?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#config_6 "Permanent link")

[`ClientConfig`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interfacesclientconfigmd)

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_18 "Permanent link")

[`CronsClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classescronsclientmd)

##### Inherited from[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#inherited-from_8 "Permanent link")

`BaseClient.constructor`

### Methods[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#methods_3 "Permanent link")

#### create()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#create_1 "Permanent link")

> **create**(`assistantId`, `payload`?): `Promise`\<`CronCreateResponse`>

Defined in: [client.ts:238](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L238)

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_18 "Permanent link")

###### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_9 "Permanent link")

`string`

Assistant ID to use for this cron job.

###### payload?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_5 "Permanent link")

`CronsCreatePayload`

Payload for creating a cron job.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_19 "Permanent link")

`Promise`\<`CronCreateResponse`>

---

#### createForThread()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#createforthread "Permanent link")

> **createForThread**(`threadId`, `assistantId`, `payload`?): `Promise`\<`CronCreateForThreadResponse`>

Defined in: [client.ts:205](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L205)

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_19 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid "Permanent link")

`string`

The ID of the thread.

###### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_10 "Permanent link")

`string`

Assistant ID to use for this cron job.

###### payload?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_6 "Permanent link")

`CronsCreatePayload`

Payload for creating a cron job.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_20 "Permanent link")

`Promise`\<`CronCreateForThreadResponse`>

The created background run.

---

#### delete()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#delete_1 "Permanent link")

> **delete**(`cronId`): `Promise`\<`void`>

Defined in: [client.ts:265](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L265)

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_20 "Permanent link")

###### cronId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cronid "Permanent link")

`string`

Cron ID of Cron job to delete.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_21 "Permanent link")

`Promise`\<`void`>

---

#### search()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#search_1 "Permanent link")

> **search**(`query`?): `Promise`\<`Cron`[]>

Defined in: [client.ts:276](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L276)

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_21 "Permanent link")

###### query?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#query_2 "Permanent link")

Query options.

###### # assistantId?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_11 "Permanent link")

`string`

###### # limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit_7 "Permanent link")

`number`

###### # offset?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#offset_7 "Permanent link")

`number`

###### # threadId?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_1 "Permanent link")

`string`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_22 "Permanent link")

`Promise`\<`Cron`[]>

List of crons.

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd) / RunsClient

## Class: RunsClient\<TStateType, TUpdateType, TCustomEventType>[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#class-runsclienttstatetype-tupdatetype-tcustomeventtype "Permanent link")

Defined in: [client.ts:776](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L776)

### Extends[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#extends_3 "Permanent link")

- `BaseClient`

### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_5 "Permanent link")

• **TStateType** = `DefaultValues`

• **TUpdateType** = `TStateType`

• **TCustomEventType** = `unknown`

### Constructors[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#constructors_5 "Permanent link")

#### new RunsClient()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#new-runsclient "Permanent link")

> **new RunsClient**\<`TStateType`, `TUpdateType`, `TCustomEventType`>(`config`?): [`RunsClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesrunsclientmd)\<`TStateType`, `TUpdateType`, `TCustomEventType`>

Defined in: [client.ts:88](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L88)

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_22 "Permanent link")

###### config?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#config_7 "Permanent link")

[`ClientConfig`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interfacesclientconfigmd)

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_23 "Permanent link")

[`RunsClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesrunsclientmd)\<`TStateType`, `TUpdateType`, `TCustomEventType`>

##### Inherited from[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#inherited-from_9 "Permanent link")

`BaseClient.constructor`

### Methods[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#methods_4 "Permanent link")

#### cancel()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#cancel "Permanent link")

> **cancel**(`threadId`, `runId`, `wait`, `action`): `Promise`\<`void`>

Defined in: [client.ts:1063](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1063)

Cancel a run.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_23 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_2 "Permanent link")

`string`

The ID of the thread.

###### runId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#runid "Permanent link")

`string`

The ID of the run.

###### wait[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#wait "Permanent link")

`boolean` = `false`

Whether to block when canceling

###### action[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#action_1 "Permanent link")

`CancelAction` = `"interrupt"`

Action to take when cancelling the run. Possible values are `interrupt` or `rollback`. Default is `interrupt`.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_24 "Permanent link")

`Promise`\<`void`>

---

#### create()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#create_2 "Permanent link")

> **create**(`threadId`, `assistantId`, `payload`?): `Promise`\<`Run`>

Defined in: [client.ts:885](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L885)

Create a run.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_24 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_3 "Permanent link")

`string`

The ID of the thread.

###### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_12 "Permanent link")

`string`

Assistant ID to use for this run.

###### payload?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_7 "Permanent link")

`RunsCreatePayload`

Payload for creating a run.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_25 "Permanent link")

`Promise`\<`Run`>

The created run.

---

#### createBatch()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#createbatch "Permanent link")

> **createBatch**(`payloads`): `Promise`\<`Run`[]>

Defined in: [client.ts:921](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L921)

Create a batch of stateless background runs.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_25 "Permanent link")

###### payloads[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payloads "Permanent link")

`RunsCreatePayload` & `object`[]

An array of payloads for creating runs.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_26 "Permanent link")

`Promise`\<`Run`[]>

An array of created runs.

---

#### delete()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#delete_2 "Permanent link")

> **delete**(`threadId`, `runId`): `Promise`\<`void`>

Defined in: [client.ts:1157](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1157)

Delete a run.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_26 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_4 "Permanent link")

`string`

The ID of the thread.

###### runId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#runid_1 "Permanent link")

`string`

The ID of the run.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_27 "Permanent link")

`Promise`\<`void`>

---

#### get()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#get_1 "Permanent link")

> **get**(`threadId`, `runId`): `Promise`\<`Run`>

Defined in: [client.ts:1050](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1050)

Get a run by ID.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_27 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_5 "Permanent link")

`string`

The ID of the thread.

###### runId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#runid_2 "Permanent link")

`string`

The ID of the run.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_28 "Permanent link")

`Promise`\<`Run`>

The run.

---

#### join()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#join "Permanent link")

> **join**(`threadId`, `runId`, `options`?): `Promise`\<`void`>

Defined in: [client.ts:1085](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1085)

Block until a run is done.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_28 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_6 "Permanent link")

`string`

The ID of the thread.

###### runId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#runid_3 "Permanent link")

`string`

The ID of the run.

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_3 "Permanent link")

###### # signal?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#signal "Permanent link")

`AbortSignal`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_29 "Permanent link")

`Promise`\<`void`>

---

#### joinStream()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#joinstream "Permanent link")

> **joinStream**(`threadId`, `runId`, `options`?): `AsyncGenerator`\<{ `data`: `any`; `event`: `StreamEvent`; }>

Defined in: [client.ts:1111](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1111)

Stream output from a run in real-time, until the run is done. Output is not buffered, so any output produced before this call will not be received here.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_29 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_7 "Permanent link")

`string`

The ID of the thread.

###### runId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#runid_4 "Permanent link")

`string`

The ID of the run.

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_4 "Permanent link")

Additional options for controlling the stream behavior: - signal: An AbortSignal that can be used to cancel the stream request - cancelOnDisconnect: When true, automatically cancels the run if the client disconnects from the stream - streamMode: Controls what types of events to receive from the stream (can be a single mode or array of modes) Must be a subset of the stream modes passed when creating the run. Background runs default to having the union of all stream modes enabled.

`AbortSignal` | { `cancelOnDisconnect`: `boolean`; `signal`: `AbortSignal`; `streamMode`: `StreamMode` | `StreamMode`[]; }

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_30 "Permanent link")

`AsyncGenerator`\<{ `data`: `any`; `event`: `StreamEvent`; }>

An async generator yielding stream parts.

---

#### list()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#list "Permanent link")

> **list**(`threadId`, `options`?): `Promise`\<`Run`[]>

Defined in: [client.ts:1013](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1013)

List all runs for a thread.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_30 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_8 "Permanent link")

`string`

The ID of the thread.

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_5 "Permanent link")

Filtering and pagination options.

###### # limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit_8 "Permanent link")

`number`

Maximum number of runs to return. Defaults to 10

###### # offset?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#offset_8 "Permanent link")

`number`

Offset to start from. Defaults to 0.

###### # status?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#status_4 "Permanent link")

`RunStatus`

Status of the run to filter by.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_31 "Permanent link")

`Promise`\<`Run`[]>

List of runs.

---

#### stream()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#stream "Permanent link")

Create a run and stream the results.

##### Param[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#param "Permanent link")

The ID of the thread.

##### Param[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#param_1 "Permanent link")

Assistant ID to use for this run.

##### Param[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#param_2 "Permanent link")

Payload for creating a run.

##### Call Signature[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#call-signature "Permanent link")

> **stream**\<`TStreamMode`, `TSubgraphs`>(`threadId`, `assistantId`, `payload`?): `TypedAsyncGenerator`\<`TStreamMode`, `TSubgraphs`, `TStateType`, `TUpdateType`, `TCustomEventType`>

Defined in: [client.ts:781](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L781)

###### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_6 "Permanent link")

• **TStreamMode** _extends_ `StreamMode` | `StreamMode`[] = `StreamMode`

• **TSubgraphs** _extends_ `boolean` = `false`

###### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_31 "Permanent link")

###### # threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_9 "Permanent link")

`null`

###### # assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_13 "Permanent link")

`string`

###### # payload?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_8 "Permanent link")

`Omit`\<`RunsStreamPayload`\<`TStreamMode`, `TSubgraphs`>, `"multitaskStrategy"` | `"onCompletion"`>

###### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_32 "Permanent link")

`TypedAsyncGenerator`\<`TStreamMode`, `TSubgraphs`, `TStateType`, `TUpdateType`, `TCustomEventType`>

##### Call Signature[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#call-signature_1 "Permanent link")

> **stream**\<`TStreamMode`, `TSubgraphs`>(`threadId`, `assistantId`, `payload`?): `TypedAsyncGenerator`\<`TStreamMode`, `TSubgraphs`, `TStateType`, `TUpdateType`, `TCustomEventType`>

Defined in: [client.ts:799](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L799)

###### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_7 "Permanent link")

• **TStreamMode** _extends_ `StreamMode` | `StreamMode`[] = `StreamMode`

• **TSubgraphs** _extends_ `boolean` = `false`

###### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_32 "Permanent link")

###### # threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_10 "Permanent link")

`string`

###### # assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_14 "Permanent link")

`string`

###### # payload?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_9 "Permanent link")

`RunsStreamPayload`\<`TStreamMode`, `TSubgraphs`>

###### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_33 "Permanent link")

`TypedAsyncGenerator`\<`TStreamMode`, `TSubgraphs`, `TStateType`, `TUpdateType`, `TCustomEventType`>

---

#### wait()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#wait_1 "Permanent link")

Create a run and wait for it to complete.

##### Param[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#param_3 "Permanent link")

The ID of the thread.

##### Param[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#param_4 "Permanent link")

Assistant ID to use for this run.

##### Param[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#param_5 "Permanent link")

Payload for creating a run.

##### Call Signature[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#call-signature_2 "Permanent link")

> **wait**(`threadId`, `assistantId`, `payload`?): `Promise`\<`DefaultValues`>

Defined in: [client.ts:938](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L938)

###### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_33 "Permanent link")

###### # threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_11 "Permanent link")

`null`

###### # assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_15 "Permanent link")

`string`

###### # payload?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_10 "Permanent link")

`Omit`\<`RunsWaitPayload`, `"multitaskStrategy"` | `"onCompletion"`>

###### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_34 "Permanent link")

`Promise`\<`DefaultValues`>

##### Call Signature[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#call-signature_3 "Permanent link")

> **wait**(`threadId`, `assistantId`, `payload`?): `Promise`\<`DefaultValues`>

Defined in: [client.ts:944](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L944)

###### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_34 "Permanent link")

###### # threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_12 "Permanent link")

`string`

###### # assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_16 "Permanent link")

`string`

###### # payload?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_11 "Permanent link")

`RunsWaitPayload`

###### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_35 "Permanent link")

`Promise`\<`DefaultValues`>

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd) / StoreClient

## Class: StoreClient[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#class-storeclient "Permanent link")

Defined in: [client.ts:1175](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1175)

### Extends[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#extends_4 "Permanent link")

- `BaseClient`

### Constructors[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#constructors_6 "Permanent link")

#### new StoreClient()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#new-storeclient "Permanent link")

> **new StoreClient**(`config`?): [`StoreClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesstoreclientmd)

Defined in: [client.ts:88](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L88)

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_35 "Permanent link")

###### config?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#config_8 "Permanent link")

[`ClientConfig`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interfacesclientconfigmd)

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_36 "Permanent link")

[`StoreClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesstoreclientmd)

##### Inherited from[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#inherited-from_10 "Permanent link")

`BaseClient.constructor`

### Methods[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#methods_5 "Permanent link")

#### deleteItem()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#deleteitem "Permanent link")

> **deleteItem**(`namespace`, `key`): `Promise`\<`void`>

Defined in: [client.ts:1296](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1296)

Delete an item.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_36 "Permanent link")

###### namespace[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#namespace_6 "Permanent link")

`string`[]

A list of strings representing the namespace path.

###### key[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#key_3 "Permanent link")

`string`

The unique identifier for the item.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_37 "Permanent link")

`Promise`\<`void`>

Promise

---

#### getItem()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#getitem "Permanent link")

> **getItem**(`namespace`, `key`, `options`?): `Promise`\<`null` | `Item`>

Defined in: [client.ts:1252](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1252)

Retrieve a single item.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_37 "Permanent link")

###### namespace[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#namespace_7 "Permanent link")

`string`[]

A list of strings representing the namespace path.

###### key[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#key_4 "Permanent link")

`string`

The unique identifier for the item.

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_6 "Permanent link")

###### # refreshTtl?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#refreshttl "Permanent link")

`null` | `boolean`

Whether to refresh the TTL on this read operation. If null, uses the store's default behavior.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_38 "Permanent link")

`Promise`\<`null` | `Item`>

Promise

##### Example[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#example "Permanent link")

```ts
const item = await client.store.getItem(
  ["documents", "user123"],
  "item456",
  { refreshTtl: true }
);
console.log(item);
// {
//   namespace: ["documents", "user123"],
//   key: "item456",
//   value: { title: "My Document", content: "Hello World" },
//   createdAt: "2024-07-30T12:00:00Z",
//   updatedAt: "2024-07-30T12:00:00Z"
// }
```

---

#### listNamespaces()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#listnamespaces "Permanent link")

> **listNamespaces**(`options`?): `Promise`\<`ListNamespaceResponse`>

Defined in: [client.ts:1392](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1392)

List namespaces with optional match conditions.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_38 "Permanent link")

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_7 "Permanent link")

###### # limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit_9 "Permanent link")

`number`

Maximum number of namespaces to return (default is 100).

###### # maxDepth?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#maxdepth "Permanent link")

`number`

Optional integer specifying the maximum depth of namespaces to return.

###### # offset?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#offset_9 "Permanent link")

`number`

Number of namespaces to skip before returning results (default is 0).

###### # prefix?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#prefix "Permanent link")

`string`[]

Optional list of strings representing the prefix to filter namespaces.

###### # suffix?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#suffix_1 "Permanent link")

`string`[]

Optional list of strings representing the suffix to filter namespaces.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_39 "Permanent link")

`Promise`\<`ListNamespaceResponse`>

Promise

---

#### putItem()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#putitem "Permanent link")

> **putItem**(`namespace`, `key`, `value`, `options`?): `Promise`\<`void`>

Defined in: [client.ts:1196](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1196)

Store or update an item.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_39 "Permanent link")

###### namespace[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#namespace_8 "Permanent link")

`string`[]

A list of strings representing the namespace path.

###### key[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#key_5 "Permanent link")

`string`

The unique identifier for the item within the namespace.

###### value[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#value_1 "Permanent link")

`Record`\<`string`, `any`>

A dictionary containing the item's data.

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_8 "Permanent link")

###### # index?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#index "Permanent link")

`null` | `false` | `string`[]

Controls search indexing - null (use defaults), false (disable), or list of field paths to index.

###### # ttl?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#ttl "Permanent link")

`null` | `number`

Optional time-to-live in minutes for the item, or null for no expiration.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_40 "Permanent link")

`Promise`\<`void`>

Promise

##### Example[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#example_1 "Permanent link")

```ts
await client.store.putItem(
  ["documents", "user123"],
  "item456",
  { title: "My Document", content: "Hello World" },
  { ttl: 60 } // expires in 60 minutes
);
```

---

#### searchItems()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#searchitems "Permanent link")

> **searchItems**(`namespacePrefix`, `options`?): `Promise`\<`SearchItemsResponse`>

Defined in: [client.ts:1347](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L1347)

Search for items within a namespace prefix.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_40 "Permanent link")

###### namespacePrefix[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#namespaceprefix "Permanent link")

`string`[]

List of strings representing the namespace prefix.

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_9 "Permanent link")

###### # filter?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#filter_1 "Permanent link")

`Record`\<`string`, `any`>

Optional dictionary of key-value pairs to filter results.

###### # limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit_10 "Permanent link")

`number`

Maximum number of items to return (default is 10).

###### # offset?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#offset_10 "Permanent link")

`number`

Number of items to skip before returning results (default is 0).

###### # query?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#query_3 "Permanent link")

`string`

Optional search query.

###### # refreshTtl?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#refreshttl_1 "Permanent link")

`null` | `boolean`

Whether to refresh the TTL on items returned by this search. If null, uses the store's default behavior.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_41 "Permanent link")

`Promise`\<`SearchItemsResponse`>

Promise

##### Example[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#example_2 "Permanent link")

```ts
const results = await client.store.searchItems(
  ["documents"],
  {
    filter: { author: "John Doe" },
    limit: 5,
    refreshTtl: true
  }
);
console.log(results);
// {
//   items: [
//     {
//       namespace: ["documents", "user123"],
//       key: "item789",
//       value: { title: "Another Document", author: "John Doe" },
//       createdAt: "2024-07-30T12:00:00Z",
//       updatedAt: "2024-07-30T12:00:00Z"
//     },
//     // ... additional items ...
//   ]
// }
```

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd) / ThreadsClient

## Class: ThreadsClient\<TStateType, TUpdateType>[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#class-threadsclienttstatetype-tupdatetype "Permanent link")

Defined in: [client.ts:489](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L489)

### Extends[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#extends_5 "Permanent link")

- `BaseClient`

### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_8 "Permanent link")

• **TStateType** = `DefaultValues`

• **TUpdateType** = `TStateType`

### Constructors[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#constructors_7 "Permanent link")

#### new ThreadsClient()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#new-threadsclient "Permanent link")

> **new ThreadsClient**\<`TStateType`, `TUpdateType`>(`config`?): [`ThreadsClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesthreadsclientmd)\<`TStateType`, `TUpdateType`>

Defined in: [client.ts:88](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L88)

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_41 "Permanent link")

###### config?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#config_9 "Permanent link")

[`ClientConfig`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interfacesclientconfigmd)

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_42 "Permanent link")

[`ThreadsClient`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#classesthreadsclientmd)\<`TStateType`, `TUpdateType`>

##### Inherited from[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#inherited-from_11 "Permanent link")

`BaseClient.constructor`

### Methods[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#methods_6 "Permanent link")

#### copy()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#copy "Permanent link")`

> **copy**(`threadId`): `Promise`\<`Thread`\<`TStateType`>>

Defined in: [client.ts:566](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L566)

Copy an existing thread

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_42 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_13 "Permanent link")

`string`

ID of the thread to be copied

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_43 "Permanent link")

`Promise`\<`Thread`\<`TStateType`>>

Newly copied thread

---

#### create()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#create_3 "Permanent link")

> **create**(`payload`?): `Promise`\<`Thread`\<`TStateType`>>

Defined in: [client.ts:511](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L511)

Create a new thread.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_43 "Permanent link")

###### payload?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_12 "Permanent link")

Payload for creating a thread.

###### # graphId?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#graphid_3 "Permanent link")

`string`

Graph ID to associate with the thread.

###### # ifExists?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#ifexists_1 "Permanent link")

`OnConflictBehavior`

How to handle duplicate creation.

**Default**

`[](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#__codelineno-3-1)"raise"`

###### # metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_12 "Permanent link")

`Metadata`

Metadata for the thread.

###### # supersteps?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#supersteps "Permanent link")

`object`[]

Apply a list of supersteps when creating a thread, each containing a sequence of updates.

Used for copying a thread between deployments.

###### # threadId?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_14 "Permanent link")

`string`

ID of the thread to create.

If not provided, a random UUID will be generated.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_44 "Permanent link")

`Promise`\<`Thread`\<`TStateType`>>

The created thread.

---

#### delete()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#delete_3 "Permanent link")

> **delete**(`threadId`): `Promise`\<`void`>

Defined in: [client.ts:599](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L599)

Delete a thread.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_44 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_15 "Permanent link")

`string`

ID of the thread.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_45 "Permanent link")

`Promise`\<`void`>

---

#### get()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#get_2 "Permanent link")

> **get**\<`ValuesType`>(`threadId`): `Promise`\<`Thread`\<`ValuesType`>>

Defined in: [client.ts:499](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L499)

Get a thread by ID.

##### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_9 "Permanent link")

• **ValuesType** = `TStateType`

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_45 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_16 "Permanent link")

`string`

ID of the thread.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_46 "Permanent link")

`Promise`\<`Thread`\<`ValuesType`>>

The thread.

---

#### getHistory()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#gethistory "Permanent link")

> **getHistory**\<`ValuesType`>(`threadId`, `options`?): `Promise`\<`ThreadState`\<`ValuesType`>[]>

Defined in: [client.ts:752](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L752)

Get all past states for a thread.

##### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_10 "Permanent link")

• **ValuesType** = `TStateType`

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_46 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_17 "Permanent link")

`string`

ID of the thread.

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_10 "Permanent link")

Additional options.

###### # before?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#before "Permanent link")

`Config`

###### # checkpoint?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#checkpoint "Permanent link")

`Partial`\<`Omit`\<`Checkpoint`, `"thread_id"`>>

###### # limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit_11 "Permanent link")

`number`

###### # metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_13 "Permanent link")

`Metadata`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_47 "Permanent link")

`Promise`\<`ThreadState`\<`ValuesType`>[]>

List of thread states.

---

#### getState()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#getstate "Permanent link")

> **getState**\<`ValuesType`>(`threadId`, `checkpoint`?, `options`?): `Promise`\<`ThreadState`\<`ValuesType`>>

Defined in: [client.ts:659](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L659)

Get state for a thread.

##### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_11 "Permanent link")

• **ValuesType** = `TStateType`

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_47 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_18 "Permanent link")

`string`

ID of the thread.

###### checkpoint?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#checkpoint_1 "Permanent link")

`string` | `Checkpoint`

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_11 "Permanent link")

###### # subgraphs?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#subgraphs "Permanent link")

`boolean`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_48 "Permanent link")

`Promise`\<`ThreadState`\<`ValuesType`>>

Thread state.

---

#### patchState()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#patchstate "Permanent link")

> **patchState**(`threadIdOrConfig`, `metadata`): `Promise`\<`void`>

Defined in: [client.ts:722](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L722)

Patch the metadata of a thread.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_48 "Permanent link")

###### threadIdOrConfig[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadidorconfig "Permanent link")

Thread ID or config to patch the state of.

`string` | `Config`

###### metadata[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_14 "Permanent link")

`Metadata`

Metadata to patch the state with.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_49 "Permanent link")

`Promise`\<`void`>

---

#### search()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#search_2 "Permanent link")

> **search**\<`ValuesType`>(`query`?): `Promise`\<`Thread`\<`ValuesType`>[]>

Defined in: [client.ts:611](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L611)

List threads

##### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_12 "Permanent link")

• **ValuesType** = `TStateType`

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_49 "Permanent link")

###### query?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#query_4 "Permanent link")

Query options

###### # limit?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#limit_12 "Permanent link")

`number`

Maximum number of threads to return. Defaults to 10

###### # metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_15 "Permanent link")

`Metadata`

Metadata to filter threads by.

###### # offset?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#offset_11 "Permanent link")

`number`

Offset to start from.

###### # sortBy?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#sortby_1 "Permanent link")

`ThreadSortBy`

Sort by.

###### # sortOrder?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#sortorder_1 "Permanent link")

`SortOrder`

Sort order. Must be one of 'asc' or 'desc'.

###### # status?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#status_5 "Permanent link")

`ThreadStatus`

Thread status to filter on. Must be one of 'idle', 'busy', 'interrupted' or 'error'.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_50 "Permanent link")

`Promise`\<`Thread`\<`ValuesType`>[]>

List of threads

---

#### update()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#update_1 "Permanent link")

> **update**(`threadId`, `payload`?): `Promise`\<`Thread`\<`DefaultValues`>>

Defined in: [client.ts:579](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L579)

Update a thread.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_50 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_19 "Permanent link")

`string`

ID of the thread.

###### payload?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#payload_13 "Permanent link")

Payload for updating the thread.

###### # metadata?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_16 "Permanent link")

`Metadata`

Metadata for the thread.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_51 "Permanent link")

`Promise`\<`Thread`\<`DefaultValues`>>

The updated thread.

---

#### updateState()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#updatestate "Permanent link")

> **updateState**\<`ValuesType`>(`threadId`, `options`): `Promise`\<`Pick`\<`Config`, `"configurable"`>>

Defined in: [client.ts:693](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L693)

Add state to a thread.

##### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_13 "Permanent link")

• **ValuesType** = `TUpdateType`

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_51 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_20 "Permanent link")

`string`

The ID of the thread.

###### options[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_12 "Permanent link")

###### # asNode?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#asnode "Permanent link")

`string`

###### # checkpoint?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#checkpoint_2 "Permanent link")

`Checkpoint`

###### # checkpointId?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#checkpointid "Permanent link")

`string`

###### # values[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#values_1 "Permanent link")

`ValuesType`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_52 "Permanent link")

`Promise`\<`Pick`\<`Config`, `"configurable"`>>

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd) / getApiKey

## Function: getApiKey()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#function-getapikey "Permanent link")

> **getApiKey**(`apiKey`?): `undefined` | `string`

Defined in: [client.ts:53](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L53)

Get the API key from the environment. Precedence: 1. explicit argument 2. LANGGRAPH_API_KEY 3. LANGSMITH_API_KEY 4. LANGCHAIN_API_KEY

### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_52 "Permanent link")

#### apiKey?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#apikey "Permanent link")

`string`

Optional API key provided as an argument

### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_53 "Permanent link")

`undefined` | `string`

The API key if found, otherwise undefined

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#readmemd) / ClientConfig

## Interface: ClientConfig[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interface-clientconfig "Permanent link")

Defined in: [client.ts:71](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L71)

### Properties[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#properties_3 "Permanent link")

#### apiKey?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#apikey_1 "Permanent link")

> `optional` **apiKey**: `string`

Defined in: [client.ts:73](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L73)

---

#### apiUrl?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#apiurl "Permanent link")

> `optional` **apiUrl**: `string`

Defined in: [client.ts:72](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L72)

---

#### callerOptions?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#calleroptions "Permanent link")

> `optional` **callerOptions**: `AsyncCallerParams`

Defined in: [client.ts:74](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L74)

---

#### defaultHeaders?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#defaultheaders "Permanent link")

> `optional` **defaultHeaders**: `Record`\<`string`, `undefined` | `null` | `string`>

Defined in: [client.ts:76](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L76)

---

#### timeoutMs?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#timeoutms "Permanent link")

> `optional` **timeoutMs**: `number`

Defined in: [client.ts:75](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/client.ts#L75)

**[langchain/langgraph-sdk](https://github.com/langchain/langgraph-sdk "GitHub Repository: langchain/langgraph-sdk")**

---

## [langchain/langgraph-sdk](https://github.com/langchain/langgraph-sdk "GitHub Repository: langchain/langgraph-sdk")/react[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#langchainlanggraph-sdkreact "Permanent link")

### Interfaces[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interfaces_2 "Permanent link")

- [UseStream](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactinterfacesusestreammd)
- [UseStreamOptions](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactinterfacesusestreamoptionsmd)

### Type Aliases[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-aliases_1 "Permanent link")

- [MessageMetadata](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reacttype-aliasesmessagemetadatamd)

### Functions[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#functions_1 "Permanent link")

- [useStream](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactfunctionsusestreammd)

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactreadmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactreadmemd) / useStream

## Function: useStream()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#function-usestream "Permanent link")

> **useStream**\<`StateType`, `Bag`>(`options`): [`UseStream`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactinterfacesusestreammd)\<`StateType`, `Bag`>

Defined in: [react/stream.tsx:618](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L618)

### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_14 "Permanent link")

• **StateType** _extends_ `Record`\<`string`, `unknown`> = `Record`\<`string`, `unknown`>

• **Bag** _extends_ `object` = `BagTemplate`

### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_53 "Permanent link")

#### options[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_13 "Permanent link")

[`UseStreamOptions`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactinterfacesusestreamoptionsmd)\<`StateType`, `Bag`>

### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_54 "Permanent link")

[`UseStream`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactinterfacesusestreammd)\<`StateType`, `Bag`>

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactreadmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactreadmemd) / UseStream

## Interface: UseStream\<StateType, Bag>[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interface-usestreamstatetype-bag "Permanent link")

Defined in: [react/stream.tsx:507](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L507)

### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_15 "Permanent link")

• **StateType** _extends_ `Record`\<`string`, `unknown`> = `Record`\<`string`, `unknown`>

• **Bag** _extends_ `BagTemplate` = `BagTemplate`

### Properties[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#properties_4 "Permanent link")

#### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_17 "Permanent link")

> **assistantId**: `string`

Defined in: [react/stream.tsx:592](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L592)

The ID of the assistant to use.

---

#### branch[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#branch "Permanent link")

> **branch**: `string`

Defined in: [react/stream.tsx:542](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L542)

The current branch of the thread.

---

#### client[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#client "Permanent link")

> **client**: `Client`

Defined in: [react/stream.tsx:587](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L587)

LangGraph SDK client used to send request and receive responses.

---

#### error[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#error "Permanent link")

> **error**: `unknown`

Defined in: [react/stream.tsx:519](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L519)

Last seen error from the thread or during streaming.

---

#### experimental_branchTree[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#experimental_branchtree "Permanent link")

> **experimental_branchTree**: `Sequence`\<`StateType`>

Defined in: [react/stream.tsx:558](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L558)

**`Experimental`**

Tree of all branches for the thread.

---

#### getMessagesMetadata()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#getmessagesmetadata "Permanent link")

> **getMessagesMetadata**: (`message`, `index`?) => `undefined` | [`MessageMetadata`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reacttype-aliasesmessagemetadatamd)\<`StateType`>

Defined in: [react/stream.tsx:579](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L579)

Get the metadata for a message, such as first thread state the message was seen in and branch information.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_54 "Permanent link")

###### message[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#message_2 "Permanent link")

`Message`

The message to get the metadata for.

###### index?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#index_1 "Permanent link")

`number`

The index of the message in the thread.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_55 "Permanent link")

`undefined` | [`MessageMetadata`](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reacttype-aliasesmessagemetadatamd)\<`StateType`>

The metadata for the message.

---

#### history[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#history "Permanent link")

> **history**: `ThreadState`\<`StateType`>[]

Defined in: [react/stream.tsx:552](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L552)

Flattened history of thread states of a thread.

---

#### interrupt[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interrupt "Permanent link")

> **interrupt**: `undefined` | `Interrupt`\<`GetInterruptType`\<`Bag`>>

Defined in: [react/stream.tsx:563](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L563)

Get the interrupt value for the stream if interrupted.

---

#### isLoading[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#isloading "Permanent link")

> **isLoading**: `boolean`

Defined in: [react/stream.tsx:524](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L524)

Whether the stream is currently running.

---

#### messages[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#messages "Permanent link")

> **messages**: `Message`[]

Defined in: [react/stream.tsx:569](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L569)

Messages inferred from the thread. Will automatically update with incoming message chunks.

---

#### setBranch()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#setbranch "Permanent link")

> **setBranch**: (`branch`) => `void`

Defined in: [react/stream.tsx:547](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L547)

Set the branch of the thread.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_55 "Permanent link")

###### branch[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#branch_1 "Permanent link")

`string`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_56 "Permanent link")

`void`

---

#### stop()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#stop "Permanent link")

> **stop**: () => `void`

Defined in: [react/stream.tsx:529](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L529)

Stops the stream.

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_57 "Permanent link")

`void`

---

#### submit()[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#submit "Permanent link")

> **submit**: (`values`, `options`?) => `void`

Defined in: [react/stream.tsx:534](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L534)

Create and stream a run to the thread.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_56 "Permanent link")

###### values[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#values_2 "Permanent link")

`undefined` | `null` | `GetUpdateType`\<`Bag`, `StateType`>

###### options?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_14 "Permanent link")

`SubmitOptions`\<`StateType`, `GetConfigurableType`\<`Bag`>>

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_58 "Permanent link")

`void`

---

#### values[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#values_3 "Permanent link")

> **values**: `StateType`

Defined in: [react/stream.tsx:514](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L514)

The current values of the thread.

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactreadmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactreadmemd) / UseStreamOptions

## Interface: UseStreamOptions\<StateType, Bag>[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#interface-usestreamoptionsstatetype-bag "Permanent link")

Defined in: [react/stream.tsx:408](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L408)

### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_16 "Permanent link")

• **StateType** _extends_ `Record`\<`string`, `unknown`> = `Record`\<`string`, `unknown`>

• **Bag** _extends_ `BagTemplate` = `BagTemplate`

### Properties[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#properties_5 "Permanent link")

#### apiKey?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#apikey_2 "Permanent link")

> `optional` **apiKey**: `string`

Defined in: [react/stream.tsx:430](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L430)

The API key to use.

---

#### apiUrl?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#apiurl_1 "Permanent link")

> `optional` **apiUrl**: `string`

Defined in: [react/stream.tsx:425](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L425)

The URL of the API to use.

---

#### assistantId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#assistantid_18 "Permanent link")

> **assistantId**: `string`

Defined in: [react/stream.tsx:415](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L415)

The ID of the assistant to use.

---

#### callerOptions?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#calleroptions_1 "Permanent link")

> `optional` **callerOptions**: `AsyncCallerParams`

Defined in: [react/stream.tsx:435](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L435)

Custom call options, such as custom fetch implementation.

---

#### client?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#client_1 "Permanent link")

> `optional` **client**: `Client`\<`DefaultValues`, `DefaultValues`, `unknown`>

Defined in: [react/stream.tsx:420](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L420)

Client used to send requests.

---

#### defaultHeaders?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#defaultheaders_1 "Permanent link")

> `optional` **defaultHeaders**: `Record`\<`string`, `undefined` | `null` | `string`>

Defined in: [react/stream.tsx:440](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L440)

Default headers to send with requests.

---

#### messagesKey?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#messageskey "Permanent link")

> `optional` **messagesKey**: `string`

Defined in: [react/stream.tsx:448](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L448)

Specify the key within the state that contains messages. Defaults to "messages".

##### Default[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#default "Permanent link")

`[](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#__codelineno-4-1)"messages"`

---

#### onCustomEvent()?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#oncustomevent "Permanent link")

> `optional` **onCustomEvent**: (`data`, `options`) => `void`

Defined in: [react/stream.tsx:470](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L470)

Callback that is called when a custom event is received.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_57 "Permanent link")

###### data[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#data "Permanent link")

`GetCustomEventType`\<`Bag`>

###### options[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#options_15 "Permanent link")

###### # mutate[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#mutate "Permanent link")

(`update`) => `void`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_59 "Permanent link")

`void`

---

#### onDebugEvent()?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#ondebugevent "Permanent link")

> `optional` **onDebugEvent**: (`data`) => `void`

Defined in: [react/stream.tsx:494](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L494)

**`Internal`**

Callback that is called when a debug event is received. This API is experimental and subject to change.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_58 "Permanent link")

###### data[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#data_1 "Permanent link")

`unknown`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_60 "Permanent link")

`void`

---

#### onError()?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#onerror "Permanent link")

> `optional` **onError**: (`error`) => `void`

Defined in: [react/stream.tsx:453](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L453)

Callback that is called when an error occurs.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_59 "Permanent link")

###### error[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#error_1 "Permanent link")

`unknown`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_61 "Permanent link")

`void`

---

#### onFinish()?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#onfinish "Permanent link")

> `optional` **onFinish**: (`state`) => `void`

Defined in: [react/stream.tsx:458](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L458)

Callback that is called when the stream is finished.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_60 "Permanent link")

###### state[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#state "Permanent link")

`ThreadState`\<`StateType`>

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_62 "Permanent link")

`void`

---

#### onLangChainEvent()?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#onlangchainevent "Permanent link")

> `optional` **onLangChainEvent**: (`data`) => `void`

Defined in: [react/stream.tsx:488](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L488)

Callback that is called when a LangChain event is received.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_61 "Permanent link")

###### data[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#data_2 "Permanent link")

###### # data[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#data_3 "Permanent link")

`unknown`

###### # event[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#event_1 "Permanent link")

`string` & `object` | `"on_tool_start"` | `"on_tool_stream"` | `"on_tool_end"` | `"on_chat_model_start"` | `"on_chat_model_stream"` | `"on_chat_model_end"` | `"on_llm_start"` | `"on_llm_stream"` | `"on_llm_end"` | `"on_chain_start"` | `"on_chain_stream"` | `"on_chain_end"` | `"on_retriever_start"` | `"on_retriever_stream"` | `"on_retriever_end"` | `"on_prompt_start"` | `"on_prompt_stream"` | `"on_prompt_end"`

###### # metadata[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#metadata_17 "Permanent link")

`Record`\<`string`, `unknown`>

###### # name[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#name_5 "Permanent link")

`string`

###### # parent_ids[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parent_ids "Permanent link")

`string`[]

###### # run_id[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#run_id_2 "Permanent link")

`string`

###### # tags[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#tags "Permanent link")

`string`[]

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_63 "Permanent link")

`void`

##### See[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#see_1 "Permanent link")

[https://langchain-ai.github.io/langgraph/cloud/how-tos/stream_events/#stream-graph-in-events-mode](https://langchain-ai.github.io/langgraph/cloud/how-tos/stream_events/#stream-graph-in-events-mode) for more details.

---

#### onMetadataEvent()?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#onmetadataevent "Permanent link")

> `optional` **onMetadataEvent**: (`data`) => `void`

Defined in: [react/stream.tsx:482](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L482)

Callback that is called when a metadata event is received.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_62 "Permanent link")

###### data[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#data_4 "Permanent link")

###### # run_id[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#run_id_3 "Permanent link")

`string`

###### # thread_id[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#thread_id_8 "Permanent link")

`string`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_64 "Permanent link")

`void`

---

#### onThreadId()?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#onthreadid "Permanent link")

> `optional` **onThreadId**: (`threadId`) => `void`

Defined in: [react/stream.tsx:504](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L504)

Callback that is called when the thread ID is updated (ie when a new thread is created).

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_63 "Permanent link")

###### threadId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_21 "Permanent link")

`string`

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_65 "Permanent link")

`void`

---

#### onUpdateEvent()?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#onupdateevent "Permanent link")

> `optional` **onUpdateEvent**: (`data`) => `void`

Defined in: [react/stream.tsx:463](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L463)

Callback that is called when an update event is received.

##### Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#parameters_64 "Permanent link")

###### data[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#data_5 "Permanent link")

##### Returns[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#returns_66 "Permanent link")

`void`

---

#### threadId?[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#threadid_22 "Permanent link")

> `optional` **threadId**: `null` | `string`

Defined in: [react/stream.tsx:499](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L499)

The ID of the thread to fetch history and current values from.

[**@langchain/langgraph-sdk**](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactreadmemd)

---

[@langchain/langgraph-sdk](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#reactreadmemd) / MessageMetadata

## Type Alias: MessageMetadata\<StateType>[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-alias-messagemetadatastatetype "Permanent link")

> **MessageMetadata**\<`StateType`>: `object`

Defined in: [react/stream.tsx:169](https://github.com/langchain-ai/langgraph/blob/1acad37beee3b2509cbf0f07d66377176b8eafe2/libs/sdk-js/src/react/stream.tsx#L169)

### Type Parameters[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-parameters_17 "Permanent link")

• **StateType** _extends_ `Record`\<`string`, `unknown`>

### Type declaration[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#type-declaration "Permanent link")

#### branch[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#branch_2 "Permanent link")

> **branch**: `string` | `undefined`

The branch of the message.

#### branchOptions[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#branchoptions "Permanent link")

> **branchOptions**: `string`[] | `undefined`

The list of branches this message is part of. This is useful for displaying branching controls.

#### firstSeenState[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#firstseenstate "Permanent link")

> **firstSeenState**: `ThreadState`\<`StateType`> | `undefined`

The first thread state the message was seen in.

#### messageId[¶](https://langchain-ai.github.io/langgraph/cloud/reference/sdk/js_ts_sdk_ref/#messageid "Permanent link")

> **messageId**: `string`

The ID of the message used.

