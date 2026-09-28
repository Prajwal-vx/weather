// OpenWeatherMap request and response handling.
import { API_CONFIG, UNITS } from './config.js';

const MAX_RESPONSE_BYTES = 512 * 1024;
const ALLOWED_ENDPOINTS = new Set(['/weather', '/forecast']);
const ICON_PATTERN = /^\d{2}[dn]$/;

function assertConfiguration() {
    if (typeof API_CONFIG.apiKey !== 'string' || !API_CONFIG.apiKey.trim() || API_CONFIG.apiKey.length > 256) {
        throw new Error('Weather lookup is not configured. Add an OpenWeatherMap key to env-config.js.');
    }
}

function validUnit(unit) {
    if (unit !== UNITS.METRIC && unit !== UNITS.IMPERIAL) throw new Error('Choose a supported temperature unit.');
}

function validateParams(params) {
    const keys = Object.keys(params);
    const cityQuery = keys.length === 2 && keys.includes('q') && keys.includes('units');
    const coordinateQuery = keys.length === 3 && keys.includes('lat') && keys.includes('lon') && keys.includes('units');
    if (!cityQuery && !coordinateQuery) {
        throw new Error('Weather request parameters are invalid.');
    }
    if (params.q !== undefined) validateCity(params.q);
    if (params.lat !== undefined || params.lon !== undefined) validateCoords(params.lat, params.lon);
    validUnit(params.units);
}

async function request(endpoint, params) {
    assertConfiguration();
    if (!ALLOWED_ENDPOINTS.has(endpoint)) throw new Error('Weather request is invalid.');
    validateParams(params);

    const url = new URL(`${API_CONFIG.baseUrl}${endpoint}`);
    for (const [key, value] of Object.entries({ ...params, appid: API_CONFIG.apiKey })) {
        url.searchParams.set(key, String(value));
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
        const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) {
            if (response.status === 404) throw new Error('We couldn’t find that place. Check the spelling and try again.');
            if (response.status === 401) throw new Error('The weather service key is invalid or not active.');
            if (response.status === 429) throw new Error('The weather service is busy. Please try again shortly.');
            throw new Error('Weather data is temporarily unavailable. Please try again.');
        }

        const declaredSize = Number(response.headers.get('content-length'));
        if (Number.isFinite(declaredSize) && declaredSize > MAX_RESPONSE_BYTES) {
            throw new Error('Weather service returned an oversized response.');
        }
        const body = await response.text();
        if (new TextEncoder().encode(body).byteLength > MAX_RESPONSE_BYTES) {
            throw new Error('Weather service returned an oversized response.');
        }
        try { return JSON.parse(body); } catch { throw new Error('Weather service returned an invalid response.'); }
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

function boundedNumber(value, min, max) {
    return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function safeText(value, maxLength) {
    return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validForecastTimestamp(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return false;
    const [date, time] = value.split(' ');
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute, second] = time.split(':').map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day));
    return parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 && parsedDate.getUTCDate() === day
        && hour <= 23 && minute <= 59 && second <= 59;
}

function validateForecast(data) {
    if (!data || !Array.isArray(data.list) || data.list.length > 100) {
        throw new Error('Weather service returned incomplete forecast data.');
    }
    const days = new Map();
    for (const entry of data.list) {
        if (!entry || !validForecastTimestamp(entry.dt_txt) || !entry.main || !Array.isArray(entry.weather) || !entry.weather[0]) continue;
        const date = entry.dt_txt.slice(0, 10);
        if (!boundedNumber(entry.main.temp_min, -100, 100) || !boundedNumber(entry.main.temp_max, -100, 100)) continue;
        const description = safeText(entry.weather[0].description, 120);
        if (!description) continue;
        const existing = days.get(date);
        const hour = Number(entry.dt_txt.slice(11, 13));
        if (!existing || Math.abs(hour - 12) < Math.abs(existing.hour - 12)) {
            days.set(date, {
                hour,
                value: {
                    date,
                    temp_min: entry.main.temp_min,
                    temp_max: entry.main.temp_max,
                    description,
                    icon: ICON_PATTERN.test(entry.weather[0].icon) ? entry.weather[0].icon : '01d'
                }
            });
        }
    }
    return [...days.values()].slice(0, 5).map(({ value }) => value);
}

function validateCurrent(data) {
    const condition = data?.weather?.[0];
    if (!data || typeof data.name !== 'string' || !data.main || !Array.isArray(data.weather) || !condition || !data.sys || !data.wind
        || !boundedNumber(data.main.temp, -100, 100) || !boundedNumber(data.main.feels_like, -100, 100)
        || !Number.isInteger(data.main.humidity) || data.main.humidity < 0 || data.main.humidity > 100
        || !boundedNumber(data.wind.speed, 0, 200)) {
        throw new Error('Weather service returned incomplete current conditions.');
    }
    const name = safeText(data.name, 100);
    const mainCondition = safeText(condition.main, 80);
    const description = safeText(condition.description, 120);
    if (!name || !mainCondition || !description) throw new Error('Weather service returned incomplete current conditions.');

    return {
        name,
        sys: { country: safeText(data.sys.country, 3) },
        main: { temp: data.main.temp, feels_like: data.main.feels_like, humidity: data.main.humidity },
        wind: { speed: data.wind.speed },
        weather: [{ main: mainCondition, description, icon: ICON_PATTERN.test(condition.icon) ? condition.icon : '01d' }]
    };
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
