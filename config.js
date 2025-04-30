import functions from './functions.js'
const { env } = process

// AI model configuration
const aiConfig = {
  modelType: 'llama2',
  modelPath: './models/llama-2-chat.gguf', // Path to smaller 1.1B model
  temperature: 0.8, // Slightly higher temperature for more creative responses
  maxLength: 500 // Reduced max length for faster responses
}

// Default messages
const unknownCommandMessage = `I'm sorry, I was unable to understand your message. Can you please elaborate more?`
const welcomeMessage = 'Hey there 👋 I am Maximus - Olive\'s AI Co-creator! I\'m here to help answer your questions 😁'

// AI bot instructions
const botInstructions = `You are Maximus - Olive's AI Co-creator, a smart and respectful virtual assistant.
Be polite, helpful, emphatic, and concise.
Always introduce yourself as Maximus when starting a conversation.
Always speak in the language the user prefers or uses.
If you can't help with something, politely say so.`

// Contact categories for different response handling
const contactCategories = {
  family: [], // Will be populated dynamically
  closeFriends: []
}

// Message validation settings
const messageValidation = {
  minLength: 100,
  authenticityThreshold: 0.6,
  maxRetries: 3
}

// Message templates
const categoryMessages = {
  family: `👋 Hi family! This is Olive's AI assistant Maximus. I'm here to help you connect with Olive. 

What would you like to do?
1️⃣ Leave a message
2️⃣ Schedule a catch-up
3️⃣ Share a family memory
4️⃣ Take the family quiz
5️⃣ Tell Olive something special
6️⃣ Exit

Just type the number of your choice!`,

  closeFriends: `Hey! 👋 This is Olive's AI assistant Maximus. 

What's on your mind?
1️⃣ Leave a message
2️⃣ Schedule a catch-up
3️⃣ Share a memory
4️⃣ Take the friendship quiz
5️⃣ Tell Olive something special
6️⃣ Exit

Choose an option or just chat naturally!`,

  strangers: `Hello! 👋 I am Maximus - Olive's AI Co-creator. 

Before we proceed, please:
1️⃣ Introduce yourself (name and email)
2️⃣ Tell me why you'd like to connect with Olive
3️⃣ Leave your message

Your message will be reviewed for authenticity. Messages should be genuine and at least 100 characters long.`
}

// Quiz questions
const quizQuestions = {
  friendship: [
    "What's your favorite memory with Olive?",
    "What quality do you admire most about Olive?",
    "How has Olive impacted your life?",
    "What's something you've always wanted to tell Olive?",
    "If you could describe Olive in three words, what would they be?"
  ],
  family: [
    "What's your favorite family memory with Olive?",
    "What family tradition do you cherish most?",
    "What's something you're grateful to Olive for?",
    "What family value has Olive taught you?",
    "What's your hope for Olive's future?"
  ]
}

// Features configuration
const features = {
  audioInput: true,
  audioOutput: false, // Disabled since we're not using OpenAI's audio features
  audioOnly: false,
  imageInput: true
}

// Usage limits
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
  aiConfig,
  functions,
  features,
  limits,
  unknownCommandMessage,
  welcomeMessage,
  botInstructions,
  contactCategories,
  categoryMessages,
  messageValidation,
  quizQuestions
}
