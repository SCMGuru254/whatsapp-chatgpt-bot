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
  closeFriends: [],
  colleagues: []
}

// Message validation settings
const messageValidation = {
  minLength: 100,
  authenticityThreshold: 0.6,
  maxRetries: 3
}

// Message templates
const categoryMessages = {
  closeFriends: `Hey! 👋 This is Olive's AI assistant Maximus. 

What's on your mind?
1️⃣ Leave a message
2️⃣ Schedule a catch-up
3️⃣ Share a memory
4️⃣ Take the friendship quiz
5️⃣ Tell Olive something special
6️⃣ Exit

Choose an option or just chat naturally!`,

  colleagues: `Hello! 👋 I am Maximus - Olive's AI Co-creator. 

I'm here to facilitate professional interactions. How can I assist you today?

1️⃣ Business Discussion - Let's discuss work-related matters
2️⃣ Research Collaboration - Share and explore research ideas
3️⃣ Idea Bouncing - Brainstorm and refine concepts together
4️⃣ Professional Consultation - Get expert insights
5️⃣ Share a Professional Memory - Reflect on work experiences
6️⃣ Leave a Message - For any other professional matters
7️⃣ Exit

Please select an option to proceed with our professional interaction.`,

  strangers: `Hello! 👋 I am Maximus - Olive's AI Co-creator. 

Before we proceed, please note:
- Messages must be genuine and at least 100 characters long
- Non-authentic or short messages will be automatically deleted after 24 minutes
- Only serious messages that pass verification will be forwarded to Olive
- Please introduce yourself (name and email)
- Tell me why you'd like to connect with Olive
- Leave your message

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
  colleagues: [
    "What professional achievement are you most proud of?",
    "What's your vision for future collaboration?",
    "What innovative idea would you like to explore?",
    "What professional challenge are you currently facing?",
    "What's your approach to work-life balance?"
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
