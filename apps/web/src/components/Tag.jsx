export default function Tag({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-bean-mist px-3 py-1 text-xs font-semibold text-bean-teal">
      {children}
    </span>
  );
}
