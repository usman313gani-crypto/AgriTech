
import { useMemo, useState } from "react";

const crops = [
  {
    id: 1,
    name: "Wheat",
    hindi: "गेहूँ",
    category: "Cereal",
    season: "Rabi",
    duration: "Usually 4–5 months",
    soil: "Well-drained loamy soil",
    water: "Manage irrigation according to soil moisture and crop stage. Avoid waterlogging.",
    sowing: "Wheat is generally grown in the Rabi season in central India. Follow local agricultural recommendations for sowing dates and varieties.",
    care: "Prepare a suitable seedbed, manage weeds, and use regionally recommended nutrient practices.",
  },
  {
    id: 2,
    name: "Soybean",
    hindi: "सोयाबीन",
    category: "Oilseed",
    season: "Kharif",
    duration: "Usually 3–4 months",
    soil: "Well-drained loamy soil",
    water: "Avoid waterlogging and monitor soil moisture during dry periods.",
    sowing: "Soybean is commonly grown during the monsoon season. Sowing depends on rainfall, soil moisture, and local recommendations.",
    care: "Use suitable seed varieties, maintain drainage, and monitor weeds, pests, and diseases.",
  },
  {
    id: 3,
    name: "Rice",
    hindi: "धान",
    category: "Cereal",
    season: "Usually Kharif",
    duration: "Varies by variety",
    soil: "Suitable clay loam or other rice-growing soils",
    water: "Water needs depend on soil, variety, growing method, and crop stage.",
    sowing: "Planting dates and direct-seeding or transplanting methods depend on local climate and water availability.",
    care: "Manage weeds and water levels, and monitor regularly for pests and diseases.",
  },
  {
    id: 4,
    name: "Maize",
    hindi: "मक्का",
    category: "Cereal",
    season: "Often Kharif; varies by region",
    duration: "Usually 3–4 months",
    soil: "Fertile, well-drained soil",
    water: "Pay attention to soil moisture, particularly during flowering and grain formation.",
    sowing: "Choose a suitable variety and sowing time according to local climate and agricultural guidance.",
    care: "Maintain suitable spacing, manage weeds, and inspect plants for pests and diseases.",
  },
  {
    id: 5,
    name: "Cotton",
    hindi: "कपास",
    category: "Fibre crop",
    season: "Commonly Kharif",
    duration: "Several months; variety dependent",
    soil: "Suitable, well-drained soil",
    water: "Avoid waterlogging and manage moisture according to crop stage.",
    sowing: "Sowing dates depend on rainfall, irrigation, variety, and regional recommendations.",
    care: "Scout for pests regularly and follow locally recommended integrated pest-management guidance.",
  },
  {
    id: 6,
    name: "Chickpea",
    hindi: "चना",
    category: "Pulse",
    season: "Rabi",
    duration: "Usually 3–4 months",
    soil: "Well-drained loamy soil",
    water: "Avoid excessive irrigation; actual requirements depend on soil and rainfall.",
    sowing: "Chickpea is commonly grown in the Rabi season. Follow local recommendations for varieties and sowing dates.",
    care: "Monitor for pod borer and diseases, and follow recommended crop rotation and nutrient practices.",
  },
];

const categories = ["All", "Cereal", "Oilseed", "Pulse", "Fibre crop"];

export default function CropResources() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedCrop, setSelectedCrop] = useState(null);

  const filteredCrops = useMemo(() => {
    const query = search.trim().toLowerCase();

    return crops.filter((crop) => {
      const matchesSearch =
        crop.name.toLowerCase().includes(query) ||
        crop.hindi.includes(search.trim());

      const matchesCategory =
        category === "All" || crop.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <main className="container py-5">
      <div className="mb-4">
        <p className="section-kicker mb-1">LEARN AND GROW</p>
        <h1 className="fw-bold">Crop Resources</h1>
        <p className="text-secondary">
          Search crop guides, growing seasons, soil requirements, irrigation,
          and general crop-care information.
        </p>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <label htmlFor="cropSearch" className="form-label fw-semibold">
            Search crops
          </label>
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-search" />
            </span>
            <input
              id="cropSearch"
              type="search"
              className="form-control"
              placeholder="Search Wheat, Soybean, Rice..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="col-md-6">
          <label htmlFor="cropCategory" className="form-label fw-semibold">
            Crop category
          </label>
          <select
            id="cropCategory"
            className="form-select"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All categories" : item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-bold mb-0">Explore crops</h5>
        <span className="text-secondary small">
          {filteredCrops.length} result(s)
        </span>
      </div>

      <div className="row g-4">
        {filteredCrops.map((crop) => (
          <div className="col-md-6 col-xl-4" key={crop.id}>
            <article className="card h-100 border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <span className="rounded-3 p-3 bg-success-subtle text-success">
                    <i className="bi bi-flower1 fs-3" />
                  </span>
                  <span className="badge text-bg-light border">
                    {crop.category}
                  </span>
                </div>

                <h4 className="fw-bold mt-3 mb-1">{crop.name}</h4>
                <p className="text-secondary">{crop.hindi}</p>

                <p className="mb-2">
                  <i className="bi bi-calendar3 me-2 text-success" />
                  <strong>Season:</strong> {crop.season}
                </p>
                <p className="mb-2">
                  <i className="bi bi-hourglass-split me-2 text-success" />
                  <strong>Duration:</strong> {crop.duration}
                </p>
                <p className="text-secondary small mb-4">
                  <i className="bi bi-tree me-2" />
                  {crop.soil}
                </p>

                <button
                  type="button"
                  className="btn btn-outline-success w-100"
                  onClick={() => setSelectedCrop(crop)}
                >
                  View growing guide
                  <i className="bi bi-arrow-right ms-2" />
                </button>
              </div>
            </article>
          </div>
        ))}

        {filteredCrops.length === 0 && (
          <div className="col-12">
            <div className="text-center py-5 border rounded-3">
              <i className="bi bi-search fs-1 text-secondary" />
              <h5 className="mt-3">No crops found</h5>
              <p className="text-secondary">
                Try another name or change the category.
              </p>
              <button
                type="button"
                className="btn btn-success"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
              >
                Clear filters
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedCrop && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cropGuideTitle"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCrop(null);
            }
          }}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
            role="document"
          >
            <div className="modal-content border-0 shadow">
              <div className="modal-header">
                <div>
                  <p className="section-kicker mb-1">GROWING GUIDE</p>
                  <h4 id="cropGuideTitle" className="modal-title fw-bold">
                    {selectedCrop.name} ({selectedCrop.hindi})
                  </h4>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setSelectedCrop(null)}
                />
              </div>

              <div className="modal-body p-4">
                <h6 className="fw-bold">Growing season and duration</h6>
                <p>{selectedCrop.season} · {selectedCrop.duration}</p>

                <h6 className="fw-bold">Soil requirements</h6>
                <p>{selectedCrop.soil}</p>

                <h6 className="fw-bold">Irrigation</h6>
                <p>{selectedCrop.water}</p>

                <h6 className="fw-bold">Sowing guidance</h6>
                <p>{selectedCrop.sowing}</p>

                <h6 className="fw-bold">Crop care</h6>
                <p>{selectedCrop.care}</p>

                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2" />
                  This is general starter information, not a farm-specific
                  recommendation. Confirm local sowing dates, fertilizer
                  rates, and crop-protection advice with your local
                  agricultural extension service or ICAR/KVK.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => setSelectedCrop(null)}
                >
                  Close guide
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
