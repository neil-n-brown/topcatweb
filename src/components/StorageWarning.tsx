import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useStorageAware } from '../hooks/useStorageAware'

interface StorageWarningProps {
  showWhenLimited?: boolean
  className?: string
}

export default function StorageWarning({ showWhenLimited = true, className = '' }: StorageWarningProps) {
  const { hasAccess, type, isAvailable, error, retryStorageAccess } = useStorageAware()

  // Don't show warning if storage is working fine
  if (hasAccess && isAvailable && !error) {
    return null
  }

  // Only show when limited if requested
  if (!showWhenLimited && !error) {
    return null
  }

  return (
    <div className={`p-3 bg-yellow-100 border border-yellow-300 rounded-lg ${className}`}>
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-yellow-900 mb-1">
            Storage Access Limited
          </h4>
          <p className="text-sm text-yellow-800 mb-2">
            {error 
              ? `Storage error: ${error}`
              : `Using ${type} storage. Some features may not persist between sessions.`
            }
          </p>
          <div className="flex items-center space-x-2">
            <button
              onClick={retryStorageAccess}
              className="text-sm text-yellow-800 hover:text-yellow-900 underline flex items-center"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </button>
            <span className="text-xs text-yellow-700">
              Storage: {type} ({isAvailable ? 'available' : 'limited'})
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}