const toneMap = {
  verified: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-rose-100 text-rose-800",
  scheduled: "bg-sky-100 text-sky-800",
  open: "bg-emerald-100 text-emerald-800",
  full: "bg-slate-100 text-slate-700",
  closed: "bg-rose-100 text-rose-800",
};

export default function StatusBadge({ children, tone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        toneMap[tone] || "bg-bean-mist text-bean-teal"
      }`}
    >
      {children}
    </span>
  );
}
