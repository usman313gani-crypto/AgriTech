
import { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const emptyForm = {
    farm: "",
    cropName: "",
    plantingDate: "",
    growthStage: "Planted",
    healthStatus: "Healthy",
    ph: "",
    moisture: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    notes: "",
};

const stages = [
    "Planted",
    "Germination",
    "Vegetative",
    "Flowering",
    "Harvesting",
];

const healthStatuses = ["Healthy", "Needs Attention", "Critical"];

function formatDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "Date unavailable"
        : date.toLocaleString();
}

function getHealthBadge(status) {
    switch (status) {
        case "Healthy":
            return "bg-success";
        case "Needs Attention":
            return "bg-warning text-dark";
        case "Critical":
            return "bg-danger";
        default:
            return "bg-secondary";
    }
}

function CropMonitoring() {
    const { user } = useAuth();

    const [farms, setFarms] = useState([]);
    const [records, setRecords] = useState([]);
    const [form, setForm] = useState({ ...emptyForm });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [expandedHistory, setExpandedHistory] = useState({});
    const [historyById, setHistoryById] = useState({});
    const [historyLoading, setHistoryLoading] = useState({});

    const loadData = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [farmResponse, recordResponse] = await Promise.all([
                api.get("/farms"),
                api.get("/crop-monitoring"),
            ]);

            const farmList = farmResponse.data.farms || [];
            const recordList = recordResponse.data.data || [];

            setFarms(farmList);
            setRecords(recordList);

            setForm((previous) => ({
                ...previous,
                farm: previous.farm || farmList[0]?._id || "",
            }));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Could not load farms or crop monitoring records."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((previous) => ({ ...previous, [name]: value }));
    };

    const resetForm = () => {
        setForm({ ...emptyForm, farm: farms[0]?._id || "" });
        setEditingId(null);
    };

    const loadHistory = async (recordId, forceRefresh = false) => {
        if (!forceRefresh && historyById[recordId]) return;

        setHistoryLoading((previous) => ({
            ...previous,
            [recordId]: true,
        }));

        try {
            const response = await api.get(
                `/crop-monitoring/${recordId}/history`
            );

            setHistoryById((previous) => ({
                ...previous,
                [recordId]: response.data.data?.history || [],
            }));
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Could not load crop monitoring history."
            );
        } finally {
            setHistoryLoading((previous) => ({
                ...previous,
                [recordId]: false,
            }));
        }
    };

    const toggleHistory = async (recordId) => {
        const willExpand = !expandedHistory[recordId];

        setExpandedHistory((previous) => ({
            ...previous,
            [recordId]: willExpand,
        }));

        if (willExpand) {
            await loadHistory(recordId);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!form.farm) {
            setError("Please create a farm before adding a crop record.");
            return;
        }

        const toNumberOrNull = (value) => {
            if (value === "" || value === null || value === undefined) {
                return null;
            }

            return Number(value);
        };

        const payload = {
            farm: form.farm,
            cropName: form.cropName.trim(),
            plantingDate: form.plantingDate,
            growthStage: form.growthStage,
            healthStatus: form.healthStatus,
            soilHealth: {
                ph: toNumberOrNull(form.ph),
                moisture: toNumberOrNull(form.moisture),
                nitrogen: toNumberOrNull(form.nitrogen),
                phosphorus: toNumberOrNull(form.phosphorus),
                potassium: toNumberOrNull(form.potassium),
            },
            notes: form.notes.trim(),
        };

        setSaving(true);

        try {
            let savedRecordId = editingId;

            if (editingId) {
                const response = await api.put(
                    `/crop-monitoring/${editingId}`,
                    payload
                );

                setMessage(
                    response.data.message ||
                        "Crop record updated successfully."
                );
            } else {
                const response = await api.post(
                    "/crop-monitoring",
                    payload
                );

                savedRecordId = response.data.data?._id;

                setMessage(
                    response.data.message ||
                        "Crop record created successfully."
                );
            }

            // Clear cached history so the next view fetches the latest data.
            if (savedRecordId) {
                setHistoryById((previous) => {
                    const updated = { ...previous };
                    delete updated[savedRecordId];
                    return updated;
                });
            }

            resetForm();
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Could not save the crop monitoring record."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (record) => {
        const soil = record.soilHealth || {};

        setForm({
            farm: record.farm?._id || record.farm || "",
            cropName: record.cropName || "",
            plantingDate: record.plantingDate
                ? new Date(record.plantingDate).toISOString().slice(0, 10)
                : "",
            growthStage: record.growthStage || "Planted",
            healthStatus: record.healthStatus || "Healthy",
            ph: soil.ph ?? "",
            moisture: soil.moisture ?? "",
            nitrogen: soil.nitrogen ?? "",
            phosphorus: soil.phosphorus ?? "",
            potassium: soil.potassium ?? "",
            notes: record.notes || "",
        });

        setEditingId(record._id);
        setError("");
        setMessage("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this crop monitoring record?")) return;

        setError("");
        setMessage("");

        try {
            await api.delete(`/crop-monitoring/${id}`);

            if (editingId === id) resetForm();

            setHistoryById((previous) => {
                const updated = { ...previous };
                delete updated[id];
                return updated;
            });

            setExpandedHistory((previous) => {
                const updated = { ...previous };
                delete updated[id];
                return updated;
            });

            setMessage("Crop monitoring record deleted successfully.");
            await loadData();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    "Could not delete the crop monitoring record."
            );
        }
    };

    if (user?.role !== "farmer") {
        return (
            <div className="container py-4">
                <div className="alert alert-warning">
                    Crop monitoring is available to farmer accounts.
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="mb-4">
                <h2>Crop Monitoring & Soil Health</h2>
                <p className="text-muted">
                    Track crop growth, crop health, soil measurements, and
                    monitoring history.
                </p>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                    <button
                        type="button"
                        className="btn-close float-end"
                        aria-label="Dismiss"
                        onClick={() => setError("")}
                    />
                </div>
            )}

            {message && (
                <div className="alert alert-success" role="status">
                    {message}
                </div>
            )}

            <div className="card shadow-sm mb-4">
                <div className="card-header">
                    <h5 className="mb-0">
                        {editingId ? "Edit Crop Record" : "Add Crop Record"}
                    </h5>
                </div>

                <div className="card-body">
                    {farms.length === 0 && !loading ? (
                        <div className="alert alert-info">
                            You need to create a farm first. Open Farm
                            Management to add one.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                <div className="col-md-6">
                                    <label className="form-label">Farm *</label>
                                    <select
                                        className="form-select"
                                        name="farm"
                                        value={form.farm}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">
                                            Select your farm
                                        </option>
                                        {farms.map((farm) => (
                                            <option
                                                key={farm._id}
                                                value={farm._id}
                                            >
                                                {farm.farmName} — {farm.location}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">
                                        Crop name *
                                    </label>
                                    <input
                                        className="form-control"
                                        name="cropName"
                                        value={form.cropName}
                                        onChange={handleChange}
                                        maxLength={80}
                                        placeholder="e.g. Wheat"
                                        required
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">
                                        Planting date *
                                    </label>
                                    <input
                                        className="form-control"
                                        type="date"
                                        name="plantingDate"
                                        value={form.plantingDate}
                                        onChange={handleChange}
                                        max={new Date()
                                            .toLocaleDateString("en-CA")}
                                        required
                                    />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">
                                        Growth stage
                                    </label>
                                    <select
                                        className="form-select"
                                        name="growthStage"
                                        value={form.growthStage}
                                        onChange={handleChange}
                                    >
                                        {stages.map((stage) => (
                                            <option key={stage} value={stage}>
                                                {stage}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label">
                                        Crop health
                                    </label>
                                    <select
                                        className="form-select"
                                        name="healthStatus"
                                        value={form.healthStatus}
                                        onChange={handleChange}
                                    >
                                        {healthStatuses.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <hr className="my-4" />
                            <h5>Soil Measurements</h5>
                            <p className="text-muted small">
                                Optional: enter measurements from your soil
                                tests. Moisture is a percentage; NPK values
                                should use the units on your test report.
                            </p>

                            <div className="row g-3">
                                <div className="col-md">
                                    <label className="form-label">
                                        Soil pH (0–14)
                                    </label>
                                    <input
                                        className="form-control"
                                        type="number"
                                        name="ph"
                                        min="0"
                                        max="14"
                                        step="0.1"
                                        value={form.ph}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="col-md">
                                    <label className="form-label">
                                        Moisture (%)
                                    </label>
                                    <input
                                        className="form-control"
                                        type="number"
                                        name="moisture"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={form.moisture}
                                        onChange={handleChange}
                                    />
                                </div>

                                {[
                                    ["nitrogen", "Nitrogen (N)"],
                                    ["phosphorus", "Phosphorus (P)"],
                                    ["potassium", "Potassium (K)"],
                                ].map(([name, label]) => (
                                    <div className="col-md" key={name}>
                                        <label className="form-label">
                                            {label}
                                        </label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            name={name}
                                            min="0"
                                            step="any"
                                            value={form[name]}
                                            onChange={handleChange}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3">
                                <label className="form-label">
                                    Observations / Notes
                                </label>
                                <textarea
                                    className="form-control"
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    rows="3"
                                    maxLength={1000}
                                    placeholder="Record visible crop conditions or other observations..."
                                />
                            </div>

                            <div className="d-flex gap-2 mt-4">
                                <button
                                    className="btn btn-success"
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                          ? "Update Record"
                                          : "Add Crop Record"}
                                </button>

                                {editingId && (
                                    <button
                                        className="btn btn-outline-secondary"
                                        type="button"
                                        onClick={resetForm}
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Your Crop Records</h4>
                <button
                    className="btn btn-outline-success btn-sm"
                    onClick={loadData}
                    disabled={loading}
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <p>Loading crop records...</p>
            ) : records.length === 0 ? (
                <div className="alert alert-light border">
                    No crop records yet. Add your first record using the form
                    above.
                </div>
            ) : (
                <div className="row g-3">
                    {records.map((record) => {
                        const history = historyById[record._id] || [];
                        const isHistoryExpanded =
                            Boolean(expandedHistory[record._id]);
                        const isHistoryLoading =
                            Boolean(historyLoading[record._id]);

                        return (
                            <div
                                className="col-md-6 col-xl-4"
                                key={record._id}
                            >
                                <div className="card h-100 shadow-sm">
                                    <div className="card-body">
                                        <h5>{record.cropName}</h5>
                                        <p className="text-muted mb-2">
                                            Farm:{" "}
                                            {record.farm?.farmName || "Farm"}
                                        </p>

                                        <p className="mb-1">
                                            <strong>Planted:</strong>{" "}
                                            {new Date(
                                                record.plantingDate
                                            ).toLocaleDateString()}
                                        </p>

                                        <p className="mb-1">
                                            <strong>Growth:</strong>{" "}
                                            {record.growthStage}
                                        </p>

                                        <p className="mb-3">
                                            <strong>Health:</strong>{" "}
                                            <span
                                                className={`badge ${getHealthBadge(record.healthStatus)}`}
                                            >
                                                {record.healthStatus}
                                            </span>
                                        </p>

                                        <hr />
                                        <h6>Soil measurements</h6>
                                        <p className="small mb-1">
                                            pH:{" "}
                                            {record.soilHealth?.ph ??
                                                "Not recorded"}{" "}
                                            · Moisture:{" "}
                                            {record.soilHealth?.moisture == null
                                                ? "Not recorded"
                                                : `${record.soilHealth.moisture}%`}
                                        </p>

                                        <p className="small mb-1">
                                            N:{" "}
                                            {record.soilHealth?.nitrogen ?? "—"}{" "}
                                            · P:{" "}
                                            {record.soilHealth?.phosphorus ??
                                                "—"}{" "}
                                            · K:{" "}
                                            {record.soilHealth?.potassium ?? "—"}
                                        </p>

                                        {record.notes && (
                                            <p className="mt-3 mb-0">
                                                <strong>Notes:</strong>{" "}
                                                {record.notes}
                                            </p>
                                        )}
                                    </div>

                                    <div className="card-footer bg-white">
                                        <div className="d-flex flex-wrap gap-2">
                                            <button
                                                className="btn btn-outline-primary btn-sm"
                                                onClick={() =>
                                                    handleEdit(record)
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() =>
                                                    handleDelete(record._id)
                                                }
                                            >
                                                Delete
                                            </button>

                                            <button
                                                className="btn btn-outline-success btn-sm"
                                                onClick={() =>
                                                    toggleHistory(record._id)
                                                }
                                                aria-expanded={isHistoryExpanded}
                                            >
                                                {isHistoryExpanded
                                                    ? "Hide History"
                                                    : "Monitoring History"}
                                            </button>
                                        </div>

                                        {isHistoryExpanded && (
                                            <div className="mt-3">
                                                <hr />
                                                <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                                                    <h6 className="mb-0">
                                                        Monitoring History
                                                    </h6>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() =>
                                                            loadHistory(
                                                                record._id,
                                                                true
                                                            )
                                                        }
                                                        disabled={
                                                            isHistoryLoading
                                                        }
                                                    >
                                                        Refresh
                                                    </button>
                                                </div>

                                                {isHistoryLoading ? (
                                                    <p className="small text-muted">
                                                        Loading history...
                                                    </p>
                                                ) : history.length === 0 ? (
                                                    <p className="small text-muted">
                                                        No history entries
                                                        available for this crop.
                                                    </p>
                                                ) : (
                                                    <div className="border-start border-2 ps-3">
                                                        {history.map((entry) => (
                                                            <div
                                                                className="mb-3"
                                                                key={entry._id}
                                                            >
                                                                <p className="small text-muted mb-2">
                                                                    {formatDate(
                                                                        entry.changedAt
                                                                    )}
                                                                </p>

                                                                <p className="mb-1">
                                                                    <strong>
                                                                        Health:
                                                                    </strong>{" "}
                                                                    {entry.healthStatus}
                                                                </p>

                                                                <p className="mb-1">
                                                                    <strong>
                                                                        Growth:
                                                                    </strong>{" "}
                                                                    {entry.growthStage}
                                                                </p>

                                                                {entry.changedFields
                                                                    ?.length > 0 && (
                                                                    <p className="small mb-2">
                                                                        <strong>
                                                                            Changed:
                                                                        </strong>{" "}
                                                                        {entry.changedFields.join(
                                                                            ", "
                                                                        )}
                                                                    </p>
                                                                )}

                                                                {entry.notes && (
                                                                    <p className="small mb-2">
                                                                        <strong>
                                                                            Notes:
                                                                        </strong>{" "}
                                                                        {entry.notes}
                                                                    </p>
                                                                )}

                                                                <p className="small mb-0">
                                                                    <strong>
                                                                        Soil:
                                                                    </strong>{" "}
                                                                    pH{" "}
                                                                    {entry.soilHealth?.ph ??
                                                                        "—"}
                                                                    {" · "}Moisture{" "}
                                                                    {entry.soilHealth
                                                                        ?.moisture ??
                                                                        "—"}
                                                                    {" · "}N{" "}
                                                                    {entry.soilHealth
                                                                        ?.nitrogen ??
                                                                        "—"}
                                                                    {" · "}P{" "}
                                                                    {entry.soilHealth
                                                                        ?.phosphorus ??
                                                                        "—"}
                                                                    {" · "}K{" "}
                                                                    {entry.soilHealth
                                                                        ?.potassium ??
                                                                        "—"}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default CropMonitoring;
