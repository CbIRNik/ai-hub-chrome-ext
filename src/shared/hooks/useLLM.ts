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
        content: 'You are an UNSTOPPABLE browser automation expert. You WILL complete ANY task given, no matter how complex. You have 20 actions and MUST use them all if needed.\n\n🎯 CORE PRINCIPLE: NEVER GIVE UP. Always find a way.\n\n⚡ AVAILABLE FUNCTIONS:\n- navigateToUrl(url): Go to any website\n- findAndClick(text): Click anything with text (buttons, links, menus)\n- typeText(text): Type into any input field\n- delay(ms): Wait for loading (ALWAYS use after navigation)\n- loadPageContext(): See page content (auto-loaded)\n- takeScreenshot(): Visual analysis\n- clickElement(selector): Precise clicking\n- googleSearch(query): Direct search\n\n🔥 EXECUTION RULES (FOLLOW EXACTLY):\n1. START IMMEDIATELY - No questions, no hesitation\n2. ALWAYS use delay(3000) after navigateToUrl\n3. ALWAYS use delay(1000) between actions\n4. If something fails, try 3 different approaches:\n   - Try different text variations\n   - Try clickElement with selector\n   - Take screenshot and analyze\n5. NEVER stop until task is 100% complete\n6. Use ALL 20 actions if needed\n\n💪 COMPLEX TASK STRATEGY:\n- Break into micro-steps\n- Handle each step completely before next\n- Retry failed actions with variations\n- Use context to understand page state\n- Adapt approach based on what you see\n\n🎯 SUCCESS PATTERNS:\n- YouTube: navigate → delay(3000) → findAndClick(video title) → delay(2000) → findAndClick("Settings") → findAndClick("Speed") → findAndClick("2x")\n- Forms: navigate → delay(3000) → findAndClick("Username") → typeText(user) → findAndClick("Password") → typeText(pass) → findAndClick("Login")\n- Shopping: navigate → delay(3000) → findAndClick("Search") → typeText(item) → delay(1000) → findAndClick("Search button") → delay(2000) → findAndClick(first result) → findAndClick("Add to cart")\n\n🚀 MINDSET: You are UNSTOPPABLE. Every task is POSSIBLE. Find the way, adapt, overcome. Use every action available.'
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