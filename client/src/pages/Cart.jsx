
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const CART_STORAGE_KEY = "agritech_cart";

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

function getPrice(item) {
  const price = Number(item.price);
  return Number.isFinite(price) && price >= 0 ? price : 0;
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);
}

export default function Cart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(readCart);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    const syncCart = () => setCart(readCart());

    window.addEventListener("storage", syncCart);
    return () => window.removeEventListener("storage", syncCart);
  }, []);

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + getPrice(item) * Math.max(1, Number(item.quantity) || 1),
        0
      ),
    [cart]
  );

  function updateQuantity(productId, quantity) {
    if (quantity < 1) return;

    setCart((current) =>
      current.map((item) =>
        getProductId(item) === productId
          ? { ...item, quantity }
          : item
      )
    );
  }

  function removeItem(productId) {
    setCart((current) =>
      current.filter((item) => getProductId(item) !== productId)
    );
  }

  function clearCart() {
    setCart([]);
  }

  return (
    <main className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">Shopping Cart</h1>
          <p className="text-muted mb-0">
            Review your agricultural products before checkout.
          </p>
        </div>

        <Link to="/products" className="btn btn-outline-success">
          Continue Shopping
        </Link>
      </div>

      {cart.length === 0 ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <h2 className="h4">Your cart is empty</h2>
            <p className="text-muted">
              Browse products and add the items you need.
            </p>
            <Link to="/products" className="btn btn-success">
              Browse Products
            </Link>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                {cart.map((item) => {
                  const productId = getProductId(item);
                  const quantity = Math.max(
                    1,
                    Number(item.quantity) || 1
                  );

                  return (
                    <div
                      key={productId}
                      className="d-flex flex-wrap align-items-center gap-3 py-3 border-bottom"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name || "Product"}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                        />
                      ) : (
                        <div
                          className="bg-light rounded d-flex align-items-center justify-content-center"
                          style={{ width: 80, height: 80 }}
                        >
                          <span aria-hidden="true">🌱</span>
                        </div>
                      )}

                      <div className="flex-grow-1">
                        <h3 className="h6 mb-1">
                          {item.name || "Agricultural Product"}
                        </h3>
                        <p className="text-muted mb-1">
                          {formatPrice(getPrice(item))} per unit
                        </p>
                        <strong>
                          Subtotal: {formatPrice(getPrice(item) * quantity)}
                        </strong>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          aria-label={`Decrease quantity of ${item.name}`}
                          disabled={quantity <= 1}
                          onClick={() =>
                            updateQuantity(productId, quantity - 1)
                          }
                        >
                          −
                        </button>

                        <span className="fw-semibold">{quantity}</span>

                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() =>
                            updateQuantity(productId, quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeItem(productId)}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}

                <div className="d-flex justify-content-end pt-3">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h2 className="h5 mb-3">Order Summary</h2>

                <div className="d-flex justify-content-between mb-2">
                  <span>Items</span>
                  <span>
                    {cart.reduce(
                      (sum, item) =>
                        sum + Math.max(1, Number(item.quantity) || 1),
                      0
                    )}
                  </span>
                </div>

                <div className="d-flex justify-content-between mb-3">
                  <span>Subtotal</span>
                  <strong>{formatPrice(total)}</strong>
                </div>

                <p className="small text-muted">
                  Final product prices will be verified by the server when
                  you place your order.
                </p>

                <button
                  type="button"
                  className="btn btn-success w-100"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
