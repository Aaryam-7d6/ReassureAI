import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to={user ? "/dashboard" : "/"}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-2xl font-bold text-blue-600"
          >
            ReassureAI
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-700">
                  Hi, {(user.full_name || user.name || user.email)?.split(" ")[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-gray-600 hover:text-red-600 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 text-gray-600 hover:text-blue-600 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
