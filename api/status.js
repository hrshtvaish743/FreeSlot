'use strict';

const status = {
    success: {
        message: 'Successful execution',
        code: 0
    },
    captchaFail: {
        message: 'Captcha Failed',
        code: 22
    },
    timedOut: {
        message: 'Session timed out',
        code: 11
    },
    invalid: {
        message: 'Invalid credentials',
        code: 12
    },
    captchaParsing: {
        message: 'Error parsing captcha',
        code: 13
    },
    tokenExpired: {
        message: 'Token expired',
        code: 14
    },
    noData: {
        message: 'Requested data is not available',
        code: 15
    },
    dataParsing: {
        message: 'Error parsing data or invalid credentials',
        code: 16
    },
    toDo: {
        message: 'This feature is incomplete, please help us by contributing to its development',
        code: 50
    },
    deprecated: {
        message: 'This feature or endpoint has been deprecated, please bear with us while we upgrade your app',
        code: 60
    },
    vitDown: {
        message: 'VIT\'s Servers may be slow/down or we may be facing a connectivity Issue',
        code: 89
    },
    mongoDown: {
        message: 'Our MongoDB instances may be Down or We may be facing a connectivity Issue',
        code: 97
    },
    maintenance: {
        message: 'Our API servers are down for maintenance, please bear with us while we do what we do best',
        code: 98
    },
    other: {
        message: 'An unforeseen/unknown/irrecoverable error has occurred, please bear with us while we fix it',
        code: 99
    }
};

module.exports = status;
