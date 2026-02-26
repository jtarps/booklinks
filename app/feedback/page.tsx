'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bug,
  Lightbulb,
  MessageCircle,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Eye,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';
import { useAuth } from '@/components/AuthProvider';

type FeedbackStatus = 'new' | 'read' | 'in_progress' | 'resolved' | 'dismissed';

interface FeedbackItem {
  id: string;
  type: 'bug' | 'feature' | 'general';
  message: string;
  email: string | null;
  page_url: string | null;
  status: FeedbackStatus;
  admin_notes: string | null;
  created_at: string;
  user_id: string | null;
  profiles?: { display_name: string | null } | null;
}


const statusConfig: Record<FeedbackStatus, { label: string; icon: React.ReactNode; color: string }> = {
  new: { label: 'New', icon: <Circle className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700' },
  read: { label: 'Read', icon: <Eye className="h-3.5 w-3.5" />, color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', icon: <Clock className="h-3.5 w-3.5" />, color: 'bg-amber-100 text-amber-700' },
  resolved: { label: 'Resolved', icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'bg-green-100 text-green-700' },
  dismissed: { label: 'Dismissed', icon: <XCircle className="h-3.5 w-3.5" />, color: 'bg-red-100 text-red-700' },
};

const typeIcons: Record<string, React.ReactNode> = {
  bug: <Bug className="h-4 w-4 text-red-500" />,
  feature: <Lightbulb className="h-4 w-4 text-amber-500" />,
  general: <MessageCircle className="h-4 w-4 text-blue-500" />,
};

export default function FeedbackPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FeedbackStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchFeedback = useCallback(async () => {
    if (!user) return;

    // Check if user is admin from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const adminCheck = profile?.is_admin === true;
    setIsAdmin(adminCheck);

    let query = supabase
      .from('feedback')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: false });

    if (!adminCheck) {
      query = query.eq('user_id', user.id);
    }

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }

    const { data } = await query;
    setItems((data as FeedbackItem[]) || []);
    setLoading(false);
  }, [user, filter, typeFilter]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    if (user) fetchFeedback();
  }, [user, authLoading, fetchFeedback, router]);

  const updateStatus = async (id: string, status: FeedbackStatus) => {
    await supabase
      .from('feedback')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    fetchFeedback();
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const counts = {
    all: items.length,
    new: items.filter((i) => i.status === 'new').length,
    in_progress: items.filter((i) => i.status === 'in_progress').length,
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/')}
        className="inline-flex items-center text-indigo-600 hover:text-indigo-500 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to home
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isAdmin ? 'Feedback Dashboard' : 'My Feedback'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin
              ? `${counts.new} new, ${counts.in_progress} in progress`
              : 'Track your submitted feedback'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['all', 'new', 'read', 'in_progress', 'resolved', 'dismissed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s === 'all' ? 'All' : statusConfig[s].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['all', 'bug', 'feature', 'general'].map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback list */}
      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No feedback found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border border-gray-100 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5">{typeIcons[item.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[item.status].color}`}
                      >
                        {statusConfig[item.status].icon}
                        {statusConfig[item.status].label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                      {isAdmin && (item.profiles?.display_name || item.email) && (
                        <span className="text-xs text-gray-500">
                          from {item.profiles?.display_name || item.email}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap">{item.message}</p>
                    {item.page_url && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        Page: {item.page_url}
                      </p>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item.id, e.target.value as FeedbackStatus)}
                    className="text-sm border-gray-200 rounded-lg focus:ring-indigo-600 focus:border-transparent"
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
