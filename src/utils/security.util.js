/**
 * Utility functions for security and input validation
 */
export class SecurityUtil {
    /**
     * Validates and sanitizes user input
     * @param {string} input - User input to validate
     * @returns {string} - Sanitized input
     * @throws {Error} - If input is invalid
     */
    static validateInput(input) {
        if (!input || typeof input !== 'string') {
            throw new Error('Input must be a non-empty string');
        }

        // Remove any potential XSS or injection attempts
        let sanitized = input
            .replace(/[<>]/g, '') // Remove < and >
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .replace(/data:/gi, '') // Remove data: protocol
            .trim();

        // Check for minimum length
        if (sanitized.length < 2) {
            throw new Error('Input too short');
        }

        // Check for maximum length
        if (sanitized.length > 1000) {
            throw new Error('Input too long');
        }

        // Check for repetitive patterns that might indicate spam
        if (/(.)\1{10,}/.test(sanitized)) {
            throw new Error('Input contains excessive repetition');
        }

        return sanitized;
    }

    /**
     * Validates phone numbers
     * @param {string} phone - Phone number to validate
     * @returns {boolean} - Whether the phone number is valid
     */
    static isValidPhone(phone) {
        return /^\d{10,15}$/.test(phone.replace(/\D/g, ''));
    }

    /**
     * Sanitizes a filename
     * @param {string} filename - Filename to sanitize
     * @returns {string} - Sanitized filename
     */
    static sanitizeFilename(filename) {
        return filename
            .replace(/[^a-z0-9.-]/gi, '_')
            .replace(/\.{2,}/g, '.')
            .toLowerCase();
    }
}

/**
 * List of sensitive patterns to watch for in messages
 */
export const SENSITIVE_PATTERNS = [
    /\b\d{16}\b/, // Credit card numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // Email addresses
    /\b(?:\d[ -]*?){13,16}\b/ // Any sequence that might be a card number
];