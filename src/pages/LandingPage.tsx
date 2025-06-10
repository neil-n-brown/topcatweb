import React from 'react'
import { Heart, Smartphone, Trophy, Upload, ArrowRight, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { isDemoMode } from '../lib/supabase'

export default function LandingPage() {
  const sampleCats = [
    {
      src: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=400',
      name: 'Whiskers',
      reactions: 1247,
      emoji: '🧡'
    },
    {
      src: 'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=400',
      name: 'Luna',
      reactions: 892,
      emoji: '🖤'
    },
    {
      src: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400',
      name: 'Mittens',
      reactions: 756,
      emoji: '🤍'
    }
  ]

  return (
    <div className="min-h-screen bg-cute-gradient relative overflow-hidden">
      {/* Floating Cat Decorations */}
      <div className="fixed top-20 right-20 text-6xl opacity-10 float-animation pointer-events-none">
        🐱
      </div>
      <div className="fixed bottom-32 left-16 text-4xl opacity-15 float-animation pointer-events-none" style={{ animationDelay: '1s' }}>
        🐾
      </div>
      <div className="fixed top-1/3 left-10 text-3xl opacity-10 float-animation pointer-events-none" style={{ animationDelay: '2s' }}>
        😻
      </div>
      <div className="fixed top-2/3 right-10 text-5xl opacity-10 float-animation pointer-events-none" style={{ animationDelay: '0.5s' }}>
        💕
      </div>

      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="alert-cute-warning border-b border-yellow-300 px-4 py-3 relative z-10">
          <div className="max-w-7xl mx-auto text-center">
            <p className="font-medium flex items-center justify-center">
              <span className="text-2xl mr-2">🚧</span>
              Demo Mode: Supabase is not configured. You can explore the interface, but authentication and data features are disabled.
              <span className="text-2xl ml-2">😸</span>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="nav-cute shadow-lg relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl bg-gradient-to-r from-pink-400 to-purple-400 shadow-lg hover-bounce">
                😺
              </div>
              <div>
                <span className="text-2xl font-bold text-cute-primary bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  Top Cat
                </span>
                <div className="text-xs text-cute-secondary">Purrfect ratings!</div>
              </div>
            </div>
            <Link
              to="/auth"
              className="btn-cute hover-bounce flex items-center space-x-2"
            >
              <span>{isDemoMode ? 'View Demo' : 'Get Started'}</span>
              <span className="text-lg">😸</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Cute Hero Cat */}
          <div className="mb-8">
            <div className="text-8xl mb-4 float-animation">😻</div>
            <div className="flex justify-center space-x-4 text-3xl opacity-60">
              <span className="float-animation" style={{ animationDelay: '0.5s' }}>🐾</span>
              <span className="float-animation" style={{ animationDelay: '1s' }}>💕</span>
              <span className="float-animation" style={{ animationDelay: '1.5s' }}>🐾</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-cute-primary mb-6 leading-tight">
            Rate the World's
            <br />
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
              Cutest Cats
            </span>
          </h1>
          
          <p className="text-xl text-cute-secondary mb-8 max-w-3xl mx-auto leading-relaxed">
            Swipe through adorable cat photos, react with emojis, and discover the most beloved 
            felines in our community. It's like Tinder, but for cats! 
            <span className="text-2xl ml-2">🐱💕</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to={isDemoMode ? "/swipe" : "/auth"}
              className="btn-cute text-lg hover-bounce flex items-center justify-center space-x-2"
            >
              <span>{isDemoMode ? 'Try Demo' : 'Start Swiping'}</span>
              <ArrowRight className="w-5 h-5" />
              <span className="text-xl">😻</span>
            </Link>
            <Link
              to={isDemoMode ? "/upload" : "/auth"}
              className="px-8 py-4 rounded-full text-lg font-medium transition-all duration-300 transform hover:scale-105 border-2 border-pink-300 text-pink-600 hover:bg-pink-50 flex items-center justify-center space-x-2"
            >
              <span>{isDemoMode ? 'View Upload' : 'Upload Your Cat'}</span>
              <span className="text-xl">📸</span>
            </Link>
          </div>

          {/* Sample Cat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {sampleCats.map((cat, index) => (
              <div key={index} className="card-cute p-6 transform hover:scale-105 transition-all duration-300 group">
                <div className="relative mb-4">
                  <img
                    src={cat.src}
                    alt={cat.name}
                    className="w-full h-64 object-cover rounded-2xl"
                  />
                  <div className="absolute top-3 right-3 text-2xl bg-white/80 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center">
                    {cat.emoji}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                    <Heart className="w-4 h-4 text-pink-500" />
                    <span className="text-sm font-medium text-cute-primary">{cat.reactions}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-cute-primary mb-2">{cat.name}</h3>
                <div className="flex items-center justify-center space-x-2 text-pink-500">
                  <span className="text-sm font-medium">Purrfect rating!</span>
                  <span className="text-lg">😸</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-4xl font-bold text-cute-primary mb-4">How Top Cat Works</h2>
            <p className="text-xl text-cute-secondary">Simple, fun, and addictive cat rating</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center card-cute p-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl bg-gradient-to-r from-pink-100 to-purple-100">
                📱
              </div>
              <h3 className="text-xl font-bold text-cute-primary mb-4">Swipe & Rate</h3>
              <p className="text-cute-secondary leading-relaxed">
                Swipe right for cute cats, left for not-so-cute ones. Or use our emoji reactions 
                for more expressive rating! 
                <span className="text-lg ml-1">😻💕</span>
              </p>
            </div>

            <div className="text-center card-cute p-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl bg-gradient-to-r from-pink-100 to-purple-100">
                📸
              </div>
              <h3 className="text-xl font-bold text-cute-primary mb-4">Upload Your Cat</h3>
              <p className="text-cute-secondary leading-relaxed">
                Share your adorable feline friend with the community and see how many reactions 
                they get from cat lovers worldwide.
                <span className="text-lg ml-1">🐱⭐</span>
              </p>
            </div>

            <div className="text-center card-cute p-8">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl bg-gradient-to-r from-pink-100 to-purple-100">
                👑
              </div>
              <h3 className="text-xl font-bold text-cute-primary mb-4">Compete & Win</h3>
              <p className="text-cute-secondary leading-relaxed">
                Watch your cat climb the leaderboards! See which cats are trending and 
                compete for the title of "Top Cat."
                <span className="text-lg ml-1">🏆😸</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 relative z-10">
        <div className="card-cute max-w-5xl mx-auto px-8 py-16 text-center">
          <div className="text-6xl mb-8">📊</div>
          <h2 className="text-4xl font-bold text-cute-primary mb-12">Join the Cat Community</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50">
              <div className="text-4xl font-bold text-pink-600 mb-2">10K+</div>
              <div className="text-cute-secondary flex items-center justify-center">
                <span>Cats Rated</span>
                <span className="text-lg ml-2">😻</span>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="text-4xl font-bold text-purple-600 mb-2">5K+</div>
              <div className="text-cute-secondary flex items-center justify-center">
                <span>Active Users</span>
                <span className="text-lg ml-2">👥</span>
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50">
              <div className="text-4xl font-bold text-pink-600 mb-2">50K+</div>
              <div className="text-cute-secondary flex items-center justify-center">
                <span>Reactions Given</span>
                <span className="text-lg ml-2">💕</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="card-cute max-w-4xl mx-auto px-8 py-16 text-center bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="text-6xl mb-6">🚀</div>
          <h2 className="text-4xl font-bold text-cute-primary mb-4">Ready to Find Your Top Cat?</h2>
          <p className="text-xl text-cute-secondary mb-8">
            {isDemoMode 
              ? 'Explore the demo to see how Top Cat works! 🎮😸'
              : 'Join thousands of cat lovers in rating the world\'s cutest cats 🌟💕'
            }
          </p>
          <Link
            to={isDemoMode ? "/swipe" : "/auth"}
            className="btn-cute text-lg hover-bounce inline-flex items-center space-x-2"
          >
            <span>{isDemoMode ? 'Try Demo Now' : 'Start Rating Cats Now'}</span>
            <Heart className="w-5 h-5" />
            <span className="text-xl">😻</span>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="nav-cute py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xl bg-gradient-to-r from-pink-400 to-purple-400 shadow-lg">
              😺
            </div>
            <span className="text-lg font-bold text-cute-primary">Top Cat</span>
            <span className="text-2xl">💕</span>
          </div>
          <p className="text-cute-secondary">
            Made with 💖 for cat lovers everywhere 🐱✨
          </p>
        </div>
      </footer>
    </div>
  )
}