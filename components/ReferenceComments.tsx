'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase-browser';

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: {
    display_name: string | null;
  };
}

interface ReferenceCommentsProps {
  referenceId: string;
}

export function ReferenceComments({ referenceId }: ReferenceCommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const { count } = await supabase
        .from('reference_comments')
        .select('*', { count: 'exact', head: true })
        .eq('reference_id', referenceId);
      setCommentCount(count ?? 0);
    }
    fetchCount();
  }, [referenceId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('reference_comments')
      .select('id, content, created_at, user_id, profile:profiles(display_name)')
      .eq('reference_id', referenceId)
      .order('created_at', { ascending: true });

    if (data) {
      setComments(data.map((c: any) => ({
        ...c,
        profile: Array.isArray(c.profile) ? c.profile[0] : c.profile,
      })));
    }
    setLoading(false);
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };

  const submitComment = async () => {
    if (!user || !newComment.trim() || submitting) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from('reference_comments')
      .insert({
        user_id: user.id,
        reference_id: referenceId,
        content: newComment.trim(),
      })
      .select('id, content, created_at, user_id')
      .single();

    if (!error && data) {
      setComments((prev) => [
        ...prev,
        { ...data, profile: { display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'You' } },
      ]);
      setCommentCount((c) => c + 1);
      setNewComment('');
    }
    setSubmitting(false);
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from('reference_comments').delete().eq('id', commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentCount((c) => c - 1);
  };

  return (
    <div>
      <button
        onClick={toggleComments}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {commentCount > 0 && <span>{commentCount}</span>}
      </button>

      {showComments && (
        <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <>
              {comments.map((comment) => (
                <div key={comment.id} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {comment.profile?.display_name || 'Anonymous'}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                    {user && user.id === comment.user_id && (
                      <button
                        onClick={() => deleteComment(comment.id)}
                        className="text-gray-400 hover:text-red-500"
                        title="Delete comment"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}

              {comments.length === 0 && (
                <p className="text-sm text-gray-500">No comments yet.</p>
              )}

              {user ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                    placeholder="Add a comment..."
                    className="flex-1 text-sm rounded border-gray-300"
                  />
                  <button
                    onClick={submitComment}
                    disabled={submitting || !newComment.trim()}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-500 font-medium">
                    Sign up
                  </Link>{' '}
                  to leave a comment.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
