// API Service Module
// ===================
// This module handles all HTTP requests to the OpenWeatherMap API
// It provides clean functions for fetching weather data with proper error handling

import { API_CONFIG, UNITS } from './config.js';

/**
 * Fetches current weather data for a given city
 * @param {string} city - Name of the city (e.g., "London", "New York")
 * @param {string} unit - Unit system: 'metric' (Celsius) or 'imperial' (Fahrenheit)
 * @returns {Promise<Object>} Current weather data
 * @throws {Error} If the API request fails
 */
async function getCurrentWeather(city, unit = UNITS.METRIC) {
    // Construct the API URL with query parameters
    // endpoint: /weather?q={city}&units={unit}&appid={apiKey}
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.currentWeather}?q=${encodeURIComponent(city)}&units=${unit}&appid=${API_CONFIG.apiKey}`;
    
    try {
        // Make the HTTP GET request using fetch API
        const response = await fetch(url);
        
        // Check if the response is successful (status code 200-299)
        if (!response.ok) {
            // Parse error response to get specific error message
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch weather data');
        }
        
        // Parse the JSON response
        const data = await response.json();
        
        // Return the parsed weather data
        return data;
    } catch (error) {
        // Re-throw the error for the caller to handle
        throw new Error(`Weather fetch error: ${error.message}`);
    }
}

/**
 * Fetches 5-day forecast data for a given city
 * @param {string} city - Name of the city
 * @param {string} unit - Unit system: 'metric' or 'imperial'
 * @returns {Promise<Object>} Forecast data with 40 data points (8 per day)
 * @throws {Error} If the API request fails
 */
async function getForecast(city, unit = UNITS.METRIC) {
    // Construct the API URL for forecast endpoint
    // endpoint: /forecast?q={city}&units={unit}&appid={apiKey}
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.forecast}?q=${encodeURIComponent(city)}&units=${unit}&appid=${API_CONFIG.apiKey}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch forecast data');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`Forecast fetch error: ${error.message}`);
    }
}

/**
 * Fetches current weather data using coordinates (latitude/longitude)
 * Used for geolocation feature
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} unit - Unit system: 'metric' or 'imperial'
 * @returns {Promise<Object>} Current weather data
 * @throws {Error} If the API request fails
 */
async function getCurrentWeatherByCoords(lat, lon, unit = UNITS.METRIC) {
    // Construct URL with coordinates instead of city name
    // endpoint: /weather?lat={lat}&lon={lon}&units={unit}&appid={apiKey}
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.weatherByCoords}?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_CONFIG.apiKey}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch weather data');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`Weather fetch error: ${error.message}`);
    }
}

/**
 * Fetches 5-day forecast data using coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} unit - Unit system: 'metric' or 'imperial'
 * @returns {Promise<Object>} Forecast data
 * @throws {Error} If the API request fails
 */
async function getForecastByCoords(lat, lon, unit = UNITS.METRIC) {
    // Construct URL with coordinates for forecast
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.forecastByCoords}?lat=${lat}&lon=${lon}&units=${unit}&appid=${API_CONFIG.apiKey}`;
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch forecast data');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        throw new Error(`Forecast fetch error: ${error.message}`);
    }
}

/**
 * Processes raw forecast data to extract one reading per day
 * The API returns 40 data points (8 per day for 5 days)
 * We filter to get the noon reading (12:00 PM) for each day
 * @param {Object} forecastData - Raw forecast data from API
 * @returns {Array} Array of daily forecast objects
 */
function processForecastData(forecastData) {
    // The API returns data in 3-hour intervals (8 readings per day)
    // We want to extract one representative reading per day
    // Typically we use the reading closest to noon (12:00)
    
    const dailyForecasts = [];
    const processedDates = new Set(); // Track dates we've already processed
    
    // Iterate through all forecast entries
    for (const entry of forecastData.list) {
        // Extract date from the dt_txt field (format: "2021-10-18 12:00:00")
        const date = entry.dt_txt.split(' ')[0];
        
        // Only process each date once
        if (!processedDates.has(date)) {
            processedDates.add(date);
            
            // Create a simplified forecast object
            dailyForecasts.push({
                date: date,
                temp: entry.main.temp,
                temp_min: entry.main.temp_min,
                temp_max: entry.main.temp_max,
                weather: entry.weather[0].main,
                description: entry.weather[0].description,
                icon: entry.weather[0].icon
            });
        }
    }
    
    // Return first 5 days (in case API returns more)
    return dailyForecasts.slice(0, 5);
}

/**
 * Fetches both current weather and forecast for a city
 * Convenience function that combines both API calls
 * @param {string} city - Name of the city
 * @param {string} unit - Unit system: 'metric' or 'imperial'
 * @returns {Promise<Object>} Object containing current weather and processed forecast
 * @throws {Error} If either API request fails
 */
async function getWeatherData(city, unit = UNITS.METRIC) {
    try {
        // Fetch both current weather and forecast in parallel
        // This is faster than sequential requests
        const [currentWeather, forecastData] = await Promise.all([
            getCurrentWeather(city, unit),
            getForecast(city, unit)
        ]);
        
        // Process the forecast data to get daily readings
        const forecast = processForecastData(forecastData);
        
        // Return combined data object
        return {
            current: currentWeather,
            forecast: forecast
        };
    } catch (error) {
        throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
}

/**
 * Fetches both current weather and forecast using coordinates
 * Convenience function for geolocation
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} unit - Unit system: 'metric' or 'imperial'
 * @returns {Promise<Object>} Object containing current weather and processed forecast
 * @throws {Error} If either API request fails
 */
async function getWeatherDataByCoords(lat, lon, unit = UNITS.METRIC) {
    try {
        // Fetch both current weather and forecast in parallel
        const [currentWeather, forecastData] = await Promise.all([
            getCurrentWeatherByCoords(lat, lon, unit),
            getForecastByCoords(lat, lon, unit)
        ]);
        
        // Process the forecast data
        const forecast = processForecastData(forecastData);
        
        return {
            current: currentWeather,
            forecast: forecast
        };
    } catch (error) {
        throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
}

// Export all functions for use in other modules
export {
    getCurrentWeather,
    getForecast,
    getCurrentWeatherByCoords,
    getForecastByCoords,
    processForecastData,
    getWeatherData,
    getWeatherDataByCoords
};
