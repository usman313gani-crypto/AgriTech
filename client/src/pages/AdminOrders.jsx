
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/orders");
      const data = response.data.orders || [];

      setOrders(data);

      const statuses = {};
      data.forEach((order) => {
        statuses[order._id] = order.status;
      });

      setSelectedStatuses(statuses);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load orders. Please check your admin access."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = (orderId, status) => {
    setSelectedStatuses((previous) => ({
      ...previous,
      [orderId]: status,
    }));
  };

  const updateStatus = async (orderId) => {
    try {
      setUpdatingId(orderId);
      setError("");
      setMessage("");

      const response = await api.patch(
        `/admin/orders/${orderId}/status`,
        { status: selectedStatuses[orderId] }
      );

      const updatedOrder = response.data.order;

      setOrders((previous) =>
        previous.map((order) =>
          order._id === orderId
            ? { ...order, status: updatedOrder.status }
            : order
        )
      );

      setMessage("Order status updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to update order status."
      );
    } finally {
      setUpdatingId("");
    }
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleString("en-IN") : "N/A";

  if (loading) {
    return (
      <div className="container py-5">
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2>Admin Order Management</h2>
          <p className="text-muted mb-0">
            View orders and manage their delivery status.
          </p>
        </div>

        <Link to="/admin" className="btn btn-outline-secondary">
          Back to Admin Dashboard
        </Link>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-1">Total Orders</h5>
          <h3 className="mb-0">{orders.length}</h3>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="alert alert-info">
          No orders have been placed yet.
        </div>
      ) : (
        <div className="row g-4">
          {orders.map((order) => (
            <div className="col-12" key={order._id}>
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
                    <div>
                      <h5 className="mb-1">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </h5>
                      <small className="text-muted">
                        {formatDate(order.createdAt)}
                      </small>
                    </div>

                    <span className="badge bg-success align-self-start">
                      {order.status}
                    </span>
                  </div>

                  <hr />

                  <h6>Farmer Details</h6>
                  <p className="mb-1">
                    <strong>Name:</strong>{" "}
                    {order.user?.name || "Unknown"}
                  </p>
                  <p className="mb-3">
                    <strong>Email:</strong>{" "}
                    {order.user?.email || "N/A"}
                  </p>

                  <h6>Products</h6>
                  <ul className="mb-3">
                    {order.items?.map((item, index) => (
                      <li key={item._id || `${order._id}-${index}`}>
                        {item.name} × {item.quantity} — ₹
                        {(
                          Number(item.price || 0) *
                          Number(item.quantity || 0)
                        ).toLocaleString("en-IN")}
                      </li>
                    ))}
                  </ul>

                  <p>
                    <strong>Total Amount:</strong>{" "}
                    ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                  </p>

                  <p>
                    <strong>Payment:</strong>{" "}
                    {order.paymentMethod || "N/A"} (
                    {order.paymentStatus || "N/A"})
                  </p>

                  <hr />

                  <label
                    className="form-label fw-semibold"
                    htmlFor={`status-${order._id}`}
                  >
                    Update Order Status
                  </label>

                  <div className="d-flex flex-wrap gap-2">
                    <select
                      id={`status-${order._id}`}
                      className="form-select"
                      style={{ maxWidth: "240px" }}
                      value={selectedStatuses[order._id] || order.status}
                      onChange={(event) =>
                        handleStatusChange(order._id, event.target.value)
                      }
                      disabled={updatingId === order._id}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      className="btn btn-success"
                      onClick={() => updateStatus(order._id)}
                      disabled={
                        updatingId === order._id ||
                        selectedStatuses[order._id] === order.status
                      }
                    >
                      {updatingId === order._id
                        ? "Updating..."
                        : "Save Status"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminOrders;
