
import { useEffect, useState } from "react";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather";

function Weather() {
    const [city, setCity] = useState("");
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [locationMessage, setLocationMessage] = useState(
        "Detecting your location..."
    );

    const fetchWeather = async (params) => {
        if (!API_KEY) {
            setError(
                "OpenWeatherMap API key is missing. Add VITE_OPENWEATHER_API_KEY to client/.env and restart Vite."
            );
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const query = new URLSearchParams({
                ...params,
                appid: API_KEY,
                units: "metric",
            });

            const response = await fetch(`${WEATHER_URL}?${query}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to fetch weather data."
                );
            }

            setWeather(data);
            setLocationMessage("Weather loaded successfully.");
        } catch (err) {
            setWeather(null);
            setError(
                err.message || "Could not connect to the weather service."
            );
            setLocationMessage("");
        } finally {
            setLoading(false);
        }
    };

    const detectLocation = () => {
        setError("");
        setLocationMessage("");

        if (!navigator.geolocation) {
            setError("Your browser does not support location detection.");
            return;
        }

        setLoading(true);
        setLocationMessage("Requesting your location...");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocationMessage("Fetching weather for your location...");
                fetchWeather({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
            },
            (geoError) => {
                setLoading(false);

                const messages = {
                    1: "Location permission was denied. Search for a city instead.",
                    2: "Your location is unavailable. Please search for a city.",
                    3: "Location request timed out. Please try again.",
                };

                setLocationMessage("");
                setError(
                    messages[geoError.code] ||
                    "Could not detect your location."
                );
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000,
            }
        );
    };

    useEffect(() => {
        detectLocation();
    }, []);

    const handleSearch = (event) => {
        event.preventDefault();

        const searchedCity = city.trim();

        if (!searchedCity) {
            setError("Please enter a city name.");
            return;
        }

        fetchWeather({ q: searchedCity });
    };

    const iconUrl = weather?.weather?.[0]?.icon
        ? `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`
        : "";

    return (
        <div className="container py-4">
            <div className="mb-4">
                <h2>Weather Forecast</h2>
                <p className="text-muted">
                    Check current weather conditions for your location or any
                    city to help plan farming activities.
                </p>
            </div>

            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <form onSubmit={handleSearch}>
                        <label className="form-label" htmlFor="weather-city">
                            Search by city
                        </label>

                        <div className="input-group">
                            <input
                                id="weather-city"
                                className="form-control"
                                type="text"
                                placeholder="Enter city, e.g. Indore"
                                value={city}
                                onChange={(event) => setCity(event.target.value)}
                            />

                            <button
                                className="btn btn-success"
                                type="submit"
                                disabled={loading}
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    <button
                        type="button"
                        className="btn btn-outline-success mt-3"
                        onClick={detectLocation}
                        disabled={loading}
                    >
                        Use My Current Location
                    </button>
                </div>
            </div>

            {locationMessage && (
                <p className="text-muted">{locationMessage}</p>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {loading && (
                <div className="text-center py-4">
                    <div
                        className="spinner-border text-success"
                        role="status"
                    >
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Fetching weather data...</p>
                </div>
            )}

            {weather && !loading && (
                <>
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-body p-4">
                            <p className="text-muted mb-1">
                                {weather.name}
                                {weather.sys?.country
                                    ? `, ${weather.sys.country}`
                                    : ""}
                            </p>

                            <div className="d-flex align-items-center flex-wrap gap-3">
                                {iconUrl && (
                                    <img
                                        src={iconUrl}
                                        alt={weather.weather?.[0]?.description || "Weather"}
                                        width="100"
                                        height="100"
                                    />
                                )}

                                <div>
                                    <h1 className="display-3 mb-0">
                                        {Math.round(weather.main.temp)}°C
                                    </h1>
                                    <h5 className="text-capitalize">
                                        {weather.weather?.[0]?.description}
                                    </h5>
                                    <p className="text-muted mb-0">
                                        Feels like{" "}
                                        {Math.round(weather.main.feels_like)}°C
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="row g-3">
                        <div className="col-6 col-lg-3">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <p className="text-muted">Humidity</p>
                                    <h4>💧 {weather.main.humidity}%</h4>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-lg-3">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <p className="text-muted">Wind speed</p>
                                    <h4>💨 {weather.wind.speed} m/s</h4>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-lg-3">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <p className="text-muted">Pressure</p>
                                    <h4>🌡️ {weather.main.pressure} hPa</h4>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-lg-3">
                            <div className="card h-100 shadow-sm">
                                <div className="card-body">
                                    <p className="text-muted">Cloudiness</p>
                                    <h4>☁️ {weather.clouds.all}%</h4>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-muted small mt-3">
                        Data provided by OpenWeatherMap. Weather conditions
                        may change.
                    </p>
                </>
            )}
        </div>
    );
}

export default Weather;
