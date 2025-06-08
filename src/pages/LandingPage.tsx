import React from 'react'
import { Heart, Smartphone, Trophy, Upload, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { isDemoMode } from '../lib/supabase'

export default function LandingPage() {
  const sampleCats = [
    {
      src: 'https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&cs=tinysrgb&w=400',
      name: 'Whiskers',
      reactions: 1247
    },
    {
      src: 'https://images.pexels.com/photos/416160/pexels-photo-416160.jpeg?auto=compress&cs=tinysrgb&w=400',
      name: 'Luna',
      reactions: 892
    },
    {
      src: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400',
      name: 'Mittens',
      reactions: 756
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Demo Mode Banner */}
      {isDemoMode && (
        <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-3">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-yellow-800 font-medium">
              🚧 Demo Mode: Supabase is not configured. You can explore the interface, but authentication and data features are disabled.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Top Cat</span>
            </div>
            <Link
              to="/auth"
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              {isDemoMode ? 'View Demo' : 'Get Started'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Rate the World's
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">
              {' '}Cutest Cats
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Swipe through adorable cat photos, react with emojis, and discover the most beloved 
            felines in our community. It's like Tinder, but for cats! 🐱
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              to={isDemoMode ? "/swipe" : "/auth"}
              className="bg-orange-500 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center"
            >
              {isDemoMode ? 'Try Demo' : 'Start Swiping'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to={isDemoMode ? "/upload" : "/auth"}
              className="border-2 border-orange-500 text-orange-500 px-8 py-4 rounded-lg text-lg font-medium hover:bg-orange-50 transition-colors"
            >
              {isDemoMode ? 'View Upload' : 'Upload Your Cat'}
            </Link>
          </div>

          {/* Sample Cat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {sampleCats.map((cat, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:scale-105 transition-transform">
                <img
                  src={cat.src}
                  alt={cat.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-900">{cat.name}</h3>
                  <p className="text-orange-500 font-medium">{cat.reactions} reactions</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How Top Cat Works</h2>
            <p className="text-xl text-gray-600">Simple, fun, and addictive cat rating</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Swipe & Rate</h3>
              <p className="text-gray-600">
                Swipe right for cute cats, left for not-so-cute ones. Or use our emoji reactions 
                for more expressive rating!
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-pink-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Cat</h3>
              <p className="text-gray-600">
                Share your adorable feline friend with the community and see how many reactions 
                they get from cat lovers worldwide.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Compete & Win</h3>
              <p className="text-gray-600">
                Watch your cat climb the leaderboards! See which cats are trending and 
                compete for the title of "Top Cat."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-pink-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-12">Join the Cat Community</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-white mb-2">10K+</div>
              <div className="text-orange-100">Cats Rated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">5K+</div>
              <div className="text-orange-100">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white mb-2">50K+</div>
              <div className="text-orange-100">Reactions Given</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Find Your Top Cat?</h2>
          <p className="text-xl text-gray-300 mb-8">
            {isDemoMode 
              ? 'Explore the demo to see how Top Cat works!'
              : 'Join thousands of cat lovers in rating the world\'s cutest cats'
            }
          </p>
          <Link
            to={isDemoMode ? "/swipe" : "/auth"}
            className="bg-orange-500 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-orange-600 transition-colors inline-flex items-center"
          >
            {isDemoMode ? 'Try Demo Now' : 'Start Rating Cats Now'}
            <Heart className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">Top Cat</span>
          </div>
          <p className="text-gray-600">
            Made with ❤️ for cat lovers everywhere
          </p>
        </div>
      </footer>
    </div>
  )
}