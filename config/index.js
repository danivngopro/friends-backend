require('dotenv').config('./.env');

const config = {
    ad: {
        AD_SERVICE_URL: process.env.AD_SERVICE_URL || 'http://localhost:3000',
        type: ''
    },
    groupId: {
        types: ['distribution', 'security'],
        prefixIds: {
            distribution: 'FRDIS',
            security: 'FRSEC',
        },
        idLength: 10
    },
    approve: {
        NOT_APPROVED_LIMIT: 100,
        APPROVED_LIMIT: 1000,
    }
}


module.exports = config;