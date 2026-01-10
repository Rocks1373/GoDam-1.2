import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/authContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { login, isAuthenticated, error: authError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(username, password);
      navigate("/dashboard");
    } catch {
      // Error is handled by auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <div className="brand-mark">Go</div>
            <div className="brand-text">
              <div className="brand-title">GoDam 1.2</div>
              <div className="brand-subtitle">Warehouse Admin</div>
            </div>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          {authError && <div className="error-message">{authError}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-footer">
          <p>Demo credentials: admin / admin</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
