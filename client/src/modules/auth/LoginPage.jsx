import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowRight, Eye, ShieldCheck } from "lucide-react";
import { useAuth } from "./AuthContext";
import api from "../../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await api.post("/auth/login", { email, password });
      const data = response.data.data;
      login({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to sign in. Check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f3f5fa] px-3 py-4 sm:px-4">
      <div className="pointer-events-none absolute -right-28 -top-36 h-[420px] w-[420px] rounded-full bg-indigo-100/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-blue-100/70 blur-3xl" />

      <div className="relative grid w-full max-w-[980px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(22,34,62,0.12)] lg:min-h-[560px] lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden flex-col justify-between overflow-hidden bg-[#172342] p-5 text-white lg:flex xl:p-6">
          <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="relative">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-lg shadow-black/10">
                <Activity size={20} strokeWidth={2.2} />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">V-Sync</div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/55">Practice Management</div>
              </div>
            </div>

            <div className="mt-12 max-w-md">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-indigo-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Connected care workspace
              </div>
              <h1 className="mt-4 text-[34px] font-semibold leading-[1.12] tracking-[-0.04em] text-white">
                Your practice,
                <br />
                in sync.
              </h1>
              <p className="mt-4 max-w-sm text-[13px] leading-6 text-slate-300">
                Bring patient care, appointments, clinical records, dispensing and practice operations into one secure workspace.
              </p>
            </div>
          </div>

          <div className="relative flex items-center gap-2 border-t border-white/10 pt-4 text-[10px] font-medium text-slate-300">
            <ShieldCheck size={14} className="text-indigo-200" />
            Role-based access protects each workspace.
          </div>
        </section>

        <section className="flex items-center px-3 py-5 sm:px-9 lg:px-6 xl:px-9">
          <div className="mx-auto w-full max-w-[380px]">
            <div className="mb-5 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172342] text-white shadow-sm">
                <Activity size={19} />
              </div>
              <div className="mt-3 text-lg font-bold tracking-tight text-slate-900">V-Sync</div>
              <p className="mt-0.5 text-xs text-slate-500">Practice management workspace</p>
            </div>

            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-indigo-600">Welcome back</div>
              <h2 className="mt-2 text-[26px] font-bold tracking-tight text-slate-950">Sign in to V-Sync</h2>
              <p className="mt-1.5 text-xs leading-5 text-slate-500">Use your work account to continue to your practice workspace.</p>
            </div>

            {error && (
              <div role="alert" className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-700">
                <ShieldCheck size={15} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@practice.com"
                  autoComplete="username"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-50"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-3 focus:ring-indigo-50"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#24345d] px-3 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-center gap-2 border-t border-slate-100 pt-4 text-[10px] text-slate-400">
              <Eye size={13} />
              Secure access to your clinical workspace
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
