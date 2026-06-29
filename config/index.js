require('dotenv').config();

const parsedPollInterval = parseInt(process.env.POLL_INTERVAL_MS);

module.exports = {
    pollIntervalMs: (parsedPollInterval > 0) ? parsedPollInterval : 5000,
    port: parseInt(process.env.PORT) || 3000,
    googleMapsKey: process.env.GOOGLE_MAPS_KEY || '',
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.lad.lviv.ua',
    isProduction: process.env.NODE_ENV === 'production',
    // Allowed browser origins for Socket.IO CORS (comma-separated env override).
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
};
