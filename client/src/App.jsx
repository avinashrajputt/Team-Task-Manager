import { Route, Routes, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getMe } from "./api/client.js";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ProjectDetail from "./pages/ProjectDetail.jsx";
import NavBar from "./components/NavBar.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const data = await getMe();
        setUser(data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  if (loading) {
    return <div className="page">Loading...</div>;
  }

  return (
    <div className="app">
      <NavBar user={user} onLogout={() => setUser(null)} />
      <Routes>
        <Route path="/login" element={<Login onAuth={setUser} />} />
        <Route path="/signup" element={<Signup onAuth={setUser} />} />
        <Route
          path="/"
          element={user ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/projects/:id"
          element={user ? <ProjectDetail /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </div>
  );
}
