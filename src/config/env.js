import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (two levels up from config folder)
dotenv.config({ 
    path: join(__dirname, `../../.env${process.env.NODE_ENV ? '.' + process.env.NODE_ENV : ''}`)
});

// Validate required environment variables
const requiredEnvVars = [
    'WEBHOOK_VERIFY_TOKEN',
    'API_TOKEN',
    'BUSINESS_PHONE',
    'API_VERSION',
    'PORT',
    'GEMINI_API_KEY'
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

export const config = {
    // Server Configuration
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT, 10) || 3000,
    HOST: process.env.HOST || '0.0.0.0',

    // API Keys and Tokens
    WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN,
    API_TOKEN: process.env.API_TOKEN,
    BUSINESS_PHONE: process.env.BUSINESS_PHONE,
    API_VERSION: process.env.API_VERSION,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    
    // Security Configuration
    RATE_LIMIT: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100 // limit each IP to 100 requests per windowMs
    },

    // Logging Configuration
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FORMAT: process.env.LOG_FORMAT || 'combined',

    // CORS Configuration
    CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    
    // Performance Configuration
    CACHE_TTL: parseInt(process.env.CACHE_TTL, 10) || 300, // 5 minutes in seconds
    REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT, 10) || 5000, // 5 seconds
    
    // Health Check Configuration
    HEALTH_CHECK_PATH: process.env.HEALTH_CHECK_PATH || '/health'
};