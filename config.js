// API Configuration
// ===================
// Get your free API key from: https://openweathermap.org/api
// Sign up for a free account and navigate to API keys section

import { ENV_CONFIG } from './env-config.js';

const API_CONFIG = {
  // API key is loaded from environment configuration
  // If env-config.js doesn't exist, you can temporarily set the key here
  apiKey: ENV_CONFIG.openWeatherApiKey || '1aa6e29820a12f771d91538a74add1f2',
  
  // Base URL for OpenWeatherMap API
  baseUrl: 'https://api.openweathermap.org/data/2.5',
  
  // API Endpoints
  endpoints: {
    // Current weather by city name
    currentWeather: '/weather',
    // 5-day forecast by city name
    forecast: '/forecast',
    // Current weather by coordinates (for geolocation)
    weatherByCoords: '/weather',
    // Forecast by coordinates
    forecastByCoords: '/forecast'
  }
};

// Unit constants
const UNITS = {
  METRIC: 'metric',    // Celsius, m/s, etc.
  IMPERIAL: 'imperial'  // Fahrenheit, mph, etc.
};

export { API_CONFIG, UNITS };
