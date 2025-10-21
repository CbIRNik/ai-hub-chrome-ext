interface MarkdownProps {
  content: string
}

export const Markdown = ({ content }: MarkdownProps) => {
  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-700 px-1 rounded text-sm">$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-700 p-2 rounded mt-2 mb-2 text-sm overflow-x-auto"><code>$1</code></pre>')
      .replace(/\n/g, '<br>')
  }

  return (
    <div 
      className="markdown"
      dangerouslySetInnerHTML={{ __html: formatText(content) }}
    />
  )
}