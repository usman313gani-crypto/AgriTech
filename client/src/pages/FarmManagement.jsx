
import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
  farmName: "",
  location: "",
  area: "",
  areaUnit: "acre",
  soilType: "Other",
  cropsGrown: "",
  irrigationType: "Other",
  notes: ""
};

export default function FarmManagement() {
  const { user } = useAuth();

  const [farms, setFarms] = useState([]);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadFarms = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/farms");
      setFarms(response.data.farms);
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not load farm profiles."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "farmer") {
      loadFarms();
    } else {
      setLoading(false);
    }
  }, [user?.role, loadFarms]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  function resetForm() {
    setForm({ ...emptyForm });
    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const area = Number(form.area);

    if (!form.farmName.trim() || !form.location.trim()) {
      setError("Farm name and location are required.");
      return;
    }

    if (!Number.isFinite(area) || area < 0.01) {
      setError("Enter a valid farm area of at least 0.01.");
      return;
    }

    const payload = {
      farmName: form.farmName.trim(),
      location: form.location.trim(),
      area,
      areaUnit: form.areaUnit,
      soilType: form.soilType,
      cropsGrown: form.cropsGrown
        .split(",")
        .map((crop) => crop.trim())
        .filter(Boolean),
      irrigationType: form.irrigationType,
      notes: form.notes.trim()
    };

    setSaving(true);

    try {
      if (editingId) {
        await api.put(`/farms/${editingId}`, payload);
        setMessage("Farm profile updated successfully.");
      } else {
        await api.post("/farms", payload);
        setMessage("Farm profile created successfully.");
      }

      resetForm();
      await loadFarms();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not save the farm profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEditing(farm) {
    setEditingId(farm._id);
    setForm({
      farmName: farm.farmName || "",
      location: farm.location || "",
      area: String(farm.area ?? ""),
      areaUnit: farm.areaUnit || "acre",
      soilType: farm.soilType || "Other",
      cropsGrown: (farm.cropsGrown || []).join(", "),
      irrigationType: farm.irrigationType || "Other",
      notes: farm.notes || ""
    });

    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(farm) {
    const confirmed = window.confirm(
      `Delete the farm "${farm.farmName}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/farms/${farm._id}`);

      if (editingId === farm._id) {
        resetForm();
      }

      setMessage("Farm profile deleted successfully.");
      await loadFarms();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not delete the farm profile."
      );
    }
  }

  if (user?.role !== "farmer") {
    return (
      <main className="container py-5">
        <div className="alert alert-warning">
          Farm management is available to farmer accounts only.
        </div>
      </main>
    );
  }

  return (
    <main className="container py-5">
      <div className="mb-4">
        <p className="text-success fw-semibold mb-1">FARMER WORKSPACE</p>
        <h1 className="fw-bold">Farm Management</h1>
        <p className="text-secondary">
          Create and manage your farm profiles in one place.
        </p>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      <div className="card shadow-sm border-0 mb-5">
        <div className="card-body p-4">
          <h4 className="fw-bold mb-4">
            {editingId ? "Edit Farm Profile" : "Add a Farm"}
          </h4>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="farmName">
                  Farm name *
                </label>
                <input
                  id="farmName"
                  name="farmName"
                  className="form-control"
                  value={form.farmName}
                  onChange={updateForm}
                  maxLength={100}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="location">
                  Location *
                </label>
                <input
                  id="location"
                  name="location"
                  className="form-control"
                  value={form.location}
                  onChange={updateForm}
                  maxLength={200}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="area">
                  Farm area *
                </label>
                <input
                  id="area"
                  name="area"
                  type="number"
                  min="0.01"
                  step="any"
                  className="form-control"
                  value={form.area}
                  onChange={updateForm}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="areaUnit">
                  Area unit
                </label>
                <select
                  id="areaUnit"
                  name="areaUnit"
                  className="form-select"
                  value={form.areaUnit}
                  onChange={updateForm}
                >
                  <option value="acre">Acre</option>
                  <option value="hectare">Hectare</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="soilType">
                  Soil type
                </label>
                <select
                  id="soilType"
                  name="soilType"
                  className="form-select"
                  value={form.soilType}
                  onChange={updateForm}
                >
                  {["Clay", "Sandy", "Silt", "Loamy", "Black", "Red", "Other"].map(
                    (soil) => (
                      <option key={soil} value={soil}>
                        {soil}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="cropsGrown">
                  Crops grown
                </label>
                <input
                  id="cropsGrown"
                  name="cropsGrown"
                  className="form-control"
                  placeholder="Wheat, Soybean, Maize"
                  value={form.cropsGrown}
                  onChange={updateForm}
                />
                <small className="text-secondary">
                  Separate crop names with commas.
                </small>
              </div>

              <div className="col-md-6">
                <label className="form-label" htmlFor="irrigationType">
                  Irrigation type
                </label>
                <select
                  id="irrigationType"
                  name="irrigationType"
                  className="form-select"
                  value={form.irrigationType}
                  onChange={updateForm}
                >
                  {["Rainfed", "Canal", "Borewell", "Drip", "Sprinkler", "Other"].map(
                    (type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="notes">
                  Additional notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  className="form-control"
                  rows={3}
                  maxLength={1000}
                  value={form.notes}
                  onChange={updateForm}
                />
              </div>

              <div className="col-12 d-flex gap-2 flex-wrap">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Farm"
                    : "Add Farm"}
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
            </div>
          </form>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">Your Farms</h3>
        <button
          className="btn btn-outline-success btn-sm"
          onClick={loadFarms}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p>Loading farm profiles...</p>
      ) : farms.length === 0 ? (
        <div className="alert alert-info">
          No farms found. Use the form above to add your first farm.
        </div>
      ) : (
        <div className="row g-4">
          {farms.map((farm) => (
            <div className="col-md-6 col-lg-4" key={farm._id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="fw-bold">{farm.farmName}</h5>
                  <p className="text-secondary mb-2">
                    <i className="bi bi-geo-alt me-2" />
                    {farm.location}
                  </p>
                  <p className="mb-2">
                    <strong>Area:</strong> {farm.area} {farm.areaUnit}
                  </p>
                  <p className="mb-2">
                    <strong>Soil:</strong> {farm.soilType}
                  </p>
                  <p className="mb-2">
                    <strong>Crops:</strong>{" "}
                    {farm.cropsGrown?.length
                      ? farm.cropsGrown.join(", ")
                      : "Not specified"}
                  </p>
                  <p className="mb-3">
                    <strong>Irrigation:</strong> {farm.irrigationType}
                  </p>
                  {farm.notes && (
                    <p className="text-secondary">{farm.notes}</p>
                  )}

                  <div className="d-flex gap-2 mt-3">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => startEditing(farm)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(farm)}
                    >
                      Delete
                    </button>
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
