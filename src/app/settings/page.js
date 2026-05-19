'use client';

import { useState } from 'react';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import ProtectedPage from '../../components/ProtectedPage';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [notifications, setNotifications] = useState({
    absent: true,
    verification: true,
    summary: true,
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No user found');

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, formData.newPassword);
      setMessage('Password updated successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setError('');
    setMessage('');
    setLoading(true);

    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(notifications));
      setMessage('Notification preferences saved successfully');
    } catch (err) {
      setError('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedPage>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-8 border-b">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'profile'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'security'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Security
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'notifications'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Notifications
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-gray-900">{auth.currentUser?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Verified</label>
                    <div className="mt-1 flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${auth.currentUser?.emailVerified ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <p className="text-gray-900">{auth.currentUser?.emailVerified ? 'Verified' : 'Not Verified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
              )}
              {message && (
                <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">{message}</div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Email Notifications</h2>
              {error && (
                <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>
              )}
              {message && (
                <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">{message}</div>
              )}
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="absent"
                    className="mr-3"
                    checked={notifications.absent}
                    onChange={(e) => setNotifications({ ...notifications, absent: e.target.checked })}
                  />
                  <label htmlFor="absent" className="text-gray-900">
                    Email alerts when student is absent
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="verification"
                    className="mr-3"
                    checked={notifications.verification}
                    onChange={(e) => setNotifications({ ...notifications, verification: e.target.checked })}
                  />
                  <label htmlFor="verification" className="text-gray-900">
                    Reminder emails for account verification
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="summary"
                    className="mr-3"
                    checked={notifications.summary}
                    onChange={(e) => setNotifications({ ...notifications, summary: e.target.checked })}
                  />
                  <label htmlFor="summary" className="text-gray-900">
                    Daily attendance summary emails
                  </label>
                </div>
              </div>
              <button
                onClick={handleSavePreferences}
                disabled={loading}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
              >
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>
      </div>
    </ProtectedPage>
  );
}
