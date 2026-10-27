
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const CART_STORAGE_KEY = "agritech_cart";

const INITIAL_ADDRESS = {
  fullName: "",
  phone: "",
  addressLine: "",
  city: "",
  state: "",
  postalCode: "",
};

function readCart() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(CART_STORAGE_KEY) || "[]"
    );
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function getProductId(item) {
  return String(item._id || item.id || item.productId || "");
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);
}

export default function Checkout() {
  const navigate = useNavigate();

  const [cart, setCart] = useState(readCart);
  const [address, setAddress] = useState(INITIAL_ADDRESS);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const total = useMemo(
    () =>
      cart.reduce((sum, item) => {
        const price = Number(item.price);
        const quantity = Math.max(1, Number(item.quantity) || 1);

        return sum + (Number.isFinite(price) ? price : 0) * quantity;
      }, 0),
    [cart]
  );

  function handleChange(event) {
    const { name, value } = event.target;

    setAddress((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Your cart is empty. Please add a product first.");
      return;
    }

    const missingField = Object.entries(address).some(
      ([, value]) => !value.trim()
    );

    if (missingField) {
      setError("Please complete every delivery address field.");
      return;
    }

    if (!/^[0-9]{10}$/.test(address.phone.trim())) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }

    if (!/^[0-9]{6}$/.test(address.postalCode.trim())) {
      setError("Enter a valid 6-digit postal PIN code.");
      return;
    }

    const items = cart.map((item) => ({
      productId: getProductId(item),
      quantity: Number(item.quantity) || 1,
    }));

    if (
      items.some(
        (item) =>
          !item.productId ||
          !Number.isSafeInteger(item.quantity) ||
          item.quantity < 1
      )
    ) {
      setError("A cart item is invalid. Please return to your cart.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/orders", {
        items,
        shippingAddress: address,
      });

      if (!response.data?.success || !response.data?.order?._id) {
        setError("The server did not confirm your order. Please check your orders before retrying.");
        return;
      }

      const order = response.data.order;

      // Clear the cart only after the server confirms success.
      localStorage.removeItem(CART_STORAGE_KEY);
      setCart([]);

      navigate(`/order-confirmation/${order._id}`, {
        replace: true,
        state: { order },
      });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to place your order. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container py-4">
      <div className="mb-4">
        <h1 className="h2">Checkout</h1>
        <p className="text-muted">
          Enter your delivery details to place your order.
        </p>
      </div>

      {cart.length === 0 ? (
        <div className="alert alert-info">
          Your cart is empty.{" "}
          <Link to="/products">Browse products</Link>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-7">
            <form
              className="card border-0 shadow-sm"
              onSubmit={handleSubmit}
            >
              <div className="card-body p-4">
                <h2 className="h5 mb-3">Delivery Address</h2>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label" htmlFor="fullName">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    className="form-control"
                    value={address.fullName}
                    onChange={handleChange}
                    maxLength={100}
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="form-control"
                    value={address.phone}
                    onChange={handleChange}
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    autoComplete="tel"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="addressLine">
                    Address
                  </label>
                  <textarea
                    id="addressLine"
                    name="addressLine"
                    className="form-control"
                    rows={3}
                    value={address.addressLine}
                    onChange={handleChange}
                    maxLength={300}
                    autoComplete="street-address"
                    required
                  />
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label" htmlFor="city">
                      City / Village
                    </label>
                    <input
                      id="city"
                      name="city"
                      className="form-control"
                      value={address.city}
                      onChange={handleChange}
                      maxLength={100}
                      autoComplete="address-level2"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="state">
                      State
                    </label>
                    <input
                      id="state"
                      name="state"
                      className="form-control"
                      value={address.state}
                      onChange={handleChange}
                      maxLength={100}
                      autoComplete="address-level1"
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label" htmlFor="postalCode">
                      PIN Code
                    </label>
                    <input
                      id="postalCode"
                      name="postalCode"
                      className="form-control"
                      value={address.postalCode}
                      onChange={handleChange}
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      autoComplete="postal-code"
                      required
                    />
                  </div>
                </div>

                <hr className="my-4" />

                <h2 className="h5">Payment Method</h2>
                <div className="border rounded p-3">
                  <strong>Cash on Delivery (COD)</strong>
                  <p className="text-muted small mb-0 mt-1">
                    Pay when your order is delivered.
                  </p>
                </div>

                <button
                  type="submit"
                  className="btn btn-success w-100 mt-4"
                  disabled={submitting || cart.length === 0}
                >
                  {submitting ? "Placing Order..." : "Place Order"}
                </button>

                <Link
                  to="/cart"
                  className="btn btn-outline-secondary w-100 mt-2"
                >
                  Return to Cart
                </Link>
              </div>
            </form>
          </div>

          <div className="col-lg-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h2 className="h5 mb-3">Order Summary</h2>

                {cart.map((item, index) => {
                  const quantity = Math.max(
                    1,
                    Number(item.quantity) || 1
                  );
                  const price = Number(item.price) || 0;

                  return (
                    <div
                      key={`${getProductId(item)}-${index}`}
                      className="d-flex justify-content-between gap-3 mb-3"
                    >
                      <div>
                        <div className="fw-semibold">
                          {item.name || "Agricultural Product"}
                        </div>
                        <small className="text-muted">
                          Quantity: {quantity}
                        </small>
                      </div>
                      <span>{formatPrice(price * quantity)}</span>
                    </div>
                  );
                })}

                <hr />

                <div className="d-flex justify-content-between">
                  <span>Estimated total</span>
                  <strong className="fs-5">
                    {formatPrice(total)}
                  </strong>
                </div>

                <p className="text-muted small mt-3 mb-0">
                  The server calculates the final order total using
                  product prices stored in the database.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
