/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import webhookRoutes from './routes/webhook.routes.js';

// Create Express app
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.CORS_ORIGIN,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.RATE_LIMIT.windowMs,
    max: config.RATE_LIMIT.max,
    message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Performance middleware
app.use(compression());
app.use(express.json({ limit: '10kb' })); // Limit payload size

// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
    });
    next();
});

// Health check endpoint
app.get(config.HEALTH_CHECK_PATH, (req, res) => {
    res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/', webhookRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
        error: config.NODE_ENV === 'production' ? 
            'Internal server error' : 
            err.message
    });
});

// Graceful shutdown
const server = app.listen(config.PORT, config.HOST, () => {
    logger.info(`Server is running on ${config.HOST}:${config.PORT} in ${config.NODE_ENV} mode`);
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received. Closing server...');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection:', err);
    process.exit(1);
});