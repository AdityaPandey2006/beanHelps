export default function EmptyState({ title, children, action }) {
  return (
    <div className="rounded-lg border border-dashed border-bean-sage/50 bg-white/70 p-6 text-center">
      <h3 className="text-base font-semibold text-bean-ink">{title}</h3>
      {children && <p className="mx-auto mt-2 max-w-xl text-sm text-bean-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
