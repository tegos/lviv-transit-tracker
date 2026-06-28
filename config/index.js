require('dotenv').config();

const parsedUpdate = parseInt(process.env.DEFAULT_UPDATE);

module.exports = {
    defaultUpdate: (parsedUpdate > 0) ? parsedUpdate : 5000,
    port: parseInt(process.env.PORT) || 3000,
    googleMapsKey: process.env.GOOGLE_MAPS_KEY || '',
};
