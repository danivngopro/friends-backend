require('dotenv').config('./.env');

const config = {
    ad: {
        AD_SERVICE_URL: process.env.AD_SERVICE_URL || 'http://localhost:3000',
        type: ''
    }
}


module.exports = config;