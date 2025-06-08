import React from 'react'
import { authHelpers } from '../lib/supabase'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // If it's an auth-related error, clean up corrupted sessions
    if (error.message?.includes('auth') || 
        error.message?.includes('session') || 
        error.message?.includes('token')) {
      console.log('Auth-related error detected, cleaning up sessions')
      authHelpers.cleanupCorruptedSessions()
    }

    // Log error for debugging
    if (import.meta.env.DEV) {
      console.group('Error Boundary Details')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }
  }

  handleRetry = () => {
    // Clean up any corrupted data before retrying
    authHelpers.cleanupCorruptedSessions()
    
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    })
  }

  handleRefresh = () => {
    // Clean up before refreshing
    authHelpers.cleanupCorruptedSessions()
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message?.includes('auth') || 
                         this.state.error?.message?.includes('session') ||
                         this.state.error?.message?.includes('token')

      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 p-4">
          <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-lg w-full">
            <div className="text-6xl mb-4">😿</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {isAuthError ? 'Authentication Error' : 'Something went wrong'}
            </h1>
            <p className="text-gray-600 mb-6">
              {isAuthError 
                ? 'There was an issue with your session. This has been automatically cleaned up.'
                : 'An unexpected error occurred. Don\'t worry, we\'ve logged the details.'
              }
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-6 p-4 bg-gray-100 rounded-lg">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-gray-600 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleRefresh}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Refresh Page
              </button>
              
              {isAuthError && (
                <button
                  onClick={() => window.location.href = '/auth'}
                  className="w-full bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Go to Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}