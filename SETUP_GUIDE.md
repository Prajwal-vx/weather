# Setup Guide

## Quick Start

1. **Get your API Key**:
   - Go to [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Navigate to API keys section
   - Copy your API key (it looks like: `a1b2c3d4e5f6g7h8i9j0`)

2. **Configure the App**:
   - Open `env-config.js` in a text editor
   - Replace the API key with your actual key:
   ```javascript
   const ENV_CONFIG = {
       openWeatherApiKey: 'a1b2c3d4e5f6g7h8i9j0' // Replace with your key
   };
   ```
   - If `env-config.js` doesn't exist, copy `env-config.js.template` to `env-config.js` first

3. **Run the App**:
   - Simply open `index.html` in a web browser
   - No build step or server required!

## Features Walkthrough

### Search by City
- Type a city name in the search bar
- Press Enter or click the search button
- Weather data will display automatically

### Use My Location
- Click the 📍 button to use your current location
- Browser will ask for location permission
- Weather for your location will display

### Temperature Units
- Use the toggle switch to switch between °C and °F
- All temperatures update automatically

### Recent Searches
- Your last 5 searched cities appear as clickable chips
- Click any chip to quickly search that city again
- Searches persist even after closing the browser

## Troubleshooting

### "city not found" Error
- Check the city name spelling
- Try the city name in English
- Some cities may require country code (e.g., "London,GB")

### API Key Errors
- Verify your API key is correctly copied into `env-config.js`
- Make sure there are no extra spaces
- Check that your API key is active on OpenWeatherMap
- Ensure `env-config.js` file exists (copy from template if needed)

### Geolocation Not Working
- Ensure location permissions are enabled in your browser
- Some browsers require HTTPS for geolocation
- Try using a different browser if issues persist

## Browser Compatibility

This app works in all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## Development Notes

### File Structure
```
weather/
├── index.html              # Main HTML structure
├── styles.css              # All styling
├── .env                    # Environment variables template
├── env-config.js           # Your actual API key (⚠️ ADD YOUR API KEY HERE)
├── env-config.js.template  # Template for env-config.js
├── config.js               # API configuration
├── api.js                  # API service layer
├── app.js                  # Main application logic
└── README.md               # Project documentation
```

### Architecture
- **Separation of Concerns**: API calls, DOM rendering, and event handling are in separate modules
- **ES6 Modules**: Uses modern JavaScript modules with import/export
- **Async/Await**: Clean async code with proper error handling
- **LocalStorage**: Persists recent searches without a backend

### API Endpoints Used
- Current Weather: `https://api.openweathermap.org/data/2.5/weather`
- 5-Day Forecast: `https://api.openweathermap.org/data/2.5/forecast`

## Learning Outcomes

This project demonstrates:
- ✅ REST API integration
- ✅ Async/await patterns
- ✅ Dynamic DOM manipulation
- ✅ Event handling and debouncing
- ✅ LocalStorage for data persistence
- ✅ Geolocation API usage
- ✅ Responsive CSS design
- ✅ Error handling and user feedback
- ✅ Modular JavaScript architecture
