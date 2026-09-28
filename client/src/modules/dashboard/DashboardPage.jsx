import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ContactRound,
  Glasses,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getAppointments,
  createAppointment,
  getAppointmentClinicians,
} from "../appointments/appointment.api";

import { getPatients } from "../patients/patient.api";

import { getDispensingList } from "../optical/spectacle.api";
import { getContactLenses } from "../contactLenses/contactLens.api";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const APPOINTMENT_STATUS = {
  booked: "Booked",
  confirmed: "Confirmed",
  here: "Here",
  examining: "Examining",
  complete: "Complete",
  cancelled: "Cancelled",
  no_show: "No show",
};

const APPOINTMENT_STATUS_CLASS = {
  booked: "bg-slate-100 text-slate-600",
  confirmed: "bg-blue-50 text-blue-700",
  here: "bg-amber-50 text-amber-700",
  examining: "bg-violet-50 text-violet-700",
  complete: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-orange-50 text-orange-700",
};

const JOB_STATUS = [
  "draft",
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
    .replace(/\b\w/g, (character) => character.toUpperCase());

const fullName = (person) =>
  [
    person?.firstName,
    person?.middleName,
    person?.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "Unknown";

const dateKey = (date) => {
  const value = new Date(date);

  return `${value.getFullYear()}-${String(
    value.getMonth() + 1,
  ).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};

const formatTime = (value) => {
  if (!value) return "—";

  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  return new Date(value).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const normalizePatients = (response) => {
  const value = response?.data;

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.patients)) return value.patients;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(response)) return response;

  return [];
};

const normalizeRows = (response) => {
  const value = response?.data;

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;

  return [];
};

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export default function DashboardPage() {
  const navigate = useNavigate();

  const today = dateKey(new Date());

  const [appointments, setAppointments] = useState([]);
  const [spectacleJobs, setSpectacleJobs] = useState([]);
  const [contactOrders, setContactOrders] = useState([]);

  const [clinicians, setClinicians] = useState([]);

  const [loading, setLoading] = useState(true);
  const [opticalLoading, setOpticalLoading] = useState(true);

  const [error, setError] = useState("");
  const [opticalError, setOpticalError] = useState("");

  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showPatientList, setShowPatientList] = useState(false);

  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [patientListLoading, setPatientListLoading] = useState(false);

  const [form, setForm] = useState({
    patientId: "",
    appointmentDate: `${today}T09:00`,
    type: "Eye Examination",
    durationMinutes: 30,
    clinicianId: "",
    reason: "",
    notes: "",
  });

  /* ---------------------------------------------------------------------- */
  /* Appointments                                                           */
  /* ---------------------------------------------------------------------- */

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAppointments({
        date: today,
      });

      setAppointments(
        Array.isArray(response?.data) ? response.data : [],
      );
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load today's appointments.",
      );
    } finally {
      setLoading(false);
    }
  }, [today]);

  /* ---------------------------------------------------------------------- */
  /* Optical operations                                                     */
  /* ---------------------------------------------------------------------- */

  const loadOpticalOperations = useCallback(async () => {
    setOpticalLoading(true);
    setOpticalError("");

    try {
      const [spectacleResult, contactResult] =
        await Promise.allSettled([
          getDispensingList(),
          getContactLenses(),
        ]);

      if (spectacleResult.status === "fulfilled") {
        setSpectacleJobs(
          normalizeRows(spectacleResult.value),
        );
      } else {
        setSpectacleJobs([]);
      }

      if (contactResult.status === "fulfilled") {
        setContactOrders(
          normalizeRows(contactResult.value),
        );
      } else {
        setContactOrders([]);
      }

      const failures = [
        spectacleResult,
        contactResult,
      ].filter(
        (result) => result.status === "rejected",
      );

      if (failures.length) {
        const firstFailure = failures[0]?.reason;

        setOpticalError(
          firstFailure?.response?.data?.message ||
            firstFailure?.message ||
            "Some optical information could not be loaded.",
        );
      }
    } catch (error) {
      setOpticalError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load optical operations.",
      );
    } finally {
      setOpticalLoading(false);
    }
  }, []);

  const refreshDashboard = async () => {
    await Promise.all([
      loadAppointments(),
      loadOpticalOperations(),
    ]);
  };

  useEffect(() => {
    loadAppointments();

    getAppointmentClinicians()
      .then((response) => {
        setClinicians(
          Array.isArray(response?.data)
            ? response.data
            : [],
        );
      })
      .catch(() => {
        setClinicians([]);
      });
  }, [loadAppointments]);

  useEffect(() => {
    loadOpticalOperations();
  }, [loadOpticalOperations]);

  /* ---------------------------------------------------------------------- */
  /* Patient search                                                         */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!showPatientList) return;

    const timer = setTimeout(async () => {
      setPatientListLoading(true);

      try {
        const response = await getPatients({
          page: 1,
          limit: 30,
          search: patientQuery.trim(),
          status: "active",
        });

        setPatientResults(
          normalizePatients(response),
        );
      } catch {
        setPatientResults([]);
      } finally {
        setPatientListLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [patientQuery, showPatientList]);

  /* ---------------------------------------------------------------------- */
  /* Appointment statistics                                                 */
  /* ---------------------------------------------------------------------- */

  const appointmentCounts = useMemo(
    () => ({
      total: appointments.length,

      waiting: appointments.filter((appointment) =>
        ["booked", "confirmed", "here"].includes(
          appointment.status,
        ),
      ).length,

      examining: appointments.filter(
        (appointment) =>
          appointment.status === "examining",
      ).length,

      completed: appointments.filter(
        (appointment) =>
          appointment.status === "complete",
      ).length,

      cancelled: appointments.filter((appointment) =>
        ["cancelled", "no_show"].includes(
          appointment.status,
        ),
      ).length,
    }),
    [appointments],
  );

  const upcomingAppointments = useMemo(
    () =>
      [...appointments].sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime(),
      ),
    [appointments],
  );

  /* ---------------------------------------------------------------------- */
  /* Optical statistics                                                     */
  /* ---------------------------------------------------------------------- */

  const spectacleCounts = useMemo(
    () => ({
      total: spectacleJobs.length,

      open: spectacleJobs.filter(
        (job) =>
          !["collected", "cancelled"].includes(
            job.status,
          ),
      ).length,

      ready: spectacleJobs.filter(
        (job) => job.status === "ready",
      ).length,

      notified: spectacleJobs.filter(
        (job) => job.status === "notified",
      ).length,

      collected: spectacleJobs.filter(
        (job) => job.status === "collected",
      ).length,
    }),
    [spectacleJobs],
  );

  const contactCounts = useMemo(
    () => ({
      total: contactOrders.length,

      open: contactOrders.filter(
        (order) =>
          !["collected", "cancelled"].includes(
            order.status,
          ),
      ).length,

      ready: contactOrders.filter(
        (order) => order.status === "ready",
      ).length,

      collected: contactOrders.filter(
        (order) => order.status === "collected",
      ).length,
    }),
    [contactOrders],
  );

  /* ---------------------------------------------------------------------- */
  /* Appointment actions                                                    */
  /* ---------------------------------------------------------------------- */

  const selectPatientForAppointment = (patient) => {
    setForm((current) => ({
      ...current,
      patientId: patient._id,
    }));

    setPatientQuery(fullName(patient));
    setPatientResults([]);
    setShowPatientList(false);
    setShowAppointmentForm(true);
  };

  const saveAppointment = async (event) => {
    event.preventDefault();

    setError("");

    if (!form.patientId) {
      setError(
        "Please select a patient before creating the appointment.",
      );
      return;
    }

    try {
      await createAppointment({
        ...form,
        durationMinutes: Number(
          form.durationMinutes,
        ),
      });

      setShowAppointmentForm(false);
      setPatientQuery("");

      setForm({
        patientId: "",
        appointmentDate: `${today}T09:00`,
        type: "Eye Examination",
        durationMinutes: 30,
        clinicianId: "",
        reason: "",
        notes: "",
      });

      await loadAppointments();
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create appointment.",
      );
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="py-5 sm:py-7">
      <div className="space-y-6">

        {/* ================================================================ */}
        {/* Header                                                           */}
        {/* ================================================================ */}

        <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Practice dashboard
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Today
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {formatDate(new Date())}
              {" · "}
              appointments, clinical flow and optical operations
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refreshDashboard}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <RefreshCw
                size={14}
                className={
                  loading || opticalLoading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() =>
                setShowPatientList(true)
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Users size={14} />
              Patient list
            </button>

            <button
              type="button"
              onClick={() =>
                setShowAppointmentForm(true)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus size={15} />
              New appointment
            </button>
          </div>
        </section>

        {/* ================================================================ */}
        {/* Errors                                                           */}
        {/* ================================================================ */}

        {error && (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-md p-1 text-red-500 hover:bg-red-100"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {opticalError && (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <span>{opticalError}</span>

            <button
              type="button"
              onClick={() => setOpticalError("")}
              className="rounded-md p-1 text-amber-500 hover:bg-amber-100"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* ================================================================ */}
        {/* Main metrics                                                      */}
        {/* ================================================================ */}

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={CalendarClock}
            label="Appointments"
            value={appointmentCounts.total}
            note="Today's schedule"
            onClick={() =>
              navigate("/appointments")
            }
          />

          <Metric
            icon={Clock3}
            label="Waiting / upcoming"
            value={appointmentCounts.waiting}
            note="Booked, confirmed or here"
            onClick={() =>
              navigate("/appointments")
            }
          />

          <Metric
            icon={Glasses}
            label="Spectacle jobs"
            value={spectacleCounts.open}
            note={`${spectacleCounts.ready} ready for collection`}
            onClick={() =>
              navigate("/dispensing")
            }
          />

          <Metric
            icon={ContactRound}
            label="Contact lens orders"
            value={contactCounts.open}
            note={`${contactCounts.ready} ready`}
            onClick={() =>
              navigate("/dispensing")
            }
          />
        </section>

        {/* ================================================================ */}
        {/* Main content                                                      */}
        {/* ================================================================ */}

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_410px]">

          {/* ============================================================ */}
          {/* Left column                                                    */}
          {/* ============================================================ */}

          <div className="space-y-5">

            {/* ------------------------------------------------------------ */}
            {/* Today's appointments                                         */}
            {/* ------------------------------------------------------------ */}

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">
                    Clinical flow
                  </div>

                  <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                    Today's appointments
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    {appointmentCounts.total} scheduled
                    {" · "}
                    {appointmentCounts.completed} completed
                    {" · "}
                    {appointmentCounts.examining} examining
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/appointments")
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  View appointments
                  <ArrowRight size={12} />
                </button>
              </header>

              {loading ? (
                <div className="px-5 py-12 text-center text-xs text-slate-400">
                  Loading appointments...
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <div className="px-5 py-14 text-center">
                  <CalendarClock
                    size={30}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    No appointments today
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setShowAppointmentForm(true)
                    }
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white"
                  >
                    <Plus size={12} />
                    New appointment
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {upcomingAppointments
                    .slice(0, 8)
                    .map((appointment) => (
                      <button
                        key={appointment._id}
                        type="button"
                        onClick={() =>
                          appointment.patientId?._id &&
                          navigate(
                            `/patients/${appointment.patientId._id}`,
                          )
                        }
                        className="w-full px-5 py-3.5 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-4">

                          <div className="w-16 shrink-0">
                            <div className="text-sm font-bold text-slate-900">
                              {formatTime(
                                appointment.appointmentDate,
                              )}
                            </div>

                            <div className="mt-1 text-[9px] text-slate-400">
                              {appointment.durationMinutes ||
                                30}{" "}
                              min
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-bold text-slate-800">
                              {fullName(
                                appointment.patientId,
                              )}
                            </div>

                            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-slate-400">
                              <span>
                                {appointment.type ||
                                  "Eye Examination"}
                              </span>

                              {appointment.clinicianId && (
                                <>
                                  <span>•</span>

                                  <span>
                                    {fullName(
                                      appointment.clinicianId,
                                    )}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${
                              APPOINTMENT_STATUS_CLASS[
                                appointment.status
                              ] ||
                              "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {APPOINTMENT_STATUS[
                              appointment.status
                            ] ||
                              appointment.status ||
                              "Booked"}
                          </span>
                        </div>
                      </button>
                    ))}

                  {upcomingAppointments.length > 8 && (
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/appointments")
                      }
                      className="flex w-full items-center justify-center gap-1.5 px-5 py-3 text-[10px] font-bold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      View{" "}
                      {upcomingAppointments.length - 8}{" "}
                      more
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* ------------------------------------------------------------ */}
            {/* Optical operations                                            */}
            {/* ------------------------------------------------------------ */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Optical operations
                  </div>

                  <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                    Dispensing workflow
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Spectacle and contact-lens orders are
                    handled as separate workflows.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/dispensing")
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Open dispensing
                  <ArrowRight size={12} />
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">

                {/* Spectacles */}
                <OperationCard
                  icon={Glasses}
                  title="Spectacle jobs"
                  eyebrow="Dispensing"
                  value={
                    opticalLoading
                      ? "—"
                      : spectacleCounts.open
                  }
                  description="Open spectacle jobs moving through ordering, preparation and collection."
                  stats={[
                    {
                      label: "Ready",
                      value: spectacleCounts.ready,
                    },
                    {
                      label: "Notified",
                      value: spectacleCounts.notified,
                    },
                    {
                      label: "Collected",
                      value: spectacleCounts.collected,
                    },
                  ]}
                  onClick={() =>
                    navigate("/dispensing")
                  }
                />

                {/* Contact lenses */}
                <OperationCard
                  icon={ContactRound}
                  title="Contact lens orders"
                  eyebrow="Contact lenses"
                  value={
                    opticalLoading
                      ? "—"
                      : contactCounts.open
                  }
                  description="Contact lens orders from preparation through collection."
                  stats={[
                    {
                      label: "Ready",
                      value: contactCounts.ready,
                    },
                    {
                      label: "Collected",
                      value: contactCounts.collected,
                    },
                    {
                      label: "Total",
                      value: contactCounts.total,
                    },
                  ]}
                  onClick={() =>
                    navigate("/dispensing")
                  }
                />
              </div>
            </section>

            {/* ------------------------------------------------------------ */}
            {/* Patient operations                                            */}
            {/* ------------------------------------------------------------ */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Patient operations
                  </div>

                  <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                    Patient care shortcuts
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    Common patient actions without duplicating
                    the individual module pages.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate("/patients")
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Patient directory
                  <ArrowRight size={12} />
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DashboardAction
                  icon={Users}
                  eyebrow="Patient records"
                  title="Patient directory"
                  description="Search patients and open their complete record."
                  onClick={() =>
                    navigate("/patients")
                  }
                />

                <DashboardAction
                  icon={UserPlus}
                  eyebrow="Registration"
                  title="Add patient"
                  description="Register a new patient."
                  onClick={() =>
                    navigate("/patients/new")
                  }
                />

                <DashboardAction
                  icon={Activity}
                  eyebrow="Clinical"
                  title="Clinical workspace"
                  description="Open clinical examination and consultation workflow."
                  onClick={() =>
                    navigate("/clinical")
                  }
                />
              </div>
            </section>
          </div>

          {/* ============================================================ */}
          {/* Right column                                                    */}
          {/* ============================================================ */}

          <aside className="space-y-5">

            {/* ------------------------------------------------------------ */}
            {/* Appointment status                                            */}
            {/* ------------------------------------------------------------ */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Appointment flow
              </div>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                Today's status
              </h2>

              <div className="mt-5 space-y-4">
                <ProgressRow
                  label="Waiting / upcoming"
                  value={appointmentCounts.waiting}
                  total={appointmentCounts.total}
                />

                <ProgressRow
                  label="Examining"
                  value={appointmentCounts.examining}
                  total={appointmentCounts.total}
                />

                <ProgressRow
                  label="Completed"
                  value={appointmentCounts.completed}
                  total={appointmentCounts.total}
                />

                <ProgressRow
                  label="Cancelled / no show"
                  value={appointmentCounts.cancelled}
                  total={appointmentCounts.total}
                />
              </div>
            </section>

            {/* ------------------------------------------------------------ */}
            {/* Optical summary                                                */}
            {/* ------------------------------------------------------------ */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Optical summary
              </div>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                Orders at a glance
              </h2>

              <div className="mt-4 space-y-3">

                <SummaryRow
                  icon={Glasses}
                  label="Spectacle jobs"
                  value={
                    opticalLoading
                      ? "—"
                      : spectacleJobs.length
                  }
                  onClick={() =>
                    navigate("/dispensing")
                  }
                />

                <SummaryRow
                  icon={PackageCheck}
                  label="Spectacles ready"
                  value={
                    opticalLoading
                      ? "—"
                      : spectacleCounts.ready
                  }
                  onClick={() =>
                    navigate("/dispensing")
                  }
                />

                <SummaryRow
                  icon={ContactRound}
                  label="Contact lens orders"
                  value={
                    opticalLoading
                      ? "—"
                      : contactOrders.length
                  }
                  onClick={() =>
                    navigate("/dispensing")
                  }
                />

                <SummaryRow
                  icon={CheckCircle2}
                  label="Contact lenses ready"
                  value={
                    opticalLoading
                      ? "—"
                      : contactCounts.ready
                  }
                  onClick={() =>
                    navigate("/dispensing")
                  }
                />
              </div>
            </section>

            {/* ------------------------------------------------------------ */}
            {/* Quick actions                                                  */}
            {/* ------------------------------------------------------------ */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Quick actions
              </div>

              <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">
                Workspace
              </h2>

              <div className="mt-4 space-y-2">
                <QuickAction
                  icon={CalendarClock}
                  label="Appointments"
                  description="Manage today's schedule"
                  onClick={() =>
                    navigate("/appointments")
                  }
                />

                <QuickAction
                  icon={Glasses}
                  label="Dispensing"
                  description="Manage spectacle and lens orders"
                  onClick={() =>
                    navigate("/dispensing")
                  }
                />

                <QuickAction
                  icon={PackageCheck}
                  label="Optical management"
                  description="Open optical workflow"
                  onClick={() =>
                    navigate("/optical")
                  }
                />

                <QuickAction
                  icon={Users}
                  label="Patients"
                  description="Search patient records"
                  onClick={() =>
                    navigate("/patients")
                  }
                />
              </div>
            </section>
          </aside>
        </section>
      </div>

      {/* ================================================================== */}
      {/* Patient selector modal                                             */}
      {/* ================================================================== */}

      {showPatientList && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowPatientList(false);
            }
          }}
        >
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">

            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Patient directory
                </div>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Find patient
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Select a patient for the appointment.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowPatientList(false)
                }
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </header>

            <div className="border-b border-slate-100 p-5">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  autoFocus
                  value={patientQuery}
                  onChange={(event) =>
                    setPatientQuery(
                      event.target.value,
                    )
                  }
                  placeholder="Search by name, patient number or phone..."
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {patientListLoading ? (
                <div className="flex min-h-[260px] items-center justify-center text-sm text-slate-400">
                  Searching patients...
                </div>
              ) : patientResults.length === 0 ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center text-center">
                  <Users
                    size={30}
                    className="text-slate-300"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    {patientQuery.trim()
                      ? "No matching patients found"
                      : "No patients available"}
                  </p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {patientResults.map(
                    (patient) => (
                      <div
                        key={patient._id}
                        className="flex flex-col gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:flex-row sm:items-center"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/patients/${patient._id}`,
                            )
                          }
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="truncate text-sm font-semibold text-slate-900 hover:underline">
                            {fullName(patient)}
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            {patient.patientNumber ||
                              "No patient number"}
                            {" · "}
                            {patient.phone ||
                              patient.mobile ||
                              "No phone"}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            selectPatientForAppointment(
                              patient,
                            )
                          }
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                        >
                          New appointment
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* New appointment modal                                              */}
      {/* ================================================================== */}

      {showAppointmentForm && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowAppointmentForm(false);
            }
          }}
        >
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">

            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Appointment
                </div>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Schedule a visit
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowAppointmentForm(false)
                }
                className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
              >
                <X size={16} />
              </button>
            </header>

            <form
              onSubmit={saveAppointment}
              className="p-5 sm:p-6"
            >
              <div className="grid gap-4 md:grid-cols-2">

                {/* Patient */}
                <div className="md:col-span-2">
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Patient
                    </span>

                    <div className="flex gap-2">
                      <input
                        value={patientQuery}
                        readOnly={Boolean(
                          form.patientId,
                        )}
                        placeholder="Select a patient"
                        className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPatientList(
                            true,
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <Search size={14} />
                        Select
                      </button>
                    </div>
                  </label>
                </div>

                <Field
                  label="Date & time"
                  type="datetime-local"
                  value={form.appointmentDate}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      appointmentDate: value,
                    }))
                  }
                />

                <Field
                  label="Duration"
                  type="number"
                  value={form.durationMinutes}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      durationMinutes: value,
                    }))
                  }
                />

                <Field
                  label="Visit type"
                  value={form.type}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      type: value,
                    }))
                  }
                />

                {/* Clinician */}
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Clinician
                  </span>

                  <select
                    value={form.clinicianId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        clinicianId:
                          event.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:bg-white"
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {clinicians.map(
                      (clinician) => (
                        <option
                          key={clinician._id}
                          value={clinician._id}
                        >
                          {fullName(
                            clinician,
                          )}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <Field
                  label="Reason"
                  value={form.reason}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      reason: value,
                    }))
                  }
                />

                <label className="block md:col-span-2">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Notes
                  </span>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes:
                          event.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:bg-white"
                    placeholder="Appointment notes..."
                  />
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setShowAppointmentForm(
                      false,
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <CalendarClock size={14} />
                  Save appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function Metric({
  icon: Icon,
  label: title,
  value,
  note,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon size={16} />
        </div>

        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </div>

          <div className="mt-1 text-xl font-bold text-slate-900">
            {value}
          </div>
        </div>
      </div>

      <div className="mt-3 text-[10px] text-slate-400">
        {note}
      </div>
    </button>
  );
}

function OperationCard({
  icon: Icon,
  eyebrow,
  title,
  value,
  description,
  stats,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-100">
          <Icon size={16} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
            {eyebrow}
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-sm font-bold text-slate-800">
              {title}
            </span>

            <ArrowRight
              size={13}
              className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600"
            />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-2xl font-bold text-slate-900">
          {value}
        </div>

        <p className="mt-1 text-[10px] leading-4 text-slate-400">
          {description}
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-200 pt-3">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="text-[9px] uppercase tracking-wider text-slate-400">
              {stat.label}
            </div>

            <div className="mt-1 text-sm font-bold text-slate-700">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </button>
  );
}

function DashboardAction({
  icon: Icon,
  eyebrow,
  title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[105px] items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-100">
        <Icon size={16} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
          {eyebrow}
        </span>

        <span className="mt-1 block text-sm font-bold text-slate-800">
          {title}
        </span>

        <span className="mt-1 block text-[11px] leading-4 text-slate-400">
          {description}
        </span>
      </span>

      <ArrowRight
        size={13}
        className="mt-1 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600"
      />
    </button>
  );
}

function SummaryRow({
  icon: Icon,
  label: title,
  value,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3 text-left transition hover:border-slate-200 hover:bg-white"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
        <Icon size={14} />
      </span>

      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-700">
        {title}
      </span>

      <span className="text-sm font-bold text-slate-900">
        {value}
      </span>

      <ArrowRight
        size={12}
        className="text-slate-300"
      />
    </button>
  );
}

function QuickAction({
  icon: Icon,
  label: title,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3 text-left transition hover:border-slate-200 hover:bg-white"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
        <Icon size={14} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-slate-700">
          {title}
        </span>

        <span className="mt-0.5 block truncate text-[10px] text-slate-400">
          {description}
        </span>
      </span>

      <ArrowRight
        size={12}
        className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600"
      />
    </button>
  );
}

function ProgressRow({
  label: title,
  value,
  total,
}) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-600">
          {title}
        </span>

        <span className="text-xs font-bold text-slate-700">
          {value}/{total}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

function Field({
  label: title,
  value,
  onChange,
  type = "text",
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {title}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
      />
    </label>
  );
}