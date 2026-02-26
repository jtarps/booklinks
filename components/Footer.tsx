import Link from 'next/link';
import { Book } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Book className="h-5 w-5 text-indigo-400" />
              <span className="text-lg font-bold text-white">BookLinks</span>
            </div>
            <p className="text-sm text-gray-400">
              Discover every book referenced inside your favorite reads. Built by
              readers, for readers.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Explore
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/explore" className="hover:text-white transition-colors">
                  Reference Map
                </Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-white transition-colors">
                  Stats
                </Link>
              </li>
              <li>
                <Link href="/lists" className="hover:text-white transition-colors">
                  Lists
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Contribute
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Add a Book
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 text-sm text-gray-500">
          <p className="text-center text-xs text-gray-600 mb-4">
            As an Amazon Associate, BookLinks earns from qualifying purchases.
            Book links on this site may be affiliate links.
          </p>
          <p className="text-center">
            &copy; {new Date().getFullYear()} BookLinks. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
