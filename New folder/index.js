const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// Initialize WhatsApp client with minimal configuration
const client = new Client({
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// Debug events
client.on('loading_screen', (percent, message) => {
    console.log('LOADING:', percent, message);
});

client.on('qr', (qr) => {
    console.log('\n=== SCAN THIS QR CODE IN WHATSAPP ===\n');
    qrcode.generate(qr, { small: true });
    console.log('\n====================================\n');
});

client.on('authenticated', () => {
    console.log('✨ Authentication successful!');
});

client.on('ready', () => {
    console.log('✨ Maximus is ready to chat!');
});

// Error handling
client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ WhatsApp disconnected:', reason);
});

// Message handling
client.on('message', async (msg) => {
    try {
        // Skip group messages
        const chat = await msg.getChat();
        if (chat.isGroup) return;

        const body = msg.body.trim();

        // Menu options
        if (/^[1-6]$/.test(body)) {
            switch (body) {
                case '1':
                    await msg.reply("Please leave your message and I'll make sure Olive gets it! 😊");
                    break;
                case '2':
                    await msg.reply("When would be a good time for Olive to catch up with you?");
                    break;
                case '3': 
                    await msg.reply("Share a memory or story about you and Olive for her life story collection! 📖");
                    break;
                case '4':
                    await msg.reply("Fun Quiz Time! How well do you know Olive? Coming soon! 🎯");
                    break;
                case '5':
                    await msg.reply("Got something weird/funny to ask? Go ahead, Olive loves those! 😄");
                    break;
                case '6':
                    await msg.reply("Thanks for reaching out! Have a wonderful day! ✨");
                    break;
            }
            return;
        }

        // Default menu
        await msg.reply(`Hey! 👋 I'm Maximus - Olive's AI Assistant!

Choose an option:

1️⃣ Leave a message
2️⃣ Schedule a chat
3️⃣ Share a story/memory
4️⃣ Take the friendship quiz
5️⃣ Ask something fun/weird
6️⃣ Exit

Reply with a number to choose!`);

    } catch (err) {
        console.error('Error:', err);
    }
});

// Start the client
console.log('Starting Maximus... Please wait while connecting to WhatsApp...');
client.initialize();