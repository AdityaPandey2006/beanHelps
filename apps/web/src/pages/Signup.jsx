import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { api } from "../api/client";

import { getNextRoute } from "../utils/getNextRoute";

const Signup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "beaner",
  });
  const [error, setError] = useState("");

  const updateField = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/signup", form);
      localStorage.setItem("beanhelps_token", response.data.token);

      const me = await api.get("/auth/me");
      navigate(getNextRoute(me.data.user));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Choose how you want to participate in beanHelps."
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <label>
          Name
          <input
            name="name"
            value={form.name}
            onChange={updateField}
            required
          />
        </label>

        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={updateField}
            required
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={updateField}
            required
          />
        </label>

        <label>
          I am joining as
          <select name="role" value={form.role} onChange={updateField}>
            <option value="beaner">Beaner - I want support</option>
            <option value="beanpist">Beanpist - I am a therapist</option>
          </select>
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit">Create account</button>

        <p className="form-note">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Signup;