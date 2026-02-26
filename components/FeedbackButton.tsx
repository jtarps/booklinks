'use client';

import { useState } from 'react';
import { MessageSquarePlus, X, Loader2, Bug, Lightbulb, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import { useAuth } from './AuthProvider';

type FeedbackType = 'bug' | 'feature' | 'general';

const typeConfig: Record<FeedbackType, { label: string; icon: React.ReactNode; color: string }> = {
  bug: { label: 'Bug Report', icon: <Bug className="h-4 w-4" />, color: 'bg-red-100 text-red-700 border-red-200' },
  feature: { label: 'Feature Request', icon: <Lightbulb className="h-4 w-4" />, color: 'bg-amber-100 text-amber-700 border-amber-200' },
  general: { label: 'General', icon: <MessageCircle className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
};

export function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError(null);

    const { error: insertError } = await supabase.from('feedback').insert({
      type,
      message: message.trim(),
      email: user?.email || email.trim() || null,
      user_id: user?.id || null,
      page_url: window.location.href,
    });

    if (insertError) {
      setError('Failed to submit. Please try again.');
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setMessage('');
      setType('general');
      setEmail('');
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
        title="Send feedback"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>

            {submitted ? (
              <div className="text-center py-8">
                <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <MessageSquarePlus className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Thanks for your feedback!</h3>
                <p className="text-gray-600 mt-1">We appreciate you helping us improve.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Send Feedback</h3>
                <p className="text-sm text-gray-500 mb-4">Help us make BookLinks better</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-2">
                    {(Object.keys(typeConfig) as FeedbackType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors ${
                          type === t
                            ? typeConfig[t].color
                            : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {typeConfig[t].icon}
                        {typeConfig[t].label}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={4}
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent resize-none"
                    placeholder={
                      type === 'bug'
                        ? 'Describe the issue you encountered...'
                        : type === 'feature'
                          ? 'Describe the feature you would like...'
                          : 'Share your thoughts...'
                    }
                  />

                  {!user && (
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      placeholder="Email (optional, for follow-up)"
                    />
                  )}

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Submit Feedback'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
