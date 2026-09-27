// Main Application Module
// ========================
// This module handles DOM manipulation, event handling, and UI state management
// It connects the API service to the HTML interface

import { getWeatherData, getWeatherDataByCoords } from './api.js';
import { UNITS } from './config.js';

// ========================
// State Management
// ========================

// Application state
let currentUnit = UNITS.METRIC; // Default to Celsius
let currentWeatherData = null;  // Store current weather data
let currentForecastData = null; // Store forecast data
let recentSearches = [];        // Array of recently searched cities

// DOM Element References
const elements = {
    // Search elements
    searchInput: document.getElementById('searchInput'),
    searchForm: document.getElementById('searchForm'),
    searchButton: document.getElementById('searchButton'),
    locationButton: document.getElementById('locationButton'),
    railSearch: document.getElementById('railSearch'),
    railLocation: document.getElementById('railLocation'),
    railForecast: document.getElementById('railForecast'),
    recentSearches: document.getElementById('recentSearches'),
    
    // Unit toggle
    unitToggle: document.getElementById('unitToggle'),
    
    // Loading and error
    loadingSpinner: document.getElementById('loadingSpinner'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    
    // Current weather
    currentWeather: document.getElementById('currentWeather'),
    heroTemperature: document.querySelector('.hero-temp'),
    weatherDetails: document.querySelector('.weather-details'),
    cityName: document.getElementById('cityName'),
    weatherDate: document.getElementById('weatherDate'),
    weatherIcon: document.getElementById('weatherIcon'),
    temperature: document.getElementById('temperature'),
    temperatureUnit: document.getElementById('temperatureUnit'),
    weatherDescription: document.getElementById('weatherDescription'),
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    conditionDetail: document.getElementById('conditionDetail'),
    
    // Forecast
    forecastSection: document.getElementById('forecastSection'),
    forecastCards: document.getElementById('forecastCards')
};

// ========================
// Initialization
// ========================

/**
 * Initialize the application when DOM is loaded
 */
function initApp() {
    // Load recent searches from localStorage
    loadRecentSearches();
    
    // Render recent search chips
    renderRecentSearches();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set initial unit toggle state
    elements.unitToggle.checked = false; // Unchecked = Celsius
}

// ========================
// DOM Rendering Functions
// ========================

/**
 * Renders current weather data to the DOM
 * @param {Object} weatherData - Current weather data from API
 */
function renderCurrentWeather(weatherData) {
    // Extract data from API response
    const { name, sys, main, weather, wind } = weatherData;
    
    // Update city name with country code
    elements.cityName.textContent = `${name}, ${sys.country}`;
    const condition = String(weather[0].main || '').toLowerCase();
    elements.currentWeather.dataset.weather = condition.includes('thunder') ? 'storm'
        : condition.includes('rain') || condition.includes('drizzle') ? 'rain'
        : condition.includes('snow') ? 'snow'
        : condition.includes('clear') ? 'clear' : 'clouds';
    elements.currentWeather.classList.remove('is-empty');
    elements.heroTemperature.classList.remove('hidden');
    elements.weatherDetails.classList.remove('hidden');
    
    // Update current date
    const currentDate = new Date();
    elements.weatherDate.textContent = currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Update weather icon
    // OpenWeatherMap provides icon codes like '01d', '02n', etc.
    // We use @2x for high resolution (100x100 pixels)
    const iconCode = weather[0].icon;
    elements.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    elements.weatherIcon.alt = weather[0].description;
    elements.currentWeather.classList.add('has-weather-icon');
    document.querySelector('.live-pill').classList.remove('hidden');
    
    // Update temperature
    elements.temperature.textContent = Math.round(main.temp);
    elements.temperatureUnit.textContent = currentUnit === UNITS.METRIC ? '°C' : '°F';
    
    // Update weather description
    elements.weatherDescription.textContent = weather[0].description;
    
    // Update weather details
    elements.feelsLike.textContent = `Feels like ${Math.round(main.feels_like)}°`;
    elements.humidity.textContent = `${main.humidity}%`;
    
    // Update wind speed with appropriate unit
    const windUnit = currentUnit === UNITS.METRIC ? 'm/s' : 'mph';
    elements.windSpeed.textContent = `${Number(wind.speed).toFixed(1)} ${windUnit}`;
    elements.conditionDetail.textContent = weather[0].main;
    
    // Show the current weather section
    elements.currentWeather.classList.remove('hidden');
}

/**
 * Renders 5-day forecast data to the DOM
 * @param {Array} forecastData - Array of daily forecast objects
 */
function renderForecast(forecastData) {
    elements.forecastCards.replaceChildren();
    
    // Create a card for each day
    forecastData.forEach((day, index) => {
        const card = createForecastCard(day, index);
        elements.forecastCards.appendChild(card);
    });
    
    // Show the forecast section
    elements.forecastSection.classList.remove('hidden');
}

/**
 * Creates a single forecast card element
 * @param {Object} dayData - Forecast data for a single day
 * @param {number} index - Index of the day (for styling)
 * @returns {HTMLElement} Forecast card element
 */
function createForecastCard(dayData) {
    const card = document.createElement('div');
    card.className = 'forecast-card';
    
    // Format date (e.g., "Mon, Sep 18")
    const date = new Date(dayData.date);
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
    
    const dateLabel = document.createElement('div');
    dateLabel.className = 'forecast-date';
    dateLabel.textContent = formattedDate;
    const icon = document.createElement('img');
    icon.className = 'forecast-icon';
    icon.alt = dayData.description;
    icon.src = `https://openweathermap.org/img/wn/${/^\d{2}[dn]$/.test(dayData.icon) ? dayData.icon : '01d'}@2x.png`;
    const temps = document.createElement('div');
    temps.className = 'forecast-temps';
    const high = document.createElement('span');
    high.className = 'forecast-high';
    high.textContent = `${Math.round(dayData.temp_max)}°`;
    const low = document.createElement('span');
    low.className = 'forecast-low';
    low.textContent = `${Math.round(dayData.temp_min)}°`;
    temps.append(high, low);
    card.append(dateLabel, icon, temps);
    
    return card;
}

/**
 * Renders recent search chips from localStorage
 */
function renderRecentSearches() {
    // Clear existing chips
    elements.recentSearches.replaceChildren();
    
    // Don't show if no recent searches
    if (recentSearches.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-note';
        empty.textContent = 'Places you look up will show here.';
        elements.recentSearches.appendChild(empty);
        return;
    }
    
    // Create a chip for each recent search
    recentSearches.forEach(city => {
        const chip = document.createElement('button');
        chip.className = 'search-chip';
        chip.textContent = city;
        
        // Add click handler to search for this city
        chip.addEventListener('click', () => {
            elements.searchInput.value = city;
            handleSearch();
        });
        
        elements.recentSearches.appendChild(chip);
    });
}

// ========================
// UI State Management
// ========================

/**
 * Shows the loading spinner
 */
function showLoading() {
    elements.loadingSpinner.classList.remove('hidden');
    elements.errorMessage.classList.add('hidden');
    elements.currentWeather.classList.add('hidden');
    elements.forecastSection.classList.add('hidden');
}

/**
 * Hides the loading spinner
 */
function hideLoading() {
    elements.loadingSpinner.classList.add('hidden');
}

/**
 * Shows an error message
 * @param {string} message - Error message to display
 */
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    elements.loadingSpinner.classList.add('hidden');
    elements.currentWeather.classList.add('hidden');
    elements.forecastSection.classList.add('hidden');
}

/**
 * Hides the error message
 */
function hideError() {
    elements.errorMessage.classList.add('hidden');
}

/**
 * Clears all weather displays
 */
function clearWeatherDisplay() {
    elements.currentWeather.classList.add('hidden');
    elements.forecastSection.classList.add('hidden');
}

// ========================
// Local Storage Management
// ========================

/**
 * Loads recent searches from localStorage
 */
function loadRecentSearches() {
    try {
        const stored = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        recentSearches = Array.isArray(stored) ? stored.filter(value => typeof value === 'string' && value.trim().length > 1 && value.length <= 80).slice(0, 5) : [];
    } catch { recentSearches = []; }
}

/**
 * Saves recent searches to localStorage
 */
function saveRecentSearches() {
    try { localStorage.setItem('recentSearches', JSON.stringify(recentSearches)); } catch { /* Storage may be disabled or full. */ }
}

/**
 * Adds a city to recent searches
 * @param {string} city - City name to add
 */
function addToRecentSearches(city) {
    // Remove if already exists (to move to front)
    const index = recentSearches.indexOf(city);
    if (index > -1) {
        recentSearches.splice(index, 1);
    }
    
    // Add to front of array
    recentSearches.unshift(city);
    
    // Keep only last 5 searches
    if (recentSearches.length > 5) {
        recentSearches = recentSearches.slice(0, 5);
    }
    
    // Save to localStorage
    saveRecentSearches();
    
    // Re-render chips
    renderRecentSearches();
}

// ========================
// Event Handlers
// ========================

/**
 * Handles search button click
 */
async function handleSearch() {
    const city = elements.searchInput.value.trim();
    
    // Validate input
    if (city.length < 2 || city.length > 80 || !/[\p{L}\p{N}]/u.test(city)) {
        showError('Enter a city name between 2 and 80 characters.');
        return;
    }
    
    // Show loading state
    showLoading();
    hideError();
    
    try {
        // Fetch weather data from API
        const data = await getWeatherData(city, currentUnit);
        
        // Store data for unit conversion
        currentWeatherData = data.current;
        currentForecastData = data.forecast;
        
        // Render the data
        renderCurrentWeather(data.current);
        renderForecast(data.forecast);
        
        // Add to recent searches
        addToRecentSearches(city);
        
        // Hide loading
        hideLoading();
        
    } catch (error) {
        // Show error message
        showError(error.message);
        hideLoading();
    }
}

/**
 * Handles geolocation button click
 */
async function handleGeolocation() {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }
    
    // Show loading state
    showLoading();
    hideError();
    
    try {
        // Get current position
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });
        
        const { latitude, longitude } = position.coords;
        
        // Fetch weather data using coordinates
        const data = await getWeatherDataByCoords(latitude, longitude, currentUnit);
        
        // Store data for unit conversion
        currentWeatherData = data.current;
        currentForecastData = data.forecast;
        
        // Render the data
        renderCurrentWeather(data.current);
        renderForecast(data.forecast);
        
        // Add city name to recent searches
        const cityName = data.current.name;
        addToRecentSearches(cityName);
        
        // Update search input with city name
        elements.searchInput.value = cityName;
        
        // Hide loading
        hideLoading();
        
    } catch (error) {
        // Handle different error types
        let errorMessage = 'Failed to get your location';
        
        if (error.code === 1) { // Permission denied
            errorMessage = 'Location permission denied. Please enable location access.';
        } else if (error.code === 2) { // Position unavailable
            errorMessage = 'Unable to determine your location.';
        } else if (error.code === 3) { // Timeout
            errorMessage = 'Location request timed out.';
        }
        
        showError(errorMessage);
        hideLoading();
    }
}

/**
 * Handles unit toggle change
 */
function handleUnitToggle() {
    // Toggle between metric and imperial
    currentUnit = elements.unitToggle.checked ? UNITS.IMPERIAL : UNITS.METRIC;
    
    // If we have weather data, re-render with new units
    if (currentWeatherData && currentForecastData) {
        // Re-fetch data with new units
        const city = elements.searchInput.value.trim() || currentWeatherData.name;
        
        showLoading();
        
        getWeatherData(city, currentUnit)
            .then(data => {
                currentWeatherData = data.current;
                currentForecastData = data.forecast;
                renderCurrentWeather(data.current);
                renderForecast(data.forecast);
                hideLoading();
            })
            .catch(error => {
                showError(error.message);
                hideLoading();
            });
    }
}

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

// ========================
// Event Listeners Setup
// ========================

/**
 * Sets up all event listeners for the application
 */
function setupEventListeners() {
    elements.searchForm.addEventListener('submit', event => { event.preventDefault(); handleSearch(); });
    elements.locationButton.addEventListener('click', handleGeolocation);
    elements.railSearch.addEventListener('click', () => elements.searchInput.focus());
    elements.railLocation.addEventListener('click', handleGeolocation);
    elements.railForecast.addEventListener('click', () => elements.forecastSection.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    elements.unitToggle.addEventListener('change', handleUnitToggle);
}

// ========================
// Start the Application
// ========================

// Initialize app when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
