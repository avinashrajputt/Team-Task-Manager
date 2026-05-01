import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/client.js";

export default function NavBar({ user, onLogout }) {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
    } finally {
      onLogout();
      navigate("/login");
    }
  }

  return (
    <header className="nav">
      <Link to="/" className="logo">
        Team Task Manager
      </Link>
      <div className="nav-actions">
        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <button className="btn secondary" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link className="btn ghost" to="/login">
              Login
            </Link>
            <Link className="btn" to="/signup">
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
