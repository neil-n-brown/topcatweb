import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackForm({ isOpen, onClose }: FeedbackFormProps) {
  const [feedback, setFeedback] = useState('');
  const [suggestFeature, setSuggestFeature] = useState(false);
  const [technicalIssue, setTechnicalIssue] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Get the session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get session');
      }
      if (!session) {
        throw new Error('No active session');
      }

      console.log('Session token:', session.access_token); // Debug log

      const response = await fetch('https://hgkjibevclwbwtzxezid.supabase.co/functions/v1/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          feedback,
          suggestFeature,
          technicalIssue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Response error:', errorData); // Debug log
        throw new Error(errorData.error || 'Failed to submit feedback');
      }

      setSubmitStatus('success');
      setFeedback('');
      setSuggestFeature(false);
      setTechnicalIssue(false);
      
      // Close the modal after 2 seconds
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-cute-primary mb-4">Share Your Thoughts! 😺</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
              Your Feedback
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-pink-200 focus:ring-2 focus:ring-pink-400 focus:border-transparent transition-all duration-200"
              rows={4}
              placeholder="Tell us what you think..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={suggestFeature}
                onChange={(e) => setSuggestFeature(e.target.checked)}
                className="rounded text-pink-500 focus:ring-pink-400"
              />
              <span className="text-sm text-gray-700">I'd like to suggest a new feature</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={technicalIssue}
                onChange={(e) => setTechnicalIssue(e.target.checked)}
                className="rounded text-pink-500 focus:ring-pink-400"
              />
              <span className="text-sm text-gray-700">I encountered a technical issue</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 rounded-xl font-medium text-white transition-all duration-200 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 transform hover:scale-105'
            }`}
          >
            {isSubmitting ? 'Sending...' : 'Send Feedback'}
          </button>

          {submitStatus === 'success' && (
            <p className="text-green-600 text-sm text-center">Thank you for your feedback! 😊</p>
          )}
          {submitStatus === 'error' && (
            <p className="text-red-600 text-sm text-center">Oops! Something went wrong. Please try again.</p>
          )}
        </form>
      </div>
    </div>
  );
} 