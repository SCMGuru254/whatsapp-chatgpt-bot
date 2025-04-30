const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Using a different mirror for the model that doesn't require authentication
const MODEL_URL = 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF/resolve/main/tinyllama-1.1b-chat-v1.0.Q4_K_M.gguf';
const MODEL_DIR = path.join(process.cwd(), 'models');
const MODEL_PATH = path.join(MODEL_DIR, 'llama-2-chat.gguf');

async function downloadModel() {
    console.log('Model will be saved to:', MODEL_PATH);

    // Create models directory if it doesn't exist
    if (!fs.existsSync(MODEL_DIR)) {
        console.log('Creating models directory...');
        fs.mkdirSync(MODEL_DIR, { recursive: true });
    }

    console.log('Downloading TinyLlama model...');
    console.log('This is a smaller model suitable for machines with limited storage');
    console.log('Downloading, please wait...');

    try {
        const response = await axios({
            method: 'GET',
            url: MODEL_URL,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(MODEL_PATH);
        const total = parseInt(response.headers['content-length'], 10);
        let downloaded = 0;

        response.data.on('data', (chunk) => {
            downloaded += chunk.length;
            const percent = (downloaded / total * 100).toFixed(2);
            process.stdout.write(`Downloaded ${percent}%\r`);
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                console.log('\nModel downloaded successfully!');
                console.log('Saved to:', MODEL_PATH);
                const stats = fs.statSync(MODEL_PATH);
                console.log('File size:', (stats.size / (1024 * 1024)).toFixed(2), 'MB');
                resolve();
            });
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error downloading model:', error.message);
        if (fs.existsSync(MODEL_PATH)) {
            fs.unlinkSync(MODEL_PATH);
        }
        process.exit(1);
    }
}

downloadModel();