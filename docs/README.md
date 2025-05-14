# Maximus - Olive's AI Co-creator

This repository contains the code for Maximus, a WhatsApp ChatGPT-powered Multimodal AI Chatbot that serves as Olive's AI Co-creator. The bot is designed to help users connect with Olive in a meaningful way through various interactive features.

## Features

- **Leave Messages**: Send messages to Olive through Maximus
- **Schedule Catch-ups**: Arrange time to connect with Olive
- **Share Memories**: Contribute to Olive's life story collection through the integrated Tally form
- **Take the Quiz**: Test how well you know Olive
- **Tell Olive Something**: Share thoughts and feelings with Olive

## Deployment

This bot is deployed using GitHub Pages for the web interface and requires a separate server component for the WhatsApp integration. Please follow the instructions in the [DEPLOYMENT.md](../DEPLOYMENT.md) file for detailed setup instructions.

## Tally Form Integration

The bot integrates with a Tally form (`https://tally.so/r/w4q5Mo`) that allows users to share their thoughts, memories, and messages with Olive. The form is embedded in the web interface and can also be accessed directly through the bot.

## Configuration

To configure the bot, you need to set up the following environment variables:

- `OPENAI_API_KEY`: Your OpenAI API key
- `WASSENGER_API_KEY`: Your Wassenger API key
- `WEBHOOK_URL`: Your webhook URL for receiving WhatsApp messages

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Set up environment variables
4. Start the bot with `npm start`
5. Access the web interface at `https://yourusername.github.io/whatsapp-chatgpt-bot/`

## License

This project is licensed under the MIT License - see the LICENSE file for details.