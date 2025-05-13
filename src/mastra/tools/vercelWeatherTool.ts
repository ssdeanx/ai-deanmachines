/**
 * Mastra Weather Tool implementation
 *
 * @file Provides a weather tool implementation using Mastra's createTool
 * @version 1.1.0
 * @author Mastra Team
 * @copyright 2025
 * @license MIT
 */

import { createTool } from '@mastra/core'; // Changed from 'ai'
import { z } from 'zod';
import { createLogger } from '@mastra/core/logger';

// Create a logger instance for the MastraWeatherTool
const logger = createLogger({
  name: 'Mastra-WeatherTool', // Renamed for clarity
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug' as 'debug' | 'info' | 'warn' | 'error',
});

const weatherToolInputSchema = z.object({
  /**
   * The city to get weather information for
   * @example "London", "New York", "Tokyo"
   */
  city: z.string().describe("The city to get weather for"),
  /**
   * Optional: The country code (e.g., "US", "GB") to make the city search more specific.
   */
  countryCode: z.string().optional().describe("Optional: The 2-letter country code (e.g., US, GB)"),
});

const weatherToolOutputSchema = z.object({
  success: z.boolean(),
  data: z.any().optional().describe("Weather data for the specified city."),
  message: z.string().optional().describe("Optional message, e.g., in case of error."),
});

export const mastraWeatherTool = createTool({ // Renamed tool
  id: "get-current-weather", // More descriptive ID
  description: "Fetches current weather for a specified city using OpenWeatherMap.",
  inputSchema: weatherToolInputSchema,
  outputSchema: weatherToolOutputSchema,
  /**
   * Tool execution function
   *
   * @param context - The validated parameters object containing the city.
   * @param runtimeContext - Optional runtime context, e.g., for API keys.
   * @param abortSignal - Optional AbortSignal for cancellation.
   * @returns Promise resolving to the weather data or error information.
   * @throws Will throw an error if the API request fails unexpectedly.
   */
  execute: async ({
    context,
    runtimeContext,
    abortSignal,
  }: {
    context: z.infer<typeof weatherToolInputSchema>;
    runtimeContext?: Record<string, any>;
    abortSignal?: AbortSignal;
  }) => {
    const { city, countryCode } = context;
    logger.info(`Fetching weather for city: ${city}${countryCode ? ', ' + countryCode : ''}`);

    const apiKey = runtimeContext?.openweathermapApiKey || process.env.OPENWEATHERMAP_API_KEY;

    if (!apiKey) {
      logger.error("OpenWeatherMap API key is not provided in runtimeContext or environment variables.");
      return { success: false, message: "OpenWeatherMap API key is missing." };
    }

    let queryString = `q=${encodeURIComponent(city)}`;
    if (countryCode) {
      queryString += `,${encodeURIComponent(countryCode)}`;
    }

    const weatherApiUrl = `https://api.openweathermap.org/data/2.5/weather?${queryString}&appid=${apiKey}&units=metric`;

    try {
      if (abortSignal?.aborted) {
        logger.warn("Weather fetch operation aborted before start.");
        return { success: false, message: "Operation aborted." };
      }

      const response = await fetch(weatherApiUrl, { signal: abortSignal });

      if (abortSignal?.aborted) {
        // Even if fetch starts, it might be aborted before response.json()
        logger.warn("Weather fetch operation aborted during fetch.");
        return { success: false, message: "Operation aborted during fetch." };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to parse error response" }));
        logger.error(`Error fetching weather for ${city}: ${response.status} ${response.statusText}`, { errorData });
        return { success: false, message: `API error: ${errorData.message || response.statusText}`, data: errorData };
      }

      const weatherData = await response.json();
      logger.info(`Successfully fetched weather for ${city}`, { weatherData });
      return { success: true, data: weatherData };

    } catch (error: any) {
      logger.error(`Exception fetching weather for ${city}: ${error.message}`, { errorName: error.name, stack: error.stack });
      if (error.name === 'AbortError' || abortSignal?.aborted) {
        return { success: false, message: "Operation aborted by signal." };
      }
      return { success: false, message: `Failed to fetch weather: ${error.message}` };
    }
  },
});