import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { apiurl } from '../../config/api';
import { Lightbulb } from 'lucide-react';

const Login = ({ setIsAuthenticated, setUserRole }) => {
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleGoogleResponse = async (response) => {
    const token = response.credential;
    if (!token) {
      setMessage('Token tidak valid dari Google');
      return;
    }

    try {
      const decoded = jwtDecode(token);
      console.log('[Login] Google user:', decoded);

      const result = await axios.post(
        `${apiurl}/api/oauth-login`,
        { token },
        { withCredentials: true }
      );

      const { accessToken, user } = result.data;

      Cookies.set('accessToken', accessToken, {
        expires: 1,
        secure: import.meta.env.MODE === 'production',
        sameSite: 'Strict',
      });

      setIsAuthenticated(true);
      setUserRole(user.role);
      navigate('/dashboard-power');
    } catch (err) {
      console.error('[Login] OAuth login error:', err);
      setMessage('Login gagal: ' + (err.response?.data?.message || 'Terjadi kesalahan.'));
    }
  };

  useEffect(() => {
    const loadGoogleScript = () => {
      const existingScript = document.getElementById('google-oauth');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.id = 'google-oauth';
        script.onload = initializeGoogleLogin;
        document.body.appendChild(script);
      } else {
        initializeGoogleLogin();
      }
    };

    const initializeGoogleLogin = () => {
      if (window.google && window.google.accounts) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-login-button'),
          {
            theme: 'filled_blue',
            size: 'large',
            width: '100%',
          }
        );
      } else {
        console.error('[Login] Google Identity Services belum tersedia');
      }
    };

    loadGoogleScript();
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-sky-50 to-indigo-100 px-4">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
        <div className="flex items-center justify-center mb-4 text-indigo-600">
          <Lightbulb className="w-8 h-8 mr-2" />
          <h1 className="text-2xl font-bold">Sistem Lampu Pintar</h1>
        </div>
        <p className="text-sm text-center text-gray-600 mb-6">
          Masuk menggunakan akun Google untuk mengakses <strong>manajemen energi cerdas</strong> dan kontrol web terautentikasi.
        </p>

        <div id="google-login-button" className="mb-6 flex justify-center"></div>

        {message && (
          <p className="text-sm text-red-600 text-center transition duration-300">{message}</p>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-6 text-xs text-gray-500 text-center">
        &copy; 2025 Budi Ariyanto - Universitas Pelita Bangsa
      </footer>
    </div>
  );
};

export default Login;
