import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        username: formData.name,
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };

      console.log("Register Payload:", payload);

      const response = await axios.post(
        `${API_URL}/api/auth/register`,
        payload
      );

      console.log("Register Response:", response.data);

      setSuccess("Registration successful. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      console.error("Register error:", error);

      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Account</h2>

        {error && (
          <p
            style={{
              color: "red",
              marginBottom: "10px",
            }}
          >
            {error}
          </p>
        )}

        {success && (
          <p
            style={{
              color: "green",
              marginBottom: "10px",
            }}
          >
            {success}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>

            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p style={{ marginTop: "15px" }}>
          Already have an account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
