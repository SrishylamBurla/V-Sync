import { useEffect, useState } from "react";
import { ArrowLeft, Boxes, CheckCircle2, RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getSundryJob, updateSundryJobStatus } from "../sundryJob.api";

const next = { ordered: "not_ready", not_ready: "ready", ready: "notified", notified: "collected" };
const label = (v) => String(v || "").replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());
const name = p => [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ") || "Unknown patient";

export default function SundryJobDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true); setError("");
    try { const r = await getSundryJob(id); setJob(r?.data || null); }
    catch (e) { setError(e?.response?.data?.message || e?.message || "Unable to load sundry job."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const advance = async () => {
    if (!next[job?.status]) return;
    try { const r = await updateSundryJobStatus(id, next[job.status]); setJob(r?.data || job); }
    catch (e) { setError(e?.response?.data?.message || "Unable to update status."); }
  };

  if (loading) return <div className="p-10 text-center text-sm text-slate-400">Loading sundry job...</div>;
  if (!job) return <div className="mx-auto max-w-3xl p-6"><div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Sundry job not found."}</div></div>;

  return <div className="mx-auto w-full max-w-4xl space-y-5 py-5 sm:py-7">
    <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900"><ArrowLeft size={15}/> Back</button>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><Boxes size={20}/></div><div><div className="text-[10px] font-bold uppercase tracking-wider text-violet-600">Dispensing · Sundry</div><h1 className="mt-1 text-xl font-bold text-slate-950">{job.jobNumber}</h1><p className="mt-1 text-sm text-slate-500">{job.item?.description || job.item?.code || "Sundry item"}</p></div></div>
        {next[job.status] && <button onClick={advance} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white"><CheckCircle2 size={14}/>{label(next[job.status])}</button>}
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] uppercase text-slate-400">Patient</div><button onClick={() => navigate(`/patients/${job.patientId?._id}`)} className="mt-1 text-sm font-bold hover:underline">{name(job.patientId)}</button></div>
        <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] uppercase text-slate-400">Quantity</div><div className="mt-1 text-sm font-bold">{job.quantity}</div></div>
        <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] uppercase text-slate-400">Total</div><div className="mt-1 text-sm font-bold">₹{Number(job.total || 0).toLocaleString("en-IN")}</div></div>
        <div className="rounded-xl bg-slate-50 p-3"><div className="text-[10px] uppercase text-slate-400">Status</div><div className="mt-1 text-sm font-bold">{label(job.status)}</div></div>
      </div>
      <button onClick={load} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600"><RefreshCw size={13}/> Refresh</button>
    </section>
  </div>;
}
