import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-xl font-bold">
          Smart Attend
        </Link>
        <div className="space-x-4">
          <Link href="/login" className="text-white hover:text-gray-200">
            Login
          </Link>
          <Link href="/dashboard" className="text-white hover:text-gray-200">
            Dashboard
          </Link>
          <Link href="/attendance" className="text-white hover:text-gray-200">
            Attendance
          </Link>
        </div>
      </div>
    </nav>
  );
}