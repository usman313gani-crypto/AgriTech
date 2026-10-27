
import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function AdminUsers() {
  const { user, isAuthLoading } = useAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};

      if (search.trim()) params.search = search.trim();
      if (role) params.role = role;

      const response = await api.get("/admin/users", { params });
      setUsers(response.data.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load users."
      );
    } finally {
      setLoading(false);
    }
  }, [search, role]);

  useEffect(() => {
    if (!isAuthLoading && user?.role === "admin") {
      fetchUsers();
    }
  }, [isAuthLoading, user?.role, fetchUsers]);

  const handleRoleChange = async (item, newRole) => {
    if (!newRole || newRole === item.role) return;

    const confirmed = window.confirm(
      `Change ${item.name}'s role from ${item.role} to ${newRole}?`
    );

    if (!confirmed) return;

    setUpdatingId(item._id);
    setError("");
    setNotice("");

    try {
      const response = await api.patch(
        `/admin/users/${item._id}/role`,
        { role: newRole }
      );

      setNotice(
        response.data.message || "User role updated successfully."
      );

      await fetchUsers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update user role."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const handleDelete = async (item) => {
    if (item.role === "admin") {
      setError("Admin accounts cannot be deleted from this page.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${item.name} (${item.email})? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(item._id);
    setError("");
    setNotice("");

    try {
      const response = await api.delete(`/admin/users/${item._id}`);

      setNotice(
        response.data.message || "User deleted successfully."
      );

      await fetchUsers();
    } catch (err) {
      const message = err.response?.data?.message;

      const related = err.response?.data?.relatedRecords;
      const details =
        related &&
        ` Linked records: ${related.farms ?? 0} farms and ${
          related.crops ?? 0
        } crop records.`;

      setError(
        (message || "Could not delete user.") + (details || "")
      );
    } finally {
      setDeletingId("");
    }
  };

  if (isAuthLoading) {
    return <main className="container py-5">Checking session...</main>;
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <div className="text-success fw-semibold small">
            AGRITECH ADMINISTRATION
          </div>
          <h1 className="h2 mb-1">User Management</h1>
          <p className="text-secondary mb-0">
            Search accounts, manage roles, and remove eligible users.
          </p>
        </div>

        <button
          className="btn btn-success"
          onClick={fetchUsers}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {notice && (
        <div className="alert alert-success" role="status">
          {notice}
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={fetchUsers}
            disabled={loading}
          >
            Retry
          </button>
        </div>
      )}

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-8">
              <label htmlFor="userSearch" className="form-label">
                Search users
              </label>
              <input
                id="userSearch"
                className="form-control"
                placeholder="Search name, email, or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label htmlFor="userRole" className="form-label">
                Filter by role
              </label>
              <select
                id="userRole"
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">All roles</option>
                <option value="farmer">Farmers</option>
                <option value="buyer">Buyers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white py-3">
          <strong>Registered Users</strong>
          <span className="text-secondary ms-2">
            ({users.length} shown, maximum 200)
          </span>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((item) => {
                  const isCurrentUser =
                    String(item._id) === String(user.id || user._id);

                  const isBusy =
                    updatingId === item._id ||
                    deletingId === item._id;

                  return (
                    <tr key={item._id}>
                      <td className="fw-semibold">{item.name}</td>
                      <td>{item.email}</td>
                      <td>{item.phone || "—"}</td>

                      <td>
                        <span
                          className={`badge ${
                            item.role === "admin"
                              ? "text-bg-dark"
                              : item.role === "farmer"
                              ? "text-bg-success"
                              : "text-bg-primary"
                          }`}
                        >
                          {item.role}
                        </span>
                      </td>

                      <td>
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td>
                        {item.role === "admin" ? (
                          <span className="text-secondary small">
                            Admin protected
                          </span>
                        ) : (
                          <div className="d-flex flex-wrap gap-2">
                            <select
                              className="form-select form-select-sm"
                              style={{ minWidth: "115px" }}
                              aria-label={`Change role for ${item.name}`}
                              value={item.role}
                              disabled={isCurrentUser || isBusy}
                              onChange={(e) =>
                                handleRoleChange(item, e.target.value)
                              }
                            >
                              <option value="farmer">Farmer</option>
                              <option value="buyer">Buyer</option>
                            </select>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(item)}
                              disabled={isCurrentUser || isBusy}
                            >
                              {deletingId === item._id
                                ? "Deleting..."
                                : "Delete"}
                            </button>

                            {updatingId === item._id && (
                              <span className="small text-secondary align-self-center">
                                Updating...
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
