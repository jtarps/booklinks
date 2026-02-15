import type { Metadata } from 'next';
import Link from 'next/link';
import { Book, BarChart3, ListChecks } from 'lucide-react';
import { AuthProvider } from '@/components/AuthProvider';
import { UserMenu } from '@/components/UserMenu';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'BookLinks — Discover Books Within Books',
    template: '%s | BookLinks',
  },
  description:
    'Find every book referenced inside your favorite reads. Explore the hidden reading lists of bestselling authors.',
  openGraph: {
    title: 'BookLinks — Discover Books Within Books',
    description:
      'Find every book referenced inside your favorite reads. Explore the hidden reading lists of bestselling authors.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link
                  href="/"
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <Book className="h-6 w-6 text-indigo-600" />
                  <h1 className="text-xl font-bold text-gray-900">BookLinks</h1>
                </Link>
                <nav className="hidden sm:flex items-center gap-4">
                  <Link
                    href="/stats"
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Stats
                  </Link>
                  <Link
                    href="/lists"
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <ListChecks className="h-4 w-4" />
                    Lists
                  </Link>
                </nav>
              </div>
              <UserMenu />
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
