
import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./context/AuthContext";
import FarmManagement from "./pages/FarmManagement";
import CropMonitoring from "./pages/CropMonitoring";
import Weather from "./pages/Weather";
import CropResources from "./pages/CropResources";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import Products from "./pages/Products";
import AdminProducts from "./pages/AdminProducts";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import MyOrders from "./pages/MyOrders";
import OrderConfirmation from "./pages/OrderConfirmation";
import AdminOrders from "./pages/AdminOrders";
function PublicOnly({ children }) {
  const { isAuthenticated } = useAuth();

  return isAuthenticated
    ? <Navigate to="/dashboard" replace />
    : children;
}

function DashboardEntry() {
  const { user } = useAuth();

  return user?.role === "admin"
    ? <Navigate to="/admin" replace />
    : <Dashboard />;
}

function AdminOnly({ children }) {
  const { user, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return <div className="container py-5">Checking your session...</div>;
  }

  return user?.role === "admin"
    ? children
    : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={<PublicOnly><Login /></PublicOnly>}
        />

        <Route
          path="/register"
          element={<PublicOnly><Register /></PublicOnly>}
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardEntry />} />
          <Route path="/farms" element={<FarmManagement />} />
          <Route path="/crop-monitoring" element={<CropMonitoring />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/crop-resources" element={<CropResources />} />
          <Route path="/products" element={<Products />} />

          <Route path="/admin" element={<AdminOnly><AdminDashboard /></AdminOnly>} />
          <Route path="/admin/users" element={<AdminOnly><AdminUsers /></AdminOnly>} />
          <Route path="/admin/products" element={<AdminOnly><AdminProducts /></AdminOnly>} />

          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route
            path="/order-confirmation/:id"
            element={<OrderConfirmation />}
          />

          <Route path="/admin/orders" element={<AdminOrders />} />
        </Route>

        <Route
          path="*"
          element={
            <main className="container py-5 text-center">
              <h2>Page not found</h2>
              <a href="/">Return home</a>
            </main>
          }
        />
      </Routes>

      <footer className="app-footer">
        <div className="container d-flex flex-wrap justify-content-between gap-2">
          <span>© {new Date().getFullYear()} AgriTech</span>
          <span>Empowering Farmers Through Digital Technology</span>
        </div>
      </footer>
    </div>
  );
}
