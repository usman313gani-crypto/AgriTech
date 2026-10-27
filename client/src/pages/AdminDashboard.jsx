
import { useCallback, useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function AdminDashboard() {
  const { user, isAuthLoading } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/stats");

      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        setError("Could not load dashboard statistics.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not connect to the admin statistics API."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && user?.role === "admin") {
      fetchStats();
    }
  }, [isAuthLoading, user?.role, fetchStats]);

  if (isAuthLoading) {
    return <div className="container py-5">Checking your session...</div>;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers,
      description: "Registered accounts",
      icon: "bi-people",
    },
    {
      title: "Total Farms",
      value: stats?.totalFarms,
      description: "Registered farms",
      icon: "bi-tree",
    },
    {
      title: "Crop Records",
      value: stats?.totalCrops,
      description: "Crop monitoring records",
      icon: "bi-flower1",
    },
  ];

  return (
    <main className="container py-4 py-md-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="text-success fw-semibold mb-1">
            AGRITECH ADMINISTRATION
          </p>
          <h1 className="h2 mb-1">Admin Dashboard</h1>
          <p className="text-secondary mb-0">
            Welcome, {user.name || "Admin"}.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-success"
          onClick={fetchStats}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Statistics"}
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <p className="mb-2">{error}</p>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={fetchStats}
          >
            Try again
          </button>
        </div>
      )}

      {loading && !stats ? (
        <div className="text-secondary py-4">
          Loading dashboard statistics...
        </div>
      ) : (
        <div className="row g-3">
          {cards.map((card) => (
            <div className="col-12 col-md-6 col-xl-4" key={card.title}>
              <section className="card h-100 border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <p className="text-secondary mb-2">{card.title}</p>
                      <h2 className="display-6 fw-bold mb-2">
                        {card.value ?? "—"}
                      </h2>
                      <p className="small text-secondary mb-0">
                        {card.description}
                      </p>
                    </div>

                    <span
                      className="rounded-circle bg-success-subtle text-success p-3"
                      aria-hidden="true"
                    >
                      <i className={`bi ${card.icon} fs-4`} />
                    </span>
                  </div>
                </div>
              </section>
            </div>
          ))}
        </div>
      )}

      <section className="mt-4">
        <h2 className="h4 mb-3">Management</h2>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="rounded-circle bg-success-subtle text-success p-3">
                    <i className="bi bi-box-seam fs-4" aria-hidden="true" />
                  </span>
                  <h3 className="h5 mb-0">Product Management</h3>
                </div>

                <p className="text-secondary">
                  Add agricultural products, update their details and prices,
                  and remove products that are no longer available.
                </p>

                <Link to="/admin/products" className="btn btn-success">
                  <i className="bi bi-plus-circle me-2" aria-hidden="true" />
                  Manage Products
                </Link>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-3">
                  <span className="rounded-circle bg-primary-subtle text-primary p-3">
                    <i className="bi bi-people fs-4" aria-hidden="true" />
                  </span>
                  <h3 className="h5 mb-0">User Management</h3>
                </div>

                <p className="text-secondary">
                  View registered accounts and manage user roles.
                </p>

                <Link to="/admin/users" className="btn btn-outline-primary">
                  Manage Users
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
