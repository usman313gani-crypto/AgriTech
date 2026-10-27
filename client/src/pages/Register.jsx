import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", password: "", role: "farmer" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create account. Check that the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-wrap container py-5">
      <div className="auth-card mx-auto">
        <div className="text-center mb-4"><div className="auth-icon"><i className="bi bi-person-plus" /></div><h2 className="fw-bold mt-3">Join AgriTech</h2><p className="text-secondary">Create your account to get started.</p></div>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        <form onSubmit={submit}>
          <label className="form-label" htmlFor="name">Full name *</label>
          <input id="name" className="form-control mb-3" name="name" value={form.name} onChange={update} autoComplete="name" required />
          <label className="form-label" htmlFor="reg-email">Email address *</label>
          <input id="reg-email" className="form-control mb-3" type="email" name="email" value={form.email} onChange={update} autoComplete="email" required />
          <div className="row">
            <div className="col-sm-6"><label className="form-label" htmlFor="phone">Phone</label><input id="phone" className="form-control mb-3" name="phone" value={form.phone} onChange={update} autoComplete="tel" /></div>
            <div className="col-sm-6"><label className="form-label" htmlFor="role">I am a</label><select id="role" className="form-select mb-3" name="role" value={form.role} onChange={update}><option value="farmer">Farmer</option><option value="buyer">Buyer</option></select></div>
          </div>
          <label className="form-label" htmlFor="address">Address / location</label>
          <input id="address" className="form-control mb-3" name="address" value={form.address} onChange={update} autoComplete="street-address" />
          <label className="form-label" htmlFor="reg-password">Password * (minimum 8 characters)</label>
          <input id="reg-password" className="form-control mb-4" type="password" name="password" value={form.password} onChange={update} autoComplete="new-password" minLength="8" required />
          <button className="btn btn-success btn-lg w-100" disabled={loading}>{loading ? "Creating account..." : "Create account"}</button>
        </form>
        <p className="text-center mt-4 mb-0 text-secondary">Already registered? <Link to="/login">Log in</Link></p>
      </div>
    </main>
  );
}
