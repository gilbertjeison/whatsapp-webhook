import axios from 'axios';
import { config } from '../config/env.js';

class WhatsAppService {
    constructor() {
        this.baseUrl = `https://graph.facebook.com/${config.API_VERSION}/${config.BUSINESS_PHONE}/messages`;
        this.headers = {
            "Authorization": `Bearer ${config.API_TOKEN}`,
            "Content-Type": "application/json"
        };
    }

    async sendMessage(to, content, messageId) {
        console.log('\n=== WhatsApp Service: Sending Message ===');
        console.log('To:', to);
        console.log('Content:', JSON.stringify(content, null, 2));
        console.log('Message ID:', messageId || 'No reply context');
        
        try {
            const messageData = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to
            };

            // Handle different message types
            if (typeof content === 'string') {
                // Simple text message
                messageData.type = "text";
                messageData.text = { body: content };
            } else if (content.type === "interactive") {
                // Interactive message (buttons)
                messageData.type = "interactive";
                messageData.interactive = content.interactive;
            } else {
                throw new Error('Unsupported message type');
            }

            // Add reply context if messageId is provided
            if (messageId) {
                messageData.context = {
                    message_id: messageId
                };
            }

            const response = await axios({
                method: "POST",
                url: this.baseUrl,
                headers: this.headers,
                data: messageData
            });
            
            console.log('Message sent successfully');
            console.log('Response:', JSON.stringify(response.data, null, 2));
            return response;
        } catch (error) {
            console.error('Error sending message:', error.response?.data || error.message);
            console.error('Request data:', JSON.stringify(error.config?.data, null, 2));
            throw error;
        }
    }

    async markMessageAsRead(messageId) {
        console.log('\n=== WhatsApp Service: Marking Message as Read ===');
        console.log('Message ID:', messageId);
        
        try {
            const response = await axios({
                method: "POST",
                url: this.baseUrl,
                headers: this.headers,
                data: {
                    messaging_product: "whatsapp",
                    status: "read",
                    message_id: messageId
                }
            });
            
            console.log('Message marked as read successfully');
            console.log('Response:', JSON.stringify(response.data, null, 2));
            return response;
        } catch (error) {
            console.error('Error marking message as read:', error.response?.data || error.message);
            throw error;
        }
    }

    async sendDocument(to, documentUrl, filename, messageId = null) {
        console.log('\n=== WhatsApp Service: Sending Document ===');
        console.log('To:', to);
        console.log('Document URL:', documentUrl);
        console.log('Filename:', filename);
        console.log('Message ID:', messageId || 'No reply context');
        
        try {
            const messageData = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to,
                type: "document",
                document: {
                    link: documentUrl,
                    filename: filename
                }
            };

            // Add reply context if messageId is provided
            if (messageId) {
                messageData.context = {
                    message_id: messageId
                };
            }

            const response = await axios({
                method: "POST",
                url: this.baseUrl,
                headers: this.headers,
                data: messageData
            });
            
            console.log('Document sent successfully');
            console.log('Response:', JSON.stringify(response.data, null, 2));
            return response;
        } catch (error) {
            console.error('Error sending document:', error.response?.data || error.message);
            console.error('Request data:', JSON.stringify(error.config?.data, null, 2));
            throw error;
        }
    }

    // Helper methods for creating message objects
    createButtonMessage(text, buttons) {
        return {
            type: "interactive",
            interactive: {
                type: "button",
                body: {
                    text: text
                },
                action: {
                    buttons: buttons.map((button, index) => ({
                        type: "reply",
                        reply: {
                            id: button.id || `btn_${index}`,
                            title: button.title || button
                        }
                    }))
                }
            }
        };
    }
}

export const whatsappService = new WhatsAppService();