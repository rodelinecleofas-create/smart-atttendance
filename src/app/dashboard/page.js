'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, sendEmailVerification, signOut } from 'firebase/auth';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import ProtectedPage from '../../components/ProtectedPage';
import { AttendanceCard, AttendancePieChart, LoadingSpinner } from '../../components/Charts';

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
    return <LoadingSpinner />;
  }

  const chartData = [
    { name: 'Present', value: stats.present },
    { name: 'Absent', value: stats.absent },
    { name: 'Late', value: stats.late },
  ];

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900">Welcome back</h1>
                <p className="mt-2 text-gray-600">Manage attendance, review reports, and keep your roster up to date.</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-blue-50 p-4 text-center">
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

          {error && <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>}
          {message && <div className="rounded-lg bg-green-50 p-4 text-green-700">{message}</div>}

          {/* Main Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <AttendanceCard title="Students" value={studentCount} color="blue" />
            <AttendanceCard title="Sessions" value={periodCount} color="purple" />
            <AttendanceCard title="Total Attendance" value={stats.total} color="green" />
            <AttendanceCard title="Attendance Rate" value={stats.total > 0 ? `${Math.round((stats.present / stats.total) * 100)}%` : '0%'} color="yellow" />
          </div>

          {/* Attendance Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <AttendanceCard title="Present" value={stats.present} color="green" />
            <AttendanceCard title="Absent" value={stats.absent} color="red" />
            <AttendanceCard title="Late" value={stats.late} color="yellow" />
          </div>

          {/* Charts and Reports */}
          <div className="grid gap-6 md:grid-cols-2">
            {chartData.some((d) => d.value > 0) && (
              <AttendancePieChart data={chartData} title="Today's Attendance Distribution" />
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => router.push('/attendance')}
              className="rounded-lg bg-indigo-600 px-6 py-4 text-white font-medium transition hover:bg-indigo-700 flex items-center justify-center gap-2"
            >
              📋 Mark Attendance
            </button>
            <button
              type="button"
              onClick={() => router.push('/records')}
              className="rounded-lg bg-emerald-600 px-6 py-4 text-white font-medium transition hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              📊 View Records
            </button>
            <button
              type="button"
              onClick={() => router.push('/reports')}
              className="rounded-lg bg-blue-600 px-6 py-4 text-white font-medium transition hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              📈 Reports
            </button>
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="rounded-lg bg-purple-600 px-6 py-4 text-white font-medium transition hover:bg-purple-700 flex items-center justify-center gap-2"
            >
              ⚙️ Admin Panel
            </button>
          </div>

          {/* Student Management */}
          <div className="grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push('/admin/roster')}
              className="rounded-lg bg-yellow-600 px-6 py-4 text-white font-medium transition hover:bg-yellow-700 text-left"
            >
              <div className="font-semibold">📥 Import/Export Roster</div>
              <div className="text-sm text-yellow-100">Bulk manage students</div>
            </button>
            <button
              type="button"
              onClick={() => router.push('/settings')}
              className="rounded-lg bg-gray-600 px-6 py-4 text-white font-medium transition hover:bg-gray-700 text-left"
            >
              <div className="font-semibold">⚙️ Account Settings</div>
              <div className="text-sm text-gray-100">Manage profile and security</div>
            </button>
          </div>

          {/* Logout Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-red-600 px-6 py-3 text-white font-medium transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
