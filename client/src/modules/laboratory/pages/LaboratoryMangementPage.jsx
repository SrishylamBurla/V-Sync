import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  PackageCheck,
  RefreshCw,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DocumentShell,
  Section,
  Table,
} from "../../../components/common/DocumentUI";
import { getDispensingList } from "../../dispensing/dispensing.api";

const LAB_STATUSES = [
  "ordered",
  "not_ready",
  "ready",
  "notified",
  "collected",
  "cancelled",
];
const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
const name = (p) =>
  [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ") ||
  "Unknown patient";

export default function LaboratoryManagementPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getDispensingList(status ? { status } : {});
      setRows(response?.data || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load laboratory jobs.",
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return rows.filter(
      (row) =>
        !term ||
        [
          row.recordNumber,
          row.itemType,
          name(row.patientId),
          row.patientId?.patientNumber,
          row.brand,
          row.model,
          row.frame?.code,
          row.lens?.code,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(term),
    );
  }, [rows, query]);

  const pending = rows.filter((row) =>
    ["ordered", "not_ready"].includes(row.status),
  ).length;
  const ready = rows.filter((row) => row.status === "ready").length;
  const notified = rows.filter((row) => row.status === "notified").length;

  return (
    <DocumentShell
      eyebrow="Laboratory workspace"
      title="Laboratory Management"
      subtitle="Keep optical production work separate from clinical records and administrative workflows."
      code="LAB"
      actions={
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      }
    >
      {error && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error}
        </div>
      )}
      <Section number="01" title="Production overview">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric icon={Clock3} label="Pending production" value={pending} />
          <Metric icon={CheckCircle2} label="Ready" value={ready} />
          <Metric icon={PackageCheck} label="Notified" value={notified} />
        </div>
      </Section>
      <Section number="02" title="Production queue">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search job, patient, frame or lens..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:bg-white"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">All production statuses</option>
            {LAB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400">
            <RefreshCw size={14} className="animate-spin" />
            Loading production queue...
          </div>
        ) : (
          <Table
            rows={filtered}
            empty="No laboratory jobs found."
            columns={[
              {
                key: "job",
                label: "Job",
                render: (r) => (
                  <button
                    type="button"
                    onClick={() => navigate(`/dispensing/${r._id}`)}
                    className="font-semibold text-slate-900 hover:text-blue-700"
                  >
                    {r.recordNumber}
                  </button>
                ),
              },
              {
                key: "type",
                label: "Type",
                render: (r) => (
                  <span className="inline-flex items-center gap-1.5">
                    <Activity size={12} className="text-slate-400" />
                    {r.itemType}
                  </span>
                ),
              },
              {
                key: "patient",
                label: "Patient",
                render: (r) => (
                  <span>
                    <b>{name(r.patientId)}</b>
                    <span className="ml-2 text-[10px] text-slate-400">
                      {r.patientId?.patientNumber || "—"}
                    </span>
                  </span>
                ),
              },
              {
                key: "frame",
                label: "Frame",
                render: (r) => r.frame?.code || "—",
              },
              {
                key: "lens",
                label: "Lens",
                render: (r) => r.lens?.code || "—",
              },
              {
                key: "status",
                label: "Status",
                render: (r) => (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase">
                    {label(r.status)}
                  </span>
                ),
              },
            ]}
          />
        )}
      </Section>
    </DocumentShell>
  );
}

function Metric({ icon: Icon, label: title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={14} />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {title}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
