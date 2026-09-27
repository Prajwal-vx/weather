# Setup guide

1. Create an OpenWeatherMap account and obtain an API key.
2. Add the key to the ignored local `env-config.js` file using the format in `env-config.js.template`.
3. Serve this directory over HTTP and open `index.html` in a modern browser.
4. Search for a city, or choose **My location** and allow the browser location request.
5. Use the °C/°F switch to change units. Your recent searches stay in browser local storage.

## Security

The app is static and has no server. Any key configured in `env-config.js` is delivered to browser code and can be copied by visitors. This is suitable only for local/demo use with provider-side usage restrictions. Public deployment needs a server-side proxy that keeps the API key private and applies input validation and rate limits. Rotate any provider key that was previously committed or embedded in source.

Geolocation requires user permission and typically HTTPS (or localhost). The app does not retain coordinates.
