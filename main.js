import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import OpenAI from 'openai'
import config from './config.js'
import * as store from './store.js'

// Initialize OpenAI client
const ai = new OpenAI({ apiKey: config.openaiKey })

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox']
  }
})

// Function to check contact category
function isFamily(contact) {
  const phone = contact.number || contact.id.user
  return config.contactCategories.family.includes(phone) || config.contactCategories.family.includes(phone.slice(1))
}

function isCloseFriend(contact) {
  const phone = contact.number || contact.id.user
  return config.contactCategories.closeFriends.includes(phone) || config.contactCategories.closeFriends.includes(phone.slice(1))
}

// Handle menu responses
async function handleMenuResponse(msg, body) {
  switch (body) {
    case '1':
      await msg.reply("Please leave your message and I'll get back to you.")
      break
    case '2':
      await msg.reply("What would be the best time to call you back?")
      break
    case '3':
      await msg.reply("Our business hours are:\nMonday-Friday: 9 AM - 5 PM\nSaturday: 10 AM - 2 PM\nSunday: Closed")
      break
    case '4':
      await msg.reply("Thank you for contacting us. Have a great day!")
      break
    default:
      return false
  }
  return true
}

// Generate AI response
async function generateAIResponse(messages) {
  try {
    const completion = await ai.chat.completions.create({
      messages,
      model: config.openaiModel,
      max_tokens: config.limits.maxOutputTokens,
      temperature: 0.7,
    })

    if (completion.choices?.length) {
      return completion.choices[0].message.content
    }
  } catch (err) {
    console.error('Error generating AI response:', err)
  }
  return config.unknownCommandMessage
}

// QR Code generation
client.on('qr', (qr) => {
  console.log('Scan this QR code in WhatsApp to log in:')
  qrcode.generate(qr, { small: true })
})

// Ready event
client.on('ready', () => {
  console.log('WhatsApp bot is ready!')
})

// Handle incoming messages
client.on('message', async (msg) => {
  try {
    const chat = await msg.getChat()
    const contact = await msg.getContact()
    
    // Skip processing for groups
    if (chat.isGroup) return

    // Check contact category
    if (isFamily(contact)) {
      console.log('Skipping family member message:', contact.number)
      return
    }

    if (isCloseFriend(contact)) {
      await msg.reply(config.categoryMessages.closeFriends)
      return
    }

    const body = msg.body.trim()

    // Handle menu responses
    if (/^[1-4]$/.test(body)) {
      const handled = await handleMenuResponse(msg, body)
      if (handled) return
    }

    // Show menu for first message or invalid option
    if (!store.state[chat.id]) {
      await msg.reply(config.categoryMessages.others)
      store.state[chat.id] = { messagesCount: 0 }
      return
    }

    // Increment message counter
    store.state[chat.id].messagesCount = (store.state[chat.id].messagesCount || 0) + 1

    // Check message limits
    if (store.state[chat.id].messagesCount > config.limits.maxMessagesPerChat) {
      await msg.reply("Message limit reached. Please start a new conversation.")
      return
    }

    // Generate AI response
    const messages = [
      { role: 'system', content: config.botInstructions },
      { role: 'user', content: body }
    ]

    const response = await generateAIResponse(messages)
    await msg.reply(response)

  } catch (err) {
    console.error('Error processing message:', err)
    await msg.reply(config.unknownCommandMessage)
  }
})

// Initialize the client
client.initialize()
