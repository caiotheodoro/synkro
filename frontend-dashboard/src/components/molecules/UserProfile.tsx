"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, Settings, Bell } from "lucide-react";
import { auth } from "@/services/auth-instance.service";

interface UserProfileProps {
  user: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

const UserProfile = ({ user }: UserProfileProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    auth.logout();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".user-dropdown")) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative user-dropdown">
      <button
        className="flex items-center space-x-2 focus:outline-none"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-10 h-10 rounded-full border-[3px] border-black shadow-neo flex items-center justify-center bg-white overflow-hidden">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name ?? "User"}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>
        <span className="font-medium hidden md:block">
          {user.name ?? user.email ?? "User"}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-neo border-[3px] border-black bg-white z-50">
          <div className="py-2">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <Link
                href="/notifications"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Link>
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
