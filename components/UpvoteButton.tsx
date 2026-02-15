'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThumbsUp } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase-browser';

interface UpvoteButtonProps {
  referenceId: string;
}

export function UpvoteButton({ referenceId }: UpvoteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUpvotes() {
      const { count: upvoteCount } = await supabase
        .from('reference_upvotes')
        .select('*', { count: 'exact', head: true })
        .eq('reference_id', referenceId);

      setCount(upvoteCount ?? 0);

      if (user) {
        const { data } = await supabase
          .from('reference_upvotes')
          .select('id')
          .eq('reference_id', referenceId)
          .eq('user_id', user.id)
          .maybeSingle();

        setHasUpvoted(!!data);
      }
    }

    fetchUpvotes();
  }, [referenceId, user]);

  const toggle = async () => {
    if (!user) {
      router.push('/auth/signup');
      return;
    }
    if (loading) return;
    setLoading(true);

    if (hasUpvoted) {
      // Optimistic update
      setHasUpvoted(false);
      setCount((c) => c - 1);

      const { error } = await supabase
        .from('reference_upvotes')
        .delete()
        .eq('reference_id', referenceId)
        .eq('user_id', user.id);

      if (error) {
        setHasUpvoted(true);
        setCount((c) => c + 1);
      }
    } else {
      // Optimistic update
      setHasUpvoted(true);
      setCount((c) => c + 1);

      const { error } = await supabase
        .from('reference_upvotes')
        .insert({ user_id: user.id, reference_id: referenceId });

      if (error) {
        setHasUpvoted(false);
        setCount((c) => c - 1);
      }
    }

    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors cursor-pointer ${
        hasUpvoted
          ? 'text-indigo-700 bg-indigo-100'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
      title={user ? (hasUpvoted ? 'Remove upvote' : 'Upvote this reference') : 'Sign up to upvote'}
    >
      <ThumbsUp className="h-3.5 w-3.5" />
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
