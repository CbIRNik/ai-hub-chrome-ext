import { browserActions } from './actions'

interface BrowserCommand {
  action: string
  params: Record<string, string>
}

export const parseBrowserCommands = (text: string): BrowserCommand[] => {
  const commands: BrowserCommand[] = []
  
  // Extract commands section
  const commandsMatch = text.match(/COMMANDS:\s*([\s\S]*?)(?:\n\n|$)/)
  if (!commandsMatch) return commands
  
  const commandsSection = commandsMatch[1]
  
  // Parse -o:selector- (open link)
  const openMatches = commandsSection.match(/-o:([^-]+)-/g)
  if (openMatches) {
    openMatches.forEach(match => {
      const selector = match.replace(/-o:([^-]+)-/, '$1')
      commands.push({ action: 'openLink', params: { selector } })
    })
  }
  
  // Parse -n:url- (navigate)
  const navMatches = commandsSection.match(/-n:([^-]+)-/g)
  if (navMatches) {
    navMatches.forEach(match => {
      const url = match.replace(/-n:([^-]+)-/, '$1')
      commands.push({ action: 'navigate', params: { url } })
    })
  }
  
  // Parse -s:query- (search)
  const searchMatches = commandsSection.match(/-s:([^-]+)-/g)
  if (searchMatches) {
    searchMatches.forEach(match => {
      const query = match.replace(/-s:([^-]+)-/, '$1')
      commands.push({ action: 'search', params: { query } })
    })
  }
  
  // Parse -f:selector:value- (fill)
  const fillMatches = commandsSection.match(/-f:([^:]+):([^-]+)-/g)
  if (fillMatches) {
    fillMatches.forEach(match => {
      const parts = match.match(/-f:([^:]+):([^-]+)-/)
      if (parts) {
        commands.push({ action: 'fill', params: { selector: parts[1], value: parts[2] } })
      }
    })
  }
  
  return commands
}

export const removeCommandsSection = (text: string): string => {
  return text.replace(/\s*COMMANDS:[\s\S]*$/, '').trim()
}

export const executeBrowserCommands = async (commands: BrowserCommand[]): Promise<string[]> => {
  const results: string[] = []

  for (const command of commands) {
    let result: string

    switch (command.action) {
      case 'openLink':
        result = await browserActions.openLinkInNewTab(command.params.selector)
        break
      case 'navigate':
        result = await browserActions.navigateToUrl(command.params.url)
        break
      case 'search':
        result = await browserActions.googleSearch(command.params.query)
        break
      case 'fill':
        result = await browserActions.fillInput(command.params.selector, command.params.value)
        break
      default:
        result = `Unknown command: ${command.action}`
    }

    results.push(result)
  }

  return results
}
