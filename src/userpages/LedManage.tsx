import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig/axiosInstance';
import { toast } from 'react-toastify';
import { 
  LightbulbIcon, 
  PowerIcon, 
  ShieldAlertIcon, 
  RefreshCwIcon, 
  UserIcon, 
  HomeIcon, 
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon,
  ClockIcon
} from 'lucide-react';

interface RoomStatus {
  room: string;
  status: boolean;
  loading?: boolean;
}

const LedManage: React.FC = () => {
  const [roomStatus, setRoomStatus] = useState<RoomStatus[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [globalLoading, setGlobalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchUserRole = async () => {
    try {
      const response = await axiosInstance.get('/token', { withCredentials: true });
      setUserRole(response.data.role || 'Unknown');
    } catch (err) {
      setUserRole('Unknown');
    }
  };

  const fetchRoom = async () => {
    setGlobalLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get('/iot/rooms', { withCredentials: true });
      if (response.data.success) {
        setRoomStatus(response.data.data);
        await fetchRoomStatuses(response.data.data);
        setLastUpdated(new Date().toLocaleTimeString());
      } else {
        throw new Error(response.data.message || 'Failed to fetch room data.');
      }
    } catch (err) {
      setError('Failed to fetch room data. Please try again later.');
      toast.error('Failed to fetch room data.');
    } finally {
      setGlobalLoading(false);
    }
  };

  const fetchRoomStatuses = async (rooms: RoomStatus[]) => {
    try {
      const response = await axiosInstance.get('/iot/led-status', { withCredentials: true });
      if (response.data.success) {
        const updatedRoomStatus = rooms.map((room) => {
          const status = response.data.data.find((s: RoomStatus) => s.room === room.room);
          return status ? { ...room, status: status.status } : room;
        });
        setRoomStatus(updatedRoomStatus);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      setError('Failed to fetch LED status. Please try again later.');
      toast.error('Failed to fetch LED status.');
    }
  };

  const updateLedStatus = async (room: string, currentStatus: boolean) => {
    if (userRole !== 'admin' && userRole !== 'user') {
      toast.error('Only admin or user can perform this action.');
      return;
    }
    
    const newStatus = !currentStatus;
    setRoomStatus((prevState) => prevState.map((r) => (r.room === room ? { ...r, loading: true } : r)));
    try {
      const response = await axiosInstance.post(`/iot/led/${room.toLowerCase()}`, { status: newStatus }, { withCredentials: true });
      if (response.data.success) {
        toast.success(`Light in ${room} updated.`);
        await fetchRoomStatuses(roomStatus);
      }
    } catch (err) {
      toast.error(`Failed to update light status for ${room}.`);
    } finally {
      setRoomStatus((prevState) => prevState.map((r) => (r.room === room ? { ...r, loading: false } : r)));
    }
  };

  useEffect(() => {
    fetchUserRole();
    fetchRoom();
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 mt-3 sm:mt-6 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-5 md:p-6 transition-all">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 border-b pb-3 sm:pb-4 dark:border-gray-700">
          <div className="flex items-center mb-2 sm:mb-0">
            <HomeIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 dark:text-white mt-8">
              Control Light
            </h2>
          </div>
          
          <div className="flex flex-wrap items-center space-x-2 sm:space-x-4">
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
              <UserIcon className="h-4 w-4 mr-1 text-blue-500 dark:text-blue-400" />
              <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">Login as:</span>
              <span className="ml-1 text-blue-600 dark:text-blue-400 font-medium text-xs sm:text-sm">
                {userRole || 'Unknown'}
              </span>
            </div>
            
            {userRole === 'admin' || userRole === 'user' ? (
  <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
    <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500 dark:text-green-400" />
    <span className="text-green-600 dark:text-green-400 text-xs font-medium">Access Granted</span>
  </div>
) : (
  <div className="flex items-center bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md">
    <ShieldAlertIcon className="h-4 w-4 mr-1 text-red-500 dark:text-red-400" />
    <span className="text-red-500 dark:text-red-400 text-xs font-medium">Access Denied</span>
  </div>
)}

{lastUpdated && (
  <div className="flex items-center bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
    <ClockIcon className="h-4 w-4 mr-1 text-gray-500 dark:text-gray-400" />
    <span className="text-gray-500 dark:text-gray-400 text-xs">
      Updated: {lastUpdated}
    </span>
  </div>
)}

                    <button 
              onClick={fetchRoom} 
              disabled={globalLoading}
              className="flex items-center bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 px-2 py-1 rounded-md transition-colors"
            >
              <RefreshCwIcon className={`h-4 w-4 mr-1 text-blue-600 dark:text-blue-400 ${globalLoading ? 'animate-spin' : ''}`} />
              <span className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm">Refresh</span>
            </button>
          </div>
        </div>
        
        {/* Loading Indicator */}
        {globalLoading && (
          <div className="flex justify-center items-center space-x-2 my-4 bg-blue-50 dark:bg-blue-900/20 py-3 rounded-lg">
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-600 dark:text-blue-400 text-sm sm:text-base">Loading data...</span>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="w-full mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-center">
            <AlertTriangleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}
        
        {/* Room Status Summary */}
        {!globalLoading && roomStatus.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-2 sm:p-3 rounded-md">
              <div className="flex items-center">
                <div className="bg-green-100 dark:bg-green-800/30 p-1 sm:p-2 rounded">
                  <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 dark:text-green-400" />
                </div>
                <div className="ml-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active Lights</p>
                  <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                    {roomStatus.filter(room => room.status).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 p-2 sm:p-3 rounded-md">
              <div className="flex items-center">
                <div className="bg-red-100 dark:bg-red-800/30 p-1 sm:p-2 rounded">
                  <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 dark:text-red-400" />
                </div>
                <div className="ml-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Inactive Lights</p>
                  <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                    {roomStatus.filter(room => !room.status).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 sm:p-3 rounded-md">
              <div className="flex items-center">
                <div className="bg-blue-100 dark:bg-blue-800/30 p-1 sm:p-2 rounded">
                  <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <div className="ml-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Rooms</p>
                  <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                    {roomStatus.length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 p-2 sm:p-3 rounded-md">
              <div className="flex items-center">
                <div className="bg-gray-100 dark:bg-gray-600 p-1 sm:p-2 rounded">
                  <InfoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="ml-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Access Level</p>
                  <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200">
                    {userRole === 'admin' || userRole === 'user' ? 'Full Access' : 'View Only'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Rooms Grid */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {roomStatus.length === 0 && !globalLoading ? (
            <div className="col-span-full py-6 flex flex-col items-center justify-center">
              <AlertTriangleIcon className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-center text-gray-500 dark:text-gray-400">No room data available.</p>
            </div>
          ) : (
            roomStatus.map((room) => (
              <div 
                key={room.room} 
                className={`flex flex-col p-3 sm:p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border ${
                  room.status 
                    ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50' 
                    : 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-200 flex items-center">
                    <HomeIcon className="w-4 h-4 mr-1 text-gray-500 dark:text-gray-400" />
                    {room.room}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    room.status 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {room.status ? 'ON' : 'OFF'}
                  </span>
                </div>
                
                <div className="flex-grow flex flex-col items-center justify-center py-2 sm:py-3">
                  <div className="relative">
                    <LightbulbIcon 
                      size={36} 
                      className={`sm:w-12 sm:h-12 transition-all duration-300 ${
                        room.status 
                          ? 'text-yellow-500 dark:text-yellow-400 drop-shadow-lg' 
                          : 'text-gray-300 dark:text-gray-500'
                      }`} 
                      strokeWidth={1.5}
                    />
                    {room.status && (
                      <div className="absolute inset-0 bg-yellow-400/30 dark:bg-yellow-400/20 rounded-full filter blur-lg animate-pulse"></div>
                    )}
                  </div>
                  
                  <div className={`mt-2 text-xs sm:text-sm ${
                    room.status 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {room.status ? 'Currently active' : 'Currently inactive'}
                  </div>
                </div>
                
                <div className="mt-2">
                {(userRole === 'admin' || userRole === 'user') ? (
                    <button
                      onClick={() => updateLedStatus(room.room, room.status)}
                      className={`w-full py-1.5 px-3 rounded flex items-center justify-center text-white text-xs sm:text-sm font-medium transition-all duration-300 ${
                        room.status 
                          ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700' 
                          : 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                      } ${room.loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={room.loading}
                    >
                      {room.loading ? (
                        <span className="flex items-center justify-center">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 sm:mr-2"></div>
                          Updating...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <PowerIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          {room.status ? 'Turn OFF' : 'Turn ON'}
                        </span>
                      )}
                    </button>
                  ) : (
                    <div className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 p-1.5 rounded text-center">
                      <ShieldAlertIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 dark:text-red-400 mr-1" />
                      <p className="text-red-500 dark:text-red-400 text-xs">
                        Admin access required
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LedManage;