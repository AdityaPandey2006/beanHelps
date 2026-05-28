import { UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import Button from "../components/Button.jsx";
import { getNextRoute } from "../utils/routes.js";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "beaner",
  });
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
      const user = await signup(form);
      navigate(getNextRoute(user), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-black">Create your account</h2>
      <p className="mt-2 text-sm text-bean-muted">Choose how you will participate in beanHelps.</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold">Name</span>
          <input
            name="name"
            value={form.name}
            onChange={update}
            className="mt-2 w-full rounded-md border border-bean-sage/40 bg-white px-3 py-3 outline-none focus:border-bean-teal focus:ring-2 focus:ring-bean-teal/20"
            required
          />
        </label>
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
            minLength={6}
            required
          />
        </label>

        <div>
          <span className="text-sm font-semibold">Role</span>
          <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-bean-mist p-1">
            {[
              ["beaner", "Beaner"],
              ["beanpist", "Beanpist"],
            ].map(([value, label]) => (
              <label
                key={value}
                className={`cursor-pointer rounded-md px-3 py-3 text-center text-sm font-bold transition ${
                  form.role === value ? "bg-white text-bean-teal shadow-sm" : "text-bean-muted"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={form.role === value}
                  onChange={update}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          <UserPlus className="h-4 w-4" />
          {submitting ? "Creating..." : "Create account"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-bean-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-bold text-bean-teal hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
