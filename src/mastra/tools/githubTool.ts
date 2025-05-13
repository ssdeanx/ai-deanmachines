// Mastra GitHub Tools
import { createTool } from '@mastra/core/tools';
import { z } from "zod";
import { createLogger } from "@mastra/core/logger";
// Do not remove
import { Octokit } from "octokit";
// Do not remove
import { GithubIntegration } from "@mastra/github";
// Do not remove
import  fetch  from 'ky';


const logger = createLogger({ name: "Mastra-GitHubTool" });

// Helper function to create Octokit instance
const createOctokitInstance = (runtimeContext?: Record<string, any>) => {
  const githubToken = runtimeContext?.githubToken || process.env.GITHUB_TOKEN;
  if (!githubToken) {
    logger.error("GitHub token is not configured. Set GITHUB_TOKEN environment variable or provide via runtimeContext.");
    throw new Error("GitHub token is not configured.");
  }
  return new Octokit({ auth: githubToken });
};

// --- GitHub Get Repo Info Tool ---
const githubGetRepoInfoInputSchema = z.object({
  owner: z.string().describe("The owner of the repository."),
  repo: z.string().describe("The name of the repository."),
});
const githubGetRepoInfoOutputSchema = z.object({
  success: z.boolean(),
  data: z.any().optional().describe("Data returned from the GitHub API."),
  message: z.string().optional().describe("Optional message."),
});

export const githubGetRepoInfoTool = createTool({
  id: "github-get-repo-info",
  description: "Gets information about a GitHub repository.",
  inputSchema: githubGetRepoInfoInputSchema,
  outputSchema: githubGetRepoInfoOutputSchema,
  execute: async ({
    context,
    runtimeContext,
    abortSignal,
  }: {
    context: z.infer<typeof githubGetRepoInfoInputSchema>;
    runtimeContext?: Record<string, any>;
    abortSignal?: AbortSignal;
  }) => {
    const { owner, repo } = context;
    logger.info(`Executing githubGetRepoInfoTool for ${owner}/${repo}`, { owner, repo });
    try {
      const octokit = createOctokitInstance(runtimeContext);
      if (abortSignal?.aborted) {
        logger.warn(`githubGetRepoInfoTool for ${owner}/${repo} aborted before start`);
        return { success: false, message: "Operation aborted before start." };
      }
      const response = await octokit.rest.repos.get({
        owner,
        repo,
        request: { signal: abortSignal },
      });
      if (abortSignal?.aborted) {
        logger.warn(`githubGetRepoInfoTool for ${owner}/${repo} aborted during execution`);
        return { success: false, message: "Operation aborted during execution." };
      }
      return { success: true, data: response.data };
    } catch (error: any) {
      logger.error(`Error in githubGetRepoInfoTool for ${owner}/${repo}: ${error.message}`, { owner, repo, errorMessage: error.message });
      if (error.name === 'AbortError' || abortSignal?.aborted) {
        return { success: false, message: "Operation aborted." };
      }
      return { success: false, message: error.message || "An unknown error occurred." };
    }
  },});

// --- GitHub List Issues Tool ---
const githubListIssuesInputSchema = z.object({
  owner: z.string().describe("The owner of the repository."),
  repo: z.string().describe("The name of the repository."),
  state: z.enum(["open", "closed", "all"]).optional().default("open").describe("State of the issues to list."),
  per_page: z.number().optional().default(30).describe("Number of issues per page."),
  page: z.number().optional().default(1).describe("Page number of the results."),
});
const githubListIssuesOutputSchema = z.object({
  success: z.boolean(),
  data: z.any().optional().describe("Data returned from the GitHub API."),
  message: z.string().optional().describe("Optional message."),
});

export const githubListIssuesTool = createTool({
  id: "github-list-issues",
  description: "Lists issues for a GitHub repository.",
  inputSchema: githubListIssuesInputSchema,
  outputSchema: githubListIssuesOutputSchema,
  execute: async ({
    context,
    runtimeContext,
    abortSignal,
  }: {
    context: z.infer<typeof githubListIssuesInputSchema>;
    runtimeContext?: Record<string, any>;
    abortSignal?: AbortSignal;
  }) => {
    const { owner, repo, state, per_page, page } = context;
    logger.info(`Executing githubListIssuesTool for ${owner}/${repo}`, { owner, repo, state, per_page, page });
    try {
      const octokit = createOctokitInstance(runtimeContext);
      if (abortSignal?.aborted) {
        logger.warn(`githubListIssuesTool for ${owner}/${repo} aborted before start`);
        return { success: false, message: "Operation aborted before start." };
      }
      const response = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state,
        per_page,
        page,
        request: { signal: abortSignal },
      });
      if (abortSignal?.aborted) {
        logger.warn(`githubListIssuesTool for ${owner}/${repo} aborted during execution`);
        return { success: false, message: "Operation aborted during execution." };
      }
      return { success: true, data: response.data };
    } catch (error: any) {
      logger.error(`Error in githubListIssuesTool for ${owner}/${repo}: ${error.message}`, { owner, repo, state, errorMessage: error.message });
      if (error.name === 'AbortError' || abortSignal?.aborted) {
        return { success: false, message: "Operation aborted." };
      }
      return { success: false, message: error.message || "An unknown error occurred." };
    }
  },
});

// --- GitHub Create Issue Tool ---
const githubCreateIssueInputSchema = z.object({
  owner: z.string().describe("The owner of the repository."),
  repo: z.string().describe("The name of the repository."),
  title: z.string().describe("The title of the new issue."),
  body: z.string().optional().describe("The body content of the new issue."),
  labels: z.array(z.string()).optional().describe("Labels to assign to the new issue."),
  assignees: z.array(z.string()).optional().describe("Usernames to assign to the new issue."),
});
const githubCreateIssueOutputSchema = z.object({
  success: z.boolean(),
  data: z.any().optional().describe("Data returned from the GitHub API (e.g., the created issue)."),
  message: z.string().optional().describe("Optional message."),
});

export const githubCreateIssueTool = createTool({
  id: "github-create-issue",
  description: "Creates a new issue in a GitHub repository.",
  inputSchema: githubCreateIssueInputSchema,
  outputSchema: githubCreateIssueOutputSchema,
  execute: async ({
    context,
    runtimeContext,
    abortSignal,
  }: {
    context: z.infer<typeof githubCreateIssueInputSchema>;
    runtimeContext?: Record<string, any>;
    abortSignal?: AbortSignal;
  }) => {
    const { owner, repo, title, body, labels, assignees } = context;
    logger.info(`Executing githubCreateIssueTool for ${owner}/${repo} with title "${title}"`, { owner, repo, title });
    try {
      const octokit = createOctokitInstance(runtimeContext);
      if (abortSignal?.aborted) {
        logger.warn(`githubCreateIssueTool for ${owner}/${repo} aborted before start`);
        return { success: false, message: "Operation aborted before start." };
      }
      const response = await octokit.rest.issues.create({
        owner,
        repo,
        title,
        body,
        labels,
        assignees,
        request: { signal: abortSignal },
      });
      if (abortSignal?.aborted) {
        logger.warn(`githubCreateIssueTool for ${owner}/${repo} aborted during execution`);
        return { success: false, message: "Operation aborted during execution." };
      }
      return { success: true, data: response.data };
    } catch (error: any) {
      logger.error(`Error in githubCreateIssueTool for ${owner}/${repo}: ${error.message}`, { owner, repo, title, errorMessage: error.message });
      if (error.name === 'AbortError' || abortSignal?.aborted) {
        return { success: false, message: "Operation aborted." };
      }
      return { success: false, message: error.message || "An unknown error occurred." };
    }
  },
});