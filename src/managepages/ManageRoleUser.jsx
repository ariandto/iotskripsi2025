import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig/axiosInstance';
import { ShieldAlertIcon } from 'lucide-react';

function ManageRoleUser() {
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState('');
  const [userRole, setUserRole] = useState(null); // null = loading
  const [message, setMessage] = useState('');

  // Ambil role dari endpoint /token
  const fetchRole = async () => {
    try {
      const res = await axiosInstance.get('/token', { withCredentials: true });
      const role = res.data?.role?.toLowerCase() || 'unknown';
      setUserRole(role);
    } catch (err) {
      console.error('Failed to fetch role:', err);
      setUserRole('unknown');
    }
  };

  useEffect(() => {
    fetchRole();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userRole !== 'admin') {
      setMessage('❌ You are not authorized to perform this action.');
      return;
    }

    if (!email.trim() || !newRole.trim()) {
      setMessage('⚠️ Please fill in both email and role.');
      return;
    }

    try {
      const response = await axiosInstance.put('/users/update', {
        email,
        role: newRole,
      });

      if (response.status === 200) {
        setMessage('✅ Role updated successfully.');
      } else {
        setMessage(response.data.msg || '⚠️ Failed to update role.');
      }
    } catch (error) {
      const serverMessage = error?.response?.data?.msg;
      setMessage(serverMessage ? `⚠️ ${serverMessage}` : '❌ Server error. Please try again later.');
      console.error('Update role error:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-indigo-100 to-white px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Manage User Role</h2>

        {/* Loading role */}
        {userRole === null ? (
          <p className="text-center text-gray-500">Loading role...</p>
        ) : userRole !== 'admin' ? (
          <div className="bg-red-100 text-red-600 border border-red-300 rounded-lg p-4 flex items-center">
            <ShieldAlertIcon className="w-5 h-5 mr-2" />
            <p className="text-sm font-medium">Access denied. Only admin can update user roles.</p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Enter target user email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="">-- Select Role --</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                  <option value="visitor">Visitor</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-semibold"
              >
                Update Role
              </button>
            </form>
            {message && (
              <p
                className={`mt-4 text-center font-medium ${
                  message.includes('success') ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {message}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ManageRoleUser;
