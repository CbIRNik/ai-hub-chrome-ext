export const getPageContent = async (): Promise<string> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) throw new Error('No active tab')

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const title = document.title
        const url = window.location.href
        const text = document.body.innerText.slice(0, 10000) // Limit to 10k chars
        return `Page: ${title}\nURL: ${url}\n\nContent:\n${text}`
      }
    })

    return result.result || 'Could not extract page content'
  } catch (error) {
    return `Error extracting page: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}