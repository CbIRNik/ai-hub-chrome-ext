let activeProcessing = null

// Save message to chat history
async function saveMessageToHistory(role, content) {
  try {
    const result = await chrome.storage.local.get(['chatHistory'])
    const history = result.chatHistory || []
    
    const newMessage = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: Date.now()
    }
    
    history.push(newMessage)
    await chrome.storage.local.set({ chatHistory: history })
    
    // Notify popup about new message
    chrome.runtime.sendMessage({
      type: 'MESSAGE_SAVED',
      payload: newMessage
    }).catch(() => {})
  } catch (error) {
    console.error('Failed to save message:', error)
  }
}

chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  console.log('Background received message:', message.type)
  
  if (message.type === 'PROCESS_LLM') {
    // Prevent multiple concurrent requests
    if (activeProcessing) {
      sendResponse({ success: false, error: 'Another request is already processing' })
      return true
    }
    
    const { messages, enableBrowserControl } = message.payload
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      title: 'AI Extension',
      message: 'Processing LLM request...'
    })
    
    // Store processing state
    activeProcessing = { messages, enableBrowserControl, startTime: Date.now() }
    
    // Load config and process
    chrome.storage.local.get(['llmConfig']).then(result => {
      const config = result.llmConfig
      if (!config) {
        console.log('No LLM config found')
        sendResponse({ success: false, error: 'LLM not configured' })
        activeProcessing = null
        return
      }
      
      console.log('Processing LLM request with config:', config.provider)
      processLLMRequest(config, messages, enableBrowserControl)
        .then(result => {
          console.log('LLM processing completed')
          
          // Save final result to chat history in background
          saveMessageToHistory('assistant', result)
          
          sendResponse({ success: true, result })
          activeProcessing = null
          
          // Reopen popup after processing
          chrome.action.openPopup()
        })
        .catch(error => {
          console.error('LLM processing failed:', error)
          sendResponse({ success: false, error: error.message })
          activeProcessing = null
        })
    })
    
    return true
  }
})

async function processLLMRequest(config, messages, enableBrowserControl) {
  console.log('Processing request with config:', config)
  console.log('Messages:', messages)
  
  if (config.provider === 'gemini') {
    return processGeminiRequest(config, messages, enableBrowserControl)
  } else {
    return processOpenAIRequest(config, messages, enableBrowserControl)
  }
}

async function processGeminiRequest(config, messages, enableBrowserControl, depth = 0) {
  // Prevent infinite loops
  if (depth > 3) {
    console.log('Max chain depth reached, stopping')
    return 'Task completed - maximum steps reached'
  }
  const baseURL = config.baseURL || 'https://generativelanguage.googleapis.com'
  const model = config.model || 'gemini-2.5-flash'
  const url = `${baseURL}/v1beta/models/${model}:generateContent?key=${config.apiKey}`
  
  const contents = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }))
  
  const requestBody = { contents }
  
  if (enableBrowserControl) {
    requestBody.tools = [{
      function_declarations: [
        {
          name: 'openLink',
          description: 'Open a URL in a NEW TAB. Use when user says "open", "открой", "launch", "start"',
          parameters: {
            type: 'object',
            properties: {
              url: { type: 'string', description: 'URL to open in new tab' }
            },
            required: ['url']
          }
        },
        {
          name: 'navigateToUrl',
          description: 'Navigate to URL in CURRENT TAB. Use when user says "go to", "перейди", "navigate", "visit"',
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
          name: 'getPageHTML',
          description: 'Get HTML content of current page',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector to get specific part (optional)' }
            }
          }
        },
        {
          name: 'clickElement',
          description: 'Click on an element by CSS selector',
          parameters: {
            type: 'object',
            properties: {
              selector: { type: 'string', description: 'CSS selector for the element to click' }
            },
            required: ['selector']
          }
        },
        {
          name: 'solveCaptcha',
          description: 'Automatically solve captcha on current page',
          parameters: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Captcha type: recaptcha, hcaptcha, image', enum: ['recaptcha', 'hcaptcha', 'image', 'auto'] }
            },
            required: ['type']
          }
        },
        {
          name: 'findAndClick',
          description: 'Find and click element by text content, aria-label, or title',
          parameters: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to search for in buttons, links, or other clickable elements' }
            },
            required: ['text']
          }
        },
        {
          name: 'loadPageContext',
          description: 'Load current page content into conversation context',
          parameters: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'takeScreenshot',
          description: 'Take screenshot of current page',
          parameters: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }]
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.status} ${errorText}`)
  }
  
  const data = await response.json()
  console.log('Gemini response:', data)
  
  const candidate = data.candidates?.[0]
  let result = candidate?.content?.parts?.[0]?.text || 'No content returned'
  
  // Execute function calls if present
  if (candidate?.content?.parts?.some(p => p.functionCall)) {
    const results = []
    
    for (const part of candidate.content.parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall
        const actionResult = await executeBrowserFunction(name, args)
        results.push(actionResult)
        // Small delay between actions
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    if (results.length > 0) {
      // Send step updates to popup immediately
      chrome.runtime.sendMessage({
        type: 'TASK_STEP',
        payload: { steps: results, partial: true }
      }).catch(() => {})
      
      result = `${result || 'Step completed'}\n\nActions: ${results.join(', ')}`
      
      // Send partial result to popup
      chrome.runtime.sendMessage({
        type: 'PARTIAL_RESULT',
        payload: { result }
      }).catch(() => {})
      
      // Continue chain only if depth allows
      if (depth < 3) {
        // Auto-load page context after actions
        let pageContext = ''
        try {
          const contextResult = await executeBrowserFunction('loadPageContext', {})
          pageContext = contextResult
        } catch (error) {
          console.log('Failed to load page context:', error.message)
        }
        
        const followUpMessages = [...messages, {
          role: 'assistant',
          content: result
        }, {
          role: 'user', 
          content: `Function results: ${results.join(', ')}.\n\n${pageContext}\n\nContinue with the next step to complete the task based on current page content.`
        }]
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        try {
          const followUpResponse = await processGeminiRequest(config, followUpMessages, enableBrowserControl, depth + 1)
          result = `${result}\n\n${followUpResponse}`
        } catch (error) {
          console.log('Follow-up failed, stopping chain:', error.message)
        }
      }
    }
  }
  
  return result
}

async function processOpenAIRequest(config, messages, enableBrowserControl) {
  const url = config.baseURL || 'https://api.openai.com/v1'
  
  const response = await fetch(`${url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages,
      temperature: 0.7
    })
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${errorText}`)
  }
  
  const data = await response.json()
  console.log('OpenAI response:', data)
  
  const result = data.choices?.[0]?.message?.content || 'No content returned'
  
  if (enableBrowserControl) {
    await executeBrowserActions(result)
  }
  
  return result
}

async function executeBrowserFunction(name, args) {
  console.log('Executing browser function:', name, args)
  
  try {
    switch (name) {
      case 'openLink':
        await chrome.tabs.create({ url: args.url })
        return `Opened link in new tab: ${args.url}`
        
      case 'navigateToUrl':
        const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true })
        await chrome.tabs.update(currentTab.id, { url: args.url })
        return `Navigated to: ${args.url}`
        
      case 'googleSearch':
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(args.query)}`
        await chrome.tabs.create({ url: searchUrl })
        return `Searched for: ${args.query}`
        
      case 'getPageHTML':
        const [htmlTab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const selector = args?.selector || null
        const htmlResults = await chrome.scripting.executeScript({
          target: { tabId: htmlTab.id },
          func: (sel) => {
            if (sel) {
              const element = document.querySelector(sel)
              return element ? element.outerHTML : 'Element not found'
            } else {
              // Get page content with video links
              const videoLinks = []
              const links = document.querySelectorAll('a[href*="/watch"]')
              links.forEach((link, index) => {
                if (index < 5) {
                  const title = link.querySelector('#video-title, .ytd-video-meta-block #video-title, h3, span[title]')?.textContent?.trim() || 'Video'
                  videoLinks.push(`<a href="${link.href}" data-selector="a[href*='/watch']:nth-of-type(${index + 1})">${title}</a>`)
                }
              })
              
              return videoLinks.length > 0 ? 
                `YouTube page with videos:\n${videoLinks.join('\n')}` : 
                'No video links found on page'
            }
          },
          args: [selector]
        })
        
        const htmlContent = htmlResults[0]?.result || 'Failed to get HTML'
        return htmlContent
        
      case 'clickElement':
        const [clickTab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const clickResults = await chrome.scripting.executeScript({
          target: { tabId: clickTab.id },
          func: (selector) => {
            const element = document.querySelector(selector)
            if (element) {
              element.click()
              return `Clicked element: ${selector}`
            }
            return `Element not found: ${selector}`
          },
          args: [args.selector]
        })
        
        return clickResults[0]?.result || 'Click failed'
        
      case 'solveCaptcha':
        const [captchaTab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const captchaResults = await chrome.scripting.executeScript({
          target: { tabId: captchaTab.id },
          func: (captchaType) => {
            // Auto-detect captcha type if not specified
            if (captchaType === 'auto') {
              if (document.querySelector('.g-recaptcha, #recaptcha')) {
                captchaType = 'recaptcha'
              } else if (document.querySelector('.h-captcha, [data-hcaptcha-widget-id]')) {
                captchaType = 'hcaptcha'
              } else if (document.querySelector('img[src*="captcha"], .captcha-image')) {
                captchaType = 'image'
              }
            }
            
            switch (captchaType) {
              case 'recaptcha':
                // Try to solve reCAPTCHA
                const recaptchaCheckbox = document.querySelector('.recaptcha-checkbox-border, [role="checkbox"]')
                if (recaptchaCheckbox) {
                  recaptchaCheckbox.click()
                  return 'Clicked reCAPTCHA checkbox'
                }
                
                // Try audio challenge
                const audioButton = document.querySelector('#recaptcha-audio-button, [title*="audio"]')
                if (audioButton) {
                  audioButton.click()
                  return 'Switched to audio reCAPTCHA'
                }
                break
                
              case 'hcaptcha':
                const hcaptchaCheckbox = document.querySelector('.hcaptcha-checkbox, [data-hcaptcha-widget-id] iframe')
                if (hcaptchaCheckbox) {
                  hcaptchaCheckbox.click()
                  return 'Clicked hCaptcha checkbox'
                }
                break
                
              case 'image':
                // Simple image captcha - try to refresh
                const refreshButton = document.querySelector('[title*="refresh"], [alt*="refresh"], .captcha-refresh')
                if (refreshButton) {
                  refreshButton.click()
                  return 'Refreshed image captcha'
                }
                break
            }
            
            return `No ${captchaType} captcha found or unable to solve`
          },
          args: [args.type]
        })
        
        return captchaResults[0]?.result || 'Captcha solving failed'
        
      case 'findAndClick':
        const [findTab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const findResults = await chrome.scripting.executeScript({
          target: { tabId: findTab.id },
          func: (searchText) => {
            const text = searchText.toLowerCase()
            
            // Search in buttons
            const buttons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]')
            for (const btn of buttons) {
              const btnText = (btn.textContent || btn.value || btn.getAttribute('aria-label') || btn.title || '').toLowerCase()
              if (btnText.includes(text)) {
                btn.click()
                return `Clicked button: "${btn.textContent || btn.value || btn.getAttribute('aria-label') || 'Button'}"`
              }
            }
            
            // Search in links
            const links = document.querySelectorAll('a')
            for (const link of links) {
              const linkText = (link.textContent || link.getAttribute('aria-label') || link.title || '').toLowerCase()
              if (linkText.includes(text)) {
                link.click()
                return `Clicked link: "${link.textContent || link.getAttribute('aria-label') || 'Link'}"`
              }
            }
            
            // Search in clickable elements
            const clickables = document.querySelectorAll('[onclick], [data-click], .clickable, .btn')
            for (const el of clickables) {
              const elText = (el.textContent || el.getAttribute('aria-label') || el.title || '').toLowerCase()
              if (elText.includes(text)) {
                el.click()
                return `Clicked element: "${el.textContent || el.getAttribute('aria-label') || 'Element'}"`
              }
            }
            
            return `No clickable element found with text: "${searchText}"`
          },
          args: [args.text]
        })
        
        return findResults[0]?.result || 'Find and click failed'
        
      case 'loadPageContext':
        const [contextTab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const contextResults = await chrome.scripting.executeScript({
          target: { tabId: contextTab.id },
          func: () => {
            // Remove scripts, styles, and hidden elements
            const clone = document.cloneNode(true)
            const unwanted = clone.querySelectorAll('script, style, noscript, [style*="display: none"], [style*="visibility: hidden"]')
            unwanted.forEach(el => el.remove())
            
            // Get all visible text
            const text = clone.body?.innerText || clone.textContent || ''
            
            // Limit text length to avoid token limits
            return text.length > 15000 ? text.substring(0, 15000) + '...' : text
          }
        })
        
        const pageContext = contextResults[0]?.result || 'Failed to load page context'
        return `CURRENT PAGE CONTEXT:\n${pageContext}`
        
      case 'takeScreenshot':
        const [screenshotTab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const screenshot = await chrome.tabs.captureVisibleTab(screenshotTab.windowId, {
          format: 'png',
          quality: 80
        })
        
        return `Screenshot taken: ${screenshot.substring(0, 100)}...`
        
      default:
        return `Unknown function: ${name}`
    }
  } catch (error) {
    console.error('Browser function error:', error)
    return `Error executing ${name}: ${error.message}`
  }
}

async function executeBrowserActions(text) {
  // Fallback text parsing for non-function calling
  if (text.includes('open new tab')) {
    await chrome.tabs.create({})
  }
  
  if (text.includes('close tab')) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab.id) await chrome.tabs.remove(tab.id)
  }
  
  const urlMatch = text.match(/navigate to (https?:\/\/[^\s]+)/i)
  if (urlMatch) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab.id) await chrome.tabs.update(tab.id, { url: urlMatch[1] })
  }
}