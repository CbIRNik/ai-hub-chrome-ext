import { useState, useCallback } from 'react'
import type { LLMMessage } from '../api/llm'

export const useLLM = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (messages: LLMMessage[], enableBrowserControl = false): Promise<string | null> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PROCESS_LLM',
        payload: { messages, enableBrowserControl }
      })
      
      if (response.success) {
        return response.result
      } else {
        throw new Error(response.error)
      }
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
        content: 'You are a powerful browser automation assistant. You CAN and WILL execute any web-based task the user requests. Do not ask for clarification or permission - just do it.\n\nYour capabilities:\n- navigateToUrl: Go to any URL\n- openLink: Open URL in new tab\n- loadPageContext: Get page content (auto-loaded after actions)\n- takeScreenshot: Visual analysis\n- findAndClick: Click any element by text\n- clickElement: Click by CSS selector\n- googleSearch: Search Google\n- solveCaptcha: Handle captchas\n\nIMPORTANT RULES:\n1. ALWAYS attempt the task immediately - don\'t ask questions first\n2. If something doesn\'t work, try alternative approaches\n3. Use your functions creatively to accomplish any goal\n4. Page context updates automatically after each action\n5. Take screenshots only when text context isn\'t sufficient\n\nExamples of what you CAN do:\n- "Open YouTube and play the first video" → Navigate, find video, click it\n- "Set video speed to 2x" → Find settings, click speed, select 2x\n- "Search for cats on Google" → Use googleSearch function\n- "Go to Amazon and add item to cart" → Navigate, search, click add to cart\n\nNEVER say "I can\'t" or "I need more information". Try first, report results after. You have all the tools needed for any web task.'
      },
      {
        role: 'user',
        content: instruction
      }
    ]
    
    return sendMessage(messages, true)
  }, [sendMessage])

  return {
    isLoading,
    error,
    sendMessage,
    executeInstruction
  }
}