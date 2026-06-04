import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ReportViewer } from "../components/ReportViewer";

const StatCard = ({ label, value, icon, color }) => (
  <div className={`${color} rounded-xl p-6 text-white shadow-md`}>
    <div className="text-4xl font-bold mb-2">{value}</div>
    <div className="text-sm opacity-90">{label}</div>
    {icon && <div className="mt-4 text-3xl">{icon}</div>}
  </div>
);

const QuickAccessCard = ({ title, description, icon, color, onClick }) => (
  <button
    onClick={onClick}
    className={`${color} rounded-xl p-6 text-white shadow-md hover:shadow-lg transition transform hover:scale-105 text-left`}
  >
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="font-bold text-lg mb-1">{title}</h3>
    <p className="text-sm opacity-90">{description}</p>
  </button>
);

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    conversations: 0,
    reportsAnalysed: 0,
    wellnessTips: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndStats = async () => {
      try {
        const userRes = await axios.get("/api/v1/auth/me", {
          withCredentials: true,
        });
        setUser(userRes.data.data);

        // Mock stats for now — replace with real API calls later
        setStats({
          conversations: 12,
          reportsAnalysed: 3,
          wellnessTips: 27,
        });
      } catch (err) {
        console.error("Failed to fetch user:", err);
        navigate("/auth");
      }
    };

    fetchUserAndStats();
  }, [navigate]);

  const handleQuickAccess = (section) => {
    navigate("/chat", { state: { mode: section } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <section className="mb-12">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
            Welcome back, {user?.fullName?.split(" ")[0] || "Friend"}! 👋
          </h1>
          <p className="text-gray-600">
            Your safe space for health and wellness guidance.
          </p>
        </section>

        {/* Stats Section */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Your Activity
          </h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <StatCard
              label="Conversations"
              value={stats.conversations}
              icon="💬"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
            />
            <StatCard
              label="Reports Analysed"
              value={stats.reportsAnalysed}
              icon="📄"
              color="bg-gradient-to-br from-teal-500 to-teal-600"
            />
            <StatCard
              label="Wellness Tips"
              value={stats.wellnessTips}
              icon="✨"
              color="bg-gradient-to-br from-amber-500 to-amber-600"
            />
          </div>
        </section>

        {/* Quick Access Section */}
        <section>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Access</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <QuickAccessCard
              title="AI Health Chat"
              description="Chat with AI for personalized health guidance"
              icon="🤖"
              color="bg-gradient-to-br from-blue-500 to-blue-600"
              onClick={() => handleQuickAccess("mental_health")}
            />
            <QuickAccessCard
              title="Report Simplifier"
              description="Upload and understand medical reports"
              icon="📋"
              color="bg-gradient-to-br from-teal-500 to-teal-600"
              onClick={() => handleQuickAccess("report")}
            />
            <QuickAccessCard
              title="Ayurvedic Guidance"
              description="Explore Ayurvedic wellness practices"
              icon="🌿"
              color="bg-gradient-to-br from-green-500 to-green-600"
              onClick={() => handleQuickAccess("ayurveda")}
            />
            <QuickAccessCard
              title="Crisis Support"
              description="Immediate help and resources"
              icon="❤️"
              color="bg-gradient-to-br from-coral to-red-600"
              onClick={() => handleQuickAccess("crisis")}
            />
          </div>
        </section>

        {/* Report Viewer Section */}
        <section className="mt-12">
          <ReportViewer />
        </section>

        {/* Footer note */}
        <section className="mt-12 p-6 bg-white rounded-xl shadow-md border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">
            💡 <strong>Tip:</strong> ReassureAI provides educational guidance
            only. Always consult healthcare professionals for medical advice.
          </p>
        </section>
      </div>
    </div>
  );
}
