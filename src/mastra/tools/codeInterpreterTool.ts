import { createTool, ToolExecutionContext as MastraToolExecutionContext } from '@mastra/core';
import { Sandbox } from '@e2b/code-interpreter';
import { createLogger, MastraLogger } from '@mastra/loggers';
import { z } from 'zod';

const codeInterpreterToolInputSchema = z.object({
  code: z.string().describe('The Python code to execute.'),
  timeout: z.number().optional().default(30000).describe('Optional execution timeout in milliseconds. Defaults to 30 seconds.'),
});

const codeInterpreterToolConfigSchema = z.object({
  e2bApiKey: z.string().optional().describe('Optional E2B API key. If not provided, it will use the E2B_API_KEY environment variable.'),
}).optional();

const codeInterpreterToolOutputSchema = z.object({
  stdout: z.string().describe("The standard output from the code execution."),
  stderr: z.string().describe("The standard error output from the code execution."),
  error: z.object({
    name: z.string().describe("The name of the error, if an error occurred."),
    message: z.string().describe("The error message, if an error occurred."),
    stacktrace: z.string().describe("The stacktrace of the error, if an error occurred."),
  }).nullable().describe("Details of the execution error, if any. Null if execution was successful."),
  result: z.any().optional().describe("The result of the execution, if any. This could be the output of the last expression in the code."),
});

// Create a logger instance for the CodeInterpreterTool
const toolLogger = createLogger({
  name: 'Mastra-CodeInterpreterTool',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
});

export const codeInterpreterTool = createTool({
  name: 'codeInterpreterTool',
  description: 'Executes Python code in a sandboxed environment and returns the output.',
  inputSchema: codeInterpreterToolInputSchema,
  outputSchema: codeInterpreterToolOutputSchema,
  configSchema: codeInterpreterToolConfigSchema,
  async execute(
    executionContext: MastraToolExecutionContext<typeof codeInterpreterToolInputSchema, typeof codeInterpreterToolConfigSchema>,
    executeOptions?: { abortSignal?: AbortSignal; runtime?: { logger?: MastraLogger; toolCallId?: string; [key: string]: any } }
  ): Promise<z.infer<typeof codeInterpreterToolOutputSchema>> {
    const { context: toolContext } = executionContext; 
    const { code, timeout } = toolContext.input;
    const config = toolContext.config;

    const currentLogger = executeOptions?.runtime?.logger || toolLogger;
    const toolCallId = executeOptions?.runtime?.toolCallId || 'code-interpreter-execution';
    const abortSignal = executeOptions?.abortSignal;

    currentLogger.info(`[${toolCallId}] Executing Code Interpreter Tool`, { code: code.substring(0, 100) + (code.length > 100 ? '...' : '') });

    let sandbox: Sandbox | undefined;
    try {
      const apiKey = config?.e2bApiKey || process.env.E2B_API_KEY;
      if (!apiKey) {
        currentLogger.error(`[${toolCallId}] E2B API key is missing. Provide it in tool config or E2B_API_KEY env var.`);
        return {
          stdout: '',
          stderr: 'E2B API Key is missing',
          error: { name: 'ConfigurationError', message: 'E2B API key is missing.', stacktrace: '' },
          result: null,
        };
      }
      
      currentLogger.debug(`[${toolCallId}] Creating E2B Sandbox.`);
      sandbox = await Sandbox.create({
        apiKey: apiKey,
        template: 'base',
      });

      if (abortSignal?.aborted) {
        currentLogger.info(`[${toolCallId}] Execution aborted before starting sandbox operation.`);
        return {
            stdout: '',
            stderr: '',
            error: { name: 'AbortError', message: 'Execution aborted by signal', stacktrace: '' },
            result: null,
        };
      }

      currentLogger.debug(`[${toolCallId}] Executing code in sandbox cell with timeout: ${timeout}ms.`);
      const execution = await sandbox.notebook.execCell(code, {
        timeout,
      });

      if (abortSignal?.aborted) {
        currentLogger.info(`[${toolCallId}] Execution aborted during sandbox operation.`);
        return {
            stdout: execution.logs.stdout.join('\n'),
            stderr: execution.logs.stderr.join('\n'),
            error: { name: 'AbortError', message: 'Execution aborted by signal', stacktrace: '' },
            result: null,
        };
      }

      if (execution.error) {
        currentLogger.error(`[${toolCallId}] Code execution error in sandbox`, { errorName: execution.error.name, errorMessage: execution.error.message });
        return {
          stdout: execution.logs.stdout.join('\n'),
          stderr: execution.logs.stderr.join('\n'),
          error: {
            name: execution.error.name,
            message: execution.error.message,
            stacktrace: execution.error.traceback.join('\n'),
          },
          result: null,
        };
      }

      currentLogger.info(`[${toolCallId}] Code execution successful`);
      return {
        stdout: execution.logs.stdout.join('\n'),
        stderr: execution.logs.stderr.join('\n'),
        result: execution.output,
        error: null,
      };

    } catch (error: any) {
      currentLogger.error(`[${toolCallId}] Failed to execute code interpreter tool`, { errorName: error.name, errorMessage: error.message, stack: error.stack });
      return {
        stdout: '',
        stderr: error.message || 'An unexpected error occurred during tool execution.',
        error: {
          name: error.name || 'ToolExecutionError',
          message: error.message || 'An unexpected error occurred.',
          stacktrace: error.stack || '',
        },
        result: null,
      };
    } finally {
      if (sandbox) {
        currentLogger.debug(`[${toolCallId}] Closing E2B Sandbox.`);
        await sandbox.close().catch((closeError: any) => 
          currentLogger.error(`[${toolCallId}] Error closing sandbox: ${closeError.message}`, { error: closeError })
        );
      }
    }
  },
});