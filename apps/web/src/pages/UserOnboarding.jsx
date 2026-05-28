import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Button from "../components/Button.jsx";

const struggles = ["anxiety", "depression", "stress", "loneliness", "grief", "burnout"];
const optionalTags = ["panic", "overthinking", "exam anxiety", "work stress", "sleep", "relationships"];

export default function UserOnboarding() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    ageRange: "18-24",
    languages: "English",
    location: "",
    preferredGroupSize: "6-8",
    primaryStruggles: [],
    optionalTags: [],
    description: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggle = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await api("/users/onboarding", {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          languages: form.languages.split(",").map((item) => item.trim()).filter(Boolean),
        }),
      });
      setUser(data.user);
      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-white/80 bg-white/90 p-6 shadow-soft">
      <h1 className="text-3xl font-black">Set up your support profile</h1>
      <p className="mt-2 text-bean-muted">These choices help beanHelps recommend forums and match you with a support circle.</p>

      <form onSubmit={submit} className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="text-sm font-semibold">Age range</span>
            <select className="field" value={form.ageRange} onChange={(e) => setForm({ ...form, ageRange: e.target.value })}>
              {["13-17", "18-24", "25-34", "35-44", "45+"].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
          <label>
            <span className="text-sm font-semibold">Languages</span>
            <input className="field" value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
          </label>
          <label>
            <span className="text-sm font-semibold">Location</span>
            <input className="field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          </label>
          <label>
            <span className="text-sm font-semibold">Preferred group size</span>
            <select className="field" value={form.preferredGroupSize} onChange={(e) => setForm({ ...form, preferredGroupSize: e.target.value })}>
              {["6-8", "8-10", "small circle", "no preference"].map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
        </div>

        <Checklist title="Primary struggles" values={struggles} selected={form.primaryStruggles} onToggle={(value) => toggle("primaryStruggles", value)} />
        <Checklist title="Optional tags" values={optionalTags} selected={form.optionalTags} onToggle={(value) => toggle("optionalTags", value)} />

        <label className="block">
          <span className="text-sm font-semibold">What would you like support with?</span>
          <textarea className="field min-h-28" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} />
        </label>

        {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <Button type="submit" disabled={submitting}>
          <CheckCircle2 className="h-4 w-4" />
          {submitting ? "Saving..." : "Finish onboarding"}
        </Button>
      </form>
    </div>
  );
}

function Checklist({ title, values, selected, onToggle }) {
  return (
    <section>
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => (
          <button
            type="button"
            key={value}
            onClick={() => onToggle(value)}
            className={`rounded-full px-3 py-2 text-sm font-semibold transition ${
              selected.includes(value) ? "bg-bean-teal text-white" : "bg-bean-mist text-bean-teal hover:bg-bean-sky"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
    </section>
  );
}
