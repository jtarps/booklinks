'use client';

import Link from 'next/link';
import { ExternalLink, Plus, X } from 'lucide-react';
import { getAmazonAffiliateLink } from '@/lib/amazon';
import { getWorldCatLink } from '@/lib/library';
import type { Reference } from '@/types';
import { UpvoteButton } from './UpvoteButton';

interface ReferenceListProps {
  title: string;
  references: Reference[];
  onAdd?: () => void;
  showAdd?: boolean;
  isDiscovering?: boolean;
}

export function ReferenceList({
  title,
  references,
  onAdd,
  showAdd,
  isDiscovering,
}: ReferenceListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {onAdd && (
          <button
            onClick={onAdd}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            disabled={isDiscovering}
          >
            {showAdd ? (
              <X className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5 mr-2" />
            )}
            {showAdd ? 'Cancel' : 'Add Reference'}
          </button>
        )}
      </div>

      {references.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2">
          {references.map((reference) => (
            <article
              key={reference.id}
              className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg"
            >
              <div className="w-24 flex-shrink-0">
                <img
                  src={reference.coverUrl}
                  alt={reference.title}
                  className="w-24 h-36 object-cover rounded shadow"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/book/${reference.id}`}
                  className="block group"
                >
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600">
                    {reference.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    by {reference.author}
                  </p>
                  {reference.description && (
                    <details>
                      <summary className="text-sm text-indigo-600 hover:text-indigo-500 cursor-pointer">
                        Description
                      </summary>
                      <p className="text-sm text-gray-700 mt-2">
                        {reference.description}
                      </p>
                    </details>
                  )}
                </Link>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {reference.referenceId && (
                    <UpvoteButton referenceId={reference.referenceId} />
                  )}
                  <a
                    href={getAmazonAffiliateLink(
                      reference.title,
                      reference.author
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Buy on Amazon{' '}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                  <span className="text-gray-300">&bull;</span>
                  <a
                    href={getWorldCatLink(
                      reference.title,
                      reference.author
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500"
                    title="Find in libraries"
                  >
                    Find Library{' '}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No references found.</p>
          {onAdd && (
            <button
              onClick={onAdd}
              className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add First Reference
            </button>
          )}
        </div>
      )}
    </div>
  );
}
