import React from 'react'
import { authHelpers } from '../lib/supabase'

interface StorageErrorBoundaryState {
  hasError: boolean
  error: Error | null
  storageInfo: { type: string; available: boolean } | null
}

interface StorageErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default class StorageErrorBoundary extends React.Component<StorageErrorBoundaryProps, StorageErrorBoundaryState> {
  constructor(props: StorageErrorBoundaryProps) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      storageInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<StorageErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Storage error boundary caught error:', error, errorInfo)
    
    // Get storage info for debugging
    try {
      const storageInfo = authHelpers.getStorageInfo()
      this.setState({ storageInfo })
    } catch (e) {
      console.warn('Could not get storage info:', e)
    }

    // If it's a storage-related error, clean up and continue
    if (error.message?.includes('storage') || 
        error.message?.includes('Access to storage is not allowed')) {
      console.log('Storage-related error detected, cleaning up...')
      authHelpers.cleanupCorruptedSessions()
    }
  }

  handleRetry = () => {
    // Clean up before retrying
    authHelpers.cleanupCorruptedSessions()
    
    this.setState({ 
      hasError: false, 
      error: null,
      storageInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      const isStorageError = this.state.error?.message?.includes('storage') || 
                            this.state.error?.message?.includes('Access to storage is not allowed')

      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg">
          <div className="flex items-start">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                {isStorageError ? 'Storage Access Limited' : 'Component Error'}
              </h4>
              <p className="text-sm text-yellow-800 mb-2">
                {isStorageError 
                  ? 'This feature requires storage access. The app will continue with limited functionality.'
                  : 'An error occurred in this component.'
                }
              </p>
              {this.state.storageInfo && (
                <p className="text-xs text-yellow-700">
                  Storage: {this.state.storageInfo.type} ({this.state.storageInfo.available ? 'available' : 'limited'})
                </p>
              )}
              <button
                onClick={this.handleRetry}
                className="mt-2 text-sm text-yellow-800 hover:text-yellow-900 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}