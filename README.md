# Skyline Weather

A lightweight weather dashboard built with HTML, CSS, and vanilla JavaScript. It provides city search, browser location, Celsius/Fahrenheit switching, recent places, and a five-day outlook using OpenWeatherMap.

## Run locally

1. Get an OpenWeatherMap API key.
2. Copy `env-config.js.template` to the ignored `env-config.js`, then put your key there: `const ENV_CONFIG = { openWeatherApiKey: 'YOUR_KEY' }; export { ENV_CONFIG };`
3. Serve this folder from a local HTTP server, then open `index.html`. Browser ES modules and location access are restricted when opening the file directly.

## Security and deployment

This project has no backend, accounts, database, uploads, or server-side API. A key included in browser JavaScript is visible to every visitor, even when the config file is excluded from source control. For public hosting, add a small server-side API proxy, store the provider key in its secret store, validate and rate-limit requests there, and restrict the provider key to the proxy where supported. Do not treat `env-config.js` as a secret in a deployed static site.

A previously embedded provider key was removed from the source. Rotate that key in the OpenWeatherMap account before deploying; removing it from the current files does not revoke a credential already exposed in a checkout or history.

## Features

- Search weather by city
- Use current location (requires browser permission and a secure context)
- Current temperature, feels-like temperature, humidity, and wind
- Five-day forecast from forecast intervals, selecting a representative near-noon reading
- Celsius/Fahrenheit toggle
- Recent places stored locally in the browser
- Responsive dashboard and accessible search/status labels

## Project files

- `index.html` — dashboard structure
- `styles.css` — responsive visual design
- `app.js` — interface state and interactions
- `api.js` — validated weather requests and response parsing
- `config.js` — provider endpoint and local configuration import
- `env-config.js.template` — local configuration example (contains no usable key)
