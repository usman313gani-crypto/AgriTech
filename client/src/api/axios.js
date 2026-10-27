
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" }
});

// Attach the saved JWT to every API request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("agritech_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Clear the saved session when the backend rejects authentication.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("agritech_token");
      localStorage.removeItem("agritech_user");

      // Notify AuthContext so React state is cleared too.
      window.dispatchEvent(new Event("agritech:unauthorized"));
    }

    return Promise.reject(error);
  }
);

export default api;
