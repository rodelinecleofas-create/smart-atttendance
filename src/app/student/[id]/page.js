'use client';

import { useState, useEffect, useParams } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import ProtectedPage from '../../../components/ProtectedPage';
import { AttendanceLineChart, LoadingSpinner } from '../../../components/Charts';
import { getStudentAttendanceTrends } from '../../../lib/reportingUtils';

export default function StudentProfile({ params }) {
  const [student, setStudent] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const studentId = params?.id;

  useEffect(() => {
    const loadStudentData = async () => {
      if (!studentId) {
        setError('Student ID not found');
        setLoading(false);
        return;
      }

      try {
        const studentDoc = await getDoc(doc(db, 'students', studentId));
        if (studentDoc.exists()) {
          setStudent({ id: studentDoc.id, ...studentDoc.data() });
        } else {
          setError('Student not found');
        }
      } catch (err) {
        setError('Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [studentId]);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <ProtectedPage>
        <div className="min-h-screen bg-gray-50 py-12 px-4">
          <div className="mx-auto max-w-4xl">
            <div className="bg-red-50 p-6 rounded-lg text-red-700">{error}</div>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  if (!student) return <LoadingSpinner />;

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-6">
              <div className="text-5xl">👤</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
                <p className="text-gray-600">ID: {student.studentId}</p>
                <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                  {student.class && (
                    <div>
                      <p className="text-gray-500">Class</p>
                      <p className="font-semibold">{student.class}</p>
                    </div>
                  )}
                  {student.section && (
                    <div>
                      <p className="text-gray-500">Section</p>
                      <p className="font-semibold">{student.section}</p>
                    </div>
                  )}
                  {student.gender && (
                    <div>
                      <p className="text-gray-500">Gender</p>
                      <p className="font-semibold">{student.gender}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500 text-sm">Email</p>
                  <p className="text-gray-900">{student.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Phone</p>
                  <p className="text-gray-900">{student.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Parent Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-gray-500 text-sm">Parent Name</p>
                  <p className="text-gray-900">{student.parentName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Parent Phone</p>
                  <p className="text-gray-900">{student.parentPhone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Parent Email</p>
                  <p className="text-gray-900">{student.parentEmail || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance History</h2>
            <p className="text-gray-600">Attendance trends will appear here once records are available.</p>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
