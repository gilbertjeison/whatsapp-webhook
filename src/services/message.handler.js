import { whatsappService } from './whatsapp.service.js';
import { GreetingUtil } from '../utils/greeting.util.js';
import { geminiService } from './gemini.service.js';
import { SecurityUtil, SENSITIVE_PATTERNS } from '../utils/security.util.js';

// Define main menu buttons in one place to avoid repetition
const MAIN_MENU_BUTTONS = [
    { id: "catalog", title: "Ver Catálogo 👚" },
    { id: "consultar", title: "Consultar ✨" },
    { id: "help", title: "Ayuda ❓" }
];


class MessageHandler {
    constructor() {
        this.assistantState = {};
    }
    async handleMessage(message, sender) {
        console.log('\n=== Message Handler Started ===');

        // Basic message validation
        if (!message?.type || !message?.from || !message?.id) {
            console.error('Invalid message format');
            return;
        }

        // Validate phone number
        if (!SecurityUtil.isValidPhone(message.from)) {
            console.error('Invalid phone number format:', message.from);
            return;
        }

        // Get sender name for personalized responses
        const senderName = sender?.profile?.name || 'Unknown';

        // Check for sensitive information in message
        if (message.type === 'text') {
            const containsSensitive = SENSITIVE_PATTERNS.some(pattern =>
                pattern.test(message.text.body)
            );

            if (containsSensitive) {
                console.warn('Message contains sensitive information');
                await whatsappService.sendMessage(
                    message.from,
                    "⚠️ Por tu seguridad, evita compartir información sensible como números de tarjeta, correos electrónicos o datos personales."
                );
                return;
            }

            // Sanitize input
            try {
                message.text.body = SecurityUtil.validateInput(message.text.body);
            } catch (error) {
                console.warn('Input validation failed:', error.message);
                await whatsappService.sendMessage(
                    message.from,
                    "⚠️ Tu mensaje no cumple con nuestras políticas de seguridad. Por favor, intenta de nuevo."
                );
                return;
            }
        }

        try {
            // Handle interactive messages (button responses)
            if (message.type === "interactive" && message.interactive?.type === "button_reply") {
                const buttonId = message.interactive.button_reply.id;

                switch (buttonId) {
                    case "catalog":
                        await whatsappService.sendMessage(
                            message.from,
                            "👚 *Colección Topped*\n\n" +
                            "✨ *Blusas Casuales:*\n" +
                            "   • Blusa Orquídea - Perfecta para el día a día\n" +
                            "   • Top Caribe - El básico que necesitas\n\n" +
                            "✨ *Blusas Elegantes:*\n" +
                            "   • Blusa Cartagena - Para ocasiones especiales\n" +
                            "   • Top Bogotá - Tu aliado en eventos\n\n" +
                            "¿Te gustaría ver fotos de algún modelo en particular?",
                            message.id
                        );
                        break;

                    case "consultar":
                        this.assistantState[message.from] = {
                            step: 'question',
                            startTime: Date.now()
                        };
                        await whatsappService.sendMessage(
                            message.from,
                            "✨ *Realiza tu consulta sobre moda, vestuario o nuestros productos*\n\n" +
                            "Puedes preguntarme sobre:\n" +
                            "• Consejos de estilo\n" +
                            "• Combinación de prendas\n" +
                            "• Tendencias de moda\n" +
                            "• Nuestros productos\n" +
                            "• Recomendaciones personalizadas",
                            message.id
                        );
                        break;

                    case "help":
                        const menuMessage = whatsappService.createButtonMessage(
                            "¿Cómo podemos ayudarte hoy?\n\nElige una de las siguientes opciones:",
                            [
                                { id: "contact", title: "Contacto 💌" },
                                { id: "faq", title: "Preguntas 📋" },
                                { id: "size", title: "Tallas 📏" }
                            ]
                        );
                        await whatsappService.sendMessage(message.from, menuMessage, message.id);
                        break;

                    case "contact":
                        await whatsappService.sendMessage(
                            message.from,
                            "💌 *Contacto Topped*\n\n" +
                            "Estamos para atenderte:\n\n" +
                            "📱 WhatsApp: +57 321 234 5678\n" +
                            "✉️ Email: hola@topped.co\n" +
                            "⏰ Horario: Lun-Vie, 8AM-6PM\n" +
                            "📍 Bogotá, Colombia",
                            message.id
                        );
                        break;

                    case "faq":
                        await whatsappService.sendMessage(
                            message.from,
                            "📋 *Preguntas Frecuentes*\n\n" +
                            "1. ¿Cómo realizo mi pedido?\n" +
                            "   → Escríbenos por WhatsApp o visita topped.co\n\n" +
                            "2. ¿Cuánto tarda el envío?\n" +
                            "   → 1-2 días hábiles en Bogotá, 2-4 días resto del país\n\n" +
                            "3. ¿Qué formas de pago aceptan?\n" +
                            "   → PSE, tarjetas de crédito, efectivo en Efecty o Baloto\n\n" +
                            "4. ¿Tienen cambios y devoluciones?\n" +
                            "   → Sí, hasta 7 días después de tu compra",
                            message.id
                        );
                        break;

                    case "size":
                        // First send a brief message
                        await whatsappService.sendMessage(
                            message.from,
                            "📏 *Guía de Tallas Topped*\n\n" +
                            "Te enviamos nuestra guía completa de tallas.\n\n" +
                            "¿Necesitas ayuda para elegir tu talla? ¡Con gusto te asesoramos! 💁‍♀️",
                            message.id
                        );

                        // Then send the size guide document
                        const documentUrl = "http://ropadetrabajoonline.com/tallajes/garys.pdf";
                        await whatsappService.sendDocument(
                            message.from,
                            documentUrl,
                            "Guía de Tallas - Topped",
                            message.id
                        );
                        break;

                    default:
                        await whatsappService.sendMessage(
                            message.from,
                            "Lo siento, no reconozco esa opción. Por favor, intenta de nuevo.",
                            message.id
                        );
                }
            }
            // Handle text messages
            else if (message.type === "text" && message.text?.body) {
                const messageText = message.text.body;

                if (GreetingUtil.isGreeting(messageText)) {
                    const lang = GreetingUtil.getLanguage(messageText);
                    const greeting = GreetingUtil.getTimeBasedResponse(lang);

                    const menuMessage = whatsappService.createButtonMessage(
                        `${greeting} ${senderName}! 👋\n¡Bienvenida a Topped! ¿Qué te gustaría ver?`,
                        MAIN_MENU_BUTTONS
                    );
                    await whatsappService.sendMessage(message.from, menuMessage, message.id);
                }
                else if (this.assistantState[message.from]) {
                    await this.handleAssistantFlow(message.from, message);
                } else {
                    const menuMessage = whatsappService.createButtonMessage(
                        "¡Hola! ¿En qué podemos ayudarte hoy? 💖",
                        MAIN_MENU_BUTTONS
                    );
                    await whatsappService.sendMessage(message.from, menuMessage, message.id);
                }

                await whatsappService.markMessageAsRead(message.id);
            }

        } catch (error) {
            console.error('Error in handleMessage:', error);
            throw error; // Let controller handle the error
        }
    }

    /**
     * Check if a conversation has timed out
     * @param {number} startTime - The timestamp when the conversation started
     * @returns {boolean}
     */
    _isConversationTimedOut(startTime) {
        const timeoutMinutes = 30;
        return Date.now() - startTime > timeoutMinutes * 60 * 1000;
    }

    /**
     * Format the AI response for WhatsApp
     * @param {string} response - The raw AI response
     * @returns {string} - Formatted response
     */
    _formatAIResponse(response) {
        // Add markdown formatting for WhatsApp
        let formatted = response
            .replace(/\*\*(.*?)\*\*/g, '*$1*')  // Bold
            .replace(/_(.*?)_/g, '_$1_')        // Italic
            .replace(/`(.*?)`/g, '*$1*')        // Code blocks as bold
            .replace(/\n{3,}/g, '\n\n');        // Remove excessive newlines

        // Ensure proper spacing around lists
        formatted = formatted.replace(/^[•\-\*]\s*/gm, '\n• ');

        return formatted.trim();
    }

    async handleAssistantFlow(to, message) {
        const state = this.assistantState[to];

        try {
            // Check for conversation timeout
            if (this._isConversationTimedOut(state.startTime)) {
                await whatsappService.sendMessage(
                    to,
                    "La sesión ha expirado por inactividad. Por favor, inicia una nueva consulta."
                );
                delete this.assistantState[to];
                geminiService.endConversation(to);
                return;
            }

            if (state.step === 'question') {
                // Show typing indicator
                await whatsappService.sendMessage(
                    to,
                    "⌛ Procesando tu consulta..."
                );

                // Get AI response
                const response = await geminiService.chat(to, message.text.body);
                const formattedResponse = this._formatAIResponse(response.text);

                // Send the AI's response
                await whatsappService.sendMessage(to, formattedResponse);

                // If the AI's response indicates completion, show feedback menu
                if (response.done) {
                    // Add a small delay before showing the feedback menu
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    const menuMessage = whatsappService.createButtonMessage(
                        "¿La respuesta fue de tu agrado?",
                        [
                            { id: "si", title: "Sí 👍" },
                            { id: "no", title: "No 👎" },
                            { id: "otra_pregunta", title: "Otra pregunta ❓" }
                        ]
                    );
                    await whatsappService.sendMessage(to, menuMessage, message.id);
                    this.assistantState[to] = {
                        ...state,
                        step: 'feedback',
                        lastResponse: formattedResponse
                    };
                } else {
                    // Update conversation state
                    this.assistantState[to] = {
                        ...state,
                        lastResponse: formattedResponse
                    };
                }
            } else if (state.step === 'feedback') {
                switch (message.interactive?.button_reply?.id) {
                    case "si":
                        await whatsappService.sendMessage(
                            to,
                            "¡Me alegro de haber podido ayudarte! 😊\n\n" +
                            "Recuerda que puedes preguntarme lo que necesites sobre moda y nuestros productos."
                        );
                        // End conversation and show main menu
                        delete this.assistantState[to];
                        geminiService.endConversation(to);

                        const mainMenu = whatsappService.createButtonMessage(
                            "¿Qué más te gustaría hacer?",
                            MAIN_MENU_BUTTONS
                        );
                        await whatsappService.sendMessage(to, mainMenu, message.id);
                        break;

                    case "no":
                        await whatsappService.sendMessage(
                            to,
                            "Lamento no haber podido ayudarte como esperabas.\n\n" +
                            "Para poder ayudarte mejor, ¿podrías reformular tu pregunta con más detalles?"
                        );
                        this.assistantState[to] = {
                            step: 'question',
                            startTime: Date.now(),
                            previousQuestion: message.text.body
                        };
                        break;

                    case "otra_pregunta":
                        await whatsappService.sendMessage(
                            to,
                            "¡Claro! ¿Qué más te gustaría saber sobre moda o nuestros productos? 😊"
                        );
                        this.assistantState[to] = {
                            step: 'question',
                            startTime: Date.now()
                        };
                        break;

                    default:
                        // If user types text instead of using buttons, treat it as a new question
                        if (message.type === "text") {
                            await whatsappService.sendMessage(
                                to,
                                "⌛ Procesando tu nueva consulta..."
                            );

                            // Reset state to question step
                            this.assistantState[to] = {
                                step: 'question',
                                startTime: Date.now()
                            };

                            // Get AI response directly without recursion
                            const response = await geminiService.chat(to, message.text.body);
                            const formattedResponse = this._formatAIResponse(response.text);

                            // Send the AI's response
                            await whatsappService.sendMessage(to, formattedResponse);

                            // If done, show feedback menu
                            if (response.done) {
                                await new Promise(resolve => setTimeout(resolve, 1000));

                                const menuMessage = whatsappService.createButtonMessage(
                                    "¿La respuesta fue de tu agrado?",
                                    [
                                        { id: "si", title: "Sí 👍" },
                                        { id: "no", title: "No 👎" },
                                        { id: "otra_pregunta", title: "Otra pregunta ❓" }
                                    ]
                                );
                                await whatsappService.sendMessage(to, menuMessage, message.id);
                                this.assistantState[to] = {
                                    ...this.assistantState[to],
                                    step: 'feedback',
                                    lastResponse: formattedResponse
                                };
                            } else {
                                // Update conversation state
                                this.assistantState[to] = {
                                    ...this.assistantState[to],
                                    lastResponse: formattedResponse
                                };
                            }
                        }
                }
            }
        } catch (error) {
            console.error('Error in handleAssistantFlow:', error);

            // Send appropriate error message to user
            const errorMessage = error.message.includes('Failed to generate response')
                ? "Lo siento, estoy teniendo problemas para procesar tu consulta. ¿Podrías intentarlo de nuevo?"
                : "Hubo un problema técnico. Por favor, intenta de nuevo en unos momentos.";

            await whatsappService.sendMessage(to, errorMessage);

            // Clean up the conversation state
            delete this.assistantState[to];
            geminiService.endConversation(to);

            // Show main menu after error
            const menuMessage = whatsappService.createButtonMessage(
                "¿Te gustaría intentar otra cosa?",
                MAIN_MENU_BUTTONS
            );
            await whatsappService.sendMessage(to, menuMessage, message.id);
        }
    }
}

export const messageHandler = new MessageHandler();