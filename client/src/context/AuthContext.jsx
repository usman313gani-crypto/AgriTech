
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("agritech_user") || "null");
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() =>
    localStorage.getItem("agritech_token")
  );

  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Keep React state synchronized when Axios detects a 401 response.
  useEffect(() => {
    function handleUnauthorized() {
      localStorage.removeItem("agritech_token");
      localStorage.removeItem("agritech_user");
      setToken(null);
      setUser(null);
    }

    window.addEventListener("agritech:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener(
        "agritech:unauthorized",
        handleUnauthorized
      );
    };
  }, []);

  // Validate a saved token against the backend when the app starts.
  useEffect(() => {
    let active = true;

    async function validateSession() {
      const savedToken = localStorage.getItem("agritech_token");

      if (!savedToken) {
        localStorage.removeItem("agritech_user");

        if (active) {
          setToken(null);
          setUser(null);
          setIsAuthLoading(false);
        }

        return;
      }

      try {
        const response = await api.get("/users/me", {
          headers: {
            Authorization: `Bearer ${savedToken}`
          }
        });

        if (!active) return;

        const freshUser = response.data.user;

        localStorage.setItem("agritech_user", JSON.stringify(freshUser));
        setToken(savedToken);
        setUser(freshUser);
      } catch (error) {
        if (!active) return;

        if (error.response?.status === 401) {
          // The Axios interceptor also clears the session.
          setToken(null);
          setUser(null);
        }

        // For network errors or server errors, preserve the cached
        // session so a temporary outage does not automatically log
        // the user out. Protected API requests may still fail.
      } finally {
        if (active) {
          setIsAuthLoading(false);
        }
      }
    }

    validateSession();

    return () => {
      active = false;
    };
  }, []);

  function saveSession(data) {
    localStorage.setItem("agritech_token", data.token);
    localStorage.setItem("agritech_user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);
    setIsAuthLoading(false);
  }

  async function register(formData) {
    const response = await api.post("/auth/register", formData);
    saveSession(response.data);
    return response.data;
  }

  async function login(formData) {
    const response = await api.post("/auth/login", formData);
    saveSession(response.data);
    return response.data;
  }

  function logout() {
    localStorage.removeItem("agritech_token");
    localStorage.removeItem("agritech_user");

    setToken(null);
    setUser(null);
    setIsAuthLoading(false);
  }

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthLoading,
      isAuthenticated: Boolean(token && user),
      register,
      login,
      logout
    }),
    [user, token, isAuthLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
