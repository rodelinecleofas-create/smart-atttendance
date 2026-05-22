'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, sendEmailVerification, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
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
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [role, setRole] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalStatus, setModalStatus] = useState(null);
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
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        setRole(userDoc.exists() ? userDoc.data().role : null);
        const today = new Date();
        const attendanceSnapshot = await getDocs(
          query(
            collection(db, 'attendance'),
            where('date', '>=', startOfDay(today)),
            where('date', '<', endOfDay(today))
          )
        );

        const records = attendanceSnapshot.docs.map((doc) => doc.data());
        setAttendanceRecords(records);

        const counts = { present: 0, absent: 0, late: 0, total: attendanceSnapshot.size };
        records.forEach((record) => {
          const status = record.status;
          if (status === 'present') counts.present += 1;
          if (status === 'absent') counts.absent += 1;
          if (status === 'late') counts.late += 1;
        });
        setStats(counts);

        const studentSnapshot = await getDocs(collection(db, 'students'));
        const studentsData = studentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setStudents(studentsData);
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

  const showStatusModal = (status) => {
    setModalStatus(status);
    setShowModal(true);
  };

  const getStudentsByStatus = () => {
    if (!modalStatus) return [];
    return attendanceRecords.filter((record) => record.status === modalStatus);
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
            <button
              onClick={() => router.push('/admin')}
              className="rounded-lg bg-blue-50 p-6 shadow hover:shadow-lg transition cursor-pointer text-left border-2 border-transparent hover:border-blue-400"
            >
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-3xl font-bold text-blue-600">{studentCount}</p>
            </button>
            <button
              onClick={() => router.push('/admin')}
              className="rounded-lg bg-purple-50 p-6 shadow hover:shadow-lg transition cursor-pointer text-left border-2 border-transparent hover:border-purple-400"
            >
              <p className="text-sm font-medium text-gray-600">Sessions</p>
              <p className="text-3xl font-bold text-purple-600">{periodCount}</p>
            </button>
            <button
              onClick={() => router.push('/records')}
              className="rounded-lg bg-green-50 p-6 shadow hover:shadow-lg transition cursor-pointer text-left border-2 border-transparent hover:border-green-400"
            >
              <p className="text-sm font-medium text-gray-600">Total Attendance</p>
              <p className="text-3xl font-bold text-green-600">{stats.total}</p>
            </button>
            <button
              onClick={() => router.push('/records')}
              className="rounded-lg bg-yellow-50 p-6 shadow hover:shadow-lg transition cursor-pointer text-left border-2 border-transparent hover:border-yellow-400"
            >
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.total > 0 ? `${Math.round((stats.present / stats.total) * 100)}%` : '0%'}</p>
            </button>
          </div>

          {/* Attendance Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <button
              onClick={() => showStatusModal('present')}
              className="rounded-lg bg-green-50 p-6 shadow hover:shadow-lg transition cursor-pointer text-left border-2 border-transparent hover:border-green-400"
            >
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-3xl font-bold text-green-600">{stats.present}</p>
            </button>
            <button
              onClick={() => showStatusModal('absent')}
              className="rounded-lg bg-red-50 p-6 shadow hover:shadow-lg transition cursor-pointer text-left border-2 border-transparent hover:border-red-400"
            >
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-3xl font-bold text-red-600">{stats.absent}</p>
            </button>
            <button
              onClick={() => showStatusModal('late')}
              className="rounded-lg bg-yellow-50 p-6 shadow hover:shadow-lg transition cursor-pointer text-left border-2 border-transparent hover:border-yellow-400"
            >
              <p className="text-sm font-medium text-gray-600">Late</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.late}</p>
            </button>
          </div>



          {/* Quick Action Buttons */}
          {role === 'teacher' || role === 'admin' ? (
            <div className="grid gap-4 md:grid-cols-3">
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
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Student access only</h2>
              <p className="mt-2 text-gray-600">
                As a student, you can view your dashboard here. Teacher tools like attendance marking, records, and reports are available only to teachers and administrators.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Student Details Modal */}
      {showModal && modalStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 capitalize">
                  {modalStatus === 'present' && '✅ Present'}
                  {modalStatus === 'absent' && '❌ Absent'}
                  {modalStatus === 'late' && '⏰ Late'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Students marked as {modalStatus} today</p>
            </div>
            <div className="p-6">
              {getStudentsByStatus().length === 0 ? (
                <p className="text-center text-gray-500">No students marked as {modalStatus} today</p>
              ) : (
                <ul className="space-y-2">
                  {getStudentsByStatus().map((record, idx) => (
                    <li key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-semibold text-gray-900">{record.studentName}</p>
                      <p className="text-sm text-gray-600">{record.studentId}</p>
                      <p className="text-xs text-gray-500 mt-1">Period: {record.classPeriod}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
