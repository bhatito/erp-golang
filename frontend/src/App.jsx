import { Outlet, Link, useLocation } from "react-router-dom";

export default function App() {
  const { pathname } = useLocation();

  const Tab = ({ to, label }) => (
    <Link
      to={to}
      className={[
        "rounded-xl px-4 py-2 text-sm font-semibold transition",
        pathname === to
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-slate-900">Fullstack Auth</div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
            <Tab to="/login" label="Login" />
            <Tab to="/dashboard" label="Dashboard" />
          </div>
        </div>
      </div>
      <Outlet />
    </div>
  );
}