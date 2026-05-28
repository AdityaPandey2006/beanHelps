import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg bg-white/85 p-6 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-wider text-bean-teal">Admin</p>
        <h1 className="mt-2 text-3xl font-black">Moderation console</h1>
        <p className="mt-2 max-w-3xl text-bean-muted">Review therapist verification requests and keep reports moving through the safety workflow.</p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/admin/verifications" className="rounded-lg bg-white/90 p-5 shadow-sm transition hover:shadow-soft">
          <ShieldCheck className="h-5 w-5 text-bean-teal" />
          <h2 className="mt-3 text-xl font-black">Therapist verifications</h2>
          <p className="mt-2 text-sm text-bean-muted">Approve, reject, or return therapists to pending review.</p>
        </Link>
        <Link to="/admin/reports" className="rounded-lg bg-white/90 p-5 shadow-sm transition hover:shadow-soft">
          <ShieldCheck className="h-5 w-5 text-bean-teal" />
          <h2 className="mt-3 text-xl font-black">Reports</h2>
          <p className="mt-2 text-sm text-bean-muted">Review unsafe content and apply moderation actions.</p>
        </Link>
      </div>
    </div>
  );
}
