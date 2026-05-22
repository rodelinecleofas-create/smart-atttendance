'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import ProtectedPage from '../../components/ProtectedPage';

export default function AdminPage() {
  const [students, setStudents] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [newStudentId, setNewStudentId] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newPeriodName, setNewPeriodName] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingPeriod, setEditingPeriod] = useState(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('admin');
  const [creatingUser, setCreatingUser] = useState(false);

  const createUserAccount = async () => {
    setError('');
    setMessage('');

    if (!newUserEmail.trim() || !newUserName.trim() || !newUserPassword) {
      setError('Email, name, and password are required.');
      return;
    }

    setCreatingUser(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Admin authentication is required.');
      }

      const idToken = await currentUser.getIdToken();
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Unable to create the user account.');
      }

      setMessage(`Created ${data.role} account for ${data.email}.`);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('');
      setNewUserRole('admin');
    } catch (err) {
      setError(err.message || 'Unable to create the user account.');
    } finally {
      setCreatingUser(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const studentSnapshot = await getDocs(query(collection(db, 'students'), orderBy('name')));
      setStudents(studentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const periodSnapshot = await getDocs(query(collection(db, 'periods'), orderBy('name')));
      setPeriods(periodSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch {
      setError('Unable to load roster and sessions.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSyncRegisteredStudents = useCallback(async () => {
    setError('');
    setMessage('');
    setSyncing(true);

    try {
      const [userSnapshot, studentSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'student'))),
        getDocs(collection(db, 'students')),
      ]);

      const studentsByUserId = new Map();
      const studentsByEmail = new Map();

      studentSnapshot.docs.forEach((studentDoc) => {
        const data = studentDoc.data();
        if (data.userId) {
          studentsByUserId.set(data.userId, { id: studentDoc.id, ...data });
        }
        if (data.email) {
          studentsByEmail.set(data.email.toLowerCase(), { id: studentDoc.id, ...data });
        }
      });

      let createdCount = 0;
      let linkedCount = 0;
      let existingCount = 0;

      for (const userDoc of userSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        const userEmail = (userData.email || '').toLowerCase();

        if (studentsByUserId.has(userId)) {
          existingCount += 1;
          continue;
        }

        const existingStudentByEmail = userEmail ? studentsByEmail.get(userEmail) : null;
        if (existingStudentByEmail) {
          await updateDoc(doc(db, 'students', existingStudentByEmail.id), {
            userId,
            studentId: existingStudentByEmail.studentId || userId,
            name: existingStudentByEmail.name || userData.name || userEmail.split('@')[0],
            email: userData.email || existingStudentByEmail.email,
            updatedAt: serverTimestamp(),
          });
          linkedCount += 1;
          continue;
        }

        await addDoc(collection(db, 'students'), {
          userId,
          studentId: userId,
          name: userData.name || userEmail.split('@')[0],
          email: userData.email || '',
          createdAt: serverTimestamp(),
        });
        createdCount += 1;
      }

      setMessage(
        `Student sync complete: ${createdCount} added, ${linkedCount} linked to existing roster records, ${existingCount} already connected.`
      );
      loadData();
    } catch (err) {
      setError(`Student sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }, [loadData]);

  useEffect(() => {
    loadData();

    const syncMissingStudents = async () => {
      await handleSyncRegisteredStudents();
    };

    syncMissingStudents();
  }, [handleSyncRegisteredStudents, loadData]);

  const addStudent = async () => {
    setError('');
    setMessage('');

    const trimmedId = newStudentId.trim();
    const trimmedName = newStudentName.trim();

    if (!trimmedId || !trimmedName) {
      setError('Student name and ID are required.');
      return;
    }

    if (students.some((student) => student.studentId === trimmedId)) {
      setError('A student with that ID already exists.');
      return;
    }

    try {
      await addDoc(collection(db, 'students'), {
        studentId: trimmedId,
        name: trimmedName,
        createdAt: serverTimestamp(),
      });
      setNewStudentId('');
      setNewStudentName('');
      setMessage('Student added.');
      loadData();
    } catch {
      setError('Unable to add student.');
    }
  };

  const addPeriod = async () => {
    setError('');
    setMessage('');

    const trimmedName = newPeriodName.trim();
    if (!trimmedName) {
      setError('A session name is required.');
      return;
    }

    try {
      await addDoc(collection(db, 'periods'), {
        name: trimmedName,
        createdAt: serverTimestamp(),
      });
      setNewPeriodName('');
      setMessage('Attendance session added.');
      loadData();
    } catch {
      setError('Unable to add session.');
    }
  };

  const updateStudent = async (studentId, updates) => {
    try {
      await updateDoc(doc(db, 'students', studentId), updates);
      setMessage('Student updated.');
      setEditingStudent(null);
      loadData();
    } catch {
      setError('Unable to update student.');
    }
  };

  const updatePeriod = async (periodId, updates) => {
    try {
      await updateDoc(doc(db, 'periods', periodId), updates);
      setMessage('Session updated.');
      setEditingPeriod(null);
      loadData();
    } catch {
      setError('Unable to update session.');
    }
  };

  const deleteStudent = async (studentId) => {
    if (!window.confirm('Delete this student from the roster?')) return;
    try {
      await deleteDoc(doc(db, 'students', studentId));
      setMessage('Student removed.');
      loadData();
    } catch {
      setError('Unable to delete student.');
    }
  };

  const deletePeriod = async (periodId) => {
    if (!window.confirm('Delete this attendance session?')) return;
    try {
      await deleteDoc(doc(db, 'periods', periodId));
      setMessage('Session removed.');
      loadData();
    } catch {
      setError('Unable to delete session.');
    }
  };

  if (loading) {
    return (
      <ProtectedPage requiredRole="admin">
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
          <div className="rounded-3xl bg-white p-8 shadow-md text-center">
            <p className="text-lg font-medium text-gray-700">Loading admin tools…</p>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage requiredRole="admin">
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">Admin panel</h1>
            <p className="mt-2 text-gray-600">Manage student roster, attendance sessions, and system settings.</p>
          </div>

          {error && <div className="rounded-3xl bg-red-50 p-6 text-red-700">{error}</div>}
          {message && <div className="rounded-3xl bg-emerald-50 p-6 text-emerald-700">{message}</div>}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Sync registered student user accounts into the roster so teachers can mark attendance for all students.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSyncRegisteredStudents}
              disabled={syncing}
              className="rounded-3xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {syncing ? 'Syncing students…' : 'Sync registered students'}
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Student roster</h2>
              <div className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Student name</span>
                    <input
                      value={newStudentName}
                      onChange={(e) => setNewStudentName(e.target.value)}
                      className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      placeholder="Full name"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">Student ID</span>
                    <input
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      placeholder="ID number"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={addStudent}
                  className="rounded-3xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
                >
                  Add student
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {students.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                    No students added yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {students.map((student) => (
                      <div key={student.id} className="rounded-3xl border border-gray-200 p-4">
                        {editingStudent === student.id ? (
                          <div className="space-y-3">
                            <input
                              value={student.name}
                              onChange={(e) => setStudents((prev) => prev.map((item) => item.id === student.id ? { ...item, name: e.target.value } : item))}
                              className="w-full rounded-xl border border-gray-300 px-4 py-3"
                            />
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => updateStudent(student.id, { name: student.name })}
                                className="rounded-2xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStudent(null)}
                                className="rounded-2xl bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{student.name}</p>
                              <p className="text-sm text-gray-500">{student.studentId}</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingStudent(student.id)}
                                className="rounded-2xl bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteStudent(student.id)}
                                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Attendance sessions</h2>
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">Session name</span>
                  <input
                    value={newPeriodName}
                    onChange={(e) => setNewPeriodName(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                    placeholder="Morning session"
                  />
                </label>
                <button
                  type="button"
                  onClick={addPeriod}
                  className="rounded-3xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700"
                >
                  Add session
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {periods.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                    No sessions created yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {periods.map((period) => (
                      <div key={period.id} className="rounded-3xl border border-gray-200 p-4">
                        {editingPeriod === period.id ? (
                          <div className="space-y-3">
                            <input
                              value={period.name}
                              onChange={(e) => setPeriods((prev) => prev.map((item) => item.id === period.id ? { ...item, name: e.target.value } : item))}
                              className="w-full rounded-xl border border-gray-300 px-4 py-3"
                            />
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() => updatePeriod(period.id, { name: period.name })}
                                className="rounded-2xl bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPeriod(null)}
                                className="rounded-2xl bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-semibold text-gray-900">{period.name}</p>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingPeriod(period.id)}
                                className="rounded-2xl bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => deletePeriod(period.id)}
                                className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Create a new user account</h2>
            <p className="mt-2 text-sm text-gray-600">Create an admin or other user account with a role assignment.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="admin@example.com"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Full name</span>
                <input
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Administrator Name"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Password</span>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                  placeholder="Secure password"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Role</span>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                >
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="parent">Parent</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={createUserAccount}
              disabled={creatingUser}
              className="mt-5 rounded-3xl bg-indigo-600 px-6 py-3 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {creatingUser ? 'Creating user…' : 'Create user account'}
            </button>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
