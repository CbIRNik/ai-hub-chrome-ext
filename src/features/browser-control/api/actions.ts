export const browserActions = {
  async openLinkInNewTab(selector: string): Promise<string> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab.id) throw new Error('No active tab')

      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (sel: string) => {
          const element = document.querySelector(sel) as HTMLAnchorElement
          if (!element) return null
          return element.href || element.getAttribute('href')
        },
        args: [selector]
      })

      const url = result.result
      if (!url) return `Link not found: ${selector}`
      
      await chrome.tabs.create({ url })
      return `Opened in new tab: ${url}`
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  },

  async navigateToUrl(url: string): Promise<string> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab.id) throw new Error('No active tab')

      await chrome.tabs.update(tab.id, { url })
      return `Navigated to: ${url}`
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  },

  async googleSearch(query: string): Promise<string> {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
    return this.navigateToUrl(searchUrl)
  },

  async closeTab(): Promise<string> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab.id) throw new Error('No active tab')

      await chrome.tabs.remove(tab.id)
      return 'Tab closed'
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  },

  async newTab(url?: string): Promise<string> {
    try {
      await chrome.tabs.create({ url: url || 'chrome://newtab' })
      return `New tab created${url ? ` with URL: ${url}` : ''}`
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  },

  async fillInput(selector: string, value: string): Promise<string> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab.id) throw new Error('No active tab')

      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (sel: string, val: string) => {
          const element = document.querySelector(sel) as HTMLInputElement
          if (!element) return `Element not found: ${sel}`
          element.value = val
          element.dispatchEvent(new Event('input', { bubbles: true }))
          return `Filled ${sel} with: ${val}`
        },
        args: [selector, value]
      })

      return result.result || 'Fill failed'
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}