import type { Metadata } from 'next';
import Link from 'next/link';
import { Book } from 'lucide-react';
import { AuthProvider } from '@/components/AuthProvider';
import { UserMenu } from '@/components/UserMenu';
import { Footer } from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://booklinks.co'),
  title: {
    default: 'BookLinks — Discover Books Within Books',
    template: '%s | BookLinks',
  },
  description:
    'Find every book referenced inside your favorite reads. Explore the hidden reading lists of bestselling authors.',
  openGraph: {
    siteName: 'BookLinks',
    title: 'BookLinks — Discover Books Within Books',
    description:
      'Find every book referenced inside your favorite reads. Explore the hidden reading lists of bestselling authors.',
    type: 'website',
    url: 'https://booklinks.co',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BookLinks — Discover Books Within Books',
    description:
      'Find every book referenced inside your favorite reads. Explore the hidden reading lists of bestselling authors.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <AuthProvider>
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <Book className="h-6 w-6 text-indigo-600" />
                <h1 className="text-xl font-bold text-gray-900">BookLinks</h1>
              </Link>
              <UserMenu />
            </div>
          </header>
          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
