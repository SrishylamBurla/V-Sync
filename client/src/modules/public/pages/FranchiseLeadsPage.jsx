import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import api from "../../../services/api";

const STATUSES = [
  ["new", "New"],
  ["contacted", "Contacted"],
  ["qualified", "Qualified"],
  ["closed", "Closed"],
];

const PLAN_LABELS = {
  essential_clinic: "Essential Clinic",
  practice_plus: "Practice Plus",
  hospital_franchise: "Hospital & Franchise",
  not_sure: "Not sure yet",
};

const STATUS_CLASSES = {
  new: "border-blue-100 bg-blue-50 text-blue-700",
  contacted: "border-amber-100 bg-amber-50 text-amber-700",
  qualified: "border-emerald-100 bg-emerald-50 text-emerald-700",
  closed: "border-slate-200 bg-slate-100 text-slate-600",
};

const EMPTY_PAGINATION = { page: 1, limit: 25, total: 0, pages: 1 };
const EMPTY_SUMMARY = { total: 0, new: 0, contacted: 0, qualified: 0, closed: 0 };

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

export default function FranchiseLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [updatingId, setUpdatingId] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/public/leads", {
        params: {
          page,
          limit: 25,
          q: search.trim() || undefined,
          status: statusFilter === "all" ? undefined : statusFilter,
        },
      });
      const payload = response?.data;
      setLeads(Array.isArray(payload?.data) ? payload.data : []);
      setPagination(payload?.pagination || { ...EMPTY_PAGINATION, page });
      setSummary(payload?.summary || EMPTY_SUMMARY);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load franchise enquiries.");
      setLeads([]);
      setPagination({ ...EMPTY_PAGINATION, page });
      setSummary(EMPTY_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLeads(), search.trim() ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [loadLeads, search]);

  const handleSearch = (value) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilter = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const updateStatus = async (lead, status) => {
    if (!lead?._id || !status || status === lead.status) return;
    const previous = lead.status;
    setUpdatingId(lead._id);
    setError("");
    setLeads((current) =>
      current.map((item) => (item._id === lead._id ? { ...item, status } : item)),
    );
    try {
      const response = await api.patch(`/public/leads/${lead._id}/status`, {
        status,
        statusNote: lead.statusNote || "",
      });
      const updated = response?.data?.data;
      if (updated) {
        setLeads((current) =>
          current.map((item) => (item._id === lead._id ? { ...item, ...updated } : item)),
        );
      }
      await loadLeads();
    } catch (err) {
      setLeads((current) =>
        current.map((item) => (item._id === lead._id ? { ...item, status: previous } : item)),
      );
      setError(err?.response?.data?.message || "Unable to update enquiry status.");
    } finally {
      setUpdatingId("");
    }
  };

  const metricCards = [
    { label: "Matching enquiries", value: summary.total, icon: Users, tone: "from-indigo-50 to-white" },
    { label: "New", value: summary.new, icon: CalendarClock, tone: "from-blue-50 to-white" },
    { label: "Qualified", value: summary.qualified, icon: CheckCircle2, tone: "from-emerald-50 to-white" },
    { label: "Closed", value: summary.closed, icon: XCircle, tone: "from-slate-50 to-white" },
  ];

  return (
    <div className="space-y-3 py-3 sm:py-3">
      <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-white via-white to-indigo-50/60 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[.16em] text-indigo-600">
            <Building2 size={13} /> Public website leads
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Hospital & franchise enquiries</h1>
          <p className="mt-1 text-[12px] text-slate-500">
            Review demo requests, contact decision-makers, and track each enquiry through follow-up.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadLeads()}
          disabled={loading}
          className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </header>

      {error && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="rounded-md p-1 hover:bg-rose-100">
            <XCircle size={15} />
          </button>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label} className={`rounded-xl border border-slate-200 bg-gradient-to-br ${item.tone} p-3.5 shadow-sm`}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-slate-500">{item.label}</span>
                <Icon size={15} className="text-indigo-600" />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{loading ? "—" : item.value}</div>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2.5 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative w-full sm:max-w-sm">
            <span className="sr-only">Search enquiries</span>
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => handleSearch(event.target.value)}
              placeholder="Search contact, hospital, email or phone..."
              className="h-9 w-full rounded-lg border bg-white pl-8 pr-3 text-[12px] outline-none"
            />
          </label>
          <select
            aria-label="Filter enquiries by status"
            value={statusFilter}
            onChange={(event) => handleStatusFilter(event.target.value)}
            className="h-9 rounded-lg border bg-white px-3 text-[12px] text-slate-700 outline-none"
          >
            <option value="all">All statuses</option>
            {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="p-6 text-center text-[12px] text-slate-500">Loading enquiries…</div>
        ) : !leads.length ? (
          <div className="p-8 text-center">
            <Building2 size={24} className="mx-auto text-slate-300" />
            <h2 className="mt-3 text-[13px] font-semibold text-slate-800">No enquiries match these filters</h2>
            <p className="mt-1 text-[12px] text-slate-500">Try another search or status. New demo and quote requests will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-slate-50/90 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Contact</th>
                  <th className="px-3 py-2.5">Organization</th>
                  <th className="px-3 py-2.5">Interest</th>
                  <th className="px-3 py-2.5">Branches</th>
                  <th className="px-3 py-2.5">Received</th>
                  <th className="px-3 py-2.5">Status / next step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[12px]">
                {leads.map((lead) => (
                  <tr key={lead._id} className="transition hover:bg-indigo-50/25">
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-800">{lead.name}</div>
                      <a className="mt-0.5 block text-[12px] text-indigo-700 hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a>
                      <a className="mt-0.5 block text-[12px] text-slate-500 hover:text-slate-700" href={`tel:${lead.phone}`}>{lead.phone}</a>
                      <div className="mt-1 text-[12px] text-slate-400">{lead.role || "—"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-slate-700">{lead.organization}</div>
                      {lead.message && <p className="mt-1 max-w-[260px] whitespace-normal text-[12px] leading-4 text-slate-500">{lead.message}</p>}
                    </td>
                    <td className="px-3 py-3 text-slate-600">{PLAN_LABELS[lead.plan] || "Not sure yet"}</td>
                    <td className="px-3 py-3 text-slate-600">{lead.branches || 1}</td>
                    <td className="px-3 py-3 text-[12px] text-slate-500">{formatDate(lead.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col items-start gap-1.5">
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[12px] font-semibold ${STATUS_CLASSES[lead.status] || STATUS_CLASSES.new}`}>
                          {STATUSES.find(([value]) => value === lead.status)?.[1] || "New"}
                        </span>
                        <select
                          aria-label={`Update status for ${lead.organization}`}
                          value={lead.status || "new"}
                          disabled={updatingId === lead._id}
                          onChange={(event) => void updateStatus(lead, event.target.value)}
                          className="h-8 max-w-32 rounded-lg border bg-white px-2 text-[12px] outline-none disabled:opacity-60"
                        >
                          {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2.5 text-[12px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            {pagination.total === 0 ? "No matching records" : `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} enquiries`}
          </span>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button type="button" disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronLeft size={13} /> Previous
            </button>
            <span className="min-w-16 text-center font-medium">Page {pagination.page} of {pagination.pages}</span>
            <button type="button" disabled={loading || page >= pagination.pages} onClick={() => setPage((value) => Math.min(pagination.pages, value + 1))} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">
              Next <ChevronRight size={13} />
            </button>
          </div>
        </footer>
      </section>
      <p className="text-[12px] leading-5 text-slate-400">Lead data is visible to super administrators only. Handle contact details in accordance with your privacy and retention policy.</p>
    </div>
  );
}
