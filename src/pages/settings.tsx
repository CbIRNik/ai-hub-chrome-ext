import { useRouter } from '@/app/routing'
import { useState, useEffect } from 'react'
import { llmClient, type LLMConfig } from '@/shared/api/llm'




const SettingsPage = () => {
  const { back } = useRouter()
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'custom'>('openai')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [baseURL, setBaseURL] = useState('')


  useEffect(() => {
    llmClient.loadConfig().then(config => {
      if (config) {
        setProvider(config.provider)
        setApiKey(config.apiKey)
        setModel(config.model || '')
        setBaseURL(config.baseURL || '')
      }
    })
  }, [])

  useEffect(() => {
    const config: LLMConfig = {
      provider,
      apiKey,
      ...(model && { model }),
      ...(baseURL && { baseURL })
    }
    llmClient.setConfig(config)
  }, [provider, apiKey, model, baseURL])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    back()
  }

  return (
    <div className="w-96 bg-gray-900 min-h-[600px]">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={back}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-white">Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="p-6 space-y-6">
        <form onSubmit={handleSave} className="space-y-5">
          {/* AI Provider */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">AI Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {['openai', 'anthropic', 'gemini', 'custom'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p as any)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${provider === p
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700'
                    }`}
                >
                  {p === 'openai' ? 'OpenAI' : p === 'anthropic' ? 'Anthropic' : p === 'gemini' ? 'Gemini' : 'Custom'}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">API Key</label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="absolute right-3 top-3">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Model (Optional)</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={provider === 'openai' ? 'gpt-4o-mini' : provider === 'anthropic' ? 'claude-3-haiku-20240307' : provider === 'gemini' ? 'gemini-1.5-flash' : 'model-name'}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Base URL for custom/OpenAI/Gemini */}
          {(provider === 'openai' || provider === 'gemini' || provider === 'custom') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Base URL (Optional)</label>
              <input
                type="url"
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                placeholder={provider === 'gemini' ? 'https://generativelanguage.googleapis.com' : 'https://api.openai.com/v1'}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Done
          </button>
        </form>

        {/* Info Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-gray-300">
              <p className="font-medium mb-1 text-white">Secure Storage</p>
              <p>Your API keys are stored locally and never shared.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { SettingsPage }
