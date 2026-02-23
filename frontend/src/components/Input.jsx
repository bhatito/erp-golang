export default function Input({ label, error, right, className = "", ...props }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-slate-700">{label}</div>
      <div className="relative">
        <input
          {...props}
          className={[
            "w-full rounded-xl border bg-white/70 px-4 py-3 text-slate-900",
            "outline-none transition placeholder:text-slate-400",
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100"
              : "border-slate-200 focus:border-slate-400 focus:ring-4 focus:ring-slate-100",
            className,
          ].join(" ")}
        />
        {right ? (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {right}
          </div>
        ) : null}
      </div>
      {error ? <div className="mt-1 text-sm text-rose-600">{error}</div> : null}
    </label>
  );
}