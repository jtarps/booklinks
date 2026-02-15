'use client';

import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BookOpen, Link2, TrendingUp, Network } from 'lucide-react';

interface DailyCount {
  day: string;
  count: number;
}

interface ReferencedBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  cover_url: string | null;
  reference_count: number;
}

interface ConnectedBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  cover_url: string | null;
  total_connections: number;
  outgoing_refs: number;
  incoming_refs: number;
}

interface StatsClientProps {
  totalBooks: number;
  totalReferences: number;
  dailyCounts: DailyCount[];
  mostReferenced: ReferencedBook[];
  mostConnected: ConnectedBook[];
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function truncateTitle(title: string, max = 25) {
  return title.length > max ? title.slice(0, max) + '...' : title;
}

export function StatsClient({
  totalBooks,
  totalReferences,
  dailyCounts,
  mostReferenced,
  mostConnected,
}: StatsClientProps) {
  const avgRefs = totalBooks > 0 ? (totalReferences / totalBooks).toFixed(1) : '0';

  const chartData = dailyCounts.map((d) => ({
    day: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: d.count,
  }));

  const refBarData = mostReferenced.map((b) => ({
    name: truncateTitle(b.title),
    slug: b.slug,
    count: b.reference_count,
  }));

  const connBarData = mostConnected.map((b) => ({
    name: truncateTitle(b.title),
    slug: b.slug,
    count: b.total_connections,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Platform Stats</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={BookOpen} label="Total Books" value={totalBooks} color="bg-indigo-600" />
        <StatCard icon={Link2} label="Total References" value={totalReferences} color="bg-purple-600" />
        <StatCard icon={TrendingUp} label="Avg Refs/Book" value={avgRefs} color="bg-green-600" />
      </div>

      {chartData.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Growth Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {refBarData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="h-5 w-5 text-purple-600" />
              <h2 className="text-lg font-semibold text-gray-900">Most Referenced Books</h2>
            </div>
            <ResponsiveContainer width="100%" height={refBarData.length * 40 + 40}>
              <BarChart data={refBarData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} fontSize={12} />
                <YAxis type="category" dataKey="name" width={150} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-1">
              {mostReferenced.slice(0, 5).map((book) => (
                <Link
                  key={book.id}
                  href={`/book/${book.slug}`}
                  className="block text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {book.title} — {book.reference_count} references
                </Link>
              ))}
            </div>
          </div>
        )}

        {connBarData.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Network className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Most Connected Books</h2>
            </div>
            <ResponsiveContainer width="100%" height={connBarData.length * 40 + 40}>
              <BarChart data={connBarData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} fontSize={12} />
                <YAxis type="category" dataKey="name" width={150} fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-1">
              {mostConnected.slice(0, 5).map((book) => (
                <Link
                  key={book.id}
                  href={`/book/${book.slug}`}
                  className="block text-sm text-indigo-600 hover:text-indigo-500"
                >
                  {book.title} — {book.total_connections} connections
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
