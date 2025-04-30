import path from 'path'
import fs from 'fs/promises'
import OpenAI from 'openai'
import config from './config.js'
import { state, stats } from './store.js'
import * as actions from './actions.js'

// Initialize OpenAI client
const ai = new OpenAI({ apiKey: config.openaiKey })

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

  // Use AI to assess message authenticity
  const response = await ai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Rate the authenticity of this message on a scale of 0-1. Consider factors like emotional depth, personal connection, and genuine expression."
      },
      {
        role: "user",
        content: message
      }
    ],
    temperature: 0.3
  })

  const authenticityScore = parseFloat(response.choices[0].message.content)
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
    await chat.sendMessage(questions[state.quizIndex])
    state.quizIndex++
    userStates.set(chat.fromNumber, state)
  } else {
    // Quiz completed
    const summary = `Thank you for completing the quiz! Here's a summary of your answers:\n\n${state.answers.join('\n\n')}`
    await chat.sendMessage(summary)
    userStates.delete(chat.fromNumber)
  }
}

// Handle "Tell Olive something" feature
async function handleTellOlive(chat, message) {
  const validation = await validateMessage(message)
  if (!validation.valid) {
    await chat.sendMessage(validation.reason)
    return
  }

  const response = `Thank you for sharing this heartfelt message. Olive will cherish this. Would you like to hear what Olive would say to you? (Reply with "yes" or "no")`
  await chat.sendMessage(response)
  userStates.set(chat.fromNumber, { waitingForOliveResponse: true, message })
}

// Determine if a given inbound message can be replied by the AI bot
function canReply ({ data, device }) {
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

// Send message back to the user and perform post-message required actions like
// adding labels to the chat or updating the chat's contact metadata
function replyMessage ({ data, device, useAudio }) {
  return async ({ message, ...params }, { text } = {}) => {
    const { phone } = data.chat.contact

    // If audio mode, create a new voice message
    let fileId = null
    if (config.features.audioOutput && !text && message.length <= 4096 && (useAudio || config.features.audioOnly)) {
      // Send recording audio chat state in background
      actions.sendTypingState({ data, device, action: 'recording' })

      // Generate audio recording
      console.log('[info] generating audio response for chat:', data.fromNumber, message)
      const audio = await ai.audio.speech.create({
        input: message,
        model: 'tts-1',
        voice: config.features.voice,
        response_format: 'mp3',
        speed: config.features.voiceSpeed
      })

      const timestamp = Date.now().toString(16)
      const random = Math.floor(Math.random() * 0xfffff).toString(16)
      fileId = `${timestamp}${random}`

      const filepath = path.join(`${config.tempPath}`, `${fileId}.mp3`)
      const buffer = Buffer.from(await audio.arrayBuffer())
      await fs.writeFile(filepath, buffer)
    } else {
      // Send text typing chat state in background
      actions.sendTypingState({ data, device, action: 'typing' })
    }

    const payload = {
      phone,
      device: device.id,
      message,
      reference: 'bot:chatgpt',
      ...params
    }

    if (fileId) {
      payload.message = undefined
      // Get base URL and add path to the webhook
      const schema = new URL(config.webhookUrl)
      const url = `${schema.protocol}//${schema.host}${path.dirname(schema.pathname)}files/${fileId}${schema.search}`
      payload.media = { url, format: 'ptt' }
    }

    const msg = await actions.sendMessage(payload)

    // Store sent message in chat history
    state[data.chat.id] = state[data.chat.id] || {}
    state[data.chat.id][msg.waId] = {
      id: msg.waId,
      flow: 'outbound',
      date: msg.createdAt,
      body: message
    }

    // Increase chat messages quota
    stats[data.chat.id] = stats[data.chat.id] || { messages: 0, time: Date.now() }
    stats[data.chat.id].messages += 1

    // Add bot-managed chat labels, if required
    if (config.setLabelsOnBotChats.length) {
      const labels = config.setLabelsOnBotChats.filter(label => (data.chat.labels || []).includes(label))
      if (labels.length) {
        await actions.updateChatLabels({ data, device, labels })
      }
    }

    // Add bot-managed chat metadata, if required
    if (config.setMetadataOnBotChats.length) {
      const metadata = config.setMetadataOnBotChats.filter(entry => entry && entry.key && entry.value).map(({ key, value }) => ({ key, value }))
      await actions.updateChatMetadata({ data, device, metadata })
    }
  }
}

function parseArguments (json) {
  try {
    return JSON.parse(json || '{}')
  } catch (err) {
    return {}
  }
}

function hasChatMetadataQuotaExceeded (chat) {
  const key = chat.contact?.metadata?.find(x => x.key === 'bot:chatgpt:status')
  if (key?.value === 'too_many_messages') {
    return true
  }
  return false
}

// Messages quota per chat
function hasChatMessagesQuota (chat) {
  const stat = stats[chat.id] = stats[chat.id] || { messages: 0, time: Date.now() }
  if (stat.messages >= config.limits.maxMessagesPerChat) {
    // Reset chat messages quota after the time limit
    if ((Date.now() - stat.time) >= (config.limits.maxMessagesPerChatTime * 1000)) {
      stat.messages = 0
      stat.time = Date.now()
      return true
    }
    return false
  }
  return true
}

// Update chat metadata if messages quota is exceeded
async function updateChatOnMessagesQuota ({ data, device }) {
  const { chat } = data
  if (hasChatMetadataQuotaExceeded(chat)) {
    return false
  }

  await Promise.all([
    // Assign chat to an agent
    actions.assignChatToAgent({
      data,
      device,
      force: true
    }),
    // Update metadata status to 'too_many_messages'
    actions.updateChatMetadata({
      data,
      device,
      metadata: [{ key: 'bot:chatgpt:status', value: 'too_many_messages' }]
    })
  ])
}

// Helper functions to check contact category
function isFamily(phone, config) {
  return config.contactCategories.family.includes(phone) || config.contactCategories.family.includes(phone.slice(1));
}

function isCloseFriend(phone, config) {
  return config.contactCategories.closeFriends.includes(phone) || config.contactCategories.closeFriends.includes(phone.slice(1));
}

async function handleMenuResponse(body, reply) {
  switch (body) {
    case '1':
      await reply({ message: "Please leave your message and I'll get back to you." });
      break;
    case '2':
      await reply({ message: "What would be the best time to call you back?" });
      break;
    case '3':
      await reply({ message: "Our business hours are:\nMonday-Friday: 9 AM - 5 PM\nSaturday: 10 AM - 2 PM\nSunday: Closed" });
      break;
    case '4':
      await reply({ message: "Thank you for contacting us. Have a great day!" });
      break;
    default:
      return false;
  }
  return true;
}

// Process message received from the user on every new inbound webhook event
export async function processMessage ({ data, device } = {}) {
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
      await chat.sendMessage(config.categoryMessages.strangers)
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
      await chat.sendMessage('Thank you for introducing yourself! You can now leave your message.')
      return
    }
  }

  // Handle menu options
  if (body.match(/^[1-6]$/)) {
    const option = parseInt(body)
    switch (option) {
      case 1: // Leave message
        await chat.sendMessage('Please write your message. It should be at least 100 characters long and genuine.')
        userState.waitingForMessage = true
        break
      case 2: // Schedule catch-up
        await chat.sendMessage('Please suggest a date and time for the catch-up.')
        userState.waitingForSchedule = true
        break
      case 3: // Share memory
        await chat.sendMessage('Please share your memory. Make it detailed and heartfelt.')
        userState.waitingForMemory = true
        break
      case 4: // Take quiz
        await handleQuiz(chat, category)
        break
      case 5: // Tell Olive something
        await chat.sendMessage('What would you like to tell Olive? Make it meaningful and from the heart.')
        userState.waitingForOliveMessage = true
        break
      case 6: // Exit
        await chat.sendMessage('Thank you for chatting! Have a great day! 👋')
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
      await chat.sendMessage(validation.reason)
      return
    }

    if (userState.waitingForOliveMessage) {
      await handleTellOlive(chat, body)
    } else {
      await chat.sendMessage('Thank you for your message! Olive will get back to you soon.')
    }
    userStates.delete(chat.fromNumber)
    return
  }

  // Default response
  await chat.sendMessage(config.categoryMessages[category])
}
