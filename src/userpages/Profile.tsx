import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import axiosInstance from '../axiosConfig/axiosInstance';
import {
  UserIcon,
  CameraIcon,
  UploadIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  FileImageIcon
} from 'lucide-react';

interface ProfileProps {
  onProfileUpdate: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onProfileUpdate }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (formData: FormData) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/profile/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(res.data.message);
      setUploadSuccess(true);
      setSelectedFile(null);
      setPreviewImage(null);
      onProfileUpdate();
    } catch {
      setMessage('Gagal mengunggah gambar');
      setUploadSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Pilih gambar terlebih dahulu');
      setUploadSuccess(false);
      return;
    }
    const formData = new FormData();
    formData.append('photo', selectedFile);
    uploadImage(formData);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await axiosInstance.get('/user-profile');
        const { photo } = res.data;
        if (photo) setPreviewImage(photo);
      } catch {
        console.error('Gagal mengambil data profil');
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setUploadSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 mt-6 mb-12">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center mb-6">
          <UserIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mr-2" />
          Ubah Foto Profil
        </h2>

        <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
          <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200 flex items-center">
            <CameraIcon className="w-4 h-4 mr-1 text-green-500" />
            Pilih Gambar Baru
          </h3>

          <label className="w-full mb-3 border border-dashed border-gray-300 dark:border-gray-600 p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition flex items-center gap-2">
            <FileImageIcon className="w-4 h-4 text-gray-500 dark:text-gray-300" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">Pilih Gambar</span>
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>

          {previewImage && (
            <img
              src={previewImage}
              alt="Preview"
              className="w-28 h-28 object-cover rounded-full border-2 border-blue-500 mx-auto mb-3"
            />
          )}

          <button
            type="submit"
            className="w-full py-2 rounded bg-green-500 hover:bg-green-600 text-white font-medium flex items-center justify-center disabled:opacity-50"
            disabled={!selectedFile || loading}
          >
            <UploadIcon className="w-4 h-4 mr-2" /> {loading ? 'Mengunggah...' : 'Upload Foto'}
          </button>
        </form>

        {message && (
          <div
            className={`mt-6 flex items-center justify-center gap-2 p-3 rounded-md text-sm font-medium w-full max-w-lg mx-auto text-center ${
              uploadSuccess ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {uploadSuccess ? (
              <CheckCircleIcon className="w-4 h-4" />
            ) : (
              <AlertCircleIcon className="w-4 h-4" />
            )}
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
