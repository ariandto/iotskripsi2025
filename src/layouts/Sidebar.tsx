import React, { useState } from "react";
import { HiMenu } from "react-icons/hi";
import { MdAdminPanelSettings, MdMeetingRoom } from "react-icons/md";
import { FiCalendar, FiMonitor, FiUser } from "react-icons/fi";
import { FaRegLightbulb, FaRegWindowClose } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

interface MenuItem {
  name: string;
  link: string;
  icon: React.ElementType;
}

interface SidebarProps {
  onLogout: () => void;
  userRole: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, userRole }) => {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const menus: MenuItem[] = [
    { name: "Dashboard", link: "/dashboard-power", icon: FiMonitor },
    ...(userRole === "admin"
      ? [
          { name: "Control", link: "/light-manage", icon: FaRegLightbulb },
          { name: "Schedule", link: "/manage-schedule", icon: FiCalendar },
          { name: "Manage Room", link: "/manage-room", icon: MdMeetingRoom },
          { name: "Profile", link: "/profile", icon: FiUser },
          { name: "Manage Role", link: "/manage-role", icon: MdAdminPanelSettings },
        ]
      : userRole === "user"
      ? [
          { name: "Manage Room", link: "/manage-room", icon: MdMeetingRoom },
          { name: "Control", link: "/light-manage", icon: FaRegLightbulb },
          { name: "Schedule", link: "/manage-schedule", icon: FiCalendar },
          { name: "Profile", link: "/profile", icon: FiUser },
        ]
      : []),
  ];

  return (
    <section
      className={`${
        open ? "w-64" : "w-20"
      } sticky top-0 h-screen bg-gradient-to-b from-indigo-600 to-blue-700 text-white p-4 shadow-lg transition-all duration-500 ease-in-out`}
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center ml-auto">
          {open ? (
            <FaRegWindowClose
              size={26}
              className="cursor-pointer hover:text-gray-200 transition-transform transform"
              onClick={() => setOpen(!open)}
            />
          ) : (
            <HiMenu
              size={26}
              className="mr-3 cursor-pointer text-white hover:text-gray-200 transition-transform transform"
              onClick={() => setOpen(!open)}
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {menus.map((menu, index) => {
          const isActive = location.pathname === menu.link;
          return (
            <Link
              key={index}
              to={menu.link}
              className={`flex items-center space-x-4 p-3 rounded-md transition duration-300 ease-in-out ${
                isActive ? "bg-blue-800" : "hover:bg-blue-600"
              }`}
            >
              <menu.icon
                size={22}
                className={`text-white ${
                  isActive ? "border-2 border-yellow-400 rounded-full p-1" : ""
                }`}
              />
              <span
                className={`${
                  open ? "block" : "hidden"
                } text-sm font-semibold`}
              >
                {menu.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default Sidebar;
