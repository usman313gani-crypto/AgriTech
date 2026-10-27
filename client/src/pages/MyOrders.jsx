
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);
}

function formatDate(date) {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "Date unavailable"
    : parsed.toLocaleString("en-IN");
}

function statusClass(status) {
  switch (status) {
    case "Delivered":
      return "text-bg-success";
    case "Cancelled":
      return "text-bg-danger";
    case "Shipped":
      return "text-bg-primary";
    case "Confirmed":
      return "text-bg-info";
    default:
      return "text-bg-warning";
  }
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchOrders() {
      try {
        const response = await api.get("/orders/my-orders");

        if (!cancelled) {
          setOrders(response.data.orders || []);
          setError("");
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load your orders."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">My Orders</h1>
          <p className="text-muted mb-0">
            View your order history and delivery status.
          </p>
        </div>

        <Link to="/products" className="btn btn-outline-success">
          Shop Products
        </Link>
      </div>

      {loading && <p>Loading your orders...</p>}

      {!loading && error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h2 className="h5">No orders yet</h2>
            <p className="text-muted">
              Your orders will appear here after checkout.
            </p>
            <Link to="/products" className="btn btn-success">
              Browse Products
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="d-grid gap-3">
          {orders.map((order) => (
            <div className="card border-0 shadow-sm" key={order._id}>
              <div className="card-body p-4">
                <div className="d-flex flex-wrap justify-content-between gap-3">
                  <div>
                    <h2 className="h6 mb-1">
                      Order #{order._id}
                    </h2>
                    <p className="text-muted small mb-2">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                    <span
                      className={`badge ${statusClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="text-md-end">
                    <div className="text-muted small">Order total</div>
                    <strong className="fs-5">
                      {formatPrice(order.totalAmount)}
                    </strong>
                    <div className="small text-muted">
                      {order.paymentMethod === "COD"
                        ? "Cash on Delivery"
                        : order.paymentMethod}
                    </div>
                  </div>
                </div>

                <hr />

                <div className="d-flex flex-wrap justify-content-between gap-3">
                  <div>
                    <strong>
                      {order.items?.length || 0} product type(s)
                    </strong>

                    <ul className="small text-muted mb-0 mt-2">
                      {order.items?.map((item, index) => (
                        <li key={`${item.product || item.name}-${index}`}>
                          {item.name} × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="align-self-end">
                    <Link
                      to={`/order-confirmation/${order._id}`}
                      className="btn btn-outline-success btn-sm"
                    >
                      View Order Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
