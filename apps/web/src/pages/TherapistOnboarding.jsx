import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Button from "../components/Button.jsx";

export default function TherapistOnboarding() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    specializations: "anxiety, stress",
    languages: "English",
    experience: "",
    availability: "",
    licenseOrCertificateUrl: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = await api("/therapists/profile", {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          specializations: form.specializations.split(",").map((item) => item.trim()).filter(Boolean),
          languages: form.languages.split(",").map((item) => item.trim()).filter(Boolean),
        }),
      });
      setUser(data.user);
      navigate("/therapist/home", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-white/80 bg-white/90 p-6 shadow-soft">
      <h1 className="text-3xl font-black">Therapist verification profile</h1>
      <p className="mt-2 text-bean-muted">Once submitted, admins can review your credentials before therapist-only actions unlock.</p>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <label>
          <span className="text-sm font-semibold">Specializations</span>
          <input name="specializations" className="field" value={form.specializations} onChange={update} required />
        </label>
        <label>
          <span className="text-sm font-semibold">Languages</span>
          <input name="languages" className="field" value={form.languages} onChange={update} required />
        </label>
        <label>
          <span className="text-sm font-semibold">Experience</span>
          <textarea name="experience" className="field min-h-24" value={form.experience} onChange={update} required />
        </label>
        <label>
          <span className="text-sm font-semibold">Availability</span>
          <input name="availability" className="field" value={form.availability} onChange={update} required />
        </label>
        <label>
          <span className="text-sm font-semibold">License or certificate URL</span>
          <input name="licenseOrCertificateUrl" className="field" value={form.licenseOrCertificateUrl} onChange={update} required />
        </label>

        {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <Button type="submit" disabled={submitting}>
          <ShieldCheck className="h-4 w-4" />
          {submitting ? "Submitting..." : "Submit for review"}
        </Button>
      </form>
    </div>
  );
}
