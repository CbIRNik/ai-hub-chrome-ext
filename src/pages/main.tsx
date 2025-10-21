import { useRouter } from '@/app/routing'
import { useState, useRef, useEffect } from 'react'
import { useLLM } from '@/shared/hooks/useLLM'
import { useChatStore } from '@/shared/store/chat'

import { Markdown } from '@/shared/ui/markdown'



const MainPage = () => {
  const [input, setInput] = useState('');
  const [enableBrowserControl, setEnableBrowserControl] = useState(false);
  const [taskSteps, setTaskSteps] = useState<string[]>([]);

  const { replace } = useRouter()
  const { isLoading, sendMessage } = useLLM()
  const { messages, addMessage, clearHistory } = useChatStore()

  useEffect(() => {
    chrome.storage.local.get(['enableBrowserControl']).then(result => {
      if (result.enableBrowserControl !== undefined) setEnableBrowserControl(result.enableBrowserControl)
    })
    
    // Listen for task steps and partial results from background
    const handleMessage = (message: any) => {
      if (message.type === 'TASK_STEP') {
        setTaskSteps(prev => [...prev, ...message.payload.steps])
      } else if (message.type === 'PARTIAL_RESULT') {
        // Add partial result as assistant message
        addMessage('assistant', message.payload.result)
      } else if (message.type === 'MESSAGE_SAVED') {
        // Message already saved in background, just update UI if needed
        console.log('Message saved to history:', message.payload)
      } else if (message.type === 'TASK_COMPLETED') {
        // Task execution completed
        setTaskSteps([])
        console.log('Task completed:', message.payload)
      }
    }
    
    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setTaskSteps([])
    addMessage('user', userMessage)

    try {
      const contextMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

      contextMessages.push({ role: 'user', content: userMessage })

      const result = await sendMessage(contextMessages, enableBrowserControl)
      if (result) {
        addMessage('assistant', result)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      addMessage('assistant', `❌ Error: ${errorMessage}`)
    }
  }



  const handleToggleBrowserControl = (newValue: boolean) => {
    setEnableBrowserControl(newValue)
    chrome.storage.local.set({ enableBrowserControl: newValue })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-96 bg-gray-900 min-h-[600px] flex flex-col relative">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 fixed top-0 w-96 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h1 className="text-lg font-semibold text-white">Browser Agent</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={clearHistory}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Clear chat"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={() => replace(["settings"])}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 mt-20">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p>Start a conversation with your AI assistant</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-100 border border-gray-700'
                }`}>
                {message.role === 'assistant' ? (
                  <Markdown content={message.content} />
                ) : (
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg">
              <div className="flex space-x-1 mb-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              {taskSteps.length > 0 && (
                <div className="text-xs text-gray-400">
                  <div className="font-medium mb-1">Executing steps:</div>
                  {taskSteps.map((step, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-1">
                      <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-2 mb-2">
          <button
            onClick={() => handleToggleBrowserControl(!enableBrowserControl)}
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-xs transition-colors ${enableBrowserControl
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span>{enableBrowserControl ? 'Browser control ON' : 'Enable browser control'}</span>
          </button>
        </div>
        <div className="flex space-x-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export { MainPage }
