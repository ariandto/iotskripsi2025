import React, { useState, useEffect } from "react";
import {
  MdArrowBack,
  MdSettings,
  MdLogout,
  MdAdminPanelSettings
} from "react-icons/md";
import {
  FiUser,
  FiCalendar,
  FiMonitor
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaRegLightbulb } from "react-icons/fa";
import axios from "axios";
import { apiurl } from "../../config/api";
import axiosInstance from "../axiosConfig/axiosInstance";
import "../styles/Responsive.css";

interface MenuItem {
  name: string;
  link: string;
  icon: React.ElementType;
}

interface ResponsiveMobileProps {
  profilePhoto: string | null;
  onLogout: () => void;
}

const ResponsiveMobile: React.FC<ResponsiveMobileProps> = ({ profilePhoto, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await axiosInstance.get("/token", { withCredentials: true });
        setUserRole(response.data.role || "visitor");
      } catch {
        setUserRole("visitor");
      }
    };
    fetchUserRole();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.delete(`${apiurl}/api/logout`, { withCredentials: true });
      onLogout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const menus: MenuItem[] =
    userRole === "admin"
      ? [
          { name: "Dashboard", link: "/dashboard-power", icon: FiMonitor },
          { name: "Control", link: "/light-manage", icon: FaRegLightbulb },
          { name: "Schedule", link: "/manage-schedule", icon: FiCalendar },
          { name: "Manage Role", link: "/manage-role", icon: MdAdminPanelSettings }
        ]
      : userRole === "user"
      ? [
          { name: "Dashboard", link: "/dashboard-power", icon: FiMonitor },
          { name: "Control", link: "/light-manage", icon: FaRegLightbulb },
          { name: "Schedule", link: "/manage-schedule", icon: FiCalendar }
        ]
      : [
          { name: "Dashboard", link: "/dashboard-power", icon: FiMonitor }
        ];

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 h-12 bg-blue-500 text-white flex items-center px-4 py-2 z-50">
        <MdArrowBack size={20} onClick={() => navigate(-1)} className="cursor-pointer" />

        <div className="ml-auto flex items-center space-x-4">
          {/* Profile Icon (Foto) */}
          <Link to="/profile" title="Profile">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <FiUser size={20} className="hover:text-gray-200" />
            )}
          </Link>

          {/* Settings */}
          <MdSettings
            size={20}
            onClick={() => {
              if (userRole === "admin" || userRole === "user") {
                navigate("/manage-room");
              }
            }}
            className={`cursor-pointer transition ${
              userRole === "visitor" ? "opacity-40 cursor-not-allowed" : "hover:text-gray-200"
            }`}
            title={userRole === "visitor" ? "Access Denied" : "Manage Room"}
          />

          {/* Logout */}
          <MdLogout size={20} onClick={handleLogout} className="cursor-pointer" title="Logout" />
        </div>
      </div>

      {/* Bottom Navigation (Tanpa Profile) */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-r from-indigo-600 to-blue-500 text-white shadow-lg flex justify-around items-center md:hidden z-50">
        {menus.map((menu, i) => (
          <div key={i} className="flex flex-col items-center justify-center">
            <Link
              to={menu.link}
              className={`flex flex-col items-center justify-center text-sm transition-transform duration-300 ${
                location.pathname === menu.link ? "text-yellow-300" : "text-gray-200"
              } hover:text-white group transform hover:scale-110`}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                {React.createElement(menu.icon, { size: 18 })}
              </div>
              <span className="text-xs">{menu.name}</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsiveMobile;
