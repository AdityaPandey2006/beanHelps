import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import Tag from "../components/Tag.jsx";
import { asArray } from "../utils/format.js";

export default function AdminVerifications() {
  const [therapists, setTherapists] = useState([]);
  const [error, setError] = useState("");

  const load = () => api("/therapists/pending").then((data) => setTherapists(data.therapists || [])).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const update = async (id, verificationStatus) => {
    await api(`/therapists/${id}/verification`, {
      method: "PATCH",
      body: JSON.stringify({ verificationStatus }),
    });
    load();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-white/85 p-6 shadow-soft">
        <h1 className="text-3xl font-black">Pending therapist profiles</h1>
        <p className="mt-2 text-bean-muted">Each page fetches fresh review data on load.</p>
      </section>
      {error && <div className="rounded-lg bg-rose-50 p-4 text-rose-700">{error}</div>}
      <section className="grid gap-4">
        {therapists.length ? therapists.map((therapist) => (
          <article key={therapist._id} className="rounded-lg bg-white/90 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-black">{therapist.name}</h2>
                  <StatusBadge tone={therapist.therapistProfile?.verificationStatus}>{therapist.therapistProfile?.verificationStatus}</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-bean-muted">{therapist.email}</p>
                <p className="mt-3 text-sm text-bean-muted">{therapist.therapistProfile?.experience}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {asArray(therapist.therapistProfile?.specializations).map((tag) => <Tag key={tag}>{tag}</Tag>)}
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => update(therapist._id, "verified")}>Verify</Button>
                <Button variant="danger" onClick={() => update(therapist._id, "rejected")}>Reject</Button>
              </div>
            </div>
          </article>
        )) : <EmptyState title="No pending therapists">New submissions will appear here.</EmptyState>}
      </section>
    </div>
  );
}
