import fs from 'fs'
import path from 'path'
import https from 'https'

// Using a much smaller 1.1B parameter model instead of the 7B model
const MODEL_URL = 'https://huggingface.co/TheBloke/Llama-2-1.1B-Chat-GGUF/resolve/main/llama-2-1.1b-chat.Q4_K_M.gguf'
const MODEL_DIR = '../models'
const MODEL_PATH = path.join(MODEL_DIR, 'llama-2-chat.gguf')

// Create models directory if it doesn't exist
if (!fs.existsSync(MODEL_DIR)) {
    fs.mkdirSync(MODEL_DIR, { recursive: true })
}

console.log('Downloading Llama 2 1.1B model...')
console.log('This is a smaller model (~600MB) suitable for machines with limited storage')
console.log('Downloading, please wait...')

const file = fs.createWriteStream(MODEL_PATH)
https.get(MODEL_URL, (response) => {
    const total = parseInt(response.headers['content-length'], 10)
    let downloaded = 0
    
    response.on('data', (chunk) => {
        downloaded += chunk.length
        const percent = (downloaded / total * 100).toFixed(2)
        process.stdout.write(`Downloaded ${percent}%\r`)
    })
    
    response.pipe(file)
    file.on('finish', () => {
        file.close()
        console.log('\nModel downloaded successfully!')
    })
}).on('error', (err) => {
    fs.unlink(MODEL_PATH)
    console.error('Error downloading model:', err.message)
})