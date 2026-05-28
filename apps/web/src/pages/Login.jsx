import { LogIn } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Button from "../components/Button.jsx";
import { getNextRoute } from "../utils/routes.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const user = await login(form);
      const fallback = getNextRoute(user);
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-black">Welcome back</h2>
      <p className="mt-2 text-sm text-bean-muted">Sign in to continue to your support space.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">Email</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={update}
            className="mt-2 w-full rounded-md border border-bean-sage/40 bg-white px-3 py-3 outline-none focus:border-bean-teal focus:ring-2 focus:ring-bean-teal/20"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Password</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            className="mt-2 w-full rounded-md border border-bean-sage/40 bg-white px-3 py-3 outline-none focus:border-bean-teal focus:ring-2 focus:ring-bean-teal/20"
            required
          />
        </label>

        {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          <LogIn className="h-4 w-4" />
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-bean-muted">
        New here?{" "}
        <Link to="/signup" className="font-bold text-bean-teal hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
