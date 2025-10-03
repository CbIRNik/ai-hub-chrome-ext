interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'custom'
  apiKey: string
  model?: string
  baseURL?: string
}

interface LLMMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

class LLMClient {
  private config: LLMConfig | null = null

  async setConfig(config: LLMConfig) {
    this.config = config
    await chrome.storage.local.set({ llmConfig: config })
  }

  async loadConfig(): Promise<LLMConfig | null> {
    if (this.config) return this.config
    
    const result = await chrome.storage.local.get(['llmConfig'])
    this.config = result.llmConfig || null
    return this.config
  }

  async sendMessage(messages: LLMMessage[], enableBrowserControl = false): Promise<string> {
    const config = await this.loadConfig()
    if (!config) throw new Error('LLM not configured')

    switch (config.provider) {
      case 'openai':
        return this.sendOpenAI(messages, config, enableBrowserControl)
      case 'anthropic':
        return this.sendAnthropic(messages, config, enableBrowserControl)
      case 'gemini':
        return this.sendGemini(messages, config, enableBrowserControl)
      case 'custom':
        return this.sendCustom(messages, config, enableBrowserControl)
      default:
        throw new Error('Unknown provider')
    }
  }

  private async sendOpenAI(messages: LLMMessage[], config: LLMConfig, enableBrowserControl = false): Promise<string> {
    const url = config.baseURL || 'https://api.openai.com/v1'
    const model = config.model || 'gpt-4o-mini'

    const tools = [
      {
        type: 'function',
        function: {
          name: 'openLink',
          description: 'Open a link in a new tab',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector for the link' }
            },
            required: ['selector']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'navigateToUrl',
          description: 'Navigate to a specific URL',
          parameters: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to navigate to' }
            },
            required: ['url']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'googleSearch',
          description: 'Search on Google',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'fillInput',
          description: 'Fill an input field',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector for the input' },
              value: { type: 'string', description: 'Value to fill' }
            },
            required: ['selector', 'value']
          }
        }
      }
    ]

    const requestBody: any = {
      model,
      messages,
      temperature: 0.7
    }
    
    if (enableBrowserControl) {
      requestBody.tools = tools
      requestBody.tool_choice = 'auto'
    }

    const response = await fetch(`${url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const message = data.choices[0]?.message
    
    if (message?.tool_calls) {
      // Execute function calls
      const { browserActions } = await import('../../features/browser-control')
      const results = []
      
      for (const toolCall of message.tool_calls) {
        const { name, arguments: args } = toolCall.function
        const params = JSON.parse(args)
        
        let result: string
        switch (name) {
          case 'openLink':
            result = await browserActions.openLinkInNewTab(params.selector)
            break
          case 'navigateToUrl':
            result = await browserActions.navigateToUrl(params.url)
            break
          case 'googleSearch':
            result = await browserActions.googleSearch(params.query)
            break
          case 'fillInput':
            result = await browserActions.fillInput(params.selector, params.value)
            break
          default:
            result = `Unknown function: ${name}`
        }
        results.push(result)
        // Small delay between actions
        await new Promise(resolve => setTimeout(resolve, 500))
      }
      
      // Continue conversation with function results
      const followUpMessages = [...messages, {
        role: 'assistant' as const,
        content: message.content || 'I\'ve executed the requested actions.'
      }, {
        role: 'user' as const,
        content: `Function results: ${results.join(', ')}. Please provide a summary or next steps.`
      }]
      
      const followUpResponse = await this.sendOpenAI(followUpMessages, config, false)
      return `${message.content || 'Actions completed'}\n\nResults: ${results.join(', ')}\n\n${followUpResponse}`
    }
    
    return message?.content || ''
  }

  private async sendAnthropic(messages: LLMMessage[], config: LLMConfig, enableBrowserControl = false): Promise<string> {
    const model = config.model || 'claude-3-haiku-20240307'
    
    const tools = enableBrowserControl ? [
      {
        name: 'openLink',
        description: 'Open a link in a new tab',
        input_schema: {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector for the link' }
          },
          required: ['selector']
        }
      },
      {
        name: 'navigateToUrl',
        description: 'Navigate to a specific URL',
        input_schema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to navigate to' }
          },
          required: ['url']
        }
      },
      {
        name: 'googleSearch',
        description: 'Search on Google',
        input_schema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search query' }
          },
          required: ['query']
        }
      },
      {
        name: 'fillInput',
        description: 'Fill an input field',
        input_schema: {
          type: 'object',
          properties: {
            selector: { type: 'string', description: 'CSS selector for the input' },
            value: { type: 'string', description: 'Value to fill' }
          },
          required: ['selector', 'value']
        }
      }
    ] : undefined

    const requestBody: any = {
      model,
      max_tokens: 1024,
      messages: messages.filter(m => m.role !== 'system'),
      system: messages.find(m => m.role === 'system')?.content
    }
    
    if (tools) {
      requestBody.tools = tools
    }
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.content?.some((c: any) => c.type === 'tool_use')) {
      const { browserActions } = await import('../../features/browser-control')
      const results = []
      
      for (const content of data.content) {
        if (content.type === 'tool_use') {
          const { name, input } = content
          
          let result: string
          switch (name) {
            case 'openLink':
              result = await browserActions.openLinkInNewTab(input.selector)
              break
            case 'navigateToUrl':
              result = await browserActions.navigateToUrl(input.url)
              break
            case 'googleSearch':
              result = await browserActions.googleSearch(input.query)
              break
            case 'fillInput':
              result = await browserActions.fillInput(input.selector, input.value)
              break
            default:
              result = `Unknown function: ${name}`
          }
          results.push(result)
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      const textContent = data.content.find((c: any) => c.type === 'text')?.text || 'Actions completed'
      
      const followUpMessages = [...messages, {
        role: 'assistant' as const,
        content: textContent
      }, {
        role: 'user' as const,
        content: `Function results: ${results.join(', ')}. Please provide a summary or next steps.`
      }]
      
      const followUpResponse = await this.sendAnthropic(followUpMessages, config, false)
      return `${textContent}\n\nResults: ${results.join(', ')}\n\n${followUpResponse}`
    }
    
    return data.content[0]?.text || ''
  }

  private async sendCustom(messages: LLMMessage[], config: LLMConfig, enableBrowserControl = false): Promise<string> {
    if (!config.baseURL) throw new Error('Base URL required for custom provider')
    
    // Check if it's Gemini API
    if (config.baseURL.includes('generativelanguage.googleapis.com')) {
      return this.sendGemini(messages, config, enableBrowserControl)
    }
    
    const response = await fetch(`${config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model || 'default',
        messages,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`Custom API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  }

  private async sendGemini(messages: LLMMessage[], config: LLMConfig, enableBrowserControl = false): Promise<string> {
    const model = config.model || 'gemini-1.5-flash'
    const baseURL = config.baseURL || 'https://generativelanguage.googleapis.com'
    const url = `${baseURL}/v1beta/models/${model}:generateContent?key=${config.apiKey}`
    
    const tools = enableBrowserControl ? {
      function_declarations: [
        {
          name: 'openLink',
          description: 'Open a link in a new tab',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector for the link' }
            },
            required: ['selector']
          }
        },
        {
          name: 'navigateToUrl',
          description: 'Navigate to a specific URL',
          parameters: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to navigate to' }
            },
            required: ['url']
          }
        },
        {
          name: 'googleSearch',
          description: 'Search on Google',
          parameters: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' }
            },
            required: ['query']
          }
        },
        {
          name: 'fillInput',
          description: 'Fill an input field',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector for the input' },
              value: { type: 'string', description: 'Value to fill' }
            },
            required: ['selector', 'value']
          }
        }
      ]
    } : undefined

    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    const requestBody: any = { contents }
    if (tools) {
      requestBody.tools = [tools]
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]
    
    if (candidate?.content?.parts?.some((p: any) => p.functionCall)) {
      const { browserActions } = await import('../../features/browser-control')
      const results = []
      
      for (const part of candidate.content.parts) {
        if (part.functionCall) {
          const { name, args } = part.functionCall
          
          let result: string
          switch (name) {
            case 'openLink':
              result = await browserActions.openLinkInNewTab(args.selector)
              break
            case 'navigateToUrl':
              result = await browserActions.navigateToUrl(args.url)
              break
            case 'googleSearch':
              result = await browserActions.googleSearch(args.query)
              break
            case 'fillInput':
              result = await browserActions.fillInput(args.selector, args.value)
              break
            default:
              result = `Unknown function: ${name}`
          }
          results.push(result)
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      const textPart = candidate.content.parts.find((p: any) => p.text)
      const textContent = textPart?.text || 'Actions completed'
      
      const followUpResponse = await this.sendGemini([...messages, {
        role: 'assistant',
        content: textContent
      }, {
        role: 'user',
        content: `Function results: ${results.join(', ')}. Please provide a summary or next steps.`
      }], config, false)
      
      return `${textContent}\n\nResults: ${results.join(', ')}\n\n${followUpResponse}`
    }
    
    return candidate?.content?.parts?.[0]?.text || ''
  }
}

export const llmClient = new LLMClient()
export type { LLMConfig, LLMMessage }