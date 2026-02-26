'use client';

import { useState } from 'react';
import { Globe, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase-browser';

interface Props {
  listId: string;
  initialPublic: boolean;
}

export function ListVisibilityToggle({ listId, initialPublic }: Props) {
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [updating, setUpdating] = useState(false);

  const toggle = async () => {
    setUpdating(true);
    const newValue = !isPublic;
    const { error } = await supabase
      .from('reading_lists')
      .update({ is_public: newValue })
      .eq('id', listId);

    if (!error) {
      setIsPublic(newValue);
    }
    setUpdating(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={updating}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        isPublic
          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
      } disabled:opacity-50`}
    >
      {isPublic ? (
        <>
          <Globe className="h-3.5 w-3.5" />
          Public
        </>
      ) : (
        <>
          <Lock className="h-3.5 w-3.5" />
          Private
        </>
      )}
    </button>
  );
}
