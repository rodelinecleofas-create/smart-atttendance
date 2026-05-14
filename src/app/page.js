import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">Smart Attend</h1>
        <p className="text-xl text-gray-600 mb-8">Efficient Attendance Management System</p>
        <div className="space-x-4">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="bg-gray-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-700"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}