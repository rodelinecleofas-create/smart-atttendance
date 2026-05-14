'use client';

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AttendanceBarChart({ data, title = 'Attendance Status Distribution' }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#3b82f6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AttendanceLineChart({ data, title = 'Attendance Trends' }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="present" stroke="#10b981" />
          <Line type="monotone" dataKey="absent" stroke="#ef4444" />
          <Line type="monotone" dataKey="late" stroke="#f59e0b" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AttendancePieChart({ data, title = 'Attendance Distribution' }) {
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'];

  return (
    <div className="bg-white rounded-lg shadow p-6 w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AttendanceCard({ title, value, icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-800',
    green: 'bg-green-50 text-green-800',
    red: 'bg-red-50 text-red-800',
    yellow: 'bg-yellow-50 text-yellow-800',
    purple: 'bg-purple-50 text-purple-800',
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg shadow p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        {icon && <div className="text-4xl opacity-25">{icon}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mt-4">{title}</h3>
        <p className="text-gray-600 mt-2 mb-6">{description}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

export function ErrorState({ title, message, onRetry }) {
  return (
    <div className="rounded-md bg-red-50 p-6">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{title}</h3>
          <div className="mt-2 text-sm text-red-700">{message}</div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 text-red-700 font-medium hover:text-red-600"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
