import path from 'path'
import fs from 'fs/promises'
import { createReadStream } from 'fs'
import express from 'express'
import bodyParser from 'body-parser'
import config from './config.js'
import { processMessage } from './enhanced-bot.js'
import { Client, LocalAuth } from 'whatsapp-web.js'
import qrcode from 'qrcode-terminal'
import * as actions from './actions.js'

// Create web server
const app = express()

// Middleware to parse incoming request bodies
app.use(bodyParser.json())

// Initialize WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox']
  }
})

// Generate QR Code
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true })
  console.log('QR Code generated! Please scan with your phone.')
})

// Handle client ready
client.on('ready', () => {
  console.log('Client is ready!')
})

// Handle incoming messages
client.on('message', async (message) => {
  try {
    await processMessage({
      data: {
        chat: {
          fromNumber: message.from,
          type: message.isGroup ? 'group' : 'chat',
          contact: {
            phone: message.from,
            status: message.isBlocked ? 'blocked' : 'active'
          }
        },
        body: message.body
      },
      device: {
        phone: client.info.wid._serialized
      }
    })
  } catch (error) {
    console.error('Error processing message:', error)
  }
})

// Index route
app.get('/', (req, res) => {
  res.send({
    name: 'chatbot',
    description: 'WhatsApp ChatGPT powered chatbot for Wassenger',
    endpoints: {
      webhook: {
        path: '/webhook',
        method: 'POST'
      },
      sendMessage: {
        path: '/message',
        method: 'POST'
      },
      sample: {
        path: '/sample',
        method: 'GET'
      }
    }
  })
})

// POST route to handle incoming webhook messages
app.post('/webhook', (req, res) => {
  const { body } = req
  if (!body || !body.event || !body.data) {
    return res.status(400).send({ message: 'Invalid payload body' })
  }
  if (body.event !== 'message:in:new') {
    return res.status(202).send({ message: 'Ignore webhook event: only message:in:new is accepted' })
  }

  // Send immediate response to acknowledge the webhook event
  res.send({ ok: true })

  // Process message response in background
  processMessage({
    data: {
      chat: {
        fromNumber: body.data.fromNumber,
        type: body.data.isGroup ? 'group' : 'chat',
        contact: {
          phone: body.data.fromNumber,
          status: body.data.isBlocked ? 'blocked' : 'active'
        }
      },
      body: body.data.body
    },
    device: {
      phone: client.info.wid._serialized
    }
  }).catch(err => {
    console.error('[error] failed to process inbound message:', body.id, body.data.fromNumber, body.data.body, err)
  })
})

// Send message on demand
app.post('/message', (req, res) => {
  const { body } = req
  if (!body || !body.phone || !body.message) {
    return res.status(400).send({ message: 'Invalid payload body' })
  }

  actions.sendMessage(body).then((data) => {
    res.send(data)
  }).catch(err => {
    res.status(+err.status || 500).send(err.response
      ? err.response.data
      : {
          message: 'Failed to send message'
        })
  })
})

// Send a sample message to your own number, or to a number specified in the query string
app.get('/sample', (req, res) => {
  const { phone, message } = req.query
  const data = {
    phone: phone || app.device.phone,
    message: message || 'Hello World from Wassenger!',
    device: app.device.id
  }
  actions.sendMessage(data).then((data) => {
    res.send(data)
  }).catch(err => {
    res.status(+err.status || 500).send(err.response
      ? err.response.data
      : {
          message: 'Failed to send sample message'
        })
  })
})

async function fileExists (filepath) {
  try {
    await fs.access(filepath, fs.constants.F_OK)
    return true
  } catch (err) {
    return false
  }
}

async function fileSize (filepath) {
  try {
    const stat = await fs.stat(filepath)
    return stat.size
  } catch (err) {
    return -1
  }
}

app.get('/files/:id', async (req, res) => {
  if (!(/^[a-f0-9]{15,18}$/i.test(req.params.id))) {
    return res.status(400).send({ message: 'Invalid ID' })
  }

  const filename = `${req.params.id}.mp3`
  const filepath = path.join(config.tempPath, filename)
  if (!(await fileExists(filepath))) {
    return res.status(404).send({ message: 'Invalid or deleted file' })
  }

  const size = await fileSize(filepath)
  if (!size) {
    return res.status(404).send({ message: 'Invalid or deleted file' })
  }

  res.set('Content-Length', size)
  res.set('Content-Type', 'application/octet-stream')

  createReadStream(filepath).pipe(res)

  res.once('close', () => {
    fs.unlink(filepath).catch(err => {
      console.error('[error] failed to delete temp file:', filepath, err.message)
    })
  })
})

app.use((err, req, res, next) => {
  res.status(+err.status || 500).send({
    message: `Unexpected error: ${err.message}`
  })
})

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  client.initialize()
})

export default app
