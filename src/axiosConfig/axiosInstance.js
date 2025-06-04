import axios from 'axios';
import { apiurl } from '../../config/api';

const axiosInstance = axios.create({
  baseURL: `${apiurl}/api`, // URL API backend
  withCredentials: true, // Kirim cookies untuk refresh token
});



// Interceptor untuk menangani refresh token dan permintaan ulang
axiosInstance.interceptors.response.use(
  response => response, // Kembalikan respons jika berhasil
  async error => {
    console.error('Error response:', error.response || error.message); // Log kesalahan untuk debug
    const originalRequest = error.config;
    // Jika error adalah Unauthorized (401) dan belum mencoba refresh token
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Tandai permintaan untuk mencegah loop

      try {
        // Minta refresh token
        const refreshResponse = await axios.get(`${apiurl}/api/token`, {
          withCredentials: true, // Pastikan cookie dikirim
        });

        const newAccessToken = refreshResponse.data.accessToken;

        // Tambahkan token baru ke header Authorization
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        // Coba ulangi permintaan asli
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('Refresh token failed:', refreshError.response || refreshError.message);
        return Promise.reject(refreshError); // Gagal merefresh token, tolak permintaan
      }
    }

    return Promise.reject(error); // Jika bukan 401 atau gagal refresh, teruskan error
  }
);

export default axiosInstance;
