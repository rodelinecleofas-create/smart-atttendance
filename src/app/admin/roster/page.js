'use client';

import { useState } from 'react';
import { addDoc, collection, doc, getDocs, query, orderBy, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import ProtectedPage from '../../../components/ProtectedPage';
import { parseCSV, validateStudentCSV, convertStudentDataForImport, generateCSVFromStudents, downloadCSV } from '../../../lib/csvUtils';
import { LoadingSpinner, EmptyState } from '../../../components/Charts';

export default function RosterManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [importResults, setImportResults] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('import');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const csvData = await parseCSV(file);
      const validation = validateStudentCSV(csvData);

      if (!validation.isValid) {
        setError(`Validation failed:\n${validation.errors.join('\n')}`);
        setLoading(false);
        return;
      }

      const studentsToImport = convertStudentDataForImport(csvData);

      // Import to Firebase
      let successCount = 0;
      let failedCount = 0;
      const errors = [];

      for (const student of studentsToImport) {
        try {
          await addDoc(collection(db, 'students'), {
            ...student,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          successCount++;
        } catch (err) {
          failedCount++;
          errors.push(`Failed to import ${student.name}: ${err.message}`);
        }
      }

      setImportResults({ success: successCount, failed: failedCount, errors });
      setMessage(`Import completed: ${successCount} students added, ${failedCount} failed`);
      
      if (errors.length > 0) {
        setError(errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n... and ${errors.length - 5} more` : ''));
      }
    } catch (err) {
      setError(`Failed to parse CSV: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const studentSnapshot = await getDocs(
        query(collection(db, 'students'), orderBy('name'))
      );
      const studentsData = studentSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const csv = generateCSVFromStudents(studentsData);
      downloadCSV(csv, `roster-${new Date().toISOString().split('T')[0]}.csv`);
      setMessage('Roster exported successfully');
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncRegisteredStudents = async () => {
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
    } catch (err) {
      setError(`Student sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateCSV = `studentId,name,class,section,gender,parentName,parentPhone,parentEmail
S001,John Doe,10,A,Male,Jane Doe,9876543211,jane@example.com
S002,Jane Smith,10,A,Female,John Smith,9876543213,john.s@example.com`;
    
    downloadCSV(templateCSV, 'roster-template.csv');
  };

  return (
    <ProtectedPage requiredRole="admin">
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Roster Management</h1>
          <p className="text-gray-600 mb-8">Import or export student roster data</p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <p className="text-sm text-gray-600">Sync student user accounts into the roster so teachers can see all registered students.</p>
            </div>
            <button
              onClick={handleSyncRegisteredStudents}
              disabled={syncing}
              className="rounded-3xl bg-indigo-600 px-5 py-3 text-white hover:bg-indigo-700 disabled:bg-indigo-300"
            >
              {syncing ? 'Syncing students…' : 'Sync registered students'}
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'import'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Import Roster
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'export'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Export Roster
            </button>
          </div>

          {message && (
            <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">{message}</div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg whitespace-pre-line text-sm">{error}</div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Student Roster</h2>
                <p className="text-gray-600 mb-4">Upload a CSV file to add students to the system</p>

                {/* Template Download */}
                <button
                  onClick={handleDownloadTemplate}
                  className="mb-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  📋 Download Template
                </button>

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="font-medium text-gray-900">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-600">CSV files only (max 10MB)</p>
                  </label>
                </div>

                {loading && <LoadingSpinner />}

                {importResults && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="font-semibold text-blue-900">Import Results</p>
                    <p className="text-sm text-blue-700 mt-2">✓ Successful: {importResults.success}</p>
                    <p className="text-sm text-blue-700">✗ Failed: {importResults.failed}</p>
                  </div>
                )}
              </div>

              {/* CSV Format Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">CSV Format Requirements</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><strong>Required columns:</strong> studentId, name</li>
                  <li><strong>Optional columns:</strong> class, section, gender, parentName, parentPhone, parentEmail</li>
                  <li>• All other columns will be ignored</li>
                  <li>• No strict validation - upload flexibility for your convenience</li>
                </ul>
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Student Roster</h2>
                <p className="text-gray-600 mb-6">Download the current student roster as CSV</p>

                <button
                  onClick={handleExport}
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 font-medium"
                >
                  {loading ? 'Exporting...' : '📥 Export as CSV'}
                </button>
              </div>

              {loading && <LoadingSpinner />}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">What will be exported?</h3>
                <p className="text-sm text-blue-700">
                  All student records including studentId, name, email, phone, class, section, gender, 
                  parent details, and creation/update timestamps.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
