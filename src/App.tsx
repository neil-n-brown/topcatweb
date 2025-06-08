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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
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

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
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

  if (user) {
    return <Navigate to="/swipe" replace />
  }

  return <>{children}</>
}

function App() {
  return (
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
          
          <Route path="/profile" element={
            <Layout>
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            </Layout>
          } />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/\" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App