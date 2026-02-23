import { X } from "lucide-react";

export default function Toast({ type = "error", title, message, onClose }) {
  const styles =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-rose-200 bg-rose-50 text-rose-950";

  return (
    <div className={`rounded-xl border p-3 ${styles}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {title ? <div className="font-semibold">{title}</div> : null}
          {message ? <div className="text-sm opacity-90">{message}</div> : null}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 hover:bg-black/5 transition"
          aria-label="Close"
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}