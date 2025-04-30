// In-memory store for chat states and message counters
export const state = {}

// Store for conversation history
export const chatHistory = {}

// Cache implementation
export const cache = new Map()
export const cacheTTL = 3600 // 1 hour in seconds

// Stats tracking
export const stats = {}
