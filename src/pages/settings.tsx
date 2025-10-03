import { useRouter } from '@/app/routing'
import { useState } from 'react'




const SettingsPage = () => {
  const { back } = useRouter()
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'custom'>('openai')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [baseURL, setBaseURL] = useState('')

  return (
    <div className="w-96 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[500px]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={back}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="p-6 space-y-6">
        <form className="space-y-5">
          {/* AI Provider */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">AI Provider</label>
            <div className="grid grid-cols-3 gap-2">
              {['openai', 'anthropic', 'custom'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p as any)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-all ${provider === p
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {p === 'openai' ? 'OpenAI' : p === 'anthropic' ? 'Anthropic' : 'Custom'}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">API Key</label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <div className="absolute right-3 top-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Model (Optional)</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={provider === 'openai' ? 'gpt-4o-mini' : provider === 'anthropic' ? 'claude-3-haiku-20240307' : 'model-name'}
              className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Base URL for custom/OpenAI */}
          {(provider === 'openai' || provider === 'custom') && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Base URL (Optional)</label>
              <input
                type="url"
                value={baseURL}
                onChange={(e) => setBaseURL(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 transition-all shadow-sm"
          >
            Save Configuration
          </button>
        </form>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Secure Storage</p>
              <p>Your API keys are stored locally and never shared.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { SettingsPage }
