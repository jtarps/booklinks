'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ListPlus, Plus, Check, Loader2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/lib/supabase-browser';

interface ReadingList {
  id: string;
  name: string;
  slug: string;
}

interface AddToListButtonProps {
  bookId: string;
  bookTitle: string;
}

export function AddToListButton({ bookId, bookTitle }: AddToListButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<ReadingList[]>([]);
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
        setCreating(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchLists = async () => {
    if (!user) return;
    setLoading(true);

    const { data: userLists } = await supabase
      .from('reading_lists')
      .select('id, name, slug')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (userLists) {
      setLists(userLists);

      // Check which lists already contain this book
      const { data: items } = await supabase
        .from('reading_list_items')
        .select('reading_list_id')
        .eq('book_id', bookId)
        .in('reading_list_id', userLists.map((l) => l.id));

      if (items) {
        setAddedTo(new Set(items.map((i) => i.reading_list_id)));
      }
    }
    setLoading(false);
  };

  const handleToggle = () => {
    if (!open) fetchLists();
    setOpen(!open);
    setCreating(false);
  };

  const addToList = async (listId: string) => {
    const { error } = await supabase.from('reading_list_items').insert({
      reading_list_id: listId,
      book_id: bookId,
    });

    if (!error) {
      setAddedTo((prev) => new Set(prev).add(listId));
    }
  };

  const removeFromList = async (listId: string) => {
    await supabase
      .from('reading_list_items')
      .delete()
      .eq('reading_list_id', listId)
      .eq('book_id', bookId);

    setAddedTo((prev) => {
      const next = new Set(prev);
      next.delete(listId);
      return next;
    });
  };

  const createList = async () => {
    if (!user || !newListName.trim()) return;
    const slug = newListName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

    const { data, error } = await supabase
      .from('reading_lists')
      .insert({
        user_id: user.id,
        name: newListName.trim(),
        slug,
      })
      .select('id, name, slug')
      .single();

    if (!error && data) {
      setLists((prev) => [data, ...prev]);
      await addToList(data.id);
      setNewListName('');
      setCreating(false);
    }
  };

  const handleClick = () => {
    if (!user) {
      router.push('/auth/signup');
      return;
    }
    handleToggle();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleClick}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        title={`Add "${bookTitle}" to a reading list`}
      >
        <ListPlus className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-2 z-50">
          <p className="px-4 pb-2 text-xs font-medium text-gray-500 uppercase">
            Add to list
          </p>

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {lists.map((list) => {
                const isAdded = addedTo.has(list.id);
                return (
                  <button
                    key={list.id}
                    onClick={() => isAdded ? removeFromList(list.id) : addToList(list.id)}
                    className="flex items-center justify-between w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <span>{list.name}</span>
                    {isAdded && <Check className="h-4 w-4 text-green-600" />}
                  </button>
                );
              })}

              {lists.length === 0 && !creating && (
                <p className="px-4 py-2 text-sm text-gray-500">No lists yet</p>
              )}

              <hr className="my-1" />

              {creating ? (
                <div className="px-4 py-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createList()}
                    placeholder="List name..."
                    className="w-full text-sm rounded border-gray-300 mb-2"
                    autoFocus
                  />
                  <button
                    onClick={createList}
                    disabled={!newListName.trim()}
                    className="w-full text-sm py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Create & Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreating(true)}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                >
                  <Plus className="h-4 w-4" />
                  New list
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
