// src/app.js
const express = require('express');
const bodyParser = require('express').json;
const pinoHttp = require('pino-http');
const logger = require('./lib/logger');
const authRoutes = require('./routes/auth.routes');
const centreRoutes = require('./routes/centres.routes');
const bookingRoutes = require('./routes/bookings.routes');
const paymentRoutes = require('./routes/payments.routes');
const healthRoutes = require('./routes/health.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();
app.use(bodyParser());
app.use(pinoHttp({ logger }));


app.use('/api/auth', authRoutes);
app.use('/health', healthRoutes);


app.use('/api/centres', centreRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/docs', require('./routes/docs.routes'));


app.use(errorHandler);

module.exports = app;
