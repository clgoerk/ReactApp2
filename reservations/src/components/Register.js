// src/components/Register.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function Register() {
  const [userName, setUserName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");     // default role
  const [secretKey, setSecretKey] = useState(""); // only used when role === "admin"

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // quick client-side checks
    if (!userName.trim() || !emailAddress.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (role === "admin" && !secretKey.trim()) {
      setError("Admin secret is required for the Admin role.");
      return;
    }

    try {
      setSubmitting(true);

      // build payload like the blog app (include secretKey only for admin)
      const payload = {
        userName: userName.trim(),
        emailAddress: emailAddress.trim(),
        password,
        role,
        ...(role === "admin" ? { secretKey } : {})
      };

      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/register.php`,
        payload,
        { withCredentials: true }
      );

      if (res.data?.success) {
        setSuccess("Registration successful. Redirecting to login…");
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setError(res.data?.message || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setError("Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "480px" }}>
      <h2 className="mb-3">Register</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label className="form-label">Username</label>
          <input
            type="text"
            className="form-control"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            autoComplete="username"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            className="form-control"
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            autoComplete="email"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <small className="text-muted">Minimum 6 characters.</small>
        </div>

        <div className="mb-3">
          <label className="form-label">Role</label>
          <select
            className="form-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="guest">Guest</option>
          </select>
        </div>

        {role === "admin" && (
          <div className="mb-3">
            <label className="form-label">Admin Secret</label>
            <input
              type="password"
              className="form-control"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter admin secret"
              required
            />
          </div>
        )}

        <button className="btn btn-success w-100" type="submit" disabled={submitting}>
          {submitting ? "Registering..." : "Register"}
        </button>
      </form>

      <p className="mt-3 text-center">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;