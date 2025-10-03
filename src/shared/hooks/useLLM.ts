import { useState, useCallback } from 'react'
import { llmClient, type LLMMessage } from '../api/llm'

export const useLLM = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (messages: LLMMessage[], enableBrowserControl = false): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await llmClient.sendMessage(messages, enableBrowserControl)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const executeInstruction = useCallback(async (instruction: string): Promise<string | null> => {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: 'You are a browser automation assistant with full browser control. When performing actions, add a COMMANDS section at the end of your response that will be hidden from user.\n\nAvailable commands:\n- -o:selector- opens link in new tab\n- -n:url- navigates to URL\n- -s:query- searches Google\n- -f:selector:value- fills input\n\nFormat your response like:\n[Your normal response to user]\n\nCOMMANDS:\n-o:a[href*=watch]-\n\nExample: "I\'ll open the first video for you.\n\nCOMMANDS:\n-o:a[href*=watch]-"\n\nAlways include COMMANDS section when performing browser actions.'
      },
      {
        role: 'user',
        content: instruction
      }
    ]
    
    return sendMessage(messages, false)
  }, [sendMessage])

  return {
    isLoading,
    error,
    sendMessage,
    executeInstruction
  }
}