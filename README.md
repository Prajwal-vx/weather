# Weather Forecast App

A modern weather application built with vanilla JavaScript, HTML, and CSS that demonstrates REST API integration, async data fetching, and dynamic UI rendering.

## Project Structure

```
weather/
├── index.html          # Main HTML structure
├── styles.css          # All styling and responsive design
├── .env                # Environment variables template (DO NOT edit this)
├── env-config.js       # Your actual API key configuration (EDIT THIS)
├── config.js           # API configuration and constants
├── api.js              # API service layer (fetch logic)
├── app.js              # Main application logic (DOM manipulation, event handlers)
├── .gitignore          # Git ignore rules (excludes env-config.js)
└── README.md           # This file
```

## Setup Instructions

1. **Get your API key**: Sign up at [OpenWeatherMap](https://openweathermap.org/api) and get your free API key
2. **Configure the app**: Open `env-config.js` and replace the API key with your actual key:
   ```javascript
   const ENV_CONFIG = {
       openWeatherApiKey: 'your_actual_api_key_here' // Replace this
   };
   ```
3. **Run the app**: Open `index.html` in a web browser (no build step required!)

## Security Notes

- **`.env`**: Template file for documentation purposes
- **`env-config.js`**: Contains your actual API key (excluded from git via .gitignore)
- **Never commit** your API key to version control
- The `.gitignore` file ensures `env-config.js` won't be shared

## Features

- Search weather by city name
- Use current location via Geolocation API
- Display current weather with temperature, conditions, humidity, wind speed
- 5-day forecast with daily cards
- Toggle between Celsius and Fahrenheit
- Loading states and error handling
- Recent search history (stored in localStorage)
- Fully responsive design

## API Endpoints Used

- **Current Weather**: `/weather` - Get current weather data
- **5-Day Forecast**: `/forecast` - Get 5-day weather forecast
