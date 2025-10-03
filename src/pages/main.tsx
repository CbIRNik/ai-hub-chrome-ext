import { useRouter } from '@/app/routing'
import { useState } from 'react'


const MainPage = () => {
  const [instruction, setInstruction] = useState('');
  const [isExecuting, _] = useState(false);
  const { replace } = useRouter()

  return (
    <div className="w-96 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-[500px]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-800">Browser Agent</h1>
          </div>
          <button
            onClick={() => replace(["settings"])}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Ready to assist</span>
          </div>
        </div>

        {/* Instruction Input */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            What would you like me to do?
          </label>
          <div className="relative">
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="e.g., Click the login button and fill the email field with test@example.com"
              className="w-full h-24 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              maxLength={500}
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-400">
              {instruction.length}/500
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          disabled={isExecuting || !instruction.trim()}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isExecuting ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Executing...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Execute</span>
            </div>
          )}
        </button>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <button className="p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors text-left">
              <div className="text-sm font-medium text-gray-800">Fill Form</div>
              <div className="text-xs text-gray-500">Auto-fill forms</div>
            </button>
            <button className="p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors text-left">
              <div className="text-sm font-medium text-gray-800">Extract Data</div>
              <div className="text-xs text-gray-500">Get page content</div>
            </button>
            <button className="p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors text-left">
              <div className="text-sm font-medium text-gray-800">Navigate</div>
              <div className="text-xs text-gray-500">Go to pages</div>
            </button>
            <button className="p-3 bg-white rounded-lg border hover:bg-gray-50 transition-colors text-left">
              <div className="text-sm font-medium text-gray-800">Interact</div>
              <div className="text-xs text-gray-500">Click & type</div>
            </button>
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="text-sm font-medium text-gray-700">Recent Activity</h3>
          </div>
          <div className="p-4 space-y-2 max-h-32 overflow-y-auto">
            <div className="text-xs text-gray-500 text-center py-4">
              No recent activity
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export { MainPage }
