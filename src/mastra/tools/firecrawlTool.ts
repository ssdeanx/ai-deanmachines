// Mastra Firecrawl Tool
import { createTool } from "@mastra/core/tools"; 
import { z } from 'zod';
import { createLogger } from '@mastra/core/logger';
import { FirecrawlApp, type CrawlOptions as FirecrawlSdkCrawlOptions, type ScrapeOptions as FirecrawlSdkScrapeOptions } from '@firecrawl/sdk'; // Standard Firecrawl SDK import
import type { AbortSignal } from 'node-abort-controller'; // Or global if available

const logger = createLogger({ name: "Mastra-FirecrawlTool" });

const firecrawlToolInputSchema = z.object({
  operation: z.enum(['scrape', 'crawl']).describe("Operation to perform: 'scrape' a single URL or 'crawl' a website."),
  url: z.string().url().describe("URL of the web page to scrape or start crawling from."),
  params: z.object({
    crawlerOptions: z.object({
      excludes: z.array(z.string()).optional().describe("Array of regex patterns to exclude URLs from crawling."),
      includes: z.array(z.string()).optional().describe("Array of regex patterns to include URLs for crawling."),
      maxDepth: z.number().int().positive().optional().describe("Maximum depth to crawl."),
      limit: z.number().int().positive().optional().describe("Maximum number of pages to crawl."),
      generateImgAltText: z.boolean().optional().describe("Whether to generate alt text for images."),
      returnOnlyUrls: z.boolean().optional().describe("Whether to return only URLs instead of page content."),
      pageOptions: z.object({
        onlyMainContent: z.boolean().optional().describe("Whether to return only the main content of the page.")
      }).optional()
    }).optional().describe("Options for the 'crawl' operation."),
    pageOptions: z.object({
      onlyMainContent: z.boolean().optional().describe("Whether to return only the main content of the page, excluding headers, footers, etc. For 'scrape' operation.")
    }).optional().describe("Options for the 'scrape' operation."),
  }).optional().describe("Parameters for the chosen operation.")
});

const firecrawlToolOutputSchema = z.object({
  success: z.boolean(),
  data: z.any().optional().describe("Scraped or crawled data. Structure depends on Firecrawl API response."),
  message: z.string().optional().describe("Optional message, e.g., in case of error or partial success.")
});

export const firecrawlTool = createTool({
  id: "firecrawl-web-operations", // Renamed ID for clarity
  description: "Scrapes content from a single URL or crawls a website using Firecrawl service.",
  inputSchema: firecrawlToolInputSchema,
  outputSchema: firecrawlToolOutputSchema,
  execute: async ({
    context,
    runtimeContext,
    abortSignal,
  }: {
    runtimeContext?: Record<string, any>;
    abortSignal?: AbortSignal;
  }) => {
    const { operation, url, params } = context;

    logger.info(`Executing Firecrawl tool: operation '${operation}' for url: ${url}`, { params });

    try {
      const apiKey = runtimeContext?.firecrawlApiKey || process.env.FIRECRAWL_API_KEY;
      if (!apiKey) {
        logger.error("Firecrawl API key is not provided in runtimeContext or environment variables.");
        return { success: false, message: "Firecrawl API key is missing." };
      }
      
      const firecrawl = new FirecrawlApp({ apiKey });

      if (abortSignal?.aborted) {
        logger.warn("Firecrawl operation aborted before start.");
        return { success: false, message: "Operation aborted." };
      }

      let response;

      if (operation === 'scrape') {
        logger.debug(`Performing scrape operation with options:`, params?.pageOptions);
        const scrapeParams = { ...params?.pageOptions };
        response = await firecrawl.scrape(url, scrapeParams, { signal: abortSignal });
      } else if (operation === 'crawl') {
        logger.debug(`Performing crawl operation with options:`, params?.crawlerOptions);
        const crawlParams = { ...params?.crawlerOptions };
        response = await firecrawl.crawl(url, crawlParams, { signal: abortSignal });
      } else {
        return { success: false, message: `Unsupported operation: ${operation}` };
      }

      if (abortSignal?.aborted) {
        logger.warn("Firecrawl operation aborted during execution.");
        return { success: false, message: "Operation aborted during execution." };
      }
      
      logger.info(`Firecrawl operation '${operation}' successful for url: ${url}`);
      return { success: true, data: response };

    } catch (error: any) {
      logger.error(`Error executing Firecrawl tool (operation: ${operation}, url: ${url}): ${error.message}`, { errorName: error.name, stack: error.stack });
      if (error.name === 'AbortError' || abortSignal?.aborted) {
        return { success: false, message: "Operation aborted by signal." };
      }
      const errorMessage = error.response?.data?.message || error.message || "An unknown error occurred.";
      return { success: false, message: errorMessage, data: error.response?.data };
    }
  },
});