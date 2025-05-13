import { createTool, ToolExecutionContext } from '@mastra/core/tools';
import { Sandbox } from '@e2b/code-interpreter';
// keep this or import as type you cant run this without it
import  RuntimeContext  from '@e2b/code-interpreter';
import { createLogger } from '@mastra/core/logger';
import { z } from 'zod';
import { ToolExecutionOptions } from 'ai';

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

export const codeInterpreterTool = createTool({
  name: 'codeInterpreterTool',
  description: 'Executes Python code in a sandboxed environment and returns the output.',
  inputSchema: codeInterpreterToolInputSchema as any,
  outputSchema: codeInterpreterToolOutputSchema as any,
  configSchema: codeInterpreterToolConfigSchema,
  async execute(context: ToolExecutionContext<typeof codeInterpreterToolInputSchema>, options?: ToolExecutionOptions): Promise<z.infer<typeof codeInterpreterToolOutputSchema>> {
    const { input, config, runtime } = context as any;
    const { logger, toolCallId, abortSignal } = runtime;

    logger.info(`[${toolCallId}] Executing Code Interpreter Tool`, { code: input.code.substring(0, 100) + (input.code.length > 100 ? '...' : '') });

    let sandbox: Sandbox | undefined;
    try {
      if (config?.e2bApiKey) {
        logger.debug(`[${toolCallId}] Using e2bApiKey from tool config.`);
      }
      
      sandbox = await Sandbox.create({
        apiKey: config?.e2bApiKey || process.env.E2B_API_KEY,
        template: 'base',
        onStdout: (data: any) => logger.debug(`[${toolCallId}] Sandbox stdout: ${data}`),
        onStderr: (data: any) => logger.debug(`[${toolCallId}] Sandbox stderr: ${data}`),
      });

      if (abortSignal?.aborted) {
        logger.info(`[${toolCallId}] Execution aborted before starting sandbox operation.`);
        return {
            stdout: '',
            stderr: '',
            error: { name: 'AbortError', message: 'Execution aborted by signal', stacktrace: '' },
            result: null,
        } as z.infer<typeof codeInterpreterToolOutputSchema>;
      }

      const execution = await sandbox.notebook.execCell(input.code, {
        timeout: input.timeout,
      });

      if (abortSignal?.aborted) {
        logger.info(`[${toolCallId}] Execution aborted during sandbox operation.`);
        if (sandbox) {
            await sandbox.close().catch((closeError: any) => logger.error(`[${toolCallId}] Error closing sandbox on abort`, { closeError }));
        }
        return {
            stdout: execution.logs.stdout.join('\n'),
            stderr: execution.logs.stderr.join('\n'),
            error: { name: 'AbortError', message: 'Execution aborted by signal', stacktrace: '' },
            result: null,
        } as z.infer<typeof codeInterpreterToolOutputSchema>;
      }

      await sandbox.close();

      if (execution.error) {
        logger.error(`[${toolCallId}] Code execution error in sandbox`, { errorName: execution.error.name, errorMessage: execution.error.message });
        return {
          stdout: execution.logs.stdout.join('\n'),
          stderr: execution.logs.stderr.join('\n'),
          error: {
            name: execution.error.name,
            message: execution.error.message,
            stacktrace: execution.error.traceback.join('\n'),
          },
          result: null,
        } as z.infer<typeof codeInterpreterToolOutputSchema>;
      }

      logger.info(`[${toolCallId}] Code execution successful`);
      return {
        stdout: execution.logs.stdout.join('\n'),
        stderr: execution.logs.stderr.join('\n'),
        result: execution.output,
        error: null,
      } as z.infer<typeof codeInterpreterToolOutputSchema>;

    } catch (error: any) {
      logger.error(`[${toolCallId}] Failed to execute code interpreter tool`, { errorName: error.name, errorMessage: error.message });
      if (sandbox) {
        await sandbox.close().catch((closeError: any) => logger.error(`[${toolCallId}] Error closing sandbox in catch block`, { closeError }));
      }
      return {
        stdout: '',
        stderr: '',
        error: {
          name: error.name || 'ToolExecutionError',
          message: error.message || 'An unexpected error occurred.',
          stacktrace: error.stack || '',
        },
        result: null,
      } as z.infer<typeof codeInterpreterToolOutputSchema>;
    }
  },});