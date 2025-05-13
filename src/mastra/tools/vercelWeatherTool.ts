/**
 * Vercel Weather Tool implementation for Mastra
 * 
 * @file Provides a weather tool implementation using Vercel AI SDK format
 * @version 1.0.0
 * @author Mastra Team
 * @copyright 2025
 * @license MIT
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createLogger } from '@mastra/core/logger'; // Changed import

// Create a logger instance for the VercelWeatherTool
const logger = createLogger({
  name: 'Mastra-VercelWeatherTool',
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});


export const vercelWeatherTool = tool({
  /**
   * Tool description that will be provided to the LLM
   * This helps the model understand when and how to use this tool
   */
  description: "Fetches current weather using Vercel AI SDK format",
  
  /**
   * Parameter schema using Zod for validation
   * Defines the expected input parameters and their types
   */
  parameters: z.object({
    /**
     * The city to get weather information for
     * @example "London", "New York", "Tokyo"
     */
    city: z.string().describe("The city to get weather for"),
  }),
  
  /**
   * Tool execution function
   * 
   * @param params - The validated parameters object containing the city
   * @returns Promise resolving to the weather data
   * @throws Will throw an error if the API request fails
   */
  execute: async ({ city }) => {
    logger.info(`Fetching weather for city: ${city}`);
    // Simulate an API call to fetch weather data
    // Replace with actual API call
    const data = await fetch(`https://api.example.com/weather?city=${city}`);
    return data.json();
  },
});