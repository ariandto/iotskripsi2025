import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { HelmetProvider } from 'react-helmet-async';
import ProtectedRoute from "./layouts/ProtectedRoute";

// Pages & Components
import Login from './userpages/Login';
import Register from './userpages/Register';
import Profile from './userpages/Profile';
import Layout from './layouts/TopLayouts';
import ManageRoleUser from './managepages/ManageRoleUser';
import LedManage from './userpages/LedManage';
import ManageRoom from './userpages/ManageRoom';
import ScheduleManage from './userpages/ScheduleManage';
import DashboardPowerStatus from './userpages/DashboardPowerStatus.tsx';
import { apiurl } from '../config/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${apiurl}/api/token`, { withCredentials: true });
      if (response.data?.email) {
        setIsAuthenticated(true);
        setUserRole(response.data.role);
        Cookies.set('userRole', response.data.role, { expires: 1 });
        Cookies.set('email', response.data.email, { expires: 1 });
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.delete(`${apiurl}/api/logout`, { withCredentials: true });
      Cookies.remove('accessToken');
      Cookies.remove('userRole');
      Cookies.remove('email');
      setIsAuthenticated(false);
      setUserRole('');

      // Google logout (jika pakai login Google)
      if (window.google?.accounts?.id) {
        const email = Cookies.get('email');
        if (email) {
          window.google.accounts.id.revoke(email, () => {
            console.log('[Logout] Google session revoked');
          });
        }
        window.google.accounts.id.disableAutoSelect();
      }
    } catch (error) {
      console.error('[Logout] error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600 dark:text-gray-300 text-lg font-medium">Checking authentication...</div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard-power" replace />
              ) : (
                <Login setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard-power" replace />
              ) : (
                <Register />
              )
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <Layout onLogout={handleLogout} userRole={userRole} />
              </ProtectedRoute>
            }
          >
            <Route path="profile" element={<Profile />} />
            <Route path="manage-role" element={<ManageRoleUser />} />
            <Route path="light-manage" element={<LedManage />} />
            <Route path="manage-room" element={<ManageRoom />} />
            <Route path="manage-schedule" element={<ScheduleManage />} />
            <Route path="dashboard-power" element={<DashboardPowerStatus />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;
