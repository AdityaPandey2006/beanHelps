import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatDate } from "../utils/format.js";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  const load = () => api("/reports").then((data) => setReports(data.reports || [])).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  const action = async (id, actionType) => {
    await api(`/reports/${id}/action`, {
      method: "PATCH",
      body: JSON.stringify({ action: actionType, resolutionNote: `Marked ${actionType} from admin UI` }),
    });
    load();
  };

  return (
    <div className="space-y-5">
      <section className="rounded-lg bg-white/85 p-6 shadow-soft">
        <h1 className="text-3xl font-black">Reports</h1>
        <p className="mt-2 text-bean-muted">Moderation reports with backend actions.</p>
      </section>
      {error && <div className="rounded-lg bg-rose-50 p-4 text-rose-700">{error}</div>}
      <section className="grid gap-4">
        {reports.length ? reports.map((report) => (
          <article key={report._id} className="rounded-lg bg-white/90 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black">{report.reason}</h2>
                  <StatusBadge tone={report.status}>{report.status}</StatusBadge>
                </div>
                <p className="mt-1 text-sm text-bean-muted">{report.targetType} · {formatDate(report.createdAt)}</p>
                <p className="mt-3 text-sm text-bean-muted">{report.details}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => action(report._id, "dismiss")}>Dismiss</Button>
                <Button onClick={() => action(report._id, "resolve")}>Resolve</Button>
                <Button variant="danger" onClick={() => action(report._id, "hide_content")}>Hide</Button>
              </div>
            </div>
          </article>
        )) : <EmptyState title="No reports">Submitted safety reports will show here.</EmptyState>}
      </section>
    </div>
  );
}
