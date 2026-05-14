'use client';

import { useState, useEffect } from 'react';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ProtectedPage from '../../components/ProtectedPage';
import { AttendanceLineChart, AttendanceBarChart, AttendancePieChart, LoadingSpinner, EmptyState } from '../../components/Charts';
import { SearchBar, FilterBar } from '../../components/TableComponents';
import { generateAttendanceSummaryReport, getWeeklyAttendanceData, getMonthlyAttendanceData } from '../../lib/reportingUtils';

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportType, setReportType] = useState('summary');
  const [filters, setFilters] = useState({});
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const recordSnapshot = await getDocs(
          query(collection(db, 'attendance'), orderBy('date', 'desc'))
        );
        setRecords(
          recordSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate?.() || new Date(doc.data().date),
          }))
        );

        const studentSnapshot = await getDocs(
          query(collection(db, 'students'), orderBy('name'))
        );
        setStudents(studentSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setError('Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (reportType === 'weekly') {
      const data = getWeeklyAttendanceData(records);
      setChartData(data);
    } else if (reportType === 'monthly') {
      const data = getMonthlyAttendanceData(records);
      setChartData(data);
    }
  }, [reportType, records]);

  const handleExportPDF = async () => {
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType, filters }),
      });
      const data = await response.json();
      console.log('PDF exported:', data);
    } catch (err) {
      setError('Failed to export PDF');
    }
  };

  const handleExportCSV = async () => {
    try {
      // This would export attendance data as CSV
      const csv = records
        .map((r) => `${r.studentId},${r.studentName},${r.date},${r.classPeriod},${r.status}`)
        .join('\n');
      const header = 'Student ID,Student Name,Date,Session,Status\n';
      const element = document.createElement('a');
      element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(header + csv)}`);
      element.setAttribute('download', `attendance-${new Date().toISOString().split('T')[0]}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (err) {
      setError('Failed to export CSV');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="mt-2 text-gray-600">Generate, view, and export attendance reports</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                📄 Export PDF
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📊 Export CSV
              </button>
            </div>
          </div>

          {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

          {/* Report Type Selection */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-lg font-semibold mb-4">Select Report Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['summary', 'weekly', 'monthly', 'student'].map((type) => (
                <button
                  key={type}
                  onClick={() => setReportType(type)}
                  className={`p-4 rounded-lg border-2 transition ${
                    reportType === type
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  {type === 'summary' && '📊 Summary'}
                  {type === 'weekly' && '📈 Weekly'}
                  {type === 'monthly' && '📅 Monthly'}
                  {type === 'student' && '👤 Student'}
                </button>
              ))}
            </div>
          </div>

          {/* Report Content */}
          {records.length === 0 ? (
            <EmptyState
              title="No Attendance Data"
              description="No attendance records found. Mark some attendance to generate reports."
            />
          ) : (
            <div className="grid gap-6">
              {reportType === 'summary' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <AttendancePieChart
                      data={[
                        { name: 'Present', value: records.filter((r) => r.status === 'present').length },
                        { name: 'Absent', value: records.filter((r) => r.status === 'absent').length },
                        { name: 'Late', value: records.filter((r) => r.status === 'late').length },
                        { name: 'Other', value: records.filter((r) => !['present', 'absent', 'late'].includes(r.status)).length },
                      ]}
                    />
                  </div>
                </div>
              )}

              {reportType === 'weekly' && chartData.length > 0 && (
                <AttendanceLineChart data={chartData} title="Weekly Attendance Trends" />
              )}

              {reportType === 'monthly' && chartData.length > 0 && (
                <AttendanceBarChart data={chartData} title="Monthly Attendance Distribution" />
              )}

              {reportType === 'student' && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Student Attendance Summary</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Student Name</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Class</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Total Days</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Present</th>
                          <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Attendance %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {generateAttendanceSummaryReport(students, records)
                          .slice(0, 20)
                          .map((report) => (
                            <tr key={report.studentId} className="border-b hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm text-gray-900">{report.studentName}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{report.class || 'N/A'}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{report.totalDays}</td>
                              <td className="px-6 py-4 text-sm text-green-600 font-medium">{report.presentDays}</td>
                              <td className="px-6 py-4 text-sm font-medium">
                                <span className={report.percentage >= 75 ? 'text-green-600' : 'text-red-600'}>
                                  {report.percentage}%
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
