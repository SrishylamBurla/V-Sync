import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import {
  Activity, ArrowRight, CalendarDays, Check, ChevronDown, CircleCheck,
  ClipboardCheck, Eye, Glasses, Layers3, Menu,
  ShieldCheck, Stethoscope, WalletCards, Users, X, Building2, Package,
} from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import api from "../../../services/api";

const plans = [
  {
    name: "Essential Clinic",
    price: "₹4,999",
    suffix: "/ month",
    summary: "A clear starting point for a single eye-care practice.",
    featured: false,
    items: ["Patient records and visit history", "Appointment scheduling", "Clinical consultation workflow", "Recall list and core reports"],
    planKey: "essential_clinic",
  },
  {
    name: "Practice Plus",
    price: "₹9,999",
    suffix: "/ month",
    summary: "Connected clinical, optical and operational workflows for a growing practice.",
    featured: true,
    items: ["Everything in Essential Clinic", "Dispensing and optical inventory", "Billing and financial workspace", "Staff roles, branches and reports"],
    planKey: "practice_plus",
  },
  {
    name: "Hospital & Franchise",
    price: "Custom",
    suffix: " proposal",
    summary: "A rollout plan tailored to hospitals, groups and franchise networks.",
    featured: false,
    items: ["Organization and branch setup", "Centralized operational oversight", "Role-based access configuration", "Scoped onboarding and deployment plan"],
    planKey: "hospital_franchise",
  },
];

const features = [
  { icon: Users, title: "Patient workspace", description: "Keep patient demographics, records and visit context together." },
  { icon: CalendarDays, title: "Appointments", description: "Organize bookings, daily schedules and visit status." },
  { icon: Stethoscope, title: "Clinical workflow", description: "Support consultations and structured eye-care examination records." },
  { icon: Glasses, title: "Optical & dispensing", description: "Manage spectacle jobs, contact lenses and sundry workflows." },
  { icon: Package, title: "Inventory", description: "Maintain catalogue, stock and inventory movement workflows." },
  { icon: WalletCards, title: "Finance & reporting", description: "Bring billing, expenses, outstanding balances and reports into one workspace." },
];

const initialForm = {
  name: "", organization: "", email: "", phone: "", role: "Hospital / clinic owner",
  plan: "practice_plus", branches: "1", message: "", website: "",
};

export default function PublicLandingPage() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const section = location.pathname === "/pricing"
      ? "pricing"
      : location.pathname === "/franchise"
        ? "contact"
        : location.hash.slice(1);
    if (!section) return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  if (!authLoading && user) return <Navigate to="/dashboard" replace />;

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submitInquiry = async (event) => {
    event.preventDefault();
    setFormError("");
    if (form.website.trim()) {
      setSubmitted(true);
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/public/leads", {
        name: form.name.trim(),
        organization: form.organization.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        plan: form.plan,
        branches: Number(form.branches || 1),
        message: form.message.trim(),
      });
      setSubmitted(true);
      setForm(initialForm);
    } catch (error) {
      setFormError(error?.response?.data?.message || "We could not send your request right now. Please try again or contact the team directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="public-site min-h-screen overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-white/80 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-3 sm:px-4 lg:px-6">
          <a href="#home" className="flex items-center gap-2.5" aria-label="V-Sync home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-100"><Activity size={19} /></span>
            <span><span className="block text-[16px] font-bold tracking-tight text-slate-950">V-Sync</span><span className="block text-[11px] font-semibold uppercase tracking-[.16em] text-slate-500">Vision Practice Platform</span></span>
          </a>
          <nav className="hidden items-center gap-6 lg:flex">
            <a className="text-[13px] font-medium text-slate-600 transition hover:text-indigo-700" href="#platform">Platform</a>
            <a className="text-[13px] font-medium text-slate-600 transition hover:text-indigo-700" href="#workflow">How it works</a>
            <a className="text-[13px] font-medium text-slate-600 transition hover:text-indigo-700" href="#pricing">Pricing</a>
            <a className="text-[13px] font-medium text-slate-600 transition hover:text-indigo-700" href="#contact">Franchise / hospital</a>
          </nav>
          <div className="hidden items-center gap-2.5 sm:flex">
            <Link to="/login" className="rounded-lg px-3.5 py-2 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100">Sign in</Link>
            <a href="#contact" className="public-button-primary inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-white transition">Request a demo <ArrowRight size={14} /></a>
          </div>
          <button type="button" onClick={() => setMobileMenuOpen((value) => !value)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 sm:hidden" aria-label="Toggle menu">{mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}</button>
        </div>
        {mobileMenuOpen && <div className="space-y-1 border-t border-slate-100 bg-white px-3 py-3 sm:hidden"><a className="block rounded-lg px-3 py-2 text-sm text-slate-700" href="#platform" onClick={() => setMobileMenuOpen(false)}>Platform</a><a className="block rounded-lg px-3 py-2 text-sm text-slate-700" href="#workflow" onClick={() => setMobileMenuOpen(false)}>How it works</a><a className="block rounded-lg px-3 py-2 text-sm text-slate-700" href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a><a className="block rounded-lg px-3 py-2 text-sm text-slate-700" href="#contact" onClick={() => setMobileMenuOpen(false)}>Hospital & franchise</a><Link className="block rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700" to="/login">Sign in</Link></div>}
      </header>

      <main id="home">
        <section className="relative mx-auto grid max-w-7xl items-center gap-8 px-3 pb-14 pt-14 sm:px-4 sm:pb-18 sm:pt-18 lg:grid-cols-[1.03fr_.97fr] lg:gap-12 lg:px-6 lg:pb-20 lg:pt-20">
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/85 px-3 py-1.5 text-[12px] font-semibold text-indigo-700 shadow-sm"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Built for modern eye-care operations</div>
            <h1 className="max-w-2xl text-[38px] font-semibold leading-[1.08] tracking-[-.045em] text-slate-950 sm:text-5xl lg:text-[58px]">One connected workspace for <span className="bg-gradient-to-r from-indigo-700 via-violet-600 to-blue-600 bg-clip-text text-transparent">better eye care.</span></h1>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-slate-600 sm:text-base">Coordinate patients, appointments, clinical consultations, optical dispensing, inventory and finance in a single practice-management platform.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href="#contact" className="public-button-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white transition">Book a product walkthrough <ArrowRight size={15} /></a>
              <a href="#pricing" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700">Explore pricing <ChevronDown size={14} /></a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2.5 text-[12px] font-medium text-slate-500"><span className="inline-flex items-center gap-1.5"><CircleCheck size={14} className="text-emerald-600" /> Role-based access</span><span className="inline-flex items-center gap-1.5"><CircleCheck size={14} className="text-emerald-600" /> Multi-branch ready</span><span className="inline-flex items-center gap-1.5"><CircleCheck size={14} className="text-emerald-600" /> Clinical + optical workflows</span></div>
          </div>

          <div className="relative mx-auto w-full max-w-[600px]">
            <div className="absolute -inset-5 rounded-[30px] bg-gradient-to-br from-indigo-200/55 via-sky-100/60 to-violet-200/40 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white bg-white p-3 shadow-[0_28px_80px_rgba(34,52,100,.13)] sm:p-3">
              <div className="flex items-center justify-between border-b border-slate-100 px-1 pb-3.5">
                <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700"><Activity size={16} /></span><span><b className="block text-[12px] text-slate-900">Practice overview</b><span className="block text-[12px] text-slate-400">Illustrative dashboard preview</span></span></div>
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Live workspace concept</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 py-3.5 sm:grid-cols-4">
                {[{ label: "Appointments", value: "Today", color: "from-indigo-50 to-blue-50", icon: CalendarDays }, { label: "Patients", value: "Records", color: "from-violet-50 to-indigo-50", icon: Users }, { label: "Clinical", value: "Consults", color: "from-sky-50 to-cyan-50", icon: Stethoscope }, { label: "Dispensing", value: "Jobs", color: "from-emerald-50 to-teal-50", icon: Glasses }].map((item) => { const Icon = item.icon; return <div key={item.label} className={`rounded-xl border border-slate-100 bg-gradient-to-br ${item.color} p-3`}><Icon size={15} className="text-indigo-600" /><div className="mt-3 text-[12px] font-medium text-slate-500">{item.label}</div><div className="mt-0.5 text-[13px] font-semibold text-slate-900">{item.value}</div></div>; })}
              </div>
              <div className="grid gap-3 sm:grid-cols-[1.25fr_.75fr]">
                <div className="rounded-xl border border-slate-100 p-3.5"><div className="flex items-center justify-between"><b className="text-[12px] text-slate-800">Daily workflow</b><span className="text-[11px] text-slate-400">Example</span></div><div className="mt-3 space-y-2.5">{[{ title: "Front desk", sub: "Appointments and patient arrivals", w: "w-[86%]", c: "bg-indigo-400" }, { title: "Clinical team", sub: "Consultation and examination", w: "w-[68%]", c: "bg-sky-400" }, { title: "Optical team", sub: "Dispensing and collection", w: "w-[74%]", c: "bg-emerald-400" }].map((row) => <div key={row.title}><div className="flex items-center justify-between gap-2"><span className="text-[12px] font-semibold text-slate-700">{row.title}</span><span className="truncate text-[11px] text-slate-400">{row.sub}</span></div><div className="mt-1.5 h-1.5 rounded-full bg-slate-100"><div className={`${row.w} ${row.c} h-1.5 rounded-full`} /></div></div>)}</div></div>
                <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-white to-violet-50/65 p-3.5"><div className="text-[12px] font-semibold text-slate-800">Connected modules</div><div className="mt-3 space-y-2">{["Patient records", "Appointments", "Consultations", "Inventory", "Billing & reports"].map((label, i) => <div key={label} className="flex items-center gap-2 rounded-lg bg-white/80 px-2 py-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-[11px] font-bold text-indigo-700">{i + 1}</span><span className="text-[11px] font-medium text-slate-600">{label}</span><Check size={12} className="ml-auto text-emerald-600" /></div>)}</div></div>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-[12px] text-indigo-800"><ShieldCheck size={14} /> Access and navigation can be configured around staff roles.</div>
            </div>
          </div>
        </section>

        <section id="platform" className="public-section border-y border-white/80 bg-white/55 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
            <div className="mx-auto max-w-2xl text-center"><p className="text-[12px] font-bold uppercase tracking-[.19em] text-indigo-600">The platform</p><h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">The day-to-day tools your practice needs</h2><p className="mt-3 text-[13px] leading-6 text-slate-600 sm:text-sm">A connected workflow from first appointment to clinical records, optical dispensing and practice reporting.</p></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => { const Icon = feature.icon; return <article key={feature.title} className="public-card rounded-xl p-3 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-700 ring-1 ring-indigo-100"><Icon size={17} /></span><h3 className="mt-3 text-[13px] font-semibold text-slate-900">{feature.title}</h3><p className="mt-1.5 text-[12px] leading-5 text-slate-600">{feature.description}</p></article>; })}
            </div>
          </div>
        </section>

        <section id="workflow" className="public-section py-14 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-3 sm:px-4 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-14 lg:px-6">
            <div><p className="text-[12px] font-bold uppercase tracking-[.19em] text-indigo-600">Simple rollout</p><h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Make your workflows clearer, not more complicated.</h2><p className="mt-3 text-[13px] leading-6 text-slate-600 sm:text-sm">V-Sync brings practice work into named sections and role-based workflows, so each team can focus on what they need to do.</p><a href="#contact" className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-indigo-700 hover:text-indigo-900">Discuss your workflow <ArrowRight size={14} /></a></div>
            <div className="grid gap-3 sm:grid-cols-3">{[{ n: "01", t: "Map your practice", d: "Confirm branches, staff roles and the modules you need." }, { n: "02", t: "Configure rollout", d: "Plan workspace setup, onboarding and any data migration." }, { n: "03", t: "Train your team", d: "Walk through day-to-day tasks and readiness before launch." }].map((step) => <div key={step.n} className="public-card rounded-xl p-3"><span className="text-[12px] font-bold text-indigo-600">{step.n}</span><h3 className="mt-3 text-[13px] font-semibold text-slate-900">{step.t}</h3><p className="mt-2 text-[12px] leading-5 text-slate-600">{step.d}</p></div>)}</div>
          </div>
        </section>

        <section id="pricing" className="public-section border-y border-indigo-100/70 bg-gradient-to-br from-indigo-50/65 via-white to-sky-50/70 py-14 sm:py-16">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
            <div className="mx-auto max-w-2xl text-center"><p className="text-[12px] font-bold uppercase tracking-[.19em] text-indigo-600">Pricing</p><h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Start with the right scope. Scale when ready.</h2><p className="mt-3 text-[12px] leading-6 text-slate-600 sm:text-sm">Indicative launch pricing. Hospital groups and franchise deployments receive a tailored proposal.</p></div>
            <div className="mt-6 grid gap-3 lg:grid-cols-3">
              {plans.map((plan) => <article key={plan.name} className={`relative flex flex-col rounded-xl border p-4 ${plan.featured ? "border-indigo-300 bg-white shadow-[0_18px_45px_rgba(79,70,229,.12)] ring-1 ring-indigo-100" : "border-slate-200 bg-white/90 shadow-sm"}`}>
                {plan.featured && <div className="absolute -top-3 left-5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Popular choice</div>}
                <h3 className="text-[14px] font-semibold text-slate-950">{plan.name}</h3><p className="mt-2 min-h-10 text-[12px] leading-5 text-slate-600">{plan.summary}</p><div className="mt-3 flex items-baseline gap-1.5"><span className="text-3xl font-semibold tracking-tight text-slate-950">{plan.price}</span><span className="text-[12px] text-slate-500">{plan.suffix}</span></div>
                <div className="my-3 h-px bg-slate-100" /><ul className="flex-1 space-y-2.5">{plan.items.map((item) => <li key={item} className="flex items-start gap-2 text-[12px] leading-5 text-slate-700"><Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />{item}</li>)}</ul>
                <a href={`#contact`} onClick={() => updateField("plan", plan.planKey)} className={`mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-[12px] font-semibold transition ${plan.featured ? "public-button-primary text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-700"}`}>{plan.planKey === "hospital_franchise" ? "Request custom quote" : "Discuss this plan"}<ArrowRight size={13} /></a>
              </article>)}
            </div>
            <p className="mt-3 text-center text-[12px] leading-5 text-slate-500">Final pricing depends on locations, user requirements, onboarding, data migration and integrations. Taxes and third-party charges, if applicable, are quoted separately.</p>
          </div>
        </section>

        <section id="contact" className="public-section py-14 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-6 px-3 sm:px-4 lg:grid-cols-[.8fr_1.2fr] lg:gap-12 lg:px-6">
            <div className="pt-1"><p className="text-[12px] font-bold uppercase tracking-[.19em] text-indigo-600">Talk to us</p><h2 className="mt-2.5 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Plan your clinic, hospital or franchise rollout.</h2><p className="mt-3 text-[13px] leading-6 text-slate-600 sm:text-sm">Tell us a little about your organization. The team can follow up to understand your locations, workflow and deployment requirements.</p><div className="mt-4 space-y-3">{[{ icon: Building2, title: "For clinics and hospitals", text: "Discuss a deployment that fits your team and branches." }, { icon: Layers3, title: "For franchise operators", text: "Explore organization structure, access and phased rollout." }, { icon: ClipboardCheck, title: "Clear next steps", text: "Start with a walkthrough and a scope-based proposal." }].map((item) => { const Icon = item.icon; return <div key={item.title} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-700 ring-1 ring-indigo-100"><Icon size={15} /></span><span><b className="block text-[12px] font-semibold text-slate-800">{item.title}</b><span className="mt-0.5 block text-[12px] leading-5 text-slate-500">{item.text}</span></span></div>; })}</div></div>
            <div className="public-card rounded-2xl p-3 shadow-[0_16px_50px_rgba(37,52,99,.08)] sm:p-4">
              {submitted ? <div className="flex min-h-[360px] flex-col items-center justify-center text-center"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CircleCheck size={25} /></span><h3 className="mt-3 text-lg font-semibold text-slate-950">Request received</h3><p className="mt-2 max-w-sm text-[13px] leading-6 text-slate-600">Thank you for your interest in V-Sync. Your enquiry has been recorded for follow-up.</p><button type="button" onClick={() => setSubmitted(false)} className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50">Send another enquiry</button></div> : <form onSubmit={submitInquiry} className="space-y-3.5">
                <div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Contact person *</span><input required value={form.name} onChange={(e) => updateField("name", e.target.value)} autoComplete="name" maxLength={100} placeholder="Your full name" className="h-10 w-full rounded-lg border bg-white px-3 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400" /></label><label className="block"><span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Hospital / practice name *</span><input required value={form.organization} onChange={(e) => updateField("organization", e.target.value)} maxLength={160} placeholder="Organization name" className="h-10 w-full rounded-lg border bg-white px-3 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400" /></label></div>
                <div className="grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Work email *</span><input required type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} autoComplete="email" maxLength={180} placeholder="name@hospital.com" className="h-10 w-full rounded-lg border bg-white px-3 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400" /></label><label className="block"><span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Phone number *</span><input required type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} autoComplete="tel" maxLength={24} pattern="[+0-9() .-]{8,24}" placeholder="+91 00000 00000" className="h-10 w-full rounded-lg border bg-white px-3 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400" /></label></div>
                <div className="grid gap-3 sm:grid-cols-3"><label className="block"><span className="mb-1.5 block text-[12px] font-semibold text-slate-700">I am a</span><select value={form.role} onChange={(e) => updateField("role", e.target.value)} className="h-10 w-full rounded-lg border bg-white px-2.5 text-[12px] text-slate-700 outline-none"><option>Hospital / clinic owner</option><option>Doctor / optometrist</option><option>Practice administrator</option><option>Franchise operator</option><option>IT / procurement</option><option>Other</option></select></label><label className="block"><span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Plan of interest</span><select value={form.plan} onChange={(e) => updateField("plan", e.target.value)} className="h-10 w-full rounded-lg border bg-white px-2.5 text-[12px] text-slate-700 outline-none"><option value="essential_clinic">Essential Clinic</option><option value="practice_plus">Practice Plus</option><option value="hospital_franchise">Hospital & Franchise</option><option value="not_sure">Not sure yet</option></select></label><label className="block"><span className="mb-1.5 block text-[12px] font-semibold text-slate-700">Number of branches</span><select value={form.branches} onChange={(e) => updateField("branches", e.target.value)} className="h-10 w-full rounded-lg border bg-white px-2.5 text-[12px] text-slate-700 outline-none"><option value="1">1 location</option><option value="2">2 locations</option><option value="3">3 locations</option><option value="4">4–5 locations</option><option value="6">6+ locations</option></select></label></div>
                <label className="block"><span className="mb-1.5 block text-[12px] font-semibold text-slate-700">What would you like to manage? <span className="font-normal text-slate-400">(optional)</span></span><textarea rows={3} maxLength={1500} value={form.message} onChange={(e) => updateField("message", e.target.value)} placeholder="Tell us about your workflows, locations or requirements..." className="w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-[12px] leading-5 text-slate-800 outline-none transition placeholder:text-slate-400" /></label>
                <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => updateField("website", e.target.value)} /></label></div>
                {formError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] leading-5 text-rose-700">{formError}</p>}
                <button type="submit" disabled={submitting} className="public-button-primary inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-3 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60">{submitting ? "Sending request..." : "Request a demo / quote"}<ArrowRight size={14} /></button>
                <p className="text-[12px] leading-4 text-slate-500">By submitting, you agree that the V-Sync team may contact you about this enquiry. Do not include patient or other sensitive health information.</p>
              </form>}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white/75 py-4">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:px-6"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-500 text-white"><Eye size={14} /></span><span className="text-[12px] font-semibold text-slate-800">V-Sync</span><span className="text-[12px] text-slate-400">Vision Practice Platform</span></div><div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-500"><a href="#platform" className="hover:text-indigo-700">Platform</a><a href="#pricing" className="hover:text-indigo-700">Pricing</a><a href="#contact" className="hover:text-indigo-700">Contact</a><Link to="/login" className="font-semibold text-indigo-700 hover:text-indigo-900">Staff sign in</Link></div><p className="text-[12px] text-slate-400">© {new Date().getFullYear()} V-Sync. All rights reserved.</p></div>
      </footer>
    </div>
  );
}
