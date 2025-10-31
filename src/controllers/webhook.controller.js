import { messageHandler } from '../services/message.handler.js';
import { config } from '../config/env.js';

class WebhookController {
    async handleIncomingMessage(req, res) {
        try {
            console.log('\n=== Webhook Request Received ===');

            const value = req.body.entry?.[0]?.changes[0]?.value;
            const message = value?.messages?.[0];
            const sender = value?.contacts?.[0];

            if (message) {
                // Pass both message and sender info to handler
                await messageHandler.handleMessage(message, sender);
            }
            
            res.sendStatus(200);
        } catch (error) {
            console.error('Error handling incoming messages:', error);
            res.sendStatus(500);
        }
    }

    verifyWebhook(req, res) {
        const mode = req.query["hub.mode"];
        const token = req.query["hub.verify_token"];
        const challenge = req.query["hub.challenge"];

        // check the mode and token sent are correct
        if (mode === "subscribe" && token === config.WEBHOOK_VERIFY_TOKEN) {
            // respond with 200 OK and challenge token
            res.status(200).send(challenge);
            console.log("Webhook verified successfully!");
        } else {
            // respond with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
}

export const webhookController = new WebhookController();