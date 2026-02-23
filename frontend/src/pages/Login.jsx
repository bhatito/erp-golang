import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { api } from "../api/client";
import { setAccessToken } from "../auth/token";
import Input from "../components/Input";
import Button from "../components/Button";
import Toast from "../components/Toast";

function validateEmail(v) {
  return /^\S+@\S+\.\S+$/.test(v);
}

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("test@mail.com");
  const [password, setPassword] = useState("123456");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const errors = useMemo(() => {
    const e = {};
    if (!email) e.email = "Email wajib diisi.";
    else if (!validateEmail(email)) e.email = "Format email tidak valid.";
    if (!password) e.password = "Password wajib diisi.";
    else if (password.length < 6) e.password = "Minimal 6 karakter.";
    return e;
  }, [email, password]);

  const canSubmit = Object.keys(errors).length === 0 && !loading;

  async function onSubmit(e) {
    e.preventDefault();
    setToast(null);

    if (!canSubmit) {
      setToast({ type: "error", title: "Periksa input", message: "Email/password belum valid." });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      setAccessToken(res.data.accessToken);
      nav("/dashboard");
    } catch (err) {
      setToast({
        type: "error",
        title: "Login gagal",
        message: err.response?.data?.error || "Coba lagi beberapa saat.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Panel kiri (desktop) */}
          <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/60 p-8 backdrop-blur">
            <div>
              <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-white">
                <span className="text-sm font-semibold">Fullstack Auth</span>
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                Welcome back 👋
              </h1>
              <p className="mt-2 text-slate-600">
                Login untuk akses dashboard. React + Tailwind v4, backend Go + PostgreSQL.
              </p>

              <div className="mt-8 grid gap-3">
                <Feature title="JWT access + refresh" desc="Auto refresh saat access token expired." />
                <Feature title="HttpOnly refresh cookie" desc="Lebih aman dari localStorage." />
                <Feature title="Protected route" desc="Dashboard hanya untuk user login." />
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Test account: <span className="font-semibold">test@mail.com</span> /{" "}
              <span className="font-semibold">123456</span>
            </div>
          </div>

          {/* Form login */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Login</h2>
                <p className="mt-1 text-sm text-slate-600">Masukkan email dan password.</p>
              </div>
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                v1
              </div>
            </div>

            {toast ? (
              <div className="mt-5">
                <Toast {...toast} onClose={() => setToast(null)} />
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <Input
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                type="email"
                error={errors.email}
                right={<Mail className="h-5 w-5 text-slate-400" />}
              />

              <Input
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type={showPw ? "text" : "password"}
                error={errors.password}
                right={
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      {showPw ? (
                        <span className="inline-flex items-center gap-1">
                          <EyeOff className="h-4 w-4" /> Hide
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-4 w-4" /> Show
                        </span>
                      )}
                    </button>
                  </div>
                }
              />

              <Button loading={loading} type="submit">
                {loading ? "Signing in..." : "Sign in"}
              </Button>

              {/* ✅ ini yang bikin "register bisa" */}
              <div className="mt-2 text-center text-sm text-slate-600">
                Belum punya akun?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 hover:decoration-slate-900"
                >
                  Register
                </Link>
              </div>
            </form>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
              <div className="font-semibold">Endpoints</div>
              <div className="mt-1">
                API: <span className="font-mono">http://localhost:8080</span>
                <br />
                Frontend: <span className="font-mono">http://localhost:5173</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ title, desc }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{desc}</div>
    </div>
  );
}