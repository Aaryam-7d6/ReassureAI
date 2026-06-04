import React from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    // Dev fallback: use locally stored DEV_USER when backend not connected
    if (import.meta.env.DEV) {
      const dev = localStorage.getItem("DEV_USER");
      if (dev) {
        try {
          setUser(JSON.parse(dev));
          return;
        } catch {}
      }
    }

    axios
      .get("/api/v1/auth/me", { withCredentials: true })
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null));
  }, []);

  const handleLogout = async () => {
    if (import.meta.env.DEV) {
      // clear local dev user only
      localStorage.removeItem("DEV_USER");
      setUser(null);
      navigate("/auth");
      return;
    }

    await axios.post("/api/v1/auth/logout", {}, { withCredentials: true });
    setUser(null);
    navigate("/auth");
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-blue-600">
            ReassureAI
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-gray-700">
                  Hi, {user.fullName?.split(" ")[0]}
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
