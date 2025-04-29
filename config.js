import functions from './functions.js'
const { env } = process

// Required. Specify the OpenAI API key to be used
// You can sign up for free here: https://platform.openai.com/signup
// Obtain your API key here: https://platform.openai.com/account/api-keys
const openaiKey = env.OPENAI_API_KEY || ''

// Required. Set the OpenAI model to use
const openaiModel = env.OPENAI_MODEL || 'gpt-4o'

// Default message when the user sends an unknown message
const unknownCommandMessage = `I'm sorry, I was unable to understand your message. Can you please elaborate more?`

// Default welcome message
const welcomeMessage = 'Hey there 👋 Welcome to this ChatGPT-powered AI chatbot! I can speak many languages 😁'

// AI bot instructions to adjust its behavior
const botInstructions = `You are a smart virtual assistant.
Be polite, helpful, emphatic, and concise.
Always speak in the language the user prefers or uses.
If you can't help with something, politely say so.`

// Required. Contact categories for different response handling
const contactCategories = {
  // Family members will be exempted from bot responses
  family: ['1234567890'], // Add your family members' phone numbers here
  // Close friends will get a prompt response
  closeFriends: ['2345678901'], // Add your close friends' phone numbers here
}

// Message templates for different categories
const categoryMessages = {
  closeFriends: "Hi! 👋 I'll get back to you as soon as possible!",
  others: `Welcome! Please select an option from the menu:

1️⃣ Leave a message
2️⃣ Schedule a callback
3️⃣ View business hours
4️⃣ Exit

Reply with the number of your choice.`
}

// Chatbot features
const features = {
  audioInput: true,
  audioOutput: true,
  audioOnly: false,
  voice: 'echo',
  voiceSpeed: 1,
  imageInput: true
}

// Chatbot limits
const limits = {
  maxInputCharacters: 1000,
  maxOutputTokens: 1000,
  chatHistoryLimit: 20,
  maxMessagesPerChat: 500,
  maxMessagesPerChatCounterTime: 24 * 60 * 60,
  maxAudioDuration: 2 * 60,
  maxImageSize: 2 * 1024 * 1024
}

export default {
  openaiKey,
  openaiModel,
  functions,
  features,
  limits,
  unknownCommandMessage,
  welcomeMessage,
  botInstructions,
  contactCategories,
  categoryMessages
}
