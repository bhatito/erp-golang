import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import { api } from "../api/client";
import Input from "../components/Input";
import Button from "../components/Button";
import Toast from "../components/Toast";

function validateEmail(v) {
  return /^\S+@\S+\.\S+$/.test(v);
}

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const errors = useMemo(() => {
    const e = {};
    if (!email) e.email = "Email wajib diisi.";
    else if (!validateEmail(email)) e.email = "Format email tidak valid.";
    if (!password) e.password = "Password wajib diisi.";
    else if (password.length < 6) e.password = "Minimal 6 karakter.";
    if (confirm !== password) e.confirm = "Password tidak sama.";
    return e;
  }, [email, password, confirm]);

  const canSubmit = Object.keys(errors).length === 0 && !loading;

  async function onSubmit(e) {
    e.preventDefault();
    setToast(null);

    if (!canSubmit) {
      setToast({
        type: "error",
        title: "Periksa input",
        message: "Pastikan semua field valid.",
      });
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", { email, password });

      setToast({
        type: "success",
        title: "Register berhasil",
        message: "Silakan login dengan akun baru kamu.",
      });

      setTimeout(() => nav("/login"), 1500);
    } catch (err) {
      setToast({
        type: "error",
        title: "Register gagal",
        message: err.response?.data?.error || "Terjadi kesalahan.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="mx-auto flex min-h-screen max-w-lg items-center justify-center px-4 py-10">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Create Account</h2>
          <p className="mt-1 text-sm text-slate-600">
            Daftarkan akun untuk masuk ke sistem ERP.
          </p>

          {toast ? (
            <div className="mt-4">
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
              placeholder="Minimal 6 karakter"
              type="password"
              error={errors.password}
              right={<Lock className="h-5 w-5 text-slate-400" />}
            />

            <Input
              label="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ulangi password"
              type="password"
              error={errors.confirm}
              right={<User className="h-5 w-5 text-slate-400" />}
            />

            <Button loading={loading} type="submit">
              {loading ? "Creating..." : "Register"}
            </Button>

            <div className="text-center text-sm text-slate-600">
              Sudah punya akun?{" "}
              <span
                className="cursor-pointer font-semibold text-slate-900 hover:underline"
                onClick={() => nav("/login")}
              >
                Login
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}