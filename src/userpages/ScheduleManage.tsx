import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig/axiosInstance';
import { toast } from 'react-toastify';
import { FiPlus, FiClock, FiEdit, FiTrash2, FiRefreshCw } from 'react-icons/fi';

interface RoomStatus {
  room: string;
  status: boolean;
}

interface Schedule {
  id: number;
  room: string;
  action: 'ON' | 'OFF';
  time: string;
}

const ScheduleManage: React.FC = () => {
  const [roomStatus, setRoomStatus] = useState<RoomStatus[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [newSchedule, setNewSchedule] = useState<Schedule>({
    id: 0,
    room: '',
    action: 'ON',
    time: '',
  });
  const [globalLoading, setGlobalLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const itemsPerPage = 5;

  const refreshToken = async () => {
    try {
      setIsRefreshing(true);
      const response = await axiosInstance.get('/token', { withCredentials: true });
      if (response.data.success) {
        console.log('Token refreshed');
      }
    } catch (err) {
      console.error('Error refreshing token:', err);
      toast.error('Session expired. Please log in again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response && error.response.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        await refreshToken();
        return axiosInstance(originalRequest);
      }
      return Promise.reject(error);
    }
  );

  const fetchUserRole = async () => {
    try {
      setIsRefreshing(true);
      const response = await axiosInstance.get('/token', { withCredentials: true });
      setUserRole(response.data.role || 'Unknown');
    } catch (err) {
      console.error('Error fetching user role:', err);
      setUserRole('Unknown');
    } finally {
      setIsRefreshing(false);
    }
  };

  const deleteSchedule = async (id: number) => {
    setIsRefreshing(true);
    try {
      const response = await axiosInstance.delete(`/iot/schedules/${id}`, {
        withCredentials: true,
      });
      if (response.data.success) {
        toast.success('Schedule deleted successfully.');
        fetchSchedules();
      } else {
        throw new Error('Failed to delete schedule.');
      }
    } catch (err) {
      console.error('Error deleting schedule:', err);
      toast.error('Failed to delete schedule.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchRoomData = async () => {
    setGlobalLoading(true);
    try {
      const [roomsResponse, statusResponse] = await Promise.all([
        axiosInstance.get('/iot/rooms', { withCredentials: true }),
        axiosInstance.get('/iot/led-status', { withCredentials: true }),
      ]);

      if (roomsResponse.data.success && statusResponse.data.success) {
        const rooms = roomsResponse.data.data;
        const statuses = statusResponse.data.data;

        const updatedRoomStatus = rooms.map((room: RoomStatus) => {
          const status = statuses.find((s: RoomStatus) => s.room === room.room);
          return status ? { ...room, status: status.status } : room;
        });

        setRoomStatus(updatedRoomStatus);
      } else {
        throw new Error('Failed to fetch room or status data.');
      }
    } catch (err) {
      console.error('Error fetching room data:', err);
      toast.error('Failed to fetch room data.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const fetchSchedules = async () => {
    setGlobalLoading(true);
    try {
      const response = await axiosInstance.get('/iot/schedules', { withCredentials: true });
      if (response.data.success) {
        const schedules = response.data.data.map((schedule: any) => ({
          id: schedule.id,
          room: schedule.room,
          action: schedule.action === 1 ? 'ON' : 'OFF',
          time: schedule.time,
        }));

        const filteredSchedules = selectedRoom
          ? schedules.filter(schedule => schedule.room === selectedRoom)
          : schedules;

        const sortedSchedules = filteredSchedules.sort((a, b) => {
          const timeA = a.time.split(':').map(Number);
          const timeB = b.time.split(':').map(Number);
          const totalSecondsA = timeA[0] * 3600 + timeA[1] * 60 + timeA[2];
          const totalSecondsB = timeB[0] * 3600 + timeB[1] * 60 + timeB[2];

          return sortOrder === 'asc' ? totalSecondsA - totalSecondsB : totalSecondsB - totalSecondsA;
        });

        setSchedules(sortedSchedules);
      } else {
        throw new Error('Failed to fetch schedules.');
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
      toast.error('Failed to fetch schedules.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const addSchedule = async () => {
    if (!newSchedule.room || !newSchedule.time) {
      toast.error('Room and time are required.');
      return;
    }

    const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
    if (!timeRegex.test(newSchedule.time)) {
      toast.error('Time must be in HH:mm:ss format.');
      return;
    }

    setIsRefreshing(true);
    try {
      const response = await axiosInstance.post('/iot/schedules', newSchedule);
      if (response.data.success) {
        toast.success('Schedule added successfully.');
        setNewSchedule({ id: 0, room: '', action: 'ON', time: '' });
        fetchSchedules();
      } else {
        throw new Error('Failed to add schedule.');
      }
    } catch (err) {
      console.error('Error adding schedule:', err);
      toast.error('Failed to add schedule.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const editSchedule = (index: number) => {
    const scheduleToEdit = schedules[index];
    setNewSchedule(scheduleToEdit);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setNewSchedule({ ...newSchedule, time: `${time}:00` });
  };

  useEffect(() => {
    fetchUserRole();
    fetchRoomData();
    fetchSchedules();
  }, []);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSchedules = schedules.slice(startIndex, endIndex);

  // ⛔ Restrict Access to Visitor
  if (userRole === null) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading role...
      </div>
    );
  }

  if (userRole === 'visitor') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-red-50">
        <div className="bg-white p-6 rounded shadow-md text-center text-red-600 font-semibold">
          ❌ Access Denied. You do not have permission to manage schedules.
        </div>
      </div>
    );
  }

  // ✅ Main UI for admin & user
  return (
    <div className="max-w-6xl mx-auto mt-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <FiClock /> Manage Schedule
      </h2>

      <div className="text-left mb-4">
        <p className="text-lg font-medium text-gray-600">
          Logged in as: <span className="text-blue-500">{userRole || 'Unknown'}</span>
        </p>
      </div>

      {(userRole === 'admin' || userRole === 'user') && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Add or Edit Schedule</h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={newSchedule.room}
              onChange={(e) => setNewSchedule({ ...newSchedule, room: e.target.value })}
              className="border p-2 rounded w-full sm:w-auto bg-white shadow"
            >
              <option value="">Select Room</option>
              {roomStatus.map((room) => (
                <option key={room.room} value={room.room}>
                  {room.room}
                </option>
              ))}
            </select>
            <select
              value={newSchedule.action}
              onChange={(e) => setNewSchedule({ ...newSchedule, action: e.target.value as 'ON' | 'OFF' })}
              className="border p-2 rounded w-full sm:w-auto bg-white shadow"
            >
              <option value="ON">Turn ON</option>
              <option value="OFF">Turn OFF</option>
            </select>
            <input
              type="time"
              value={newSchedule.time.slice(0, 5)}
              onChange={handleTimeChange}
              className="border p-2 rounded w-full sm:w-auto bg-white shadow"
            />
            <button
              onClick={addSchedule}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <FiPlus /> Add
            </button>
          </div>
        </div>
      )}
      {/* Filter and Sort */}
      <div className="mb-6 flex gap-4">
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="border p-2 rounded w-full sm:w-auto bg-white shadow focus:ring focus:ring-blue-200"
        >
          <option value="">Filter by Room</option>
          {roomStatus.map((room) => (
            <option key={room.room} value={room.room}>
              {room.room}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          className="border p-2 rounded w-full sm:w-auto bg-white shadow focus:ring focus:ring-blue-200"
        >
          <option value="asc">Sort by Time (Asc)</option>
          <option value="desc">Sort by Time (Desc)</option>
        </select>
      </div>

      {/* Schedules */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Schedules</h3>
        {schedules.length === 0 ? (
          <p className="text-gray-500">No schedules available.</p>
        ) : (
          <div>
            <table className="min-w-full table-auto border-collapse border border-gray-200 bg-white shadow">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="border border-gray-300 px-4 py-2">Room</th>
                  <th className="border border-gray-300 px-4 py-2">Action</th>
                  <th className="border border-gray-300 px-4 py-2">Time</th>
                  <th className="border border-gray-300 px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentSchedules.map((schedule, index) => (
                  <tr key={schedule.id} className="odd:bg-gray-100 even:bg-white hover:bg-blue-50">
                    <td className="border border-gray-300 px-4 py-2 text-center">{schedule.room}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{schedule.action}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">{schedule.time}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => editSchedule(index)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded focus:ring focus:ring-yellow-200"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => deleteSchedule(schedule.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded focus:ring focus:ring-red-200"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded focus:ring focus:ring-gray-200"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded focus:ring focus:ring-gray-200"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Refreshing indicator */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 w-full h-full bg-gray-800 opacity-50 flex items-center justify-center">
          <FiRefreshCw className="animate-spin text-white text-3xl" />
        </div>
      )}
    </div>
  );
};
export default ScheduleManage;
