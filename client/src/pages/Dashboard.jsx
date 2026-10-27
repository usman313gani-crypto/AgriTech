
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

const cards = [
  {
    icon: "bi-flower2",
    title: "Crop resources",
    text: "Explore crop guides, growing seasons, soil requirements, and crop care.",
    status: "Growing guides available",
    path: "/crop-resources",
    buttonText: "Explore resources",
  },
  {
    icon: "bi-shop",
    title: "Products",
    text: "Browse agricultural products, including seeds, fertilizers, and farming essentials.",
    status: "Browse available products",
    path: "/products",
    buttonText: "Browse products",
  },
];

export default function Dashboard() {
  const { user } = useAuth();

  const [profile, setProfile] = useState(user);
  const [message, setMessage] = useState("");

  const [summary, setSummary] = useState({
    totalFarms: 0,
    totalCropRecords: 0,
  });
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState("");

  // Load the logged-in user's profile.
  useEffect(() => {
    let active = true;

    api
      .get("/users/me")
      .then((response) => {
        if (active) {
          setProfile(response.data.user);
        }
      })
      .catch((error) => {
        if (active) {
          setMessage(
            error.response?.data?.message ||
              "Could not load profile from API."
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Load farm and crop-monitoring statistics.
  useEffect(() => {
    let active = true;

    const fetchSummary = async () => {
      try {
        setSummaryLoading(true);
        setSummaryError("");

        const response = await api.get("/dashboard/summary");

        if (active && response.data.success) {
          setSummary(response.data.summary);
        }
      } catch (error) {
        if (active) {
          setSummaryError(
            error.response?.data?.message ||
              "Unable to load dashboard statistics."
          );
        }
      } finally {
        if (active) {
          setSummaryLoading(false);
        }
      }
    };

    fetchSummary();

    return () => {
      active = false;
    };
  }, []);

  // Load current weather using the browser's location.
  useEffect(() => {
    let active = true;

    const loadWeather = async (latitude, longitude) => {
      try {
        const params = new URLSearchParams({
          lat: latitude,
          lon: longitude,
          appid: API_KEY,
          units: "metric",
        });

        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?${params}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            response.status === 401
              ? "Invalid OpenWeatherMap API key. Check client/.env."
              : data.message || "Could not load weather."
          );
        }

        if (active) {
          setWeather(data);
          setWeatherError("");
        }
      } catch (error) {
        if (active) {
          setWeatherError(
            error.message || "Could not load current weather."
          );
        }
      } finally {
        if (active) {
          setWeatherLoading(false);
        }
      }
    };

    if (!API_KEY) {
      setWeatherError(
        "Add VITE_OPENWEATHER_API_KEY to client/.env."
      );
      setWeatherLoading(false);

      return () => {
        active = false;
      };
    }

    if (!navigator.geolocation) {
      setWeatherError(
        "Location detection is unavailable. Open the Weather page to search for a city."
      );
      setWeatherLoading(false);

      return () => {
        active = false;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (active) {
          loadWeather(
            position.coords.latitude,
            position.coords.longitude
          );
        }
      },
      () => {
        if (active) {
          setWeatherError(
            "Allow location access to show your local weather, or use the Weather page to search for a city."
          );
          setWeatherLoading(false);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="container py-5">
      {/* Dashboard heading */}
      <div className="dashboard-heading d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <p className="section-kicker mb-1">YOUR WORKSPACE</p>

          <h1 className="fw-bold mb-1">
            Hello, {profile?.name || "there"} 👋
          </h1>

          <p className="text-secondary mb-0">
            Welcome to your AgriTech dashboard.
          </p>
        </div>

        <span className="role-pill">
          <i className="bi bi-person-badge me-2" />
          {profile?.role || "member"}
        </span>
      </div>

      {message && (
        <div className="alert alert-warning" role="alert">
          {message}
        </div>
      )}

      {/* Farm and crop statistics */}
      {summaryError && (
        <div className="alert alert-warning" role="alert">
          {summaryError}
        </div>
      )}

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="stat-card h-100">
            <span className="stat-icon">
              <i className="bi bi-house-door" />
            </span>

            <div>
              <small>Total farms</small>

              <h3 className="fw-bold mb-1">
                {summaryLoading ? "..." : summary.totalFarms}
              </h3>

              <Link
                to="/farms"
                className="small text-success text-decoration-none"
              >
                Manage your farms
                <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="stat-card h-100">
            <span className="stat-icon">
              <i className="bi bi-clipboard-data" />
            </span>

            <div>
              <small>Crop records</small>

              <h3 className="fw-bold mb-1">
                {summaryLoading ? "..." : summary.totalCropRecords}
              </h3>

              <Link
                to="/crop-monitoring"
                className="small text-success text-decoration-none"
              >
                View crop monitoring
                <i className="bi bi-arrow-right ms-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Existing profile statistics */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="stat-card h-100">
            <span className="stat-icon">
              <i className="bi bi-person-check" />
            </span>

            <div>
              <small>Account status</small>
              <h5 className="mb-0">Active</h5>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stat-card h-100">
            <span className="stat-icon">
              <i className="bi bi-geo-alt" />
            </span>

            <div>
              <small>Farm location</small>
              <h5 className="mb-0">
                {profile?.address || "Not added yet"}
              </h5>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="stat-card h-100">
            <span className="stat-icon">
              <i className="bi bi-envelope" />
            </span>

            <div>
              <small>Registered email</small>
              <h6 className="mb-0 text-break">
                {profile?.email || "Not available"}
              </h6>
            </div>
          </div>
        </div>
      </div>

      {/* Agriculture tools */}
      <h3 className="fw-bold mb-3">Agriculture tools</h3>

      <div className="row g-4">
        {/* Live weather */}
        <div className="col-md-4">
          <div className="tool-card h-100">
            <div className="feature-icon">
              <i className="bi bi-cloud-sun" />
            </div>

            <h5 className="fw-bold mt-3">Weather</h5>

            {weatherLoading ? (
              <div className="py-3">
                <div
                  className="spinner-border spinner-border-sm text-success me-2"
                  role="status"
                  aria-label="Loading weather"
                />
                Loading current weather...
              </div>
            ) : weather ? (
              <>
                <div className="d-flex align-items-center gap-2">
                  <img
                    src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                    alt={weather.weather[0].description}
                    width="75"
                    height="75"
                  />

                  <div>
                    <h2 className="fw-bold mb-0">
                      {Math.round(weather.main.temp)}°C
                    </h2>

                    <span className="text-capitalize text-secondary">
                      {weather.weather[0].description}
                    </span>
                  </div>
                </div>

                <p className="mb-1">
                  <i className="bi bi-droplet me-2" />
                  Humidity: {weather.main.humidity}%
                </p>

                <p className="mb-2">
                  <i className="bi bi-wind me-2" />
                  Wind: {weather.wind.speed} m/s
                </p>

                <p className="small text-secondary">
                  <i className="bi bi-geo-alt me-1" />
                  {weather.name}
                  {weather.sys?.country
                    ? `, ${weather.sys.country}`
                    : ""}
                </p>
              </>
            ) : (
              <p className="text-secondary">
                {weatherError || "Weather data is unavailable."}
              </p>
            )}

            <Link
              className="btn btn-outline-success btn-sm mt-2"
              to="/weather"
            >
              Open Weather Page
            </Link>
          </div>
        </div>

        {/* Other dashboard cards */}
        {cards.map((card) => (
          <div className="col-md-4" key={card.title}>
            <div className="tool-card h-100">
              <div className="feature-icon">
                <i className={`bi ${card.icon}`} />
              </div>

              <h5 className="fw-bold mt-3">{card.title}</h5>

              <p className="text-secondary">{card.text}</p>

              <span className="small status-label">
                <i className="bi bi-info-circle me-1" />
                {card.status}
              </span>

              {card.path && (
                <div>
                  <Link
                    to={card.path}
                    className="btn btn-outline-success btn-sm mt-3"
                  >
                    {card.buttonText || "Explore"}
                    <i className="bi bi-arrow-right ms-2" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AgriTech tip */}
      <div className="notice-panel mt-4">
        <i className="bi bi-lightbulb me-2" />
        <strong>AgriTech tip:</strong> Check local weather before planning
        irrigation, spraying, or harvesting.
      </div>
    </main>
  );
}
