export default function Button({ loading, className = "", children, ...props }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={[
        "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3",
        "font-semibold text-white shadow-sm",
        "bg-slate-900 hover:bg-slate-800 active:bg-slate-950",
        "disabled:cursor-not-allowed disabled:opacity-60 transition",
        className,
      ].join(" ")}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : null}
      {children}
    </button>
  );
}