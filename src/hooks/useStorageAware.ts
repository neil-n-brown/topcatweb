import { useState, useEffect } from 'react'
import { authHelpers } from '../lib/supabase'

interface StorageState {
  hasAccess: boolean
  type: 'localStorage' | 'memory'
  isAvailable: boolean
  error: string | null
}

export function useStorageAware() {
  const [storageState, setStorageState] = useState<StorageState>({
    hasAccess: false,
    type: 'memory',
    isAvailable: false,
    error: null
  })

  useEffect(() => {
    try {
      const hasAccess = authHelpers.testStorageAccess()
      const storageInfo = authHelpers.getStorageInfo()
      
      setStorageState({
        hasAccess,
        type: storageInfo.type as 'localStorage' | 'memory',
        isAvailable: storageInfo.available,
        error: null
      })
    } catch (error: any) {
      console.warn('Error checking storage access:', error)
      setStorageState({
        hasAccess: false,
        type: 'memory',
        isAvailable: false,
        error: error.message || 'Storage access check failed'
      })
    }
  }, [])

  const retryStorageAccess = () => {
    try {
      authHelpers.cleanupCorruptedSessions()
      const hasAccess = authHelpers.testStorageAccess()
      const storageInfo = authHelpers.getStorageInfo()
      
      setStorageState({
        hasAccess,
        type: storageInfo.type as 'localStorage' | 'memory',
        isAvailable: storageInfo.available,
        error: null
      })
    } catch (error: any) {
      setStorageState(prev => ({
        ...prev,
        error: error.message || 'Storage retry failed'
      }))
    }
  }

  return {
    ...storageState,
    retryStorageAccess
  }
}