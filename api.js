// OpenWeatherMap request and response handling.
import { API_CONFIG, UNITS } from './config.js';

function assertConfiguration() {
    if (!API_CONFIG.apiKey || API_CONFIG.apiKey === 'YOUR_API_KEY_HERE') {
        throw new Error('Weather lookup is not configured. Add an OpenWeatherMap key to env-config.js.');
    }
}

function validUnit(unit) {
    if (unit !== UNITS.METRIC && unit !== UNITS.IMPERIAL) throw new Error('Choose a supported temperature unit.');
}

async function request(endpoint, params) {
    assertConfiguration();
    const url = new URL(`${API_CONFIG.baseUrl}${endpoint}`);
    for (const [key, value] of Object.entries({ ...params, units: params.units, appid: API_CONFIG.apiKey })) {
        if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        let data;
        try { data = await response.json(); } catch { throw new Error('Weather service returned an invalid response.'); }
        if (!response.ok) {
            if (response.status === 404) throw new Error('We couldn’t find that place. Check the spelling and try again.');
            if (response.status === 401) throw new Error('The weather service key is invalid or not active.');
            if (response.status === 429) throw new Error('The weather service is busy. Please try again shortly.');
            throw new Error('Weather data is temporarily unavailable. Please try again.');
        }
        return data;
    } catch (error) {
        if (error.name === 'AbortError') throw new Error('Weather lookup timed out. Please try again.');
        if (error instanceof TypeError) throw new Error('Could not connect to the weather service. Check your connection.');
        throw error;
    } finally { clearTimeout(timeout); }
}

function validateCity(city) {
    if (typeof city !== 'string' || city.trim().length < 2 || city.trim().length > 80 || !/[\p{L}\p{N}]/u.test(city)) {
        throw new Error('Enter a city name between 2 and 80 characters.');
    }
    return city.trim();
}

function validateCoords(lat, lon) {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
        throw new Error('Location coordinates are invalid.');
    }
}

function validateForecast(data) {
    if (!data || !Array.isArray(data.list)) throw new Error('Weather service returned incomplete forecast data.');
    const days = new Map();
    for (const entry of data.list) {
        if (!entry || typeof entry.dt_txt !== 'string' || !entry.main || !Array.isArray(entry.weather) || !entry.weather[0]) continue;
        const date = entry.dt_txt.slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        const existing = days.get(date);
        const hour = Number(entry.dt_txt.slice(11, 13));
        if (!existing || Math.abs(hour - 12) < Math.abs(existing.hour - 12)) days.set(date, { entry, hour });
    }
    return [...days.entries()].slice(0, 5).map(([date, { entry }]) => ({
        date, temp_min: entry.main.temp_min, temp_max: entry.main.temp_max,
        description: entry.weather[0].description, icon: entry.weather[0].icon
    }));
}

function validateCurrent(data) {
    if (!data || typeof data.name !== 'string' || !data.main || !Array.isArray(data.weather) || !data.weather[0] || !data.sys || !data.wind) {
        throw new Error('Weather service returned incomplete current conditions.');
    }
    const icon = data.weather[0].icon;
    if (!/^\d{2}[dn]$/.test(icon)) data.weather[0].icon = '01d';
    return data;
}

async function getByParams(params, unit) {
    validUnit(unit);
    const [current, forecast] = await Promise.all([
        request('/weather', { ...params, units: unit }),
        request('/forecast', { ...params, units: unit })
    ]);
    return { current: validateCurrent(current), forecast: validateForecast(forecast) };
}
async function getCurrentWeather(city, unit = UNITS.METRIC) { validUnit(unit); return validateCurrent(await request('/weather', { q: validateCity(city), units: unit })); }
async function getForecast(city, unit = UNITS.METRIC) { validUnit(unit); return validateForecast(await request('/forecast', { q: validateCity(city), units: unit })); }
async function getCurrentWeatherByCoords(lat, lon, unit = UNITS.METRIC) { validateCoords(lat, lon); validUnit(unit); return validateCurrent(await request('/weather', { lat, lon, units: unit })); }
async function getForecastByCoords(lat, lon, unit = UNITS.METRIC) { validateCoords(lat, lon); validUnit(unit); return validateForecast(await request('/forecast', { lat, lon, units: unit })); }
function processForecastData(data) { return validateForecast(data); }
function getWeatherData(city, unit = UNITS.METRIC) { return getByParams({ q: validateCity(city) }, unit); }
function getWeatherDataByCoords(lat, lon, unit = UNITS.METRIC) { validateCoords(lat, lon); return getByParams({ lat, lon }, unit); }

export { getCurrentWeather, getForecast, getCurrentWeatherByCoords, getForecastByCoords, processForecastData, getWeatherData, getWeatherDataByCoords };
