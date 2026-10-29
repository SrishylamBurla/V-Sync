import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, Eye, ShieldCheck, Stethoscope, Users, Glasses, WalletCards } from "lucide-react";
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
      setError(err.response?.data?.message || "Unable to sign in. Check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-3 py-4 text-slate-900 sm:px-4 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-2xl border border-white bg-white shadow-[0_24px_80px_rgba(45,55,105,.12)] lg:grid-cols-[.92fr_1.08fr]">
          <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6 lg:flex lg:flex-col lg:justify-between xl:p-8">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-indigo-100/70 blur-3xl" />
            <div className="relative">
              <Link to="/" className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-indigo-500">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-100"><Activity size={19} /></span>
                <span><span className="block text-[15px] font-bold tracking-tight text-slate-950">V-Sync</span><span className="block text-[11px] font-semibold uppercase tracking-[.16em] text-slate-500">Vision Practice Platform</span></span>
              </Link>
              <div className="mt-16 max-w-md">
                <p className="text-[12px] font-bold uppercase tracking-[.18em] text-indigo-600">One connected workspace</p>
                <h1 className="mt-3 text-3xl font-semibold leading-[1.12] tracking-tight text-slate-950 xl:text-4xl">A clearer way to run your eye-care practice.</h1>
                <p className="mt-3 max-w-sm text-[13px] leading-6 text-slate-600">Bring patient records, appointments, clinical workflows, dispensing, inventory and finance into one organized workspace.</p>
              </div>
              <div className="mt-6 grid max-w-sm grid-cols-2 gap-2.5">
                {[{ icon: Users, label: "Patient workspace" }, { icon: Stethoscope, label: "Clinical workflow" }, { icon: Glasses, label: "Optical & dispensing" }, { icon: WalletCards, label: "Finance & reporting" }].map((item) => { const Icon = item.icon; return <div key={item.label} className="flex items-center gap-2 rounded-lg border border-white bg-white/80 px-2.5 py-2.5 shadow-sm"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Icon size={14} /></span><span className="text-[12px] font-semibold text-slate-600">{item.label}</span></div>; })}
              </div>
            </div>
            <div className="relative flex items-center gap-2 text-[12px] text-slate-500"><ShieldCheck size={15} className="text-emerald-600" /> Your access is controlled by your assigned role.</div>
          </section>

          <section className="p-4 sm:p-6 lg:p-6 xl:p-8">
            <div className="mb-6 lg:hidden"><Link to="/" className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-500 hover:text-indigo-700"><ArrowLeft size={13} /> Back to V-Sync</Link><div className="mt-3 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white"><Eye size={18} /></span><span><b className="block text-[15px] font-bold">V-Sync</b><span className="block text-[11px] uppercase tracking-[.15em] text-slate-500">Vision Practice Platform</span></span></div></div>
            <div><p className="text-[12px] font-bold uppercase tracking-[.18em] text-indigo-600">Welcome back</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Sign in to your workspace</h2><p className="mt-2 text-[12px] leading-5 text-slate-500">Use the account provided by your practice administrator.</p></div>
            {error && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[12px] leading-5 text-rose-700">{error}</div>}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <label className="block"><span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" placeholder="you@practice.com" className="h-10 w-full rounded-lg border bg-slate-50 px-3 text-[12px] outline-none transition placeholder:text-slate-400 focus:bg-white" required /></label>
              <label className="block"><span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter your password" className="h-10 w-full rounded-lg border bg-slate-50 px-3 text-[12px] outline-none transition placeholder:text-slate-400 focus:bg-white" required /></label>
              <button type="submit" disabled={loading} className="public-button-primary mt-1 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Signing in…" : "Sign in securely"}<ArrowLeft size={14} className="rotate-180" /></button>
            </form>
            <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-[12px] leading-5 text-slate-600"><ShieldCheck size={14} className="mr-1.5 inline text-indigo-600" />Your workspace and available modules depend on your assigned role.</div>
            <p className="mt-4 text-center text-[12px] text-slate-500">New to V-Sync? <Link to="/#contact" className="font-semibold text-indigo-700 hover:text-indigo-900">Request a demo</Link></p>
          </section>
        </div>
      </div>
    </div>
  );
}
