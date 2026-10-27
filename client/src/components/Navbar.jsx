
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark app-navbar">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/">
          <i className="bi bi-flower1 me-2" />
          AgriTech
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNav"
          aria-controls="mainNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="mainNav">
          <div className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
            <NavLink className="nav-link" to="/">
              Home
            </NavLink>

            {isAuthenticated ? (
              <>
                {user?.role === "admin" ? (
                  <>
                    <NavLink className="nav-link" to="/admin">
                      <i className="bi bi-speedometer2 me-1" />
                      Admin Dashboard
                    </NavLink>

                    <NavLink className="nav-link" to="/admin/users">
                      <i className="bi bi-people me-1" />
                      Manage Users
                    </NavLink>
                  </>
                ) : (
                  <>
                    <NavLink className="nav-link" to="/dashboard">
                      Dashboard
                    </NavLink>

                    {user?.role === "farmer" && (
                      <>
                        <NavLink className="nav-link" to="/farms">
                          Farm Management
                        </NavLink>

                        <NavLink
                          className="nav-link"
                          to="/crop-monitoring"
                        >
                          Crop Monitoring
                        </NavLink>

                        <NavLink className="nav-link" to="/weather">
                          <i className="bi bi-cloud-sun me-1" />
                          Weather
                        </NavLink>
                      </>
                    )}
                  </>
                )}

                <span className="navbar-text small">
                  Hi, {user?.name}
                </span>

                <button
                  type="button"
                  className="btn btn-sm btn-light ms-lg-2"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink className="nav-link" to="/login">
                  Login
                </NavLink>

                <Link
                  className="btn btn-light btn-sm ms-lg-2"
                  to="/register"
                >
                  Join AgriTech
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
