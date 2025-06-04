import React, { useState, useEffect } from 'react';
import axiosInstance from '../axiosConfig/axiosInstance';
import { toast } from 'react-toastify';
import {
  HomeIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  UserIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
  Loader2Icon,
  Building2Icon,
} from 'lucide-react';

const MAX_ROOMS = 4;

const ManageRoom = () => {
  const [roomList, setRoomList] = useState([]);
  const [newRoom, setNewRoom] = useState('');
  const [renameRoomOld, setRenameRoomOld] = useState(null);
  const [renameRoomNew, setRenameRoomNew] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedRoomToDelete, setSelectedRoomToDelete] = useState(null);

  const isAdmin = userRole === 'admin';

  const fetchUserRole = async () => {
    try {
      const response = await axiosInstance.get('/token', { withCredentials: true });
      setUserRole(response.data.role || 'Unknown');
    } catch {
      setUserRole('Unknown');
    }
  };

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/iot/rooms', { withCredentials: true });
      setRoomList(response.data.data);
    } catch {
      setError("Gagal memuat data ruangan");
      toast.error('Gagal memuat ruangan.');
    } finally {
      setLoading(false);
    }
  };

  const addRoom = async () => {
    if (!newRoom.trim()) return toast.error('Nama ruangan tidak boleh kosong');
    if (roomList.length >= MAX_ROOMS) return toast.error(`Maksimal ${MAX_ROOMS} ruangan diperbolehkan`);

    setLoading(true);
    try {
      await axiosInstance.post('/iot/rooms', { room: newRoom }, { withCredentials: true });
      toast.success('Ruangan berhasil ditambahkan');
      setNewRoom('');
      fetchRooms();
    } catch {
      toast.error('Gagal menambah ruangan');
    } finally {
      setLoading(false);
    }
  };

  const renameRoom = async () => {
    if (!renameRoomOld || !renameRoomNew.trim()) return toast.error('Form tidak lengkap');
    setLoading(true);
    try {
      await axiosInstance.put(`/iot/rooms/${renameRoomOld}`, { room: renameRoomNew }, { withCredentials: true });
      toast.success('Nama ruangan berhasil diganti');
      setRenameRoomOld(null);
      setRenameRoomNew('');
      fetchRooms();
    } catch {
      toast.error('Gagal mengganti nama ruangan');
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteRoom = async () => {
    if (!selectedRoomToDelete) return;
    setLoading(true);
    try {
      await axiosInstance.delete(`/iot/rooms/${selectedRoomToDelete.idmyroom}`, { withCredentials: true });
      toast.success(`Ruangan "${selectedRoomToDelete.room}" dihapus`);
      setShowConfirmModal(false);
      setSelectedRoomToDelete(null);
      fetchRooms();
    } catch {
      toast.error('Gagal menghapus ruangan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchUserRole();
  }, []);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 mt-4 mb-10">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
          <div className="flex items-center">
            <Building2Icon className="text-blue-600 dark:text-blue-400 w-6 h-6 mr-2" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mt-8">Manage Rooms</h2>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              {userRole === 'admin' ? 'Admin Access' : `Role: ${userRole}`}
            </span>
            {!isAdmin && (
              <div className="flex items-center bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400 px-2 py-1 rounded text-xs ml-2">
                <ShieldAlertIcon className="w-3 h-3 mr-1" />
                Admin only
              </div>
            )}
          </div>
        </div>

        {/* Loading/Error */}
        {loading && (
          <div className="flex justify-center items-center my-4">
            <Loader2Icon className="animate-spin text-blue-600 w-5 h-5 mr-2" />
            <p className="text-blue-600 text-sm">Memuat data...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-2 rounded mb-4 flex items-center">
            <AlertTriangleIcon className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        {/* Forms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-2 flex items-center text-gray-700 dark:text-gray-200">
              <PlusIcon className="w-4 h-4 mr-1 text-green-500" />
              Tambah Ruangan
            </h3>
            <input
              type="text"
              placeholder="Nama ruangan baru"
              value={newRoom}
              onChange={(e) => setNewRoom(e.target.value)}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 mb-2"
            />
            <button
              onClick={addRoom}
              disabled={roomList.length >= MAX_ROOMS}
              className={`w-full py-2 text-sm font-medium rounded ${
                roomList.length >= MAX_ROOMS
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              Tambah Ruangan
            </button>
            {roomList.length >= MAX_ROOMS && (
              <p className="text-xs text-red-600 mt-2">Maksimal {MAX_ROOMS} ruangan sudah ditambahkan.</p>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-2 flex items-center text-gray-700 dark:text-gray-200">
              <EditIcon className="w-4 h-4 mr-1 text-blue-500" />
              Rename Ruangan
            </h3>
            <select
              value={renameRoomOld ?? ''}
              onChange={(e) => setRenameRoomOld(Number(e.target.value))}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 mb-2"
            >
              <option value="">Pilih ruangan</option>
              {roomList.map((room) => (
                <option key={room.idmyroom} value={room.idmyroom}>
                  {room.room}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Nama baru"
              value={renameRoomNew}
              onChange={(e) => setRenameRoomNew(e.target.value)}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 mb-2"
            />
            <button
              onClick={renameRoom}
              className="w-full py-2 text-sm font-medium rounded bg-blue-500 hover:bg-blue-600 text-white"
            >
              Ganti Nama Ruangan
            </button>
          </div>
        </div>

        {/* Room Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {roomList.map((room) => (
            <div
              key={room.idmyroom}
              className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center text-gray-700 dark:text-gray-200 text-sm font-medium">
                  <HomeIcon className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                  {room.room}
                </span>
                <span className="text-xs text-gray-400">#{room.idmyroom}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Created: {new Date(room.createdAt).toLocaleDateString()}
              </p>
              <button
                onClick={() => {
                  if (isAdmin) {
                    setSelectedRoomToDelete(room);
                    setShowConfirmModal(true);
                  }
                }}
                disabled={!isAdmin}
                className={`w-full py-2 rounded text-sm font-medium flex items-center justify-center ${
                  isAdmin
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <TrashIcon className="w-4 h-4 mr-1" /> Hapus
              </button>
            </div>
          ))}
        </div>

        {/* Non-admin warning */}
        {!isAdmin && (
          <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded text-yellow-700 dark:text-yellow-400 text-sm">
            <div className="flex items-center">
              <AlertTriangleIcon className="w-4 h-4 mr-2" />
              Hanya admin yang dapat menghapus ruangan.
            </div>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Hapus */}
      {showConfirmModal && selectedRoomToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-[90%] max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
              Konfirmasi Hapus
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Apakah Anda yakin ingin menghapus ruangan <span className="font-medium">{selectedRoomToDelete.room}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedRoomToDelete(null);
                }}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white text-sm"
                onClick={confirmDeleteRoom}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRoom;
