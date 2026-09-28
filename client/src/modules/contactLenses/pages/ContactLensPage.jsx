import { useEffect, useMemo, useState } from "react";
import { Plus, Search, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getContactLenses } from "../contactLens.api";

import {
  DocumentShell,
  Section,
  Table,
} from "../../../components/common/DocumentUI";

const name = (p) =>
  [p?.firstName, p?.middleName, p?.lastName]
    .filter(Boolean)
    .join(" ") || "Unknown patient";

const statuses = [
  "draft",
  "ordered",
  "ready",
  "notified",
  "collected",
  "cancelled",
];

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function ContactLensPage() {
  const nav = useNavigate();

  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getContactLenses(
        status ? { status } : {},
      );

      setRows(response?.data || []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to load contact lens orders",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const filtered = useMemo(() => {
    const search = q.trim().toLowerCase();

    if (!search) return rows;

    return rows.filter((x) => {
      const searchable = [
        x?.orderNumber,
        name(x?.patientId),
        x?.patientId?.patientNumber,
        x?.patientId?.phone,
        x?.patientId?.mobile,
        x?.brand,
        x?.model,
        x?.orderType,
        x?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(search);
    });
  }, [rows, q]);

  const counts = useMemo(() => {
    return Object.fromEntries(
      statuses.map((s) => [
        s,
        rows.filter((row) => row?.status === s).length,
      ]),
    );
  }, [rows]);

  return (
    <DocumentShell
      eyebrow="Dispensing workspace"
      title="Contact Lens Jobs"
      subtitle="Manage contact lens orders from creation through collection."
      code="CONTACT LENS"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={() =>
              nav("/dispensing/contact-lenses/new")
            }
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={14} />
            New contact lens job
          </button>
        </div>
      }
    >
      {error && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =========================
          01 — JOB REGISTER
      ========================== */}
      <Section
        number="01"
        title="Contact lens job register"
        description="View and manage contact lens dispensing jobs for your practice."
      >
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_190px]">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search job, patient, phone, brand or model..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-300"
          >
            <option value="">All statuses</option>

            {statuses.map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Loading contact lens jobs...
          </div>
        ) : (
          <Table
            columns={[
              {
                key: "order",
                label: "Job",
                render: (r) => (
                  <button
                    type="button"
                    onClick={() =>
                      nav(
                        `/dispensing/contact-lenses/${r?._id}`,
                      )
                    }
                    className="font-semibold text-slate-900 hover:underline"
                  >
                    {r?.orderNumber || "—"}
                  </button>
                ),
              },

              {
                key: "patient",
                label: "Patient",
                render: (r) => {
                  const patientId = r?.patientId?._id;

                  return patientId ? (
                    <button
                      type="button"
                      onClick={() =>
                        nav(`/patients/${patientId}`)
                      }
                      className="text-left"
                    >
                      <span className="block font-semibold text-slate-800 hover:underline">
                        {name(r?.patientId)}
                      </span>

                      <span className="text-[10px] text-slate-400">
                        {r?.patientId?.patientNumber || "No patient number"}
                        {r?.patientId?.phone
                          ? ` · ${r.patientId.phone}`
                          : ""}
                      </span>
                    </button>
                  ) : (
                    <div>
                      <span className="block font-semibold text-slate-800">
                        {name(r?.patientId)}
                      </span>

                      <span className="text-[10px] text-slate-400">
                        No patient information
                      </span>
                    </div>
                  );
                },
              },

              {
                key: "type",
                label: "Type",
                render: (r) => (
                  <span className="text-xs text-slate-600">
                    {label(r?.orderType)}
                  </span>
                ),
              },

              {
                key: "lens",
                label: "Lens",
                render: (r) => (
                  <div>
                    <span className="block font-medium text-slate-700">
                      {r?.brand || "—"}
                    </span>

                    {r?.model && (
                      <span className="text-[10px] text-slate-400">
                        {r.model}
                      </span>
                    )}
                  </div>
                ),
              },

              {
                key: "qty",
                label: "Qty",
                render: (r) => r?.quantity ?? "—",
              },

              {
                key: "total",
                label: "Total",
                render: (r) =>
                  `₹${Number(r?.total || 0).toFixed(2)}`,
              },

              {
                key: "status",
                label: "Status",
                render: (r) => (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    {label(r?.status)}
                  </span>
                ),
              },
            ]}
            rows={filtered}
            empty="No contact lens jobs found."
          />
        )}
      </Section>

      {/* =========================
          02 — WORKFLOW SUMMARY
      ========================== */}
      <Section
        number="02"
        title="Workflow summary"
        description="Current contact lens jobs grouped by dispensing status."
      >
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {statuses.map((s) => {
            const active = status === s;

            return (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setStatus(active ? "" : s)
                }
                className={`rounded-xl border p-4 text-left transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    active
                      ? "text-slate-300"
                      : "text-slate-400"
                  }`}
                >
                  {label(s)}
                </div>

                <div className="mt-2 text-2xl font-bold">
                  {counts[s] || 0}
                </div>

                <div
                  className={`mt-1 text-[10px] ${
                    active
                      ? "text-slate-400"
                      : "text-slate-400"
                  }`}
                >
                  Contact lens jobs
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* =========================
          03 — WORKFLOW
      ========================== */}
      <Section
        number="03"
        title="Dispensing workflow"
        description="Contact lens jobs move through the dispensing process."
      >
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            Draft
          </span>

          <span>→</span>

          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            Ordered
          </span>

          <span>→</span>

          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            Ready
          </span>

          <span>→</span>

          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            Notified
          </span>

          <span>→</span>

          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            Collected
          </span>
        </div>
      </Section>
    </DocumentShell>
  );
}