import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to log in. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-wrap container py-5">
      <div className="auth-card mx-auto">
        <div className="text-center mb-4"><div className="auth-icon"><i className="bi bi-person-check" /></div><h2 className="fw-bold mt-3">Welcome back</h2><p className="text-secondary">Log in to your AgriTech account.</p></div>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <label className="form-label" htmlFor="email">Email address</label>
          <input id="email" className="form-control form-control-lg mb-3" type="email" name="email" value={form.email} onChange={update} autoComplete="email" required />
          <label className="form-label" htmlFor="password">Password</label>
          <input id="password" className="form-control form-control-lg mb-4" type="password" name="password" value={form.password} onChange={update} autoComplete="current-password" required />
          <button className="btn btn-success btn-lg w-100" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
        </form>
        <p className="text-center mt-4 mb-0 text-secondary">New to AgriTech? <Link to="/register">Create an account</Link></p>
      </div>
    </main>
  );
}
