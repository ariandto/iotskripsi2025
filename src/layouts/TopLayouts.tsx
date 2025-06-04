import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./Sidebar";
import ResponsiveMobile from "./ResponsiveMobile";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import axiosInstance from "../axiosConfig/axiosInstance";

interface LayoutProps {
  onLogout: () => Promise<void>; // disesuaikan karena onLogout adalah async
  userRole: string;
}

const Layout: React.FC<LayoutProps> = ({ onLogout, userRole }) => {
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchProfilePhoto = async () => {
      try {
        const response = await axiosInstance.get("/user-profile");
        const { photo } = response.data;
        setProfilePhoto(photo);
      } catch (error) {
        console.error("Error fetching profile photo:", error);
        setProfilePhoto(null);
      }
    };
    fetchProfilePhoto();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogoutClick = async () => {
    try {
      await onLogout(); // Panggil logout dari props
      navigate("/login"); // Lanjut ke login setelah logout berhasil
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 w-full bg-gradient-to-r from-indigo-600 to-blue-500 text-white flex justify-between items-center p-4 shadow-lg z-50 hidden md:flex">
        <div className="text-lg font-bold">SMART LIGHT MANAGEMENT</div>
        <div className="flex items-center gap-4">
          {/* Profile Photo Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="hover:text-gray-200 flex items-center focus:outline-none"
            >
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <FiUser size={20} />
              )}
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-900 rounded-lg shadow-lg z-50">
                <ul className="py-2">
                  <li>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 hover:bg-gray-100 transition"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Change My Photos
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 hover:bg-gray-100 transition"
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      Settings
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={async () => {
                        setIsProfileMenuOpen(false);
                        await handleLogoutClick();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition"
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar onLogout={handleLogoutClick} userRole={userRole} />
        </div>
        <div className="flex-grow p-4 overflow-auto">
          <Outlet />
        </div>
      </div>

      {/* Mobile Navbar */}
      <div className="md:hidden">
        <ResponsiveMobile profilePhoto={profilePhoto} onLogout={handleLogoutClick} />
      </div>
    </div>
  );
};

export default Layout;
