import { create } from 'zustand'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatStore {
  messages: Message[]
  addMessage: (role: 'user' | 'assistant', content: string) => void
  clearHistory: () => void
}

export const useChatStore = create<ChatStore>()((set, get) => ({
  messages: [],
  addMessage: (role, content) => {
    const newMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now()
    }
    const newMessages = [...get().messages, newMessage]
    set({ messages: newMessages })
    chrome.storage.local.set({ chatHistory: newMessages })
  },
  clearHistory: () => {
    set({ messages: [] })
    chrome.storage.local.remove(['chatHistory'])
  }
}))

// Load history on init
chrome.storage.local.get(['chatHistory']).then(result => {
  if (result.chatHistory) {
    useChatStore.setState({ messages: result.chatHistory })
  }
})