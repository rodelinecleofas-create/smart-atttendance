import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">Smart Attend</h1>
        <p className="text-xl text-gray-600 mb-8">Efficient Attendance Management System</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="w-full sm:w-auto text-center bg-blue-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-blue-700"
          >
            Get Started
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto text-center bg-green-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-green-700"
          >
            Register
          </Link>
          <Link
            href="/dashboard"
            className="w-full sm:w-auto text-center bg-gray-600 text-white px-6 py-3 rounded-md text-lg font-medium hover:bg-gray-700"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
