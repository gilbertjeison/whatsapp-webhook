import winston from 'winston';
import { config } from './env.js';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};

// Define log colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'cyan'
};

// Add colors to Winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Define Console transport format
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Create transports
const transports = [
    // Console transport for development
    new winston.transports.Console({
        format: consoleFormat,
        level: config.NODE_ENV === 'production' ? 'info' : 'debug'
    }),
    // File transport for errors
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format,
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }),
    // File transport for all logs
    new winston.transports.File({
        filename: 'logs/combined.log',
        format,
        maxsize: 5242880, // 5MB
        maxFiles: 5
    })
];

// Create logger instance
export const logger = winston.createLogger({
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    levels,
    transports,
    exitOnError: false
});

// Create stream for Morgan
export const stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

// Export a wrapper for easier usage
export const log = {
    error: (message, meta = {}) => logger.error(message, meta),
    warn: (message, meta = {}) => logger.warn(message, meta),
    info: (message, meta = {}) => logger.info(message, meta),
    http: (message, meta = {}) => logger.http(message, meta),
    debug: (message, meta = {}) => logger.debug(message, meta)
};