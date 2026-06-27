require('dotenv').config();

if (!process.env.API_URL && process.env.NODE_ENV !== 'test') {
    console.warn('[config] WARNING: API_URL is not set - API requests will fail. Copy .env.example to .env');
}

const parsedUpdate = parseInt(process.env.DEFAULT_UPDATE);

module.exports = {
    apiUrl: process.env.API_URL || '',
    defaultUpdate: (parsedUpdate > 0) ? parsedUpdate : 5000,
    port: parseInt(process.env.PORT) || 3000,
    googleMapsKey: process.env.GOOGLE_MAPS_KEY || '',
};
