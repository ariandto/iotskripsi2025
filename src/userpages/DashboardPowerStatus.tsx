import React, { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig/axiosInstance';
import { toast } from 'react-toastify';
import { 
  FiRefreshCw, 
  FiZap, 
  FiClock, 
  FiPower,
  FiHome,
  FiTrendingUp,
  FiAlertCircle,
  FiCheck
} from 'react-icons/fi';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

interface PowerData {
  room: string;
  status: boolean;
  power_consumption: number;
  timestamp: string;
}

const DashboardPowerStatus: React.FC = () => {
  const [powerData, setPowerData] = useState<PowerData[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasActiveRooms, setHasActiveRooms] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPowerData = async () => {
    try {
      setIsLoading(true);
      const [ledResponse, powerResponse] = await Promise.all([
        axiosInstance.get('/iot/led-status', { withCredentials: true }),
        axiosInstance.get('/iot/power-consumption', { withCredentials: true })
      ]);

      if (ledResponse.status === 200 && powerResponse.status === 200) {
        const ledData = ledResponse.data.data;
        const powerData = powerResponse.data.data;

        const mergedData = ledData.map((led: any) => {
          const powerInfo = powerData.find((p: any) => p.room === led.room);
          return {
            room: led.room,
            status: led.status === 1,
            power_consumption: powerInfo ? powerInfo.total_power : 0,
            timestamp: led.timestamp
          };
        });

        setPowerData(mergedData);
        setHasActiveRooms(mergedData.some((room: { status: any; }) => room.status));
      } else {
        toast.error('Failed to fetch power or LED status data.');
      }
    } catch (err) {
      console.error('Error fetching power data:', err);
      toast.error('An error occurred while fetching power data.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPowerData = async () => {
    if (!hasActiveRooms) return;

    try {
      setIsRefreshing(true);
      const response = await axiosInstance.get('/iot/refresh-power', { withCredentials: true });

      if (response.status === 200) {
        await fetchPowerData();
        toast.success('Power consumption data refreshed!');
      }
    } catch (err) {
      console.error('Error refreshing power data:', err);
      toast.error('Failed to refresh power data.');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPowerData();
    const interval = setInterval(fetchPowerData, 60000);
    return () => clearInterval(interval);
  }, []);

  const calculateTotalPower = () => {
    return powerData.reduce((total, room) => total + room.power_consumption, 0).toFixed(2);
  };

  const chartData = {
    labels: powerData.map((data) => new Date(data.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Power Consumption (W)',
        data: powerData.map((data) => data.power_consumption),
        borderColor: '#4361ee',
        backgroundColor: 'rgba(67, 97, 238, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <FiZap className="text-yellow-500 mr-2 text-2xl" />
            <h2 className="text-2xl font-bold text-gray-800 mt-6">Power Consumption Dashboard</h2>
          </div>
          
          <div className="flex items-center">
            <button
              onClick={refreshPowerData}
              disabled={isRefreshing || !hasActiveRooms}
              className={`flex items-center px-4 py-2 rounded-lg shadow-md transition-all ${
                isRefreshing || !hasActiveRooms
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <FiRefreshCw className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <FiHome className="text-blue-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Rooms</p>
                <p className="text-2xl font-bold">
                  {powerData.filter(room => room.status).length} / {powerData.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <FiZap className="text-green-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Power Consumption</p>
                <p className="text-2xl font-bold">{calculateTotalPower()} kWh</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full mr-4">
                <FiClock className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                <p className="text-xl font-bold">
                  {powerData.length > 0 
                    ? new Date(Math.max(...powerData.map(d => new Date(d.timestamp).getTime()))).toLocaleTimeString() 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Container */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <FiTrendingUp className="text-blue-600 mr-2 text-xl" />
            <h3 className="text-lg font-semibold text-gray-800">Power Consumption Trend</h3>
          </div>
          
          <div className="h-64 md:h-80">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <FiRefreshCw className="animate-spin text-blue-500 text-2xl mb-2" />
                  <p className="text-gray-500">Loading chart data...</p>
                </div>
              </div>
            ) : powerData.length > 0 ? (
              <Line data={chartData} options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'kWh'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Time'
                    }
                  }
                }
              }} />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <FiAlertCircle className="text-gray-400 text-2xl mb-2" />
                  <p className="text-gray-500">No data available for chart</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Power Status Cards */}
        <div className="mb-4 flex items-center">
          <FiPower className="text-gray-700 mr-2 text-xl" />
          <h3 className="text-lg font-semibold text-gray-800">Room Status</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading ? (
            Array(4).fill(0).map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded mb-3 w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded mb-3 w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))
          ) : powerData.length === 0 ? (
            <div className="col-span-full bg-white rounded-lg shadow-md p-6 text-center">
              <FiAlertCircle className="text-gray-400 text-4xl mx-auto mb-3" />
              <p className="text-gray-500">No power data available</p>
            </div>
          ) : (
            powerData.map((data, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-md p-6 border-t-4 ${
                  data.status ? 'border-green-500' : 'border-red-500'
                } transition-all hover:shadow-lg`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-gray-800">{data.room}</h3>
                  <div className={`${
                    data.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  } flex items-center px-2 py-1 rounded-full text-xs font-medium`}>
                    {data.status ? (
                      <><FiCheck className="mr-1" /> ON</>
                    ) : (
                      <><FiPower className="mr-1" /> OFF</>
                    )}
                  </div>
                </div>
                
                <div className="mb-3 flex items-center">
                  <FiZap className="text-yellow-500 mr-2" />
                  <span className="text-gray-700 font-medium">Power:</span>
                  <span className="ml-2 text-gray-900 font-bold">
                    {data.power_consumption.toFixed(2)} kWh
                  </span>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <FiClock className="mr-2" />
                  Updated: {new Date(data.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPowerStatus;