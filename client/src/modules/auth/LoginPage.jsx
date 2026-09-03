import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Eye, ShieldCheck } from "lucide-react";
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
      login({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
      navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071018] px-4 py-6 text-white sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
          <section className="hidden bg-[#0b151e] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#071018]"><Eye size={22} /></div>
                <div>
                  <div className="text-lg font-bold tracking-tight">V-Sync</div>
                  <div className="text-[9px] uppercase tracking-[.24em] text-white/40">Practice Management</div>
                </div>
              </div>
              <div className="mt-20 max-w-lg">
                <p className="text-xs font-semibold uppercase tracking-[.22em] text-white/40">One secure workspace</p>
                <h1 className="mt-4 text-5xl font-semibold leading-[1.05] tracking-tight">Everything your practice needs, in one place.</h1>
                <p className="mt-6 max-w-md text-sm leading-7 text-white/50">Sign in once. VividOpt uses your role to present the clinical, front desk, optical, finance and administration workspace you are authorized to use.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40"><ShieldCheck size={15} /> Role-based access is applied automatically.</div>
          </section>

          <section className="p-6 text-slate-900 sm:p-10 lg:p-12 xl:p-14">
            <div className="mb-10 lg:hidden">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white"><Eye size={21} /></div>
              <h1 className="mt-5 text-2xl font-bold">V-Sync</h1>
              <p className="mt-2 text-sm text-slate-500">Practice management workspace</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-slate-400">Welcome back</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Sign in</h2>
              <p className="mt-2 text-sm text-slate-500">Use your V-Sync account. Your role determines what you can access.</p>
            </div>
            {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={handleSubmit} className="mt-8">
              <label className="text-sm font-semibold text-slate-700">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100" required />
              <label className="mt-5 block text-sm font-semibold text-slate-700">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-slate-500 focus:bg-white focus:ring-4 focus:ring-slate-100" required />
              <button disabled={loading} className="mt-7 h-12 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60">{loading ? "Signing in..." : "Sign in"}</button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
