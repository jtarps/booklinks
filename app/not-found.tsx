import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center py-16">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Book Not Found</h2>
      <p className="text-gray-600 mb-8">
        The book you&apos;re looking for doesn&apos;t exist in our database yet.
      </p>
      <Link
        href="/"
        className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Back to Home
      </Link>
    </div>
  );
}
