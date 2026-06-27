require('dotenv').config();

module.exports = {
    apiUrl: process.env.API_URL || '',
    defaultUpdate: parseInt(process.env.DEFAULT_UPDATE) || 5000,
};
