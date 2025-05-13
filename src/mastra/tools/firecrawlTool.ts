// Mastra Firecrawl Tool
import { createTool } from "@mastra/core/tools"; 
import { z } from "zod";
import { createLogger } from "@mastra/core/logger";
import { FirecrawlApp, type CrawlOptions as FirecrawlSdkCrawlOptions, type ScrapeOptions as FirecrawlSdkScrapeOptions } from 'firecrawl'; 

const logger = createLogger({ name: "FirecrawlTool" });

const firecrawlToolInputSchema = z.object({
  url: z.string().url().describe("URL of the web page to crawl or scrape"),
  operation: z.enum(["crawl", "scrape"]).default("scrape").describe("Whether to crawl the website or scrape a single URL. Defaults to scrape."),
  crawlerOptions: z.object({ 
    excludes: z.array(z.string()).optional().describe("Array of regex patterns to exclude URLs from crawling."),
    includes: z.array(z.string()).optional().describe("Array of regex patterns to include URLs for crawling. If specified, only matching URLs will be crawled."),
    maxDepth: z.number().int().positive().optional().describe("Maximum depth to crawl for 'crawl' operation."),
    limit: z.number().int().positive().optional().describe("Maximum number of pages to crawl for 'crawl' operation."),
    generateImgAltText: z.boolean().optional().describe("Whether to generate alt text for images."),
    returnOnlyUrls: z.boolean().optional().describe("Whether to return only URLs instead of page content for 'crawl' operation."),
  }).optional().describe("Options specific to the 'crawl' operation's crawlerOptions."),
  pageOptions: z.object({ 
    onlyMainContent: z.boolean().optional().describe("Whether to return only the main content of the page, excluding headers, footers, etc. for 'scrape' operation (and also for crawl if not returning only URLs)."),
  }).optional().describe("Options specific to the 'scrape' operation's pageOptions, or for crawled pages if content is returned.")
});

const firecrawlToolOutputSchema = z.object({
  success: z.boolean(),
  data: z.any().optional().describe("Crawled or scraped data. Structure depends on Firecrawl API response."),
  message: z.string().optional().describe("Optional message, e.g., in case of error or partial success.")
});

export const firecrawlTool = createTool({
  id: "firecrawl-web-scraper",
  description: "Crawls or scrapes a web page using Firecrawl service to extract its content or sitemap.",
  inputSchema: firecrawlToolInputSchema,
  outputSchema: firecrawlToolOutputSchema,
  execute: async ({
    context, 
    runtimeContext,
    abortSignal,
  }: {
    context: z.infer<typeof firecrawlToolInputSchema>;
    runtimeContext?: Record<string, any>;
    abortSignal?: AbortSignal; 
  }) => {
    const { url, operation, crawlerOptions: inputCrawlerOptions, pageOptions: inputPageOptions } = context; 

    logger.info(`Executing Firecrawl tool for url: ${url}, operation: ${operation}`, {
      inputCrawlerOptions,
      inputPageOptions,
    });

    try {
      const apiKey = runtimeContext?.firecrawlApiKey || process.env.FIRECRAWL_API_KEY;
      if (!apiKey) {
        logger.error("Firecrawl API key not found in runtimeContext or environment variables.");
        return { success: false, message: "Firecrawl API key not configured." };
      }
      
      const firecrawl = new FirecrawlApp({ apiKey });

      if (abortSignal?.aborted) {
        logger.warn("Firecrawl operation aborted before start.");
        return { success: false, message: "Operation aborted." };
      }

      let response;

      if (operation === "crawl") {
        logger.debug("Performing crawl operation", { url, inputCrawlerOptions, inputPageOptions });
        
        const sdkCrawlParams: FirecrawlSdkCrawlOptions = {};
        if (inputCrawlerOptions) {
          sdkCrawlParams.crawlerOptions = { ...inputCrawlerOptions };
        }
        if (inputPageOptions) { 
            sdkCrawlParams.pageOptions = { ...inputPageOptions };
        }
        
        response = await firecrawl.crawlUrl(url, Object.keys(sdkCrawlParams).length > 0 ? sdkCrawlParams : undefined, { timeout: 300000, signal: abortSignal });
      } else { 
        logger.debug("Performing scrape operation", { url, inputPageOptions });

        const sdkScrapeParams: FirecrawlSdkScrapeOptions = {};
        if (inputPageOptions) {
          sdkScrapeParams.pageOptions = { ...inputPageOptions };
        }
        
        response = await firecrawl.scrapeUrl(url, Object.keys(sdkScrapeParams).length > 0 ? sdkScrapeParams : undefined, { timeout: 180000, signal: abortSignal });
      }

      if (abortSignal?.aborted) {
        logger.warn("Firecrawl operation aborted during/after execution attempt.");
        return { success: false, message: "Operation aborted during execution." };
      }
      
      logger.info("Firecrawl operation successful.");
      return { success: true, data: response };

    } catch (error: any) {
      logger.error(`Error executing Firecrawl tool for url ${url}: ${error.message}`, { errorName: error.name, stack: error.stack });
      if (error.name === 'AbortError' || abortSignal?.aborted) { 
        return { success: false, message: "Operation aborted by signal." };
      }
      if (error && typeof error === 'object' && 'message' in error) {
        return { success: false, message: `Firecrawl API error: ${error.message}` };
      }
      return { success: false, message: "An unknown error occurred during Firecrawl operation." };
    }
  },
});