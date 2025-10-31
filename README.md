# WhatsApp Webhook with Gemini AI Integration

A production-ready WhatsApp webhook application that integrates Google's Gemini AI to provide intelligent conversational responses for a fashion e-commerce business.

## Features

- **WhatsApp Business API Integration**: Receive and respond to WhatsApp messages via webhook
- **AI-Powered Conversations**: Google Gemini 2.5 Flash for natural language processing
- **Interactive Menus**: Button-based navigation for better user experience
- **Security Features**:
  - Input validation and sanitization
  - Sensitive data detection
  - Rate limiting
  - CORS protection
  - Helmet security headers
- **Conversation Management**:
  - Session timeout handling
  - Message history tracking
  - Response caching
  - Exponential backoff retry logic
- **Logging**: Comprehensive Winston-based logging system
- **Development Tools**: Hot reload with nodemon

## Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js v5
- **AI**: Google Gemini API (@google/genai)
- **Security**: Helmet, CORS, express-rate-limit, express-validator
- **Logging**: Winston
- **Development**: Nodemon

## Prerequisites

- Node.js v18 or higher
- WhatsApp Business API account
- Google Gemini API key
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/gilbertjeison/whatsapp-webhook.git
cd whatsapp-webhook
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy the example file
cp .env-example .env

# Edit .env with your credentials
```

Required environment variables:
```env
WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token
API_TOKEN=your_whatsapp_api_token
PORT=3000
BUSINESS_PHONE=your_business_phone_number
API_VERSION=v22.0
GEMINI_API_KEY=your_gemini_api_key
```

## Configuration

### Getting API Credentials

#### WhatsApp Business API
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create an app and add WhatsApp Business API
3. Get your API token and phone number ID
4. Set up webhook with your verify token

#### Google Gemini API
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key to your `.env` file

### Environment Files

The project supports multiple environment configurations:
- `.env` - Default configuration
- `.env.development` - Development environment
- `.env.production` - Production environment

## Usage

### Development Mode
```bash
npm run dev
```
Starts the server with nodemon for hot reloading.

### Production Mode
```bash
npm start
```
Starts the server in production mode.

### Webhook Setup

1. Start your server (must be publicly accessible)
2. Configure WhatsApp webhook URL: `https://your-domain.com/webhook`
3. Set verify token to match your `WEBHOOK_VERIFY_TOKEN`
4. Subscribe to message events

## Project Structure

```
whatsapp-webhook/
├── src/
│   ├── app.js                      # Main application entry point
│   ├── config/
│   │   ├── env.js                  # Environment configuration
│   │   └── logger.js               # Winston logger setup
│   ├── controllers/
│   │   └── webhook.controller.js   # Webhook request handlers
│   ├── routes/
│   │   └── webhook.routes.js       # API routes
│   ├── services/
│   │   ├── gemini.service.js       # Gemini AI integration
│   │   ├── message.handler.js      # Message processing logic
│   │   └── whatsapp.service.js     # WhatsApp API client
│   ├── utils/
│   │   ├── greeting.util.js        # Greeting detection
│   │   └── security.util.js        # Security utilities
│   └── media/
│       └── guia-tallas.pdf         # Size guide document
├── logs/                           # Application logs
├── .env-example                    # Environment template
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies
├── nodemon.json                    # Nodemon configuration
└── README.md                       # This file
```

## API Endpoints

### GET /webhook
Webhook verification endpoint for WhatsApp.

**Query Parameters:**
- `hub.mode` - Should be "subscribe"
- `hub.verify_token` - Your verification token
- `hub.challenge` - Challenge string to return

### POST /webhook
Receives webhook events from WhatsApp.

**Request Body:** WhatsApp webhook payload

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "UP",
  "timestamp": "2025-10-31T12:00:00.000Z"
}
```

## Features in Detail

### Interactive Menu System
Users can interact with buttons for:
- 📚 View Catalog
- ✨ Make Fashion Queries
- ❓ Help & Support
- 💌 Contact Information
- 📋 FAQ
- 📏 Size Guide

### AI Conversation Flow
1. User initiates conversation with greeting
2. System detects language and responds with menu
3. User selects "Consultar" to ask fashion-related questions
4. Gemini AI processes queries about:
   - Style advice
   - Outfit combinations
   - Fashion trends
   - Product recommendations
5. Conversation tracking with 30-minute timeout
6. Feedback collection after responses

### Security Measures
- Input validation and sanitization
- Sensitive information detection (credit cards, emails, etc.)
- Rate limiting (20 requests per minute per user)
- CORS protection
- Security headers with Helmet
- 10kb payload size limit

### Error Handling
- Exponential backoff retry for API calls
- Response caching with fallback
- Graceful degradation
- Comprehensive error logging

## Deployment

### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start ecosystem.config.json
pm2 save
pm2 startup
```

### Using Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production
Ensure all production environment variables are set:
- Use strong tokens and secrets
- Set `NODE_ENV=production`
- Configure proper CORS origins
- Use HTTPS in production

## Monitoring

Logs are stored in the `logs/` directory:
- Combined logs: All application logs
- Error logs: Error-level logs only

Configure log levels in `src/config/logger.js`.

## Troubleshooting

### Common Issues

**Error: "GEMINI_API_KEY is not defined"**
- Ensure `.env` file exists and contains `GEMINI_API_KEY`

**Webhook verification fails**
- Check that `WEBHOOK_VERIFY_TOKEN` matches Meta's configuration
- Ensure server is publicly accessible

**Messages not being received**
- Verify webhook subscription includes message events
- Check WhatsApp API token is valid
- Review application logs for errors

**Windows compatibility issues**
- The project uses cross-platform npm scripts
- Use `npx nodemon` if nodemon command not found

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

ISC

## Support

For issues and questions:
- Create an issue on GitHub
- Contact: [Your contact information]

## Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- Powered by Google Gemini AI
- WhatsApp Business API by Meta

## Changelog

### v1.0.0 (2025-10-31)
- Initial release
- WhatsApp webhook integration
- Gemini AI integration (gemini-2.5-flash)
- Interactive button menus
- Security features
- Conversation management
- Logging system
- Windows compatibility fixes
