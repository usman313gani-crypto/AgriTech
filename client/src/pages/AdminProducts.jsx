
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

const FALLBACK_IMAGE =
  "https://placehold.co/600x400/eaf4e4/356b35?text=AgriTech+Product";

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

const EMPTY_FORM = {
  name: "",
  category: "",
  price: "",
  description: "",
  imgUrl: "",
};

function normalizeCategory(category) {
  return String(category ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function getStandardCategory(category) {
  const normalized = normalizeCategory(category);

  return (
    STANDARD_CATEGORIES.find(
      (item) => normalizeCategory(item) === normalized
    ) || ""
  );
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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(price) || 0);
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/products");

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to load products."
        );
      }

      setProducts(
        Array.isArray(response.data.data) ? response.data.data : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  }

  function handleEdit(product) {
    setEditingId(product._id);

    setForm({
      name: product.name || "",
      category: getStandardCategory(product.category),
      price: String(product.price ?? ""),
      description: product.description || "",
      imgUrl: product.imgUrl || "",
    });

    setError("");
    setMessage("");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const name = form.name.trim();
    const category = getStandardCategory(form.category);
    const price = Number(form.price);

    if (!name || !category || form.price.trim() === "") {
      setError(
        "Product name, a valid category, and price are required."
      );
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError(
        "Enter a valid price greater than or equal to zero."
      );
      return;
    }

    const payload = {
      name,
      category,
      price,
      description: form.description.trim(),
      imgUrl: form.imgUrl.trim(),
    };

    setSaving(true);

    try {
      let response;

      if (editingId) {
        response = await api.put(`/products/${editingId}`, payload);
      } else {
        response = await api.post("/products", payload);
      }

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to save product."
        );
      }

      setMessage(
        editingId
          ? "Product updated successfully."
          : "Product added successfully."
      );

      resetForm();
      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to save product. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setDeletingId(product._id);

    try {
      const response = await api.delete(`/products/${product._id}`);

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to delete product."
        );
      }

      setProducts((current) =>
        current.filter((item) => item._id !== product._id)
      );

      if (editingId === product._id) {
        resetForm();
      }

      setMessage("Product deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to delete product."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();

    return (
      !query ||
      [product.name, product.category, product.description].some(
        (value) => String(value ?? "").toLowerCase().includes(query)
      )
    );
  });

  return (
    <main className="container py-4 py-md-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="text-success fw-semibold mb-1">
            AGRITECH ADMINISTRATION
          </p>

          <h1 className="h2 fw-bold mb-2">Product Management</h1>

          <p className="text-secondary mb-0">
            Manage fresh produce, food grains, planting supplies,
            fertilizers, and other agricultural products.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Link to="/admin" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2" aria-hidden="true" />
            Admin Dashboard
          </Link>

          <Link to="/products" className="btn btn-outline-success">
            View Catalog
          </Link>
        </div>
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

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <section className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h2 className="h5 fw-bold mb-1">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>

              <p className="text-secondary small mb-4">
                Fields marked with * are required.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="productName" className="form-label">
                    Product Name *
                  </label>

                  <input
                    id="productName"
                    name="name"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Fresh Tomatoes"
                    value={form.name}
                    onChange={handleChange}
                    maxLength={120}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="productCategory" className="form-label">
                    Category *
                  </label>

                  <select
                    id="productCategory"
                    name="category"
                    className="form-select"
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Select a category
                    </option>

                    {STANDARD_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <div className="form-text">
                    Select the category that best matches the product.
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="productPrice" className="form-label">
                    Price (₹) *
                  </label>

                  <input
                    id="productPrice"
                    name="price"
                    type="number"
                    className="form-control"
                    placeholder="Enter price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="productDescription"
                    className="form-label"
                  >
                    Description
                  </label>

                  <textarea
                    id="productDescription"
                    name="description"
                    className="form-control"
                    rows="4"
                    placeholder="Describe the product, quality, quantity, or uses..."
                    value={form.description}
                    onChange={handleChange}
                    maxLength={2000}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="productImgUrl" className="form-label">
                    Image URL
                  </label>

                  <input
                    id="productImgUrl"
                    name="imgUrl"
                    type="url"
                    className="form-control"
                    placeholder="https://example.com/product.jpg"
                    value={form.imgUrl}
                    onChange={handleChange}
                  />

                  <div className="form-text">
                    Use a publicly accessible image URL.
                  </div>
                </div>

                <div className="mb-4">
                  <p className="form-label">Image Preview</p>

                  <img
                    src={form.imgUrl.trim() || FALLBACK_IMAGE}
                    alt="Product preview"
                    className="rounded border"
                    style={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover",
                      backgroundColor: "#f3f7f0",
                    }}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={saving || deletingId !== null}
                  >
                    {saving ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          aria-hidden="true"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i
                          className={`bi ${
                            editingId ? "bi-check-circle" : "bi-plus-circle"
                          } me-2`}
                          aria-hidden="true"
                        />
                        {editingId ? "Update Product" : "Add Product"}
                      </>
                    )}
                  </button>

                  {editingId && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={resetForm}
                      disabled={saving}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>
            </div>
          </section>
        </div>

        <div className="col-12 col-lg-7">
          <section className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <h2 className="h5 fw-bold mb-1">Existing Products</h2>

                  <p className="text-secondary small mb-0">
                    {products.length}{" "}
                    {products.length === 1 ? "product" : "products"} in catalog
                  </p>
                </div>

                <button
                  type="button"
                  className="btn btn-outline-success btn-sm"
                  onClick={fetchProducts}
                  disabled={loading}
                >
                  <i
                    className="bi bi-arrow-clockwise me-1"
                    aria-hidden="true"
                  />
                  Refresh
                </button>
              </div>

              <div className="mb-3">
                <label
                  htmlFor="adminProductSearch"
                  className="form-label"
                >
                  Search products
                </label>

                <input
                  id="adminProductSearch"
                  type="search"
                  className="form-control"
                  placeholder="Search by name, category, or description..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              {loading ? (
                <div className="text-center py-5" role="status">
                  <div
                    className="spinner-border text-success"
                    aria-hidden="true"
                  />

                  <p className="text-secondary mt-3 mb-0">
                    Loading products...
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center border rounded-3 p-4">
                  <i
                    className="bi bi-box-seam fs-1 text-secondary"
                    aria-hidden="true"
                  />

                  <h3 className="h6 mt-3">
                    {products.length === 0
                      ? "No products have been added yet"
                      : "No matching products"}
                  </h3>

                  <p className="text-secondary small mb-0">
                    {products.length === 0
                      ? "Use the form to add your first product."
                      : "Try a different search term."}
                  </p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {filteredProducts.map((product) => (
                    <article
                      key={product._id}
                      className="border rounded-3 p-3"
                    >
                      <div className="d-flex gap-3">
                        <img
                          src={product.imgUrl || FALLBACK_IMAGE}
                          alt={product.name}
                          className="rounded"
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                            flexShrink: 0,
                            backgroundColor: "#f3f7f0",
                          }}
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />

                        <div className="flex-grow-1 min-w-0">
                          <span className="badge text-bg-success mb-1">
                            {getStandardCategory(product.category) ||
                              formatCategory(product.category)}
                          </span>

                          <h3 className="h6 fw-bold mb-1">
                            {product.name}
                          </h3>

                          <p className="text-success fw-semibold mb-1">
                            {formatPrice(product.price)}
                          </p>

                          <p className="text-secondary small mb-0">
                            {product.description || "No description"}
                          </p>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap gap-2 mt-3">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => handleEdit(product)}
                          disabled={saving || deletingId !== null}
                        >
                          <i
                            className="bi bi-pencil me-1"
                            aria-hidden="true"
                          />
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(product)}
                          disabled={saving || deletingId !== null}
                        >
                          {deletingId === product._id ? (
                            "Deleting..."
                          ) : (
                            <>
                              <i
                                className="bi bi-trash me-1"
                                aria-hidden="true"
                              />
                              Delete
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
