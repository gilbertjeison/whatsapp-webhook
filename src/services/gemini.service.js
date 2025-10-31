import { GoogleGenAI } from "@google/genai";
import { config } from '../config/env.js';

class GeminiService {
    constructor() {
        const apiKey = config.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not defined in environment variables");
        }
        this.ai = new GoogleGenAI({ apiKey });
        this.conversations = new Map();
        this.responseCache = new Map();

        // Start the cleanup intervals
        setInterval(() => this.cleanupOldSessions(), 15 * 60 * 1000); // Every 15 minutes
        setInterval(() => this._cleanupCache(), 60 * 60 * 1000); // Every hour

        // Initialize rate limiting
        this.rateLimits = new Map();
        this.MAX_REQUESTS_PER_MINUTE = 20;
        this.RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
    }

    /**
     * Initialize chat context with configuration
     * @private
     */
    _initializeChat() {
        return {
            chat: this.ai.chats.create({
                model: "gemini-2.5-flash",
                config: {
                    maxOutputTokens: 1000,
                    temperature: 0.7,
                    topP: 0.8,
                    topK: 40,
                },
            }),
            lastActivity: Date.now(),
            messageCount: 0
        };
    }

    /**
     * Starts or continues a conversation with a user
     * @param {string} userId - The user's unique identifier
     * @param {string} message - The user's message
     * @returns {Promise<string>} The AI's response
     */
    /**
     * Check and update rate limits for a user
     * @private
     */
    _checkRateLimit(userId) {
        const now = Date.now();
        const userRateLimit = this.rateLimits.get(userId) || { count: 0, timestamp: now };
        
        // Reset counter if window has passed
        if (now - userRateLimit.timestamp >= this.RATE_LIMIT_WINDOW) {
            userRateLimit.count = 0;
            userRateLimit.timestamp = now;
        }
        
        // Check if limit exceeded
        if (userRateLimit.count >= this.MAX_REQUESTS_PER_MINUTE) {
            throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        }
        
        // Update counter
        userRateLimit.count++;
        this.rateLimits.set(userId, userRateLimit);
    }

    /**
     * Clean up old cache entries
     * @private
     */
    _cleanupCache() {
        const now = Date.now();
        for (const [key, entry] of this.responseCache.entries()) {
            if (now - entry.timestamp > 30 * 60 * 1000) { // 30 minutes cache
                this.responseCache.delete(key);
            }
        }
    }

    /**
     * Get cached response or generate new one
     * @private
     */
    async _getResponse(session, message) {
        // Create cache key from message content
        const cacheKey = JSON.stringify({
            message: message.toLowerCase().trim(),
            context: session.messageCount
        });

        try {
            // Check cache
            const cached = this.responseCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
                console.log('Using cached response');
                return cached.response;
            }

            // Generate new response with exponential backoff retry
            const result = await this._retryWithExponentialBackoff(
                () => session.chat.sendMessage({ message }),
                3, // max attempts
                1000 // base delay in ms
            );

            // Log full response structure for debugging
            console.log('API Response received:', {
                hasResult: !!result,
                resultKeys: result ? Object.keys(result) : [],
                hasText: result && 'text' in result,
                textType: result && typeof result.text,
                textValue: result && result.text,
                hasCandidates: result && 'candidates' in result
            });

            // Validate response with multiple approaches
            let responseText = null;

            // Try direct text property first (standard SDK approach)
            if (result && typeof result.text === 'string' && result.text.trim() !== '') {
                responseText = result.text;
            }
            // Fallback: try candidates array structure
            else if (result && result.candidates && result.candidates.length > 0) {
                const candidate = result.candidates[0];
                if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                    responseText = candidate.content.parts[0].text;
                }
            }

            if (!responseText || responseText.trim() === '') {
                console.error('Invalid response structure:', JSON.stringify(result, null, 2));
                throw new Error('Invalid response from AI');
            }

            // Normalize the response object to always have a text property
            const normalizedResult = {
                text: responseText,
                originalResponse: result
            };

            // Cache the normalized response
            this.responseCache.set(cacheKey, {
                response: normalizedResult,
                timestamp: Date.now()
            });

            return normalizedResult;
        } catch (error) {
            console.error('Error getting response:', error);

            // Try to use cached response if available, even if expired
            const cachedFallback = this.responseCache.get(cacheKey);
            if (cachedFallback) {
                console.log('Using expired cache as fallback');
                return cachedFallback.response;
            }

            throw error;
        }
    }

    /**
     * Retry a function with exponential backoff
     * @private
     */
    async _retryWithExponentialBackoff(fn, maxAttempts, baseDelay) {
        let attempt = 0;
        let lastError;
        
        while (attempt < maxAttempts) {
            try {
                return await fn();
            } catch (error) {
                attempt++;
                lastError = error;
                
                if (attempt === maxAttempts) {
                    throw error;
                }
                
                // Calculate delay with jitter
                const delay = Math.min(
                    baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
                    10000 // max 10 seconds
                );
                
                console.log(`Retry attempt ${attempt} after ${delay}ms`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        throw lastError;
    }

    async chat(userId, message) {
        try {
            console.log(`\n=== Gemini Service: Processing chat for user ${userId} ===`);
            console.log(`Message: "${message}"`);

            // Check rate limits
            this._checkRateLimit(userId);

            // Get or create a chat session
            let session = this.conversations.get(userId);
            if (!session) {
                session = this._initializeChat();
                this.conversations.set(userId, session);
                console.log('Created new chat session for user');
            }

            // Update activity timestamp
            session.lastActivity = Date.now();
            session.messageCount++;

            // Send the message (retry logic is handled inside _getResponse)
            const result = await this._getResponse(session, message);

            if (typeof result.text === 'undefined' || result.text === null || result.text === '') {
                console.error('Result validation failed:', {
                    hasText: 'text' in result,
                    textType: typeof result.text,
                    textValue: result.text
                });
                throw new Error('Empty response from AI');
            }

            // Rate limit check
            if (session.messageCount > 20) {
                this.endConversation(userId);
                return {
                    text: "Has alcanzado el límite de mensajes para esta sesión. Por favor, inicia una nueva conversación.",
                    done: true
                };
            }

            const responseText = result.text;
            console.log('Generated response successfully');
            console.log('Response length:', responseText.length);

            return {
                text: responseText,
                done: this._isConversationDone(responseText)
            };
        } catch (error) {
            console.error("Error in chat:", error);
            console.error("Error stack:", error.stack);

            // Clear the conversation if there's an error to prevent stuck states
            this.conversations.delete(userId);

            // Provide more specific error messages
            if (error.message && error.message.includes('Rate limit')) {
                throw new Error("Rate limit exceeded. Please wait a moment.");
            } else if (error.message && error.message.includes('Invalid response')) {
                throw new Error("Failed to get valid response from AI. Please try again.");
            } else {
                throw new Error("Failed to process chat message");
            }
        }
    }

    /**
     * Ends a user's conversation session
     * @param {string} userId - The user's unique identifier
     */
    endConversation(userId) {
        this.conversations.delete(userId);
        console.log(`Ended conversation session for user ${userId}`);
    }

    /**
     * Check if the conversation should be considered complete
     * @param {string} response - The AI's response text
     * @returns {boolean} Whether the conversation is done
     */
    _isConversationDone(response) {
        const endPhrases = [
            "¿Hay algo más en lo que pueda ayudarte?",
            "¿Necesitas ayuda con algo más?",
            "¿Puedo ayudarte con algo más?",
            "¿Tienes alguna otra pregunta?"
        ];
        return endPhrases.some(phrase => response.includes(phrase));
    }

    /**
     * Clean up old conversations periodically
     * Called by a cleanup job
     */
    cleanupOldSessions() {
        // Clear conversations older than 30 minutes
        const thirtyMinutes = 30 * 60 * 1000;
        const now = Date.now();
        
        for (const [userId, chat] of this.conversations.entries()) {
            if (now - chat.lastActivity > thirtyMinutes) {
                this.conversations.delete(userId);
                console.log(`Cleaned up inactive session for user ${userId}`);
            }
        }
    }
}

export const geminiService = new GeminiService();