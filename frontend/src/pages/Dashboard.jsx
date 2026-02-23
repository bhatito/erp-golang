import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { clearAccessToken } from "../auth/token";
import { LogOut, ShieldCheck, User } from "lucide-react";

export default function Dashboard() {
  const nav = useNavigate();
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/me")
      .then((r) => setMe(r.data))
      .catch((e) => setErr(e.response?.data?.error || "Gagal load profil"))
      .finally(() => setLoading(false));
  }, []);

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAccessToken();
      nav("/login");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-900">
              <ShieldCheck className="h-5 w-5" />
              <span className="text-sm font-semibold">Authenticated</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-1 text-slate-600">
              Protected page, data dari endpoint <code className="rounded bg-slate-100 px-1">/me</code>.
            </p>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 shadow-sm hover:bg-slate-50 transition"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card title="Profile" icon={<User className="h-5 w-5 text-slate-500" />}>
            {loading ? (
              <div className="text-sm text-slate-600">Loading...</div>
            ) : err ? (
              <div className="text-sm text-rose-600">{err}</div>
            ) : (
              <div className="space-y-2 text-sm">
                <Row k="User ID" v={me.userId} />
                <Row k="Email" v={me.email} />
              </div>
            )}
          </Card>

          <Card title="Next steps" icon={<ShieldCheck className="h-5 w-5 text-slate-500" />}>
            <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
              <li>Tambah halaman Register.</li>
              <li>Tambah refresh token rotation.</li>
              <li>Tambah role/permission.</li>
              <li>Deploy docker compose.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, icon, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="rounded-xl bg-slate-100 p-2">{icon}</div>
        <div className="font-semibold text-slate-900">{title}</div>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-slate-600">{k}</div>
      <div className="font-semibold text-slate-900">{v}</div>
    </div>
  );
}