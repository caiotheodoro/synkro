import React, { useEffect, useState } from "react";
import UserProfile from "@/components/user/UserProfile";
import { BackofficeNavigation } from "../components";
import { auth } from "@/services/auth-instance.service";

interface BackofficeLayoutProps {
  children: React.ReactNode;
}

export const BackofficeLayout: React.FC<BackofficeLayoutProps> = ({
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = auth.getUser();
    if (userData) {
      setUser(userData);
    }
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b-[3px] border-black sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <a href="/" className="text-2xl font-bold">
              Synkro
            </a>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user && <UserProfile user={user} />}
          </div>

          <button
            className="md:hidden text-black"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              )}
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={`p-2  w-64 border-r-[3px] border-black bg-white fixed inset-y-0 pt-20 z-30 transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
        >
          <div className="p-4">
            <BackofficeNavigation />
          </div>
        </aside>

        <main
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isMobileMenuOpen ? "md:ml-64" : "ml-0 md:ml-64"
          } p-6`}
          style={{
            maxWidth: "-webkit-fill-available",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
