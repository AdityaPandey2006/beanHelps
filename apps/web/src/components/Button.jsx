export default function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const variants = {
    primary: "bg-bean-teal text-white",
    secondary: "bg-white text-bean-ink border border-bean-sage/40 hover:bg-bean-mist",
    subtle: "bg-transparent text-bean-teal hover:bg-bean-mist",
    danger: "bg-[#E07A5F] text-white",
  };

  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
