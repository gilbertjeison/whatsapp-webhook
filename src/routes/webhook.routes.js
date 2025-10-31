import express from 'express';
import { webhookController } from '../controllers/webhook.controller.js';

const router = express.Router();

// POST endpoint for receiving webhook messages
router.post("/webhook", webhookController.handleIncomingMessage);

// GET endpoint for webhook verification
router.get("/webhook", webhookController.verifyWebhook);

// Basic homepage route
router.get("/", (req, res) => {
    res.send(`<pre>Nothing to see here.
Checkout README.md to start, you know.</pre>`);
});

export default router;