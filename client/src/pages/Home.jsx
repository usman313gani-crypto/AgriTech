import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const features = [
  { icon: "bi-cloud-sun", title: "Weather awareness", text: "A place to bring local weather information into farm planning." },
  { icon: "bi-flower2", title: "Crop guidance", text: "Organize crop information and practical growing resources." },
  { icon: "bi-shop", title: "Market connection", text: "Build a path for farmers and buyers to connect directly." }
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  return (
    <>
      <section className="hero-section">
        <div className="container py-5">
          <div className="row align-items-center g-4 py-lg-5">
            <div className="col-lg-7">
              <span className="eyebrow"><i className="bi bi-leaf me-2" />Technology for better farming</span>
              <h1 className="display-4 fw-bold mt-3">Empowering farmers through <span>digital technology.</span></h1>
              <p className="lead mt-3 mb-4">A digital starting point for farm information, crop resources, and a stronger agricultural community.</p>
              <div className="d-flex flex-wrap gap-3">
                <Link className="btn btn-success btn-lg" to={isAuthenticated ? "/dashboard" : "/register"}>{isAuthenticated ? "Open dashboard" : "Get started"} <i className="bi bi-arrow-right ms-2" /></Link>
                <a className="btn btn-outline-success btn-lg" href="#features">Explore features</a>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="hero-illustration">
                <div className="sun"><i className="bi bi-sun-fill" /></div>
                <div className="hill hill-one" />
                <div className="hill hill-two" />
                <div className="field-lines" />
                <div className="hero-caption"><i className="bi bi-check-circle-fill me-2" />A smarter future for agriculture</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section id="features" className="container py-5">
        <div className="text-center mb-4">
          <p className="section-kicker">WHAT WE'RE BUILDING</p>
          <h2 className="fw-bold">Tools designed around farmers</h2>
          <p className="text-secondary">These are starter feature areas for the project MVP.</p>
        </div>
        <div className="row g-4">
          {features.map((feature) => (
            <div className="col-md-4" key={feature.title}>
              <div className="feature-card h-100">
                <div className="feature-icon"><i className={`bi ${feature.icon}`} /></div>
                <h5 className="fw-bold mt-3">{feature.title}</h5>
                <p className="text-secondary mb-0">{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
