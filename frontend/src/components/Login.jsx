import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    // Small timeout to give a smooth feel
    setTimeout(() => {
      const result = login(username.trim(), password);
      if (!result.success) {
        setError(result.error);
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1a6b2f 0%, #2d8a45 50%, #1a6b2f 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-sm-8 col-md-6 col-lg-4">
            {/* Logo / Title */}
            <div className="text-center mb-4">
              <div style={{ fontSize: "3.5rem" }}>🌾</div>
              <h2 className="text-white fw-bold mb-1">Smart Village</h2>
              <p className="text-white-50">Tadipatri Constituency Dashboard</p>
            </div>

            {/* Login Card */}
            <div className="card shadow-lg border-0" style={{ borderRadius: "16px" }}>
              <div className="card-body p-4">
                <h5 className="card-title fw-bold text-center mb-4 text-success">
                  🔐 Sign In
                </h5>

                {error && (
                  <div className="alert alert-danger py-2 text-center" role="alert">
                    ❌ {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Username</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">👤</span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">🔒</span>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                      >
                        {showPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100 fw-bold py-2"
                    disabled={loading}
                    style={{ borderRadius: "8px" }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In →"
                    )}
                  </button>
                </form>
              </div>
            </div>

            <p className="text-center text-white-50 mt-4 small">
              © 2026 Smart Village | Built for rural development
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;