import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import SwipePage from './pages/SwipePage'
import LeaderboardPage from './pages/LeaderboardPage'
import UploadPage from './pages/UploadPage'
import ProfilePage from './pages/ProfilePage'
import CatProfilesPage from './pages/CatProfilesPage'
import CatProfileDetailPage from './pages/CatProfileDetailPage'
import UserProfilePage from './pages/UserProfilePage'
import ErrorBoundary from './components/ErrorBoundary'
import StorageErrorBoundary from './components/StorageErrorBoundary'
import StorageWarning from './components/StorageWarning'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <StorageWarning className="mb-4" />
          <button
            onClick={() => window.location.href = '/auth'}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return (
    <StorageErrorBoundary>
      {children}
    </StorageErrorBoundary>
  )
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // CRITICAL FIX: Redirect authenticated users to the main app
  if (user) {
    return <Navigate to="/swipe" replace />
  }

  return (
    <StorageErrorBoundary>
      {children}
    </StorageErrorBoundary>
  )
}

// 404 Page Component
function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
        <h1 className="text-6xl font-bold text-orange-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-2">
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go Home
          </button>
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <StorageErrorBoundary>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Default route - always show landing page first */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Public routes */}
              <Route path="/landing" element={<LandingPage />} />
              
              <Route path="/auth" element={
                <PublicRoute>
                  <AuthPage />
                </PublicRoute>
              } />

              {/* Protected routes */}
              <Route path="/swipe" element={
                <Layout>
                  <ProtectedRoute>
                    <SwipePage />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/leaderboard" element={
                <Layout>
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/upload" element={
                <Layout>
                  <ProtectedRoute>
                    <UploadPage />
                  </ProtectedRoute>
                </Layout>
              } />

              <Route path="/cat-profiles" element={
                <Layout>
                  <ProtectedRoute>
                    <CatProfilesPage />
                  </ProtectedRoute>
                </Layout>
              } />

              {/* Individual cat profile page */}
              <Route path="/cat-profile/:id" element={
                <Layout>
                  <ProtectedRoute>
                    <CatProfileDetailPage />
                  </ProtectedRoute>
                </Layout>
              } />

              {/* User profile page */}
              <Route path="/user/:id" element={
                <Layout>
                  <ProtectedRoute>
                    <UserProfilePage />
                  </ProtectedRoute>
                </Layout>
              } />
              
              <Route path="/profile" element={
                <Layout>
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                </Layout>
              } />

              {/* 404 route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </StorageErrorBoundary>
    </ErrorBoundary>
  )
}

export default App