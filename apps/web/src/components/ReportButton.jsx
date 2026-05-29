import { Flag, X } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import Button from "./Button.jsx";

const reasons = [
  ["harassment", "Harassment"],
  ["self_harm", "Self-harm risk"],
  ["hate_speech", "Hate speech"],
  ["spam", "Spam"],
  ["misinformation", "Misinformation"],
  ["unsafe_advice", "Unsafe advice"],
  ["other", "Other"],
];

export default function ReportButton({ targetType, targetId, label = "Report" }) {
  const { user } = useAuth();
  const reportKey = `beanhelps_reported_${user?.id || "anonymous"}_${targetType}_${targetId}`;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("unsafe_advice");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(() => sessionStorage.getItem(reportKey) === "true");

  const submit = async (event) => {
    event.preventDefault();
    if (submitting || submitted) return;

    setStatus("");
    setSubmitting(true);
    try {
      await api("/reports", {
        method: "POST",
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          details,
        }),
      });
      sessionStorage.setItem(reportKey, "true");
      setSubmitted(true);
      setDetails("");
      setOpen(false);
    } catch (err) {
      setStatus(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const close = () => {
    setOpen(false);
    setStatus("");
    setDetails("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => !submitted && setOpen(true)}
        disabled={submitted}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
          submitted
            ? "cursor-not-allowed bg-emerald-50 text-emerald-700"
            : "text-bean-muted hover:bg-rose-50 hover:text-rose-700"
        }`}
        aria-label={submitted ? "Reported" : label}
        title={submitted ? "Reported" : label}
      >
        <Flag className="h-4 w-4" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-bean-ink/35 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-bean-ink">Report content</h2>
                <p className="mt-1 text-sm text-bean-muted">
                  Reports go to the admin moderation queue.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="grid h-9 w-9 place-items-center rounded-md text-bean-muted hover:bg-bean-mist"
                aria-label="Close report dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submit} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold">Reason</span>
                <select
                  className="field mt-2"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                >
                  {reasons.map(([value, text]) => (
                    <option key={value} value={value}>
                      {text}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold">Details</span>
                <textarea
                  className="field mt-2 min-h-28"
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  placeholder="Add context for moderators"
                  maxLength={1000}
                />
              </label>

              {status && (
                <p className="rounded-md bg-bean-mist px-3 py-2 text-sm font-semibold text-bean-teal">
                  {status}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting || submitted}>
                  {submitting ? "Submitting..." : "Submit report"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
