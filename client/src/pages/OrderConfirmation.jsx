
import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api/axios";

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);
}

export default function OrderConfirmation() {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Order ID is missing.");
      setLoading(false);
      return;
    }

    if (order?._id === id) return;

    let cancelled = false;

    async function fetchOrder() {
      try {
        setLoading(true);
        const response = await api.get(`/orders/${id}`);

        if (!cancelled) {
          setOrder(response.data.order);
          setError("");
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(
            requestError.response?.data?.message ||
              "Unable to load order details."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [id, order?._id]);

  if (loading) {
    return <main className="container py-5">Loading order details...</main>;
  }

  if (error || !order) {
    return (
      <main className="container py-5">
        <div className="alert alert-warning">
          {error || "Order not found."}
        </div>
        <Link to="/my-orders" className="btn btn-success">
          View My Orders
        </Link>
      </main>
    );
  }

  return (
    <main className="container py-5">
      <div className="card border-0 shadow-sm mx-auto" style={{ maxWidth: 760 }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <div className="display-4 mb-2" aria-hidden="true">✓</div>
            <h1 className="h2 text-success">Order Placed Successfully!</h1>
            <p className="text-muted">
              Thank you for shopping with AgriTech.
            </p>
          </div>

          <div className="alert alert-success">
            <strong>Order ID:</strong> {order._id}
          </div>

          <div className="d-flex justify-content-between mb-2">
            <span>Order status</span>
            <strong>{order.status}</strong>
          </div>

          <div className="d-flex justify-content-between mb-2">
            <span>Payment method</span>
            <strong>
              {order.paymentMethod === "COD"
                ? "Cash on Delivery"
                : order.paymentMethod}
            </strong>
          </div>

          <div className="d-flex justify-content-between mb-4">
            <span>Payment status</span>
            <strong>{order.paymentStatus}</strong>
          </div>

          <h2 className="h5">Items Ordered</h2>

          {order.items?.map((item, index) => (
            <div
              key={`${item.product || item.name}-${index}`}
              className="d-flex justify-content-between gap-3 py-3 border-bottom"
            >
              <div>
                <div className="fw-semibold">{item.name}</div>
                <small className="text-muted">
                  {formatPrice(item.price)} × {item.quantity}
                </small>
              </div>
              <strong>
                {formatPrice(Number(item.price) * Number(item.quantity))}
              </strong>
            </div>
          ))}

          <div className="d-flex justify-content-between mt-4">
            <span className="fw-semibold">Total Amount</span>
            <strong className="fs-4 text-success">
              {formatPrice(order.totalAmount)}
            </strong>
          </div>

          {order.shippingAddress && (
            <>
              <hr />
              <h2 className="h5">Delivery Address</h2>
              <p className="mb-1">{order.shippingAddress.fullName}</p>
              <p className="mb-1">{order.shippingAddress.phone}</p>
              <p className="mb-1">{order.shippingAddress.addressLine}</p>
              <p className="mb-0">
                {order.shippingAddress.city},{" "}
                {order.shippingAddress.state} –{" "}
                {order.shippingAddress.postalCode}
              </p>
            </>
          )}

          <div className="d-flex flex-wrap gap-2 mt-4">
            <Link to="/my-orders" className="btn btn-success">
              View My Orders
            </Link>
            <Link to="/products" className="btn btn-outline-success">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
