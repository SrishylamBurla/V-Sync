import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  RefreshCw,
  Search,
  Stethoscope,
  UserRound,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAppointmentClinicians,
  getAppointments,
} from "../../appointments/appointment.api";

const STATUS = [
  "booked",
  "confirmed",
  "here",
  "examining",
  "complete",
  "cancelled",
  "no_show",
];

const statusLabel = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const patientName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ") || "Unknown patient";

const dateInput = (date = new Date()) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const formatTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const clinicianName = (clinician) =>
  [clinician?.firstName, clinician?.lastName].filter(Boolean).join(" ") ||
  "Unassigned";

export default function ClinicalManagementPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(() => dateInput());
  const [status, setStatus] = useState("");
  const [clinicianId, setClinicianId] = useState("");
  const [query, setQuery] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [clinicians, setClinicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAppointments({ date, status, clinicianId });
      setAppointments(response?.data || []);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Unable to load the clinical workspace.",
      );
    } finally {
      setLoading(false);
    }
  }, [date, status, clinicianId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let mounted = true;
    getAppointmentClinicians()
      .then((response) => {
        if (mounted) setClinicians(response?.data || []);
      })
      .catch((requestError) => {
        if (mounted) {
          setError(
            requestError?.response?.data?.message ||
              requestError?.message ||
              "Unable to load clinicians.",
          );
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return appointments;

    return appointments.filter((appointment) =>
      [
        patientName(appointment.patientId),
        appointment.patientId?.patientNumber,
        appointment.patientId?.phone,
        appointment.type,
        appointment.reason,
        clinicianName(appointment.clinicianId),
        appointment.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [appointments, query]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        STATUS.map((item) => [
          item,
          appointments.filter((a) => a.status === item).length,
        ]),
      ),
    [appointments],
  );

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 py-5 sm:py-7">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-5 lg:px-7">
        <header className="mb-5 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">
                Clinical workspace
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                Clinical Management
              </h1>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                Manage the clinical queue, consultations, examinations and
                prescriptions. Optical dispensing is handled separately.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] font-bold text-slate-500">
                CLINICAL
              </div>
              <button
                type="button"
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <RefreshCw size={14} className="animate-spin" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </header>
        {error && (
          <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <Section
          number="01"
          title="Clinical queue"
          description="Live appointment activity for the selected practice date."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              icon={CalendarDays}
              label="Appointments"
              value={appointments.length}
            />
            <Metric
              icon={Clock3}
              label="Waiting / confirmed"
              value={counts.confirmed + counts.here}
            />
            <Metric
              icon={Stethoscope}
              label="Examining"
              value={counts.examining}
            />
            <Metric
              icon={CheckCircle2}
              label="Completed"
              value={counts.complete}
            />
          </div>
        </Section>

        <Section number="02" title="Clinical register">
          <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_170px_220px_170px]">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search patient, number, phone or clinician..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
              />
            </div>

            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            />

            <select
              value={clinicianId}
              onChange={(event) => setClinicianId(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">All clinicians</option>
              {clinicians.map((clinician) => (
                <option key={clinician._id} value={clinician._id}>
                  {clinicianName(clinician)}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
            >
              <option value="">All statuses</option>
              {STATUS.map((item) => (
                <option key={item} value={item}>
                  {statusLabel(item)}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <LoadingState label="Loading clinical appointments..." />
          ) : (
            <Table
              rows={filtered}
              empty="No clinical appointments match the current filters."
              columns={[
                {
                  key: "time",
                  label: "Time",
                  render: (row) => (
                    <div className="font-semibold text-slate-800">
                      {formatTime(row.appointmentDate)}
                      <div className="mt-0.5 text-[10px] font-normal text-slate-400">
                        {row.durationMinutes || 30} min
                      </div>
                    </div>
                  ),
                },
                {
                  key: "patient",
                  label: "Patient",
                  render: (row) => (
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/patients/${row.patientId?._id}`)
                      }
                      className="text-left"
                    >
                      <span className="block font-semibold text-slate-800 hover:text-blue-700">
                        {patientName(row.patientId)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {row.patientId?.patientNumber || "No patient number"}
                        {row.patientId?.phone
                          ? ` · ${row.patientId.phone}`
                          : ""}
                      </span>
                    </button>
                  ),
                },
                {
                  key: "reason",
                  label: "Visit",
                  render: (row) => (
                    <div>
                      <div className="font-medium text-slate-700">
                        {row.type || "Eye Examination"}
                      </div>
                      <div className="mt-0.5 max-w-[260px] truncate text-[10px] text-slate-400">
                        {row.reason || "Routine clinical visit"}
                      </div>
                    </div>
                  ),
                },
                {
                  key: "clinician",
                  label: "Clinician",
                  render: (row) => clinicianName(row.clinicianId),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (row) => <StatusBadge value={row.status} />,
                },
                {
                  key: "action",
                  label: "Action",
                  align: "right",
                  render: (row) => (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/appointments/${row._id}`)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Eye size={12} /> View
                      </button>
                      {row.patientId?._id &&
                        !["cancelled", "no_show"].includes(row.status) && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/patients/${row.patientId._id}/consultations/new`,
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-slate-800"
                          >
                            <Stethoscope size={12} /> Consult
                          </button>
                        )}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </Section>

        <Section number="03" title="Clinical status guide">
          <div className="flex flex-wrap gap-2">
            {STATUS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setStatus(status === item ? "" : item)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-[10px] font-bold transition ${
                  status === item
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                {item === "complete" ? (
                  <CheckCircle2 size={12} />
                ) : item === "cancelled" ? (
                  <XCircle size={12} />
                ) : (
                  <UserRound size={12} />
                )}
                {statusLabel(item)}
                <span className="opacity-60">{counts[item] || 0}</span>
              </button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        <Icon size={14} />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
    </div>
  );
}

function StatusBadge({ value }) {
  return (
    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
      {statusLabel(value)}
    </span>
  );
}

function LoadingState({ label }) {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-xs text-slate-400">
      <RefreshCw size={14} className="animate-spin" />
      {label}
    </div>
  );
}

function Section({ number, title, description, children }) {
  return (
    <section className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="flex items-center gap-2">
          {number && (
            <span className="text-[10px] font-bold text-blue-600">
              {number}
            </span>
          )}
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        </div>
        {description && (
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        )}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function Table({ rows, columns, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-xs">
        <thead>
          <tr className="border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-400">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-3 ${column.align === "right" ? "text-right" : ""}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr
                key={row._id || row.id || index}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-3 py-3 align-middle ${column.align === "right" ? "text-right" : ""}`}
                  >
                    {column.render
                      ? column.render(row)
                      : (row[column.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="py-14 text-center text-xs text-slate-400"
              >
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
