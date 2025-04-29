import { LlamaModel, LlamaContext, LlamaChatSession } from 'node-llama-cpp'
import config from './config.js'

// Initialize the AI model
const model = new LlamaModel({
    modelPath: config.aiConfig.modelPath,
    gpuLayers: 0 // Increase this if you have a GPU
})
const context = new LlamaContext({ model })
const session = new LlamaChatSession({ context })

export async function generateResponse(messages) {
    try {
        // Add system instructions
        await session.prompt(config.botInstructions)

        // Process conversation history
        for (const message of messages) {
            if (message.role === 'user') {
                await session.prompt(message.content)
            }
        }

        // Generate response
        const response = await session.prompt('', {
            maxTokens: config.limits.maxOutputTokens,
            temperature: config.aiConfig.temperature,
            stopSequence: ['User:', 'Assistant:']
        })

        return response
    } catch (err) {
        console.error('Error generating AI response:', err)
        return config.unknownCommandMessage
    }
}

// Clean up resources when done
process.on('exit', () => {
    session.free()
    context.free()
    model.free()
})