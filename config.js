// API Configuration
// ===================
// Get your free API key from: https://openweathermap.org/api
// Sign up for a free account and navigate to API keys section

let ENV_CONFIG = {};
try {
  ({ ENV_CONFIG } = await import('./env-config.js'));
} catch {
  // Fresh checkouts do not contain the ignored local key file.
}

const API_CONFIG = {
  // Browser keys are public. For a public deployment, proxy this API through
  // a server and keep the provider key in a server-side secret store.
  apiKey: ENV_CONFIG.openWeatherApiKey || '',
  
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
