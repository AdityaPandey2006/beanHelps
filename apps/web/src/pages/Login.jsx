// this is the actual login page setup
import { useState } from "react";
//used to continuously update parameters, as the email is typed, 
// the email parameter will be updated with each stroke

import { Link, useNavigate } from "react-router-dom";
// Link allows you to go from one page tp another without 
// refreshing by manual clicking
// useNavigate allows you to go from one page tp another without 
// refreshing rogrammatically(for example dashboard page 
// opened after login complete)

import AuthLayout from "../layouts/AuthLayout";
import { api } from "../api/client";

import { getNextRoute } from "../utils/getNextRoute";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
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
      const response = await api.post("/auth/login", form);
      localStorage.setItem("beanhelps_token", response.data.token);

      const me = await api.get("/auth/me");
      navigate(getNextRoute(me.data.user));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue your support journey."
    >
      <form className="form-stack" onSubmit={handleSubmit}>
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

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit">Log in</button>

        <p className="form-note">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;