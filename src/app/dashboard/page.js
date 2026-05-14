'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, sendEmailVerification, signOut } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import ProtectedPage from '../../components/ProtectedPage';

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date) {
  const start = startOfDay(date);
  return new Date(start.getTime() + 86400000);
}

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
  const [studentCount, setStudentCount] = useState(0);
  const [periodCount, setPeriodCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace('/login');
        return;
      }

      setUser(currentUser);
      setLoading(false);

      try {
        const today = new Date();
        const attendanceSnapshot = await getDocs(
          query(
            collection(db, 'attendance'),
            where('date', '>=', startOfDay(today)),
            where('date', '<', endOfDay(today))
          )
        );

        const counts = { present: 0, absent: 0, late: 0, total: attendanceSnapshot.size };
        attendanceSnapshot.forEach((doc) => {
          const status = doc.data().status;
          if (status === 'present') counts.present += 1;
          if (status === 'absent') counts.absent += 1;
          if (status === 'late') counts.late += 1;
        });
        setStats(counts);

        const studentSnapshot = await getDocs(collection(db, 'students'));
        setStudentCount(studentSnapshot.size);

        const periodSnapshot = await getDocs(collection(db, 'periods'));
        setPeriodCount(periodSnapshot.size);
      } catch (err) {
        setError('Unable to load dashboard stats.');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch {
      setError('Unable to sign out. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    try {
      await sendEmailVerification(user);
      setMessage('Verification email resent. Please check your inbox.');
    } catch {
      setError('Unable to resend verification.');
    }
  };

  const verifyLabel = useMemo(() => {
    if (!user) return '';
    return user.emailVerified ? 'Verified account' : 'Email not verified';
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg text-gray-700">Loading dashboard…</p>
      </div>
    );
  }

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">Welcome back</h1>
                <p className="mt-2 text-gray-600">Manage attendance, review reports, and keep your roster up to date.</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-blue-50 p-4 text-center">
                <p className="text-sm font-medium text-blue-700">{verifyLabel}</p>
                {!user?.emailVerified && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="mt-3 inline-flex rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Resend verification
                  </button>
                )}
              </div>
            </div>
          </div>

          {error && <div className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</div>}
          {message && <div className="rounded-2xl bg-green-50 p-4 text-green-700">{message}</div>}

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Students in roster</p>
              <p className="mt-3 text-3xl font-semibold text-gray-900">{studentCount}</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Attendance periods</p>
              <p className="mt-3 text-3xl font-semibold text-gray-900">{periodCount}</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Today&apos;s attendance</p>
              <p className="mt-3 text-3xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Present</p>
              <p className="mt-3 text-3xl font-semibold text-green-600">{stats.present}</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Absent</p>
              <p className="mt-3 text-3xl font-semibold text-red-600">{stats.absent}</p>
            </div>
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">Late</p>
              <p className="mt-3 text-3xl font-semibold text-orange-500">{stats.late}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <button
              type="button"
              onClick={() => router.push('/attendance')}
              className="rounded-3xl bg-indigo-600 px-6 py-4 text-white transition hover:bg-indigo-700"
            >
              Mark Attendance
            </button>
            <button
              type="button"
              onClick={() => router.push('/records')}
              className="rounded-3xl bg-emerald-600 px-6 py-4 text-white transition hover:bg-emerald-700"
            >
              View Records
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-3xl bg-red-600 px-6 py-4 text-white transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
