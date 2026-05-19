'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  orderBy,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ProtectedPage from '../../components/ProtectedPage';

const defaultPeriods = [
  { id: 'morning', name: 'Morning Session' },
  { id: 'afternoon', name: 'Afternoon Session' },
  { id: 'evening', name: 'Evening Session' },
];

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date) {
  return new Date(startOfDay(date).getTime() + 86400000);
}

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [periods, setPeriods] = useState(defaultPeriods);
  const [selectedIds, setSelectedIds] = useState([]);
  const [status, setStatus] = useState('present');
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriods[0].id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [lastCreatedIds, setLastCreatedIds] = useState([]);
  const [markingStudentId, setMarkingStudentId] = useState(null);

  useEffect(() => {
    const loadRoster = async () => {
      try {
        const studentSnapshot = await getDocs(query(collection(db, 'students'), orderBy('name')));
        setStudents(
          studentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );

        const periodSnapshot = await getDocs(query(collection(db, 'periods'), orderBy('name')));
        const loadedPeriods = periodSnapshot.docs.map((doc) => ({ id: doc.id, name: doc.data().name }));

        if (loadedPeriods.length) {
          setPeriods(loadedPeriods);
          setSelectedPeriod(loadedPeriods[0].id);
        }
      } catch (err) {
        setError('Unable to load students or sessions.');
      } finally {
        setLoading(false);
      }
    };

    loadRoster();
  }, []);

  const filteredStudents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    return students.filter((student) =>
      student.name?.toLowerCase().includes(searchValue) ||
      student.studentId?.toLowerCase().includes(searchValue)
    );
  }, [students, search]);

  const toggleSelection = (studentId) => {
    setSelectedIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((student) => student.id));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!selectedIds.length) {
      setError('Select at least one student before saving attendance.');
      return;
    }

    if (!selectedPeriod) {
      setError('Select a class period before marking attendance.');
      return;
    }

    const attendanceDate = new Date(date);
    if (Number.isNaN(attendanceDate.getTime())) {
      setError('Select a valid attendance date before saving.');
      return;
    }

    if (!window.confirm('Save attendance for the selected student(s)?')) {
      return;
    }

    setSubmitting(true);

    try {
      const start = startOfDay(attendanceDate);
      const end = endOfDay(attendanceDate);
      const createdIds = [];
      const skipped = [];

      for (const studentId of selectedIds) {
        const student = students.find((item) => item.id === studentId);
        if (!student) continue;

        const studentIdentifier = student.studentId || student.id;
        if (!studentIdentifier) {
          skipped.push(student.name || student.id || 'Unknown student');
          continue;
        }

        const attendanceKey = [
          encodeURIComponent(studentIdentifier),
          encodeURIComponent(selectedPeriod),
          attendanceDate.toISOString().slice(0, 10),
        ].join('_');

        const attendanceDocRef = doc(db, 'attendance', attendanceKey);
        const existingAttendance = await getDoc(attendanceDocRef);

        if (existingAttendance.exists()) {
          skipped.push(student.name || studentIdentifier);
          continue;
        }

        await setDoc(attendanceDocRef, {
          studentId: studentIdentifier,
          studentName: student.name,
          classPeriod: selectedPeriod,
          status,
          date: attendanceDate,
          createdAt: serverTimestamp(),
        });

        createdIds.push(attendanceDocRef.id);
      }

      setLastCreatedIds(createdIds);

      if (!createdIds.length) {
        setError('No attendance records were saved. Duplicates may already exist for the chosen date and period.');
      } else {
        setMessage(
          `Attendance saved for ${createdIds.length} student(s). ${skipped.length ? `Skipped ${skipped.length} duplicate(s).` : ''}`
        );
        setSelectedIds([]);
      }

      if (skipped.length) {
        setError(`Skipped duplicate entries for: ${skipped.join(', ')}`);
      }
    } catch (err) {
      console.error('Attendance save failed:', err);
      setError(`Unable to save attendance. Please try again. ${err?.message ? err.message : ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!lastCreatedIds.length) return;
    if (!window.confirm('Delete the last attendance batch you created?')) return;

    try {
      await Promise.all(lastCreatedIds.map((attendanceId) => deleteDoc(doc(db, 'attendance', attendanceId))));
      setMessage('Last batch of attendance records has been removed.');
      setLastCreatedIds([]);
    } catch {
      setError('Unable to undo attendance. Please try again.');
    }
  };

  const handleMarkStatus = async (studentId, statusValue) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    setMarkingStudentId(studentId);
    setError('');
    setMessage('');

    try {
      const attendanceDate = new Date(date);
      if (Number.isNaN(attendanceDate.getTime())) {
        setError('Select a valid attendance date before saving.');
        setMarkingStudentId(null);
        return;
      }

      const studentIdentifier = student.studentId || student.id;
      if (!studentIdentifier) {
        setError('Student ID is missing');
        setMarkingStudentId(null);
        return;
      }

      const attendanceKey = [
        encodeURIComponent(studentIdentifier),
        encodeURIComponent(selectedPeriod),
        attendanceDate.toISOString().slice(0, 10),
      ].join('_');

      const attendanceDocRef = doc(db, 'attendance', attendanceKey);
      await setDoc(attendanceDocRef, {
        studentId: studentIdentifier,
        studentName: student.name,
        classPeriod: selectedPeriod,
        status: statusValue,
        date: attendanceDate,
        createdAt: serverTimestamp(),
      }, { merge: true });

      setMessage(`${student.name} marked as ${statusValue}`);
    } catch (err) {
      setError(`Failed to mark attendance for ${student.name}: ${err.message}`);
    } finally {
      setMarkingStudentId(null);
    }
  };

  if (loading) {
    return (
      <ProtectedPage>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
          <div className="rounded-3xl bg-white p-8 shadow-md text-center">
            <p className="text-lg font-medium text-gray-700">Loading roster and sessions…</p>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage requiredRole={[ 'teacher', 'admin' ]}>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Mark Attendance</h1>
                <p className="mt-2 text-gray-600">Pick a date, choose a session, and record attendance for your students.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="rounded-2xl bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                  {selectedIds.length === filteredStudents.length ? 'Clear Selection' : 'Select All'}
                </button>
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!lastCreatedIds.length}
                  className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                >
                  Undo Last Batch
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Attendance date
                  </label>
                  <input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="session" className="block text-sm font-medium text-gray-700">
                    Session
                  </label>
                  <select
                    id="session"
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  >
                    {periods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Mark as
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-3xl bg-indigo-600 py-3 text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
                >
                  {submitting ? 'Saving attendance…' : 'Save attendance'}
                </button>
                {message && <p className="text-sm text-emerald-600">{message}</p>}
                {error && <p className="text-sm text-red-600">{error}</p>}
              </form>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Student roster</h2>
                  <p className="text-sm text-gray-600">Click status buttons to mark attendance directly.</p>
                </div>
                <div className="min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Search by name or ID"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="mt-5 max-h-[520px] overflow-y-auto rounded-3xl border border-gray-200 bg-slate-50 p-2">
                {filteredStudents.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">
                    No students found. Add your roster in the admin panel.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {filteredStudents.map((student) => (
                      <li
                        key={student.id}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${selectedIds.includes(student.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{student.name || student.studentId}</p>
                          <p className="text-sm text-gray-500">{student.studentId}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(student.id, 'present')}
                            disabled={markingStudentId === student.id}
                            className="rounded-full px-3 py-1 text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400"
                            title="Mark Present"
                          >
                            PRESENT
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(student.id, 'absent')}
                            disabled={markingStudentId === student.id}
                            className="rounded-full px-3 py-1 text-xs font-medium bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
                            title="Mark Absent"
                          >
                            ABSENT
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkStatus(student.id, 'late')}
                            disabled={markingStudentId === student.id}
                            className="rounded-full px-3 py-1 text-xs font-medium bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-yellow-400"
                            title="Mark Late"
                          >
                            LATE
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
