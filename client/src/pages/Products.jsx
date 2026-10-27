
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const FALLBACK_IMAGE =
  "https://placehold.co/600x400/eaf4e4/356b35?text=AgriTech+Product";

const CART_STORAGE_KEY = "agritech_cart";

const STANDARD_CATEGORIES = [
  "Fruits",
  "Vegetables",
  "Grains & Cereals",
  "Pulses & Legumes",
  "Spices",
  "Oilseeds",
  "Cotton & Fiber",
  "Flowers & Nursery Plants",
  "Fodder",
  "Seeds",
  "Fertilizers & Soil Products",
  "Crop Protection",
  "Equipment & Irrigation",
  "Other Agricultural Products",
];

function normalizeCategory(category) {
  return String(category ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function formatCategory(category) {
  const normalized = normalizeCategory(category);

  if (!normalized) return "Uncategorized";

  return normalized
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPrice(price) {
  const numericPrice = Number(price);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericPrice) ? numericPrice : 0);
}

function loadSavedCart() {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) return [];

    const parsedCart = JSON.parse(savedCart);

    if (!Array.isArray(parsedCart)) return [];

    return parsedCart.filter(
      (item) =>
        item &&
        typeof item.productId === "string" &&
        typeof item.name === "string" &&
        Number.isFinite(Number(item.price)) &&
        Number(item.price) >= 0 &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0
    );
  } catch {
    return [];
  }
}

export default function Products() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState(loadSavedCart);
  const [cartMessage, setCartMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch products from the backend.
  useEffect(() => {
    let active = true;

    async function fetchProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/products");
        const result = response.data;

        if (!result.success) {
          throw new Error(result.message || "Unable to load products.");
        }

        if (active) {
          setProducts(Array.isArray(result.data) ? result.data : []);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load products. Please try again."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      active = false;
    };
  }, []);

  // Save cart changes in localStorage.
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      setCartMessage(
        "Your browser could not save the cart. It may not survive a refresh."
      );
    }
  }, [cart]);

  // Close the sidebar using the Escape key.
  useEffect(() => {
    if (!sidebarOpen) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sidebarOpen]);

  // Create category options, including older database categories.
  const categories = useMemo(() => {
    const categoryMap = new Map(
      STANDARD_CATEGORIES.map((category) => [
        normalizeCategory(category),
        category,
      ])
    );

    products.forEach((product) => {
      const normalized = normalizeCategory(product.category);

      if (normalized && !categoryMap.has(normalized)) {
        categoryMap.set(normalized, formatCategory(product.category));
      }
    });

    return Array.from(categoryMap, ([value, label]) => ({
      value,
      label,
    }));
  }, [products]);

  // Filter products by search text and category.
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const normalizedCategory = normalizeCategory(product.category);

      const matchesCategory =
        selectedCategory === "all" ||
        selectedCategory === normalizedCategory;

      const matchesSearch =
        !query ||
        [product.name, product.category, product.description].some(
          (value) =>
            String(value ?? "")
              .toLowerCase()
              .includes(query)
        );

      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  const cartItemCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + Number(item.price) * item.quantity,
        0
      ),
    [cart]
  );

  // Add a product, avoiding duplicate product entries.
  function addToCart(product) {
    if (!product._id) {
      setCartMessage("This product cannot be added right now.");
      return;
    }

    setCart((currentCart) => {
      const alreadyExists = currentCart.some(
        (item) => item.productId === String(product._id)
      );

      if (alreadyExists) {
        setCartMessage(
          `${product.name} is already in your cart. You can change its quantity in My Cart.`
        );
        return currentCart;
      }

      setCartMessage(`${product.name} added to your cart.`);

      return [
        ...currentCart,
        {
          productId: String(product._id),
          name: product.name,
          category: product.category,
          price: Number(product.price) || 0,
          imgUrl: product.imgUrl || "",
          quantity: 1,
        },
      ];
    });
  }

  function updateQuantity(productId, change) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    );

    setCartMessage("");
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.productId !== productId)
    );

    setCartMessage("Product removed from your cart.");
  }

  function clearCart() {
    setCart([]);
    setCartMessage("Your cart has been cleared.");
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategory("all");
  }

  function goToCheckout() {
    if (cart.length === 0) {
      setCartMessage("Add at least one product before checkout.");
      return;
    }

    setSidebarOpen(false);
    navigate("/checkout");
  }

  const sidebarLinkClass =
    "d-flex align-items-center gap-3 text-decoration-none rounded-3 px-3 py-3";

  return (
    <>
      {/* Hidden-by-default sidebar and clickable backdrop */}
      {sidebarOpen && (
        <div
          role="presentation"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1050,
            backgroundColor: "rgba(0, 0, 0, 0.45)",
          }}
        >
          <aside
            aria-label="Shopping navigation"
            aria-modal="true"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
            className="bg-white shadow-lg d-flex flex-column"
            style={{
              width: "min(320px, 85vw)",
              height: "100%",
              overflowY: "auto",
            }}
          >
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <div>
                <h2 className="h5 fw-bold text-success mb-1">
                  AgriTech
                </h2>
                <p className="small text-secondary mb-0">
                  Farmer Menu
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline-secondary"
                aria-label="Close menu"
                onClick={() => setSidebarOpen(false)}
              >
                ✕
              </button>
            </div>

            <nav className="p-3 d-flex flex-column gap-2">
              <Link
                to="/products"
                onClick={() => setSidebarOpen(false)}
                className={`${sidebarLinkClass} bg-success text-white`}
                aria-current="page"
              >
                <span aria-hidden="true">🛍️</span>
                <span className="fw-semibold">Products</span>
              </Link>

              <Link
                to="/cart"
                onClick={() => setSidebarOpen(false)}
                className={`${sidebarLinkClass} text-dark bg-light`}
              >
                <span aria-hidden="true">🛒</span>
                <span className="flex-grow-1">My Cart</span>
                <span className="badge text-bg-success">
                  {cartItemCount}
                </span>
              </Link>

              <button
                type="button"
                onClick={goToCheckout}
                className={`${sidebarLinkClass} border-0 bg-light text-dark text-start w-100`}
              >
                <span aria-hidden="true">💳</span>
                <span>Checkout</span>
              </button>

              <Link
                to="/my-orders"
                onClick={() => setSidebarOpen(false)}
                className={`${sidebarLinkClass} text-dark bg-light`}
              >
                <span aria-hidden="true">📦</span>
                <span>My Orders</span>
              </Link>

              <hr />

              <Link
                to="/dashboard"
                onClick={() => setSidebarOpen(false)}
                className={`${sidebarLinkClass} text-dark bg-light`}
              >
                <span aria-hidden="true">🏠</span>
                <span>Dashboard</span>
              </Link>
            </nav>

            <div className="mt-auto p-3 border-top">
              <p className="small text-secondary mb-0">
                Empowering Farmers Through Digital Technology
              </p>
            </div>
          </aside>
        </div>
      )}

      <main className="container py-4 py-md-5">
        {/* Page navigation: back button and toggleable sidebar */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
          <button
            type="button"
            className="btn btn-outline-success"
            onClick={() => navigate("/dashboard")}
          >
            ← Back to Dashboard
          </button>

          <button
            type="button"
            className="btn btn-success"
            onClick={() => setSidebarOpen(true)}
            aria-expanded={sidebarOpen}
            aria-controls="shopping-navigation"
          >
            ☰ Menu
          </button>
        </div>

        {/* Marketplace heading */}
        <section className="mb-4">
          <p className="text-success fw-semibold mb-2">
            AGRITECH MARKETPLACE
          </p>

          <h1 className="fw-bold mb-2">
            Agricultural Marketplace
          </h1>

          <p className="text-secondary mb-0">
            Discover fresh fruits, vegetables, grains, pulses, seeds,
            fertilizers, crop protection products, farming equipment,
            and other agricultural essentials.
          </p>
        </section>

        {/* Shopping cart summary */}
        <section
          className="card border-0 shadow-sm mb-4"
          aria-label="Shopping cart"
        >
          <div className="card-body">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
              <div>
                <h2 className="h5 fw-bold mb-1">
                  <span className="me-2" aria-hidden="true">
                    🛒
                  </span>
                  Your Shopping Cart
                </h2>

                <p className="text-secondary mb-0">
                  {cartItemCount}{" "}
                  {cartItemCount === 1 ? "item" : "items"} in your cart
                </p>
              </div>

              <div className="text-md-end">
                <p className="text-secondary small mb-1">
                  Estimated subtotal
                </p>

                <p className="text-success fs-4 fw-bold mb-0">
                  {formatPrice(cartSubtotal)}
                </p>
              </div>
            </div>

            {cartMessage && (
              <p
                className="alert alert-success py-2 mt-3 mb-0"
                role="status"
              >
                {cartMessage}
              </p>
            )}

            {cart.length === 0 ? (
              <p className="text-secondary mt-3 mb-0">
                Your cart is empty. Add products below to get started.
              </p>
            ) : (
              <>
                <hr />

                <div className="d-flex flex-column gap-3">
                  {cart.map((item) => (
                    <div
                      className="d-flex flex-wrap align-items-center gap-3"
                      key={item.productId}
                    >
                      <img
                        src={item.imgUrl || FALLBACK_IMAGE}
                        alt={item.name}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = FALLBACK_IMAGE;
                        }}
                        style={{
                          width: "76px",
                          height: "64px",
                          objectFit: "cover",
                          borderRadius: "8px",
                        }}
                      />

                      <div className="flex-grow-1">
                        <h3 className="h6 fw-semibold mb-1">
                          {item.name}
                        </h3>

                        <p className="small text-secondary mb-0">
                          {formatPrice(item.price)} each
                        </p>

                        <p className="fw-semibold text-success mb-0">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>

                      <div
                        className="d-flex align-items-center gap-2"
                        aria-label={`Quantity for ${item.name}`}
                      >
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          aria-label={`Decrease ${item.name} quantity`}
                          onClick={() =>
                            updateQuantity(item.productId, -1)
                          }
                        >
                          −
                        </button>

                        <span className="fw-semibold" aria-live="polite">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          aria-label={`Increase ${item.name} quantity`}
                          onClick={() =>
                            updateQuantity(item.productId, 1)
                          }
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeFromCart(item.productId)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="d-flex flex-wrap justify-content-between gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={clearCart}
                  >
                    Clear Cart
                  </button>

                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={goToCheckout}
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Search and category filters */}
        <section
          className="card border-0 shadow-sm mb-4"
          aria-label="Product filters"
        >
          <div className="card-body">
            <div className="row g-4">
              <div className="col-12 col-lg-6">
                <label
                  htmlFor="productSearch"
                  className="form-label fw-semibold"
                >
                  Search products
                </label>

                <input
                  id="productSearch"
                  type="search"
                  className="form-control"
                  placeholder="Search fruits, vegetables, grains, seeds..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div className="col-12 col-lg-6">
                <label
                  htmlFor="categoryFilter"
                  className="form-label fw-semibold"
                >
                  Filter by category
                </label>

                <select
                  id="categoryFilter"
                  className="form-select"
                  value={selectedCategory}
                  onChange={(event) =>
                    setSelectedCategory(event.target.value)
                  }
                >
                  <option value="all">All Categories</option>

                  {categories.map((category) => (
                    <option
                      key={category.value}
                      value={category.value}
                    >
                      {category.label}
                    </option>
                  ))}
                </select>

                <p className="form-text mb-0 mt-2">
                  Select a category to display matching products.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-5" role="status">
            <div
              className="spinner-border text-success"
              aria-hidden="true"
            />

            <p className="text-secondary mt-3 mb-0">
              Loading agricultural products...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="alert alert-danger" role="alert">
            <p className="mb-2">{error}</p>

            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Product list */}
        {!loading && !error && (
          <>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h2 className="h5 fw-bold mb-0">
                Browse Agricultural Products
              </h2>

              <span className="text-secondary small">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "product" : "products"}
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center border rounded-3 p-5">
                <h3 className="h5">No products found</h3>

                <p className="text-secondary mb-3">
                  {products.length === 0
                    ? "There are no products in the catalog yet."
                    : "Try another search term or category."}
                </p>

                {(products.length > 0 ||
                  search ||
                  selectedCategory !== "all") && (
                  <button
                    type="button"
                    className="btn btn-outline-success"
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="row g-4">
                {filteredProducts.map((product) => (
                  <div
                    className="col-12 col-sm-6 col-lg-4 col-xl-3"
                    key={product._id}
                  >
                    <article className="card h-100 border-0 shadow-sm">
                      <img
                        src={product.imgUrl || FALLBACK_IMAGE}
                        alt={product.name}
                        className="card-img-top"
                        loading="lazy"
                        style={{
                          height: "190px",
                          objectFit: "cover",
                          backgroundColor: "#f3f7f0",
                        }}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = FALLBACK_IMAGE;
                        }}
                      />

                      <div className="card-body d-flex flex-column">
                        <span className="badge text-bg-success align-self-start mb-2">
                          {formatCategory(product.category)}
                        </span>

                        <h3 className="h5 fw-bold">
                          {product.name}
                        </h3>

                        <p className="text-secondary small flex-grow-1">
                          {product.description ||
                            "No description available."}
                        </p>

                        <div className="border-top pt-3 mt-2">
                          <span className="text-success fw-bold fs-5">
                            {formatPrice(product.price)}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-success w-100 mt-3"
                          onClick={() => addToCart(product)}
                        >
                          <span className="me-2" aria-hidden="true">
                            🛒
                          </span>
                          Add to Cart
                        </button>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
