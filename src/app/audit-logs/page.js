'use client';

import { useState, useEffect } from 'react';
import ProtectedPage from '../../components/ProtectedPage';
import { LoadingSpinner } from '../../components/Charts';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    targetType: '',
    action: '',
  });

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.targetType) params.append('targetType', filters.targetType);
        if (filters.action) params.append('action', filters.action);
        params.append('limit', '100');

        const response = await fetch(`/api/reports/audit-logs?${params}`);
        const data = await response.json();
        setLogs(data.logs || []);
      } catch (err) {
        setError('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [filters]);

  const actionLabels = {
    CREATE_ATTENDANCE: '📝 Created Attendance',
    UPDATE_ATTENDANCE: '✏️ Updated Attendance',
    DELETE_ATTENDANCE: '🗑️ Deleted Attendance',
    CREATE_STUDENT: '👤 Added Student',
    UPDATE_STUDENT: '✏️ Updated Student',
    DELETE_STUDENT: '🗑️ Removed Student',
    IMPORT_ROSTER: '📥 Imported Roster',
    EXPORT_ROSTER: '📤 Exported Roster',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Audit Log</h1>

          {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
                <select
                  value={filters.targetType}
                  onChange={(e) => setFilters({ ...filters, targetType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Types</option>
                  <option value="attendance">Attendance</option>
                  <option value="student">Student</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE_ATTENDANCE">Create</option>
                  <option value="UPDATE_ATTENDANCE">Update</option>
                  <option value="DELETE_ATTENDANCE">Delete</option>
                </select>
              </div>
            </div>
          </div>

          {/* Audit Logs Table */}
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No audit logs found
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Target ID</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">User</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        {actionLabels[log.action] || log.action}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.targetType}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-mono">{log.targetId?.substring(0, 8)}...</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.userId || 'System'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
