const greetings = {
    en: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'],
    es: [
        'hola', 
        'buenos días', 
        'buen día', 
        'buenas tardes', 
        'buenas noches',
        'buenas',  // Common informal greeting
        'buen',    // Start of greetings
        'buenos'   // Start of greetings
    ]
};

// Additional greeting patterns for more specific matching
const greetingPatterns = {
    es: [
        text => text.startsWith('buenas') && text.length < 10, // Catches just "buenas" or "buenass"
        text => /^buen[ao]s?\b/.test(text), // Matches start of word only: buena, buenas, buen, buenos
        text => text === 'ole' || text === 'ola', // Common misspellings of "hola"
    ]
};

const responses = {
    en: {
        morning: 'Good morning',
        afternoon: 'Good afternoon',
        evening: 'Good evening',
        default: 'Hello'
    },
    es: {
        morning: 'Buenos días',
        afternoon: 'Buenas tardes',
        evening: 'Buenas noches',
        default: 'Hola'
    }
};

export class GreetingUtil {
    static isGreeting(text) {
        const normalizedText = text.toLowerCase().trim();
        
        // First check exact matches in greetings lists
        const exactMatch = Object.values(greetings).some(langGreetings => 
            langGreetings.some(greeting => 
                normalizedText.includes(greeting.toLowerCase())
            )
        );

        if (exactMatch) return true;

        // Then check pattern-based matches
        return Object.values(greetingPatterns).some(patterns =>
            patterns.some(pattern => pattern(normalizedText))
        );
    }

    static getLanguage(text) {
        const normalizedText = text.toLowerCase().trim();
        
        // Check exact matches first
        for (const [lang, langGreetings] of Object.entries(greetings)) {
            if (langGreetings.some(greeting => 
                normalizedText.includes(greeting.toLowerCase())
            )) {
                return lang;
            }
        }

        // Check patterns next
        for (const [lang, patterns] of Object.entries(greetingPatterns)) {
            if (patterns.some(pattern => pattern(normalizedText))) {
                return lang;
            }
        }

        // Check if it starts with common Spanish greeting beginnings
        if (normalizedText.startsWith('buen') || normalizedText.startsWith('hol')) {
            return 'es';
        }

        return 'en'; // default to English
    }

    static getTimeBasedResponse(lang = 'en') {
        const hour = new Date().getHours();
        const langResponses = responses[lang] || responses.en;

        if (hour < 12) return langResponses.morning;
        if (hour < 18) return langResponses.afternoon;
        return langResponses.evening;
    }
}