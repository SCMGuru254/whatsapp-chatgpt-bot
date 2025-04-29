const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

process.env.PUPPETEER_SKIP_DOWNLOAD = 'true';

// Debug logging
console.log('Starting initialization...');

// Initialize WhatsApp client
const client = new Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Add debug event handlers
client.on('loading_screen', (percent, message) => {
    console.log('Loading:', percent, '%', message);
});

client.on('authenticated', () => {
    console.log('Authenticated successfully!');
});

client.on('auth_failure', (err) => {
    console.log('Authentication failed:', err);
});

client.on('disconnected', (reason) => {
    console.log('Client disconnected:', reason);
});

client.on('qr', (qr) => {
    console.log('\n=== SCAN THIS QR CODE IN WHATSAPP ===\n');
    qrcode.generate(qr, { small: true });
    console.log('\n====================================\n');
});

client.on('ready', () => {
    console.log('✨ Maximus is ready to chat! ✨');
});

// Basic message handling
client.on('message', async (msg) => {
    try {
        console.log('Received message:', msg.body);
        const chat = await msg.getChat();
        if (chat.isGroup) return;

        const body = msg.body.trim();
        console.log('Processing message:', body);
        
        // Handle menu options
        if (/^[1-6]$/.test(body)) {
            console.log('Menu option selected:', body);
            switch (body) {
                case '1':
                    await msg.reply("Please leave your message and I'll make sure Olive gets it! 😊");
                    break;
                case '2':
                    await msg.reply("When would be a good time for Olive to catch up with you?");
                    break;
                case '3':
                    await msg.reply("Share a story or memory for Olive's life story collection: [Form Link Coming Soon]");
                    break;
                case '4':
                    await msg.reply("Fun Quiz Time! How well do you know Olive? [Quiz Link Coming Soon]");
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

        // Show default menu
        await msg.reply("Hello! 👋 I am Maximus - Olive's AI Co-creator.\n\n" +
            "Please select an option:\n\n" +
            "1️⃣ Leave a message\n" +
            "2️⃣ Schedule a chat\n" +
            "3️⃣ Share a story/memory\n" +
            "4️⃣ Take the friendship quiz\n" +
            "5️⃣ Ask something fun\n" +
            "6️⃣ Exit\n\n" +
            "Reply with a number to choose!");

    } catch (err) {
        console.error('Error handling message:', err);
    }
});

// Initialize with error handling
console.log('Initializing client...');
try {
    client.initialize();
} catch (err) {
    console.error('Failed to initialize:', err);
}
