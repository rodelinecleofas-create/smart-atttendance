'use client';

import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, sendEmailVerification } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import ProtectedPage from '../../components/ProtectedPage';
import { LoadingSpinner } from '../../components/Charts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
  const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, excused: 0, sick: 0, permission: 0, leave: 0, total: 0 });
  const [studentCount, setStudentCount] = useState(0);
  const [periodCount, setPeriodCount] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [role, setRole] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.replace('/login');
        return;
      }

      setUser(currentUser);

      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userRole = userDoc.exists() ? userDoc.data().role : null;
        setRole(userRole);

        // If student, get student's own attendance records
        if (userRole === 'student') {
          const studentSnapshot = await getDocs(
            query(collection(db, 'students'), where('userId', '==', currentUser.uid))
          );

          if (studentSnapshot.docs.length > 0) {
            const studentData = studentSnapshot.docs[0];
            const studentId = studentData.id;

            // Get all attendance records for this student
            const attendanceSnapshot = await getDocs(
              query(
                collection(db, 'attendance'),
                where('studentId', '==', studentId),
                orderBy('date', 'desc'),
                limit(50)
              )
            );

            const records = attendanceSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
              date: doc.data().date?.toDate?.() || new Date(doc.data().date),
            }));
            setAttendanceRecords(records);
            setRecentRecords(records.slice(0, 5));

            const counts = { present: 0, absent: 0, late: 0, excused: 0, sick: 0, permission: 0, leave: 0, total: records.length };
            records.forEach((record) => {
              const status = record.status;
              if (status === 'present') counts.present += 1;
              else if (status === 'absent') counts.absent += 1;
              else if (status === 'late') counts.late += 1;
              else if (status === 'excused') counts.excused += 1;
              else if (status === 'sick') counts.sick += 1;
              else if (status === 'permission') counts.permission += 1;
              else if (status === 'leave') counts.leave += 1;
            });
            setStats(counts);
          }
        } else {
          // For teachers/admins, show today's attendance
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

          const counts = { present: 0, absent: 0, late: 0, excused: 0, sick: 0, permission: 0, leave: 0, total: attendanceSnapshot.size };
          records.forEach((record) => {
            const status = record.status;
            if (status === 'present') counts.present += 1;
            else if (status === 'absent') counts.absent += 1;
            else if (status === 'late') counts.late += 1;
            else if (status === 'excused') counts.excused += 1;
            else if (status === 'sick') counts.sick += 1;
            else if (status === 'permission') counts.permission += 1;
            else if (status === 'leave') counts.leave += 1;
          });
          setStats(counts);

          const studentSnapshot = await getDocs(collection(db, 'students'));
          const studentsData = studentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setStudents(studentsData);
          setStudentCount(studentSnapshot.size);

          const periodSnapshot = await getDocs(collection(db, 'periods'));
          setPeriodCount(periodSnapshot.size);
        }
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Unable to load dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

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
    return user.emailVerified ? '✅ Verified' : '⚠️ Email not verified';
  }, [user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const attendanceChartData = [
    { name: 'Present', value: stats.present, fill: '#10b981' },
    { name: 'Absent', value: stats.absent, fill: '#ef4444' },
    { name: 'Late', value: stats.late, fill: '#f59e0b' },
    { name: 'Excused', value: stats.excused, fill: '#6366f1' },
    { name: 'Sick', value: stats.sick, fill: '#8b5cf6' },
    { name: 'Permission', value: stats.permission, fill: '#ec4899' },
    { name: 'Leave', value: stats.leave, fill: '#06b6d4' },
  ].filter(d => d.value > 0);

  const colors = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* Header Section */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Welcome, {user?.email?.split('@')[0]}</h1>
                <p className="mt-2 text-gray-600 text-lg">
                  {role === 'student' ? 'View your attendance records and statistics' : 'Manage attendance and view reports'}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2 w-fit">
                <span className="text-2xl">{user?.emailVerified ? '✅' : '⚠️'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{verifyLabel}</p>
                  {!user?.emailVerified && (
                    <button
                      onClick={handleResendVerification}
                      className="text-xs text-blue-600 hover:underline mt-1"
                    >
                      Resend email
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded text-green-700">
              {message}
            </div>
          )}

          {/* Student View */}
          {role === 'student' ? (
            <>
              {/* Attendance Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                  <p className="text-gray-600 text-sm font-medium">Present</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.present}</p>
                  <p className="text-xs text-gray-500 mt-2">{stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                  <p className="text-gray-600 text-sm font-medium">Absent</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{stats.absent}</p>
                  <p className="text-xs text-gray-500 mt-2">{stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                  <p className="text-gray-600 text-sm font-medium">Late</p>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.late}</p>
                  <p className="text-xs text-gray-500 mt-2">{stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}%</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                  <p className="text-gray-600 text-sm font-medium">Total Records</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-2">All time</p>
                </div>
              </div>

              {/* Attendance Rate Overview */}
              {stats.total > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Attendance Overview</h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Pie Chart */}
                    <div className="flex justify-center">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie data={attendanceChartData} cx="50%" cy="50%" labelLine={false} label={(entry) => `${entry.name}: ${entry.value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                            {attendanceChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Stats Summary */}
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">✅ Present</span>
                          <span className="text-2xl font-bold text-green-600">{stats.present}</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">❌ Absent</span>
                          <span className="text-2xl font-bold text-red-600">{stats.absent}</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">⏰ Late</span>
                          <span className="text-2xl font-bold text-yellow-600">{stats.late}</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">📊 Attendance Rate</span>
                          <span className="text-2xl font-bold text-purple-600">{Math.round((stats.present / stats.total) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Records */}
              {recentRecords.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Attendance Records</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left py-3 px-4 text-gray-700 font-semibold">Date</th>
                          <th className="text-left py-3 px-4 text-gray-700 font-semibold">Period</th>
                          <th className="text-left py-3 px-4 text-gray-700 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentRecords.map((record) => (
                          <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-gray-900">{record.date?.toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-gray-600">{record.classPeriod}</td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                record.status === 'present' ? 'bg-green-100 text-green-800' :
                                record.status === 'absent' ? 'bg-red-100 text-red-800' :
                                record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {record.status?.charAt(0).toUpperCase() + record.status?.slice(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button
                    onClick={() => router.push('/records')}
                    className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
                  >
                    View All Records
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Teacher/Admin View */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                  <p className="text-gray-600 text-sm font-medium">Total Students</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{studentCount}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                  <p className="text-gray-600 text-sm font-medium">Sessions</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">{periodCount}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                  <p className="text-gray-600 text-sm font-medium">Present Today</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{stats.present}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                  <p className="text-gray-600 text-sm font-medium">Absent Today</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">{stats.absent}</p>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="grid md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/attendance')}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
                >
                  📋 Mark Attendance
                </button>
                <button
                  onClick={() => router.push('/records')}
                  className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
                >
                  📊 View Records
                </button>
                <button
                  onClick={() => router.push('/reports')}
                  className="bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 text-white font-bold py-4 px-6 rounded-lg shadow-lg transition transform hover:scale-105"
                >
                  📈 Reports
                </button>
              </div>

              {/* Today's Attendance Summary */}
              {stats.total > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Today&apos;s Attendance Summary</h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Chart */}
                    <div className="flex justify-center">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={[{
                          name: 'Attendance',
                          Present: stats.present,
                          Absent: stats.absent,
                          Late: stats.late,
                        }]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="Present" fill="#10b981" />
                          <Bar dataKey="Absent" fill="#ef4444" />
                          <Bar dataKey="Late" fill="#f59e0b" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Summary Cards */}
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">✅ Present</span>
                          <span className="text-2xl font-bold text-green-600">{stats.present} / {stats.total}</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">❌ Absent</span>
                          <span className="text-2xl font-bold text-red-600">{stats.absent} / {stats.total}</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">⏰ Late</span>
                          <span className="text-2xl font-bold text-yellow-600">{stats.late} / {stats.total}</span>
                        </div>
                      </div>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-700 font-medium">📊 Total Marked</span>
                          <span className="text-2xl font-bold text-blue-600">{stats.total}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
