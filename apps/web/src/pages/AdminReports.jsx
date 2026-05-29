import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Button from "../components/Button.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { formatDate, publicName } from "../utils/format.js";

export default function AdminReports() {
  const [summaries, setSummaries] = useState([]);
  const [error, setError] = useState("");

  const load = () => api("/reports").then((data) => setSummaries(data.summaries || [])).catch((err) => setError(err.message));

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
        {summaries.length ? summaries.map((summary) => (
          <article key={`${summary.targetType}-${summary.targetId}`} className="rounded-lg bg-white/90 p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black">{summary.targetType.replaceAll("_", " ")}</h2>
                  <StatusBadge tone={summary.status}>{summary.status}</StatusBadge>
                  {summary.priority === "high" && <StatusBadge tone="rejected">High priority</StatusBadge>}
                  {summary.autoHidden && <StatusBadge tone="pending">Auto-hidden</StatusBadge>}
                </div>
                <p className="mt-1 text-sm text-bean-muted">
                  {summary.reportCount} report{summary.reportCount === 1 ? "" : "s"} · latest {formatDate(summary.latestCreatedAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(summary.reasonBreakdown || {}).map(([reason, count]) => (
                    <span key={reason} className="rounded-full bg-bean-mist px-3 py-1 text-xs font-bold text-bean-teal">
                      {reason.replaceAll("_", " ")}: {count}
                    </span>
                  ))}
                </div>
                {summary.latestDetails && (
                  <p className="mt-3 text-sm text-bean-muted">{summary.latestDetails}</p>
                )}
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-bold text-bean-teal">
                    View individual reports
                  </summary>
                  <div className="mt-2 space-y-2">
                    {(summary.reports || []).map((report) => (
                      <div key={report.id} className="rounded-md bg-bean-mist/70 p-3 text-sm">
                        <p className="font-bold">
                          {report.reason.replaceAll("_", " ")} · {publicName(report.reporter)}
                        </p>
                        <p className="mt-1 text-bean-muted">{report.details || "No details provided."}</p>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => action(summary.representativeReportId, "dismiss")}>Dismiss target</Button>
                <Button onClick={() => action(summary.representativeReportId, "resolve")}>Resolve target</Button>
                <Button variant="danger" onClick={() => action(summary.representativeReportId, "hide_content")}>Hide target</Button>
              </div>
            </div>
          </article>
        )) : <EmptyState title="No reports">Submitted safety reports will show here.</EmptyState>}
      </section>
    </div>
  );
}
