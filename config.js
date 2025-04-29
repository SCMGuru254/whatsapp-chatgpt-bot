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
  family: ['1234567890'], 
  closeFriends: ['2345678901']
}

// Message templates
const categoryMessages = {
  closeFriends: `Hey! 👋 Long time no chat! This is Olive's AI assistant Maximus - she set me up a while back but maybe we haven't caught up since then! 😊 

Olive's still her fun, witty and kind self! She's working on some cool stuff including her life story. Here's what you can do:

1️⃣ Leave her a message
2️⃣ Schedule a catch-up
3️⃣ Share a story/memory for her book 📖
4️⃣ Take the friendship quiz! 🎯
5️⃣ Ask Olive something weird/funny 😄
6️⃣ Just say bye! 

Pick any option or just chat naturally! 🌟

PS: She's collecting real stories and memories from friends like you - would love to hear yours!`,

  others: `Hello! 👋 I am Maximus - Olive's AI Co-creator. 

Please select from these options:

1️⃣ Leave a message for Olive
2️⃣ Schedule a callback
3️⃣ Share something for her life story
4️⃣ View availability hours
5️⃣ Ask a question
6️⃣ Exit

Reply with the number of your choice.`
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
  categoryMessages
}
