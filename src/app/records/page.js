'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useRouter } from 'next/navigation';
import ProtectedPage from '../../components/ProtectedPage';

function normalizeDate(rawDate) {
  if (!rawDate) return null;
  if (rawDate.toDate) return rawDate.toDate();
  return new Date(rawDate);
}

export default function Records() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [periodFilter, setPeriodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ status: '', classPeriod: '', date: '' });
  const [pageSize] = useState(12);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const studentSnapshot = await getDocs(query(collection(db, 'students'), orderBy('name')));
        setStudents(studentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch {
        setError('Unable to load student data.');
      }
    };

    loadData();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setRecords([]);
    setLastVisible(null);
    setHasMore(false);
    setLoading(true);

    const fetchRecords = async () => {
      try {
        const constraints = [];
        if (periodFilter) constraints.push(where('classPeriod', '==', periodFilter));
        if (statusFilter) constraints.push(where('status', '==', statusFilter));
        if (fromDate) constraints.push(where('date', '>=', new Date(fromDate)));
        if (toDate) {
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          constraints.push(where('date', '<=', end));
        }

        const attendanceQuery = query(
          collection(db, 'attendance'),
          ...constraints,
          orderBy('date', sortOrder),
          ...(lastVisible ? [startAfter(lastVisible)] : []),
          limit(pageSize)
        );

        const snapshot = await getDocs(attendanceQuery);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), date: normalizeDate(doc.data().date) }));
        setRecords(data);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
        setHasMore(snapshot.docs.length === pageSize);
      } catch {
        setError('Unable to load attendance records.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [periodFilter, statusFilter, fromDate, toDate, sortOrder]);

  const filteredRecords = useMemo(() => {
    if (!studentFilter.trim()) return records;
    const queryText = studentFilter.trim().toLowerCase();
    return records.filter((record) =>
      record.studentName?.toLowerCase().includes(queryText) || record.studentId?.toLowerCase().includes(queryText)
    );
  }, [records, studentFilter]);

  const startNewEdit = (record) => {
    setEditingId(record.id);
    setEditValues({
      status: record.status || 'present',
      classPeriod: record.classPeriod || '',
      date: record.date ? record.date.toISOString().slice(0, 10) : '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({ status: '', classPeriod: '', date: '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateDoc(doc(db, 'attendance', editingId), {
        status: editValues.status,
        classPeriod: editValues.classPeriod,
        date: new Date(editValues.date),
      });
      setRecords((prev) =>
        prev.map((record) =>
          record.id === editingId
            ? { ...record, status: editValues.status, classPeriod: editValues.classPeriod, date: new Date(editValues.date) }
            : record
        )
      );
      cancelEdit();
    } catch {
      setError('Unable to update record.');
    }
  };

  const deleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await deleteDoc(doc(db, 'attendance', recordId));
      setRecords((prev) => prev.filter((record) => record.id !== recordId));
    } catch {
      setError('Unable to delete the record.');
    }
  };

  const loadMore = async () => {
    if (!hasMore || !lastVisible) return;
    setLoading(true);

    try {
      const constraints = [];
      if (periodFilter) constraints.push(where('classPeriod', '==', periodFilter));
      if (statusFilter) constraints.push(where('status', '==', statusFilter));
      if (fromDate) constraints.push(where('date', '>=', new Date(fromDate)));
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        constraints.push(where('date', '<=', end));
      }

      const attendanceQuery = query(
        collection(db, 'attendance'),
        ...constraints,
        orderBy('date', sortOrder),
        startAfter(lastVisible),
        limit(pageSize)
      );

      const snapshot = await getDocs(attendanceQuery);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), date: normalizeDate(doc.data().date) }));
      setRecords((prev) => [...prev, ...data]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
    } catch {
      setError('Unable to load more records.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    const csvRows = [
      ['Student name', 'Student ID', 'Class period', 'Status', 'Date'],
      ...filteredRecords.map((record) => [
        record.studentName || '',
        record.studentId || '',
        record.classPeriod || '',
        record.status || '',
        record.date ? record.date.toLocaleDateString() : '',
      ]),
    ];

    const csvContent = csvRows.map((row) => row.map((cell) => "").join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'attendance-records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Attendance Records</h1>
                <p className="mt-2 text-gray-600">Filter, edit, export, and print attendance reports.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setSortOrder((current) => (current === 'desc' ? 'asc' : 'desc'))}
                  className="rounded-2xl bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Sort by date: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                </button>
                <button
                  type="button"
                  onClick={downloadCSV}
                  className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Print
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Student ID or name</label>
                  <input
                    value={studentFilter}
                    onChange={(e) => setStudentFilter(e.target.value)}
                    placeholder="Search by student"
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">From date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">To date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="lg:col-span-3 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Session</label>
                  <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  >
                    <option value="">All sessions</option>
                    {Array.from(new Set(records.map((record) => record.classPeriod))).map((session) => (
                      <option key={session} value={session}>
                        {session}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  >
                    <option value="">All statuses</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="rounded-3xl bg-red-50 p-6 text-red-700">{error}</div>}

          <div className="rounded-3xl bg-white p-6 shadow-sm overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-gray-700">Loading records…</div>
            ) : filteredRecords.length === 0 ? (
              <div className="py-16 text-center text-gray-500">No attendance records match the selected filters.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Session</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className={editingId === record.id ? 'bg-slate-50' : ''}>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {record.studentName || 'Unknown'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">{record.studentId}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {editingId === record.id ? (
                          <input
                            value={editValues.classPeriod}
                            onChange={(e) => setEditValues((prev) => ({ ...prev, classPeriod: e.target.value }))}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2"
                          />
                        ) : (
                          record.classPeriod
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {editingId === record.id ? (
                          <select
                            value={editValues.status}
                            onChange={(e) => setEditValues((prev) => ({ ...prev, status: e.target.value }))}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2"
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="late">Late</option>
                          </select>
                        ) : (
                          record.status
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {editingId === record.id ? (
                          <input
                            type="date"
                            value={editValues.date}
                            onChange={(e) => setEditValues((prev) => ({ ...prev, date: e.target.value }))}
                            className="w-full rounded-xl border border-gray-300 px-3 py-2"
                          />
                        ) : (
                          record.date?.toLocaleDateString() || ''
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-sm font-medium space-x-2">
                        {editingId === record.id ? (
                          <>
                            <button
                              type="button"
                              onClick={saveEdit}
                              className="rounded-2xl bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="rounded-2xl bg-gray-200 px-3 py-2 text-gray-700 hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startNewEdit(record)}
                              className="rounded-2xl bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRecord(record.id)}
                              className="rounded-2xl bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {hasMore && (
            <div className="rounded-3xl bg-white p-6 shadow-sm text-center">
              <button
                type="button"
                onClick={loadMore}
                className="inline-flex rounded-3xl bg-slate-800 px-6 py-3 text-white hover:bg-slate-900"
              >
                Load more
              </button>
            </div>
          )}

          <div className="rounded-3xl bg-white p-6 shadow-sm text-right">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="rounded-3xl bg-gray-600 px-6 py-3 text-white hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
