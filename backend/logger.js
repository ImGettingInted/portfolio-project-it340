const pino = require('pino');

module.exports = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: 'portfolio-hub' },
    redact: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.password_hash'
    ]
});
