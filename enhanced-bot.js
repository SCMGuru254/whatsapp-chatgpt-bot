import path from 'path'
import fs from 'fs/promises'
import { LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp'
import config from './config.js'
import { state, stats } from './store.js'
import * as actions from './actions.js'

// Initialize Llama model
const model = new LlamaModel({
  modelPath: config.aiConfig.modelPath,
  gpuLayers: 0 // Set to 0 for CPU-only, increase for GPU acceleration
})
const context = new LlamaContext({ model })
const session = new LlamaChatSession({ context })

// User state management
const userStates = new Map()

// Message validation function
async function validateMessage(message) {
  if (message.length < config.messageValidation.minLength) {
    return {
      valid: false,
      reason: 'Message too short. Please write at least 100 characters.'
    }
  }

  // Use Llama to assess message authenticity
  const prompt = `Rate the authenticity of this message on a scale of 0-1. Consider factors like emotional depth, personal connection, and genuine expression. Message: "${message}"`
  
  const response = await session.prompt(prompt, {
    temperature: config.aiConfig.temperature,
    maxTokens: config.aiConfig.maxLength
  })

  const authenticityScore = parseFloat(response)
  return {
    valid: authenticityScore >= config.messageValidation.authenticityThreshold,
    score: authenticityScore,
    reason: authenticityScore < config.messageValidation.authenticityThreshold 
      ? 'Message seems insincere. Please write a more genuine message.' 
      : null
  }
}

// Handle quiz functionality
async function handleQuiz(chat, category) {
  const questions = config.quizQuestions[category]
  const state = userStates.get(chat.fromNumber) || { quizIndex: 0, answers: [] }
  
  if (state.quizIndex < questions.length) {
    await actions.sendMessage({ phone: chat.fromNumber, message: questions[state.quizIndex] })
    state.quizIndex++
    userStates.set(chat.fromNumber, state)
  } else {
    // Quiz completed
    const summary = `Thank you for completing the quiz! Here's a summary of your answers:\n\n${state.answers.join('\n\n')}`
    await actions.sendMessage({ phone: chat.fromNumber, message: summary })
    userStates.delete(chat.fromNumber)
  }
}

// Handle "Tell Olive something" feature
async function handleTellOlive(chat, message) {
  const validation = await validateMessage(message)
  if (!validation.valid) {
    await actions.sendMessage({ phone: chat.fromNumber, message: validation.reason })
    return
  }

  const response = `Thank you for sharing this heartfelt message. Olive will cherish this. Would you like to hear what Olive would say to you? (Reply with "yes" or "no")`
  await actions.sendMessage({ phone: chat.fromNumber, message: response })
  userStates.set(chat.fromNumber, { waitingForOliveResponse: true, message })
}

// Process incoming messages
export async function processMessage({ data, device } = {}) {
  if (!canReply({ data, device })) {
    return
  }

  const { chat, body } = data
  const userState = userStates.get(chat.fromNumber) || {}

  // Handle user category
  let category = 'strangers'
  if (config.contactCategories.family.includes(chat.fromNumber)) {
    category = 'family'
  } else if (config.contactCategories.closeFriends.includes(chat.fromNumber)) {
    category = 'closeFriends'
  }

  // Handle unsaved numbers
  if (category === 'strangers' && !userState.introduced) {
    if (!userState.waitingForIntroduction) {
      await actions.sendMessage({ phone: chat.fromNumber, message: config.categoryMessages.strangers })
      userState.waitingForIntroduction = true
      userStates.set(chat.fromNumber, userState)
      return
    }

    // Process introduction
    const [name, email, reason] = body.split('\n')
    if (name && email && reason) {
      userState.introduced = true
      userState.name = name
      userState.email = email
      userState.reason = reason
      userStates.set(chat.fromNumber, userState)
      await actions.sendMessage({ phone: chat.fromNumber, message: 'Thank you for introducing yourself! You can now leave your message.' })
      return
    }
  }

  // Handle menu options
  if (body.match(/^[1-6]$/)) {
    const option = parseInt(body)
    switch (option) {
      case 1: // Leave message
        await actions.sendMessage({ phone: chat.fromNumber, message: 'Please write your message. It should be at least 100 characters long and genuine.' })
        userState.waitingForMessage = true
        break
      case 2: // Schedule catch-up
        await actions.sendMessage({ phone: chat.fromNumber, message: 'Please suggest a date and time for the catch-up.' })
        userState.waitingForSchedule = true
        break
      case 3: // Share memory
        await actions.sendMessage({ phone: chat.fromNumber, message: 'Please share your memory. Make it detailed and heartfelt.' })
        userState.waitingForMemory = true
        break
      case 4: // Take quiz
        await handleQuiz(chat, category)
        break
      case 5: // Tell Olive something
        await actions.sendMessage({ phone: chat.fromNumber, message: 'What would you like to tell Olive? Make it meaningful and from the heart.' })
        userState.waitingForOliveMessage = true
        break
      case 6: // Exit
        await actions.sendMessage({ phone: chat.fromNumber, message: 'Thank you for chatting! Have a great day! 👋' })
        userStates.delete(chat.fromNumber)
        return
    }
    userStates.set(chat.fromNumber, userState)
    return
  }

  // Handle waiting states
  if (userState.waitingForMessage || userState.waitingForMemory || userState.waitingForOliveMessage) {
    const validation = await validateMessage(body)
    if (!validation.valid) {
      await actions.sendMessage({ phone: chat.fromNumber, message: validation.reason })
      return
    }

    if (userState.waitingForOliveMessage) {
      await handleTellOlive(chat, body)
    } else {
      await actions.sendMessage({ phone: chat.fromNumber, message: 'Thank you for your message! Olive will get back to you soon.' })
    }
    userStates.delete(chat.fromNumber)
    return
  }

  // Default response
  await actions.sendMessage({ phone: chat.fromNumber, message: config.categoryMessages[category] })
}

// Helper function to determine if a message can be replied to
function canReply({ data, device }) {
  const { chat } = data

  // Skip chat if already assigned to a team member
  if (chat.owner?.agent) {
    return false
  }

  // Skip messages receive from the same number: prevent self-reply loops
  if (chat.fromNumber === device.phone) {
    console.log('[debug] Skip message: cannot chat with your own WhatsApp number:', device.phone)
    return false
  }

  // Skip messages from group chats and channels
  if (chat.type !== 'chat') {
    return false
  }

  // Skip replying chat if it has one of the configured labels, when applicable
  if (config.skipChatWithLabels && config.skipChatWithLabels.length && chat.labels && chat.labels.length) {
    if (config.skipChatWithLabels.some(label => chat.labels.includes(label))) {
      return false
    }
  }

  // Only reply to chats that were whitelisted, when applicable
  if (config.numbersWhitelist && config.numbersWhitelist.length && chat.fromNumber) {
    if (config.numbersWhitelist.some(number => number === chat.fromNumber || chat.fromNumber.slice(1) === number)) {
      return true
    } else {
      return false
    }
  }

  // Skip replying to chats that were explicitly blacklisted, when applicable
  if (config.numbersBlacklist && config.numbersBlacklist.length && chat.fromNumber) {
    if (config.numbersBlacklist.some(number => number === chat.fromNumber || chat.fromNumber.slice(1) === number)) {
      return false
    }
  }

  // Skip replying to blocked chats
  if (chat.status === 'banned' || chat.waStatus === 'banned') {
    return false
  }

  // Skip blocked contacts
  if (chat.contact?.status === 'blocked') {
    return false
  }

  // Skip replying chats that were archived, when applicable
  if (config.skipArchivedChats && (chat.status === 'archived' || chat.waStatus === 'archived')) {
    return false
  }

  return true
}