import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileText,
  MoreVertical,
  History,
  PackageCheck,
  Pill,
  RefreshCw,
  Search,
  Stethoscope,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import {
  getAppointments,
  getAppointmentClinicians,
  updateAppointment,
} from "../appointments/appointment.api";
import { getPatient } from "../patients/patient.api";
import { getPatientConsultations } from "../clinical/consultation.api";
import {
  getReportOverview,
  getOperationalReports,
} from "../reports/reports.api";
import { useAuth } from "../auth/AuthContext";

const statusMap = {
  booked: "Booked",
  confirmed: "Confirmed",
  here: "Here",
  examining: "Examining",
  complete: "Complete",
  cancelled: "Cancelled",
  no_show: "No show",
};

const statusClass = {
  booked: "bg-slate-100 text-slate-700",
  confirmed: "bg-blue-50 text-blue-700",
  here: "bg-amber-50 text-amber-700",
  examining: "bg-violet-50 text-violet-700",
  complete: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-orange-50 text-orange-700",
};

const chartPalette = [
  "#2563eb",
  "#7c3aed",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#0ea5e9",
];
const statusOptions = Object.keys(statusMap);

const fullName = (p) =>
  [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ");
const dateKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const fmtDate = (value, options = {}) =>
  new Date(value).toLocaleDateString("en-IN", options);
const fmtTime = (value) =>
  new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const normalizeAppointments = (response) =>
  Array.isArray(response?.data) ? response.data : [];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = [
    "super_admin",
    "organization_admin",
    "branch_manager",
  ].includes(user?.role);
  const today = dateKey(new Date());

  const [selectedDate, setSelectedDate] = useState(today);
  const [appointments, setAppointments] = useState([]);
  const [clinicians, setClinicians] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [clinicianFilter, setClinicianFilter] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientConsultations, setPatientConsultations] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [actionMenuId, setActionMenuId] = useState(null);
  const [recordView, setRecordView] = useState("full");

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getAppointments({
        date: selectedDate,
        status: statusFilter,
        clinicianId: clinicianFilter,
        search: query.trim(),
      });
      setAppointments(normalizeAppointments(response));
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, statusFilter, clinicianFilter, query]);

  useEffect(() => {
    getAppointmentClinicians()
      .then((response) =>
        setClinicians(Array.isArray(response?.data) ? response.data : []),
      )
      .catch(() => setClinicians([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAppointments();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadAppointments]);

  const dateStrip = useMemo(() => {
    const base = new Date(`${selectedDate}T12:00:00`);
    return Array.from({ length: 7 }, (_, index) => {
      const d = new Date(base);
      d.setDate(d.getDate() + index - 3);
      return dateKey(d);
    });
  }, [selectedDate]);

  const setDate = (value) => setSelectedDate(value);
  const moveDate = (delta) => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + delta);
    setDate(dateKey(d));
  };

  const openPatientPreview = async (appointment) => {
    const patientId = appointment?.patientId?._id;
    if (!patientId) return;
    setSelectedAppointment(appointment);
    setSelectedPatient(null);
    setPatientConsultations([]);
    setPatientLoading(true);
    try {
      const [patientResponse, consultationResponse] = await Promise.all([
        getPatient(patientId),
        getPatientConsultations(patientId),
      ]);
      setSelectedPatient(
        patientResponse?.data || appointment.patientId || null,
      );
      setPatientConsultations(
        Array.isArray(consultationResponse?.data)
          ? consultationResponse.data
          : [],
      );
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load patient history");
    } finally {
      setPatientLoading(false);
    }
  };

  const closePatientModal = () => {
    setSelectedAppointment(null);
    setSelectedPatient(null);
    setPatientConsultations([]);
    setActionMenuId(null);
  };

  const openFullPatientRecord = async (appointment) => {
    setActionMenuId(null);
    setRecordView("full");
    await openPatientPreview(appointment);
  };

  const openPreviousConsultation = async (appointment) => {
    setActionMenuId(null);
    setRecordView("consultation");
    await openPatientPreview(appointment);
  };

  const openPatientDocuments = (appointment) => {
    setActionMenuId(null);
    const patientId = appointment?.patientId?._id;
    if (!patientId) return;
    navigate(`/patients/${patientId}`, {
      state: { openDocuments: true },
    });
  };

  const changeStatus = async (appointment, nextStatus) => {
    if (!appointment || appointment.status === nextStatus) return;
    setStatusSaving(true);
    try {
      const response = await updateAppointment(appointment._id, {
        status: nextStatus,
        statusNote: `Dashboard status changed to ${statusMap[nextStatus]}`,
      });
      const updated = response?.data || { ...appointment, status: nextStatus };
      setAppointments((current) =>
        current.map((item) => (item._id === appointment._id ? updated : item)),
      );
      setSelectedAppointment((current) =>
        current?._id === appointment._id ? updated : current,
      );
    } catch (e) {
      setError(
        e?.response?.data?.message || "Unable to update appointment status",
      );
    } finally {
      setStatusSaving(false);
    }
  };

  const counts = useMemo(() => {
    const data = {
      total: appointments.length,
      booked: 0,
      confirmed: 0,
      here: 0,
      examining: 0,
      complete: 0,
      cancelled: 0,
      no_show: 0,
    };
    appointments.forEach((item) => {
      if (data[item.status] !== undefined) data[item.status] += 1;
    });
    return data;
  }, [appointments]);

  const monthlyRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getFullYear(), end.getMonth(), 1);
    return { from: dateKey(start), to: dateKey(end) };
  }, []);

  const [analytics, setAnalytics] = useState(null);
  const [operational, setOperational] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(isAdmin);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    Promise.all([
      getReportOverview(monthlyRange),
      getOperationalReports(monthlyRange),
    ])
      .then(([overview, ops]) => {
        if (!active) return;
        setAnalytics(overview?.data || null);
        setOperational(ops?.data || null);
      })
      .catch(() => {
        if (!active) return;
        setAnalytics(null);
        setOperational(null);
      })
      .finally(() => active && setAnalyticsLoading(false));
    return () => {
      active = false;
    };
  }, [isAdmin, monthlyRange]);

  const revenueTrend = useMemo(
    () =>
      (analytics?.daily || []).map((item) => ({
        name: item._id
          ? fmtDate(`${item._id}T12:00:00`, { day: "2-digit", month: "short" })
          : "—",
        revenue: Number(item.value || 0),
        paid: Number(item.paid || 0),
      })),
    [analytics],
  );

  const appointmentStatusData = useMemo(
    () =>
      (analytics?.appointmentStatuses || []).map((item) => ({
        name: statusMap[item._id] || item._id,
        value: Number(item.count || 0),
      })),
    [analytics],
  );

  const categoryData = useMemo(
    () =>
      (analytics?.revenueByCategory || []).map((item) => ({
        name: item._id || "Other",
        value: Number(item.value || 0),
      })),
    [analytics],
  );

  return (
    <div className="space-y-6 py-5 sm:py-7">
      <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-blue-700">
              <Activity size={12} /> Practice command centre
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Today
              </h1>
              <div className="flex items-center gap-1.5 rounded-xl border border-blue-100 bg-white/90 p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => moveDate(-1)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  aria-label="Previous day"
                >
                  <ChevronLeft size={14} />
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-8 border-0 bg-transparent px-1 text-xs font-bold text-slate-700 outline-none"
                  aria-label="Search appointments by date"
                />
                <button
                  type="button"
                  onClick={() => moveDate(1)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
                  aria-label="Next day"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setDate(today)}
                  className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-slate-800"
                >
                  Today
                </button>
              </div>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {fmtDate(selectedDate, {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}{" "}
              · patient flow, appointments and practice performance
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/appointments/book?mode=existing")}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800"
            >
              <CalendarClock size={15} /> Book Appointment
            </button>
            <button
              type="button"
              onClick={() => navigate("/patients")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Users size={15} /> Patients
            </button>
            <button
              type="button"
              onClick={loadAppointments}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            <X size={15} />
          </button>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          icon={CalendarClock}
          label="Appointments"
          value={counts.total}
          note="Selected date"
        />
        <Metric
          icon={Clock3}
          label="Waiting / upcoming"
          value={counts.booked + counts.confirmed + counts.here}
          note="Booked · confirmed · here"
        />
        <Metric
          icon={Users}
          label="Examining"
          value={counts.examining}
          note="Currently with clinician"
        />
        <Metric
          icon={CheckCircle2}
          label="Completed"
          value={counts.complete}
          note="Finished visits"
        />
        <Metric
          icon={XCircle}
          label="Cancelled / no-show"
          value={counts.cancelled + counts.no_show}
          note="Requires attention"
        />
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5 sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
                Appointment control
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Calendar-wise appointments
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Status is controlled from the dashboard. Click a patient for
                their complete clinical snapshot.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                {appointments.length} appointment
                {appointments.length === 1 ? "" : "s"} on this date
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2">
            {dateStrip.map((day) => {
              const active = day === selectedDate;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDate(day)}
                  className={`rounded-xl border px-2 py-2.5 text-center transition ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">
                    {fmtDate(`${day}T12:00:00`, { weekday: "short" })}
                  </div>
                  <div className="mt-1 text-sm font-bold">
                    {fmtDate(`${day}T12:00:00`, { day: "2-digit" })}
                  </div>
                  <div className="mt-0.5 text-[9px] opacity-70">
                    {fmtDate(`${day}T12:00:00`, { month: "short" })}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_200px]">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patient, number or phone..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:bg-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"
            >
              <option value="">All statuses</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {statusMap[s]}
                </option>
              ))}
            </select>
            <select
              value={clinicianFilter}
              onChange={(e) => setClinicianFilter(e.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"
            >
              <option value="">All clinicians</option>
              {clinicians.map((c) => (
                <option key={c._id} value={c._id}>
                  {fullName(c)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarClock size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-600">
              No appointments for this date
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Book an appointment or change the date/filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Visit type</th>
                  <th className="px-5 py-3">Optometrist</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((a) => (
                  <tr
                    key={a._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="text-sm font-bold text-slate-800">
                        {fmtTime(a.appointmentDate)}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {a.durationMinutes || 30} min
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => {
                          const patientId =
                            typeof a.patientId === "object"
                              ? a.patientId?._id
                              : a.patientId;

                          if (!patientId) return;

                          setActionMenuId(null);
                          navigate(`/patients/${patientId}`);
                        }}
                        className="text-left"
                        title="Open patient record"
                      >
                        <div className="text-sm font-semibold text-slate-900 hover:text-blue-700 hover:underline">
                          {fullName(a.patientId) || "Unknown patient"}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {a.patientId?.patientNumber || "—"} ·{" "}
                          {a.patientId?.phone ||
                            a.patientId?.mobile ||
                            "No phone"}
                        </div>
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        disabled={
                          statusSaving && selectedAppointment?._id === a._id
                        }
                        value={a.status}
                        onChange={(e) => changeStatus(a, e.target.value)}
                        className={`rounded-full border-0 px-3 py-1.5 text-[10px] font-bold outline-none ${statusClass[a.status] || statusClass.booked}`}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {statusMap[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-700">
                        {a.type || "Eye Examination"}
                      </div>
                      <div className="mt-1 max-w-[200px] truncate text-[10px] text-slate-400">
                        {a.reason || a.notes || "Routine visit"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-700">
                        {fullName(a.clinicianId) || "Unassigned"}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {a.clinicianId?.role || ""}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openPreviousConsultation(a)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                        >
                          <History size={12} /> Previous consultation
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            aria-label={`Actions for ${fullName(a.patientId) || "patient"}`}
                            onClick={() =>
                              setActionMenuId((current) =>
                                current === a._id ? null : a._id
                              )
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <MoreVertical size={17} />
                          </button>

                          {actionMenuId === a._id && (
                            <div className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                              <button
                                type="button"
                                onClick={() => {
                                  const patientId =
                                    typeof a.patientId === "object"
                                      ? a.patientId?._id
                                      : a.patientId;

                                  if (!patientId) return;

                                  setActionMenuId(null);
                                  navigate(`/patients/${patientId}`);
                                }}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <Users size={15} className="text-blue-600" />
                                Full patient record
                              </button>
                              <button
                                type="button"
                                onClick={() => openPatientDocuments(a)}
                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                <FileText size={15} className="text-emerald-600" />
                                Upload documents
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isAdmin && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-600">
                Management analytics
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Practice performance
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Admin-level operational and financial visibility.
              </p>
            </div>
            <span className="rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
              Month to date
            </span>
          </div>
          {analyticsLoading ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400">
              Loading management analytics...
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <Metric
                  icon={Users}
                  label="Active patients"
                  value={analytics?.counts?.patients ?? "—"}
                  note="Patient database"
                  accent="blue"
                />
                <Metric
                  icon={Stethoscope}
                  label="Consultations"
                  value={analytics?.counts?.consultations ?? "—"}
                  note="Clinical activity"
                  accent="violet"
                />
                <Metric
                  icon={PackageCheck}
                  label="Optical orders"
                  value={opticalMetric(analytics)}
                  note="Spectacle + contact lens"
                  accent="emerald"
                />
                <Metric
                  icon={CheckCircle2}
                  label="Collected"
                  value={money(analytics?.totals?.paid ?? analytics?.paid)}
                  note="Payments received"
                  accent="amber"
                />
                <Metric
                  icon={FileText}
                  label="Outstanding"
                  value={money(
                    analytics?.totals?.outstanding ?? analytics?.outstanding,
                  )}
                  note="Open balance"
                  accent="rose"
                />
              </div>
              <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
                <ChartCard
                  title="Revenue trend"
                  subtitle="Daily invoiced and collected value"
                >
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={revenueTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(v) => money(v)} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#2563eb"
                        fill="#2563eb"
                        fillOpacity={0.12}
                      />
                      <Area
                        type="monotone"
                        dataKey="paid"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.1}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>
                <ChartCard
                  title="Appointment status"
                  subtitle="Current reporting period"
                >
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={appointmentStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={92}
                        paddingAngle={3}
                      >
                        {appointmentStatusData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={chartPalette[i % chartPalette.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
              <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                <ChartCard
                  title="Revenue by category"
                  subtitle="Where practice revenue is coming from"
                >
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(v) => money(v)} />
                      <Bar
                        dataKey="value"
                        fill="#7c3aed"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
                <article className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-indigo-950 p-5 text-white shadow-sm">
                  <div className="text-[10px] font-bold uppercase tracking-[.18em] text-indigo-200">
                    Operational pulse
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      ["Today's appointments", counts.total],
                      [
                        "Consultations",
                        analytics?.counts?.consultations ?? "—",
                      ],
                      ["Spectacles", analytics?.counts?.spectacles ?? "—"],
                      [
                        "Contact lenses",
                        analytics?.counts?.contactLenses ?? "—",
                      ],
                      ["Recall due", operational?.recallsDue ?? "—"],
                      ["Low stock", operational?.lowStock ?? "—"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="text-[10px] uppercase tracking-wider text-indigo-200">
                          {label}
                        </div>
                        <div className="mt-1 text-xl font-bold">{value}</div>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </>
          )}
        </section>
      )}

      {selectedAppointment && (
        <PatientSnapshotModal
          appointment={selectedAppointment}
          patient={selectedPatient}
          consultations={patientConsultations}
          loading={patientLoading}
          view={recordView}
          onClose={closePatientModal}
          onOpenPatient={() =>
            navigate(`/patients/${selectedAppointment.patientId?._id}`, {
              state: { openDocuments: false },
            })
          }
          onUploadDocuments={() => openPatientDocuments(selectedAppointment)}
        />
      )}
    </div>
  );
}

function opticalMetric(analytics) {
  return (
    Number(analytics?.counts?.spectacles || 0) +
    Number(analytics?.counts?.contactLenses || 0)
  );
}
function Metric({ icon: Icon, label, value, note, accent = "slate" }) {
  const accents = {
    slate: {
      wrap: "from-slate-50 to-white border-slate-200",
      icon: "bg-slate-100 text-slate-600",
      value: "text-slate-900",
    },
    blue: {
      wrap: "from-blue-50 to-white border-blue-100",
      icon: "bg-blue-100 text-blue-600",
      value: "text-blue-900",
    },
    violet: {
      wrap: "from-violet-50 to-white border-violet-100",
      icon: "bg-violet-100 text-violet-600",
      value: "text-violet-900",
    },
    emerald: {
      wrap: "from-emerald-50 to-white border-emerald-100",
      icon: "bg-emerald-100 text-emerald-600",
      value: "text-emerald-900",
    },
    amber: {
      wrap: "from-amber-50 to-white border-amber-100",
      icon: "bg-amber-100 text-amber-600",
      value: "text-amber-900",
    },
    rose: {
      wrap: "from-rose-50 to-white border-rose-100",
      icon: "bg-rose-100 text-rose-600",
      value: "text-rose-900",
    },
  };
  const c = accents[accent] || accents.slate;
  return (
    <div
      className={`rounded-xl border bg-gradient-to-br ${c.wrap} px-3 py-3 shadow-sm`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.icon}`}
        >
          <Icon size={15} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </div>
          <div className={`mt-0.5 text-lg font-bold leading-none ${c.value}`}>
            {value}
          </div>
        </div>
      </div>
      <div className="mt-2 truncate text-[9px] text-slate-400">{note}</div>
    </div>
  );
}
function ChartCard({ title, subtitle, children }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <div className="text-sm font-bold text-slate-900">{title}</div>
        <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

function PatientSnapshotModal({
  appointment,
  patient,
  consultations,
  loading,
  view,
  onClose,
  onOpenPatient,
  onUploadDocuments,
}) {
  const p = patient || appointment?.patientId;
  const latest = consultations?.[0];
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-5 py-5 sm:px-7">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
              {view === "consultation" ? "Previous consultation records" : "Patient full record"}
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {fullName(p) || "Patient"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {p?.patientNumber || "—"} · {p?.phone || p?.mobile || "No phone"}
            </p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {view === "full" && (
              <button
                type="button"
                onClick={onUploadDocuments}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
              >
                <FileText size={14} /> Upload documents
              </button>
            )}
            <button
              type="button"
              onClick={onOpenPatient}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600"
            >
              <ExternalLink size={14} /> Open patient record
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500"
            >
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
          {loading ? (
            <div className="py-20 text-center text-sm text-slate-400">
              Loading patient history...
            </div>
          ) : (
            <div className="space-y-6">
              <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {[
                  ["DOB", p?.dateOfBirth ? fmtDate(p.dateOfBirth) : "—"],
                  ["Gender", p?.gender || "—"],
                  ["Source", p?.source || "—"],
                  [
                    "Last consultation",
                    p?.lastConsultationAt ? fmtDate(p.lastConsultationAt) : "—",
                  ],
                  [
                    "Next recall",
                    p?.nextRecallAt ? fmtDate(p.nextRecallAt) : "—",
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {label}
                    </div>
                    <div className="mt-1 text-sm font-bold text-slate-700">
                      {value}
                    </div>
                  </div>
                ))}
              </section>
              {view === "full" && (
                <>
                  <section className="rounded-2xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Users size={16} className="text-blue-600" />
                        <h3 className="text-sm font-bold text-slate-900">
                          Patient information
                        </h3>
                      </div>
                    </div>
                    <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        ["First name", p?.firstName || "—"],
                        ["Middle name", p?.middleName || "—"],
                        ["Last name", p?.lastName || "—"],
                        ["Patient number", p?.patientNumber || "—"],
                        ["Phone", p?.phone || p?.mobile || "—"],
                        ["Alternate phone", p?.alternatePhone || "—"],
                        ["Email", p?.email || "—"],
                        ["Date of birth", p?.dateOfBirth ? fmtDate(p.dateOfBirth) : "—"],
                        ["Gender", p?.gender || "—"],
                        ["Address", p?.address || "—"],
                        ["City", p?.city || "—"],
                        ["State", p?.state || "—"],
                        ["Postcode", p?.postcode || p?.postalCode || "—"],
                        ["Source", p?.source || "—"],
                        ["Notes", p?.notes || "—"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {label}
                          </div>
                          <div className="mt-1 break-words text-xs font-semibold text-slate-700">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-dashed border-blue-200 bg-blue-50/70 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Patient documents
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          Upload reports, prescriptions, referrals, IDs and other files to this patient's record.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onUploadDocuments}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                      >
                        <FileText size={14} /> Upload document
                      </button>
                    </div>
                  </section>
                </>
              )}

              <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
                <article className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <History size={16} className="text-blue-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Previous consultations
                      </h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Clinician</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Symptoms</th>
                          <th className="px-4 py-3">Recall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {consultations.length ? (
                          consultations.slice(0, 8).map((c) => (
                            <tr
                              key={c._id}
                              className="border-b border-slate-100 last:border-0"
                            >
                              <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                                {c.consultationDate
                                  ? fmtDate(c.consultationDate)
                                  : "—"}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600">
                                {fullName(c.optometristId) || "—"}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600">
                                {String(c.consultationType || "—").replaceAll(
                                  "_",
                                  " ",
                                )}
                              </td>
                              <td className="max-w-[220px] px-4 py-3 text-xs text-slate-500">
                                {c.symptoms || "—"}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600">
                                {c.recallDue ? fmtDate(c.recallDue) : "—"}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="5"
                              className="py-10 text-center text-xs text-slate-400"
                            >
                              No previous consultations recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </article>
                <article className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope size={16} className="text-violet-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Previous prescription
                      </h3>
                    </div>
                  </div>
                  <div className="p-5">
                    {latest?.givenRx ? (
                      <RxSummary rx={latest.givenRx} pd={latest.pd} />
                    ) : (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No previous Given Rx recorded.
                      </div>
                    )}
                  </div>
                </article>
              </section>
              {view === "full" && (
                <section className="grid gap-4 md:grid-cols-3">
                  <InfoCard
                    icon={Pill}
                    label="Medication"
                    value={latest?.medication || "No record"}
                  />
                  <InfoCard
                    icon={FileText}
                    label="Allergy"
                    value={latest?.allergy || "No recorded allergy"}
                  />
                  <InfoCard
                    icon={History}
                    label="Patient notes"
                    value={p?.notes || "No notes recorded"}
                  />
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function RxSummary({ rx, pd }) {
  const r = rx?.right || {},
    l = rx?.left || {};
  const rows = [
    ["Sphere", r.sphere, l.sphere],
    ["Cylinder", r.cylinder, l.cylinder],
    ["Axis", r.axis, l.axis],
    ["VA", r.va, l.va],
    ["Add", r.add, l.add],
    ["Inter", r.inter, l.inter],
    ["Prism", r.prism, l.prism],
    ["Base", r.base, l.base],
  ];
  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[420px] border-collapse text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
              <th className="border-b border-slate-200 px-3 py-2">Rx</th>
              <th className="border-b border-slate-200 px-3 py-2">OD</th>
              <th className="border-b border-slate-200 px-3 py-2">OS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, rv, lv]) => (
              <tr
                key={label}
                className="border-b border-slate-100 last:border-0"
              >
                <th className="px-3 py-2 text-[10px] font-bold text-slate-500">
                  {label}
                </th>
                <td className="px-3 py-2 text-xs font-semibold text-blue-700">
                  {rv || "—"}
                </td>
                <td className="px-3 py-2 text-xs font-semibold text-rose-700">
                  {lv || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["Right PD", pd?.right || "—"],
          ["Left PD", pd?.left || "—"],
          ["Total PD", pd?.total || "—"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-slate-50 p-3">
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              {l}
            </div>
            <div className="mt-1 text-sm font-bold text-slate-700">{v}</div>
          </div>
        ))}
      </div>
    </>
  );
}
function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-slate-600">
        <Icon size={14} />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-600">{value}</p>
    </div>
  );
}
