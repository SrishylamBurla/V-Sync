import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPatients, createPatient } from "../../patients/patient.api";
import {
  DocumentShell,
  Section,
  Field,
} from "../../../components/common/DocumentUI";
import {
  getAppointments,
  getAppointmentClinicians,
  createAppointment,
  updateAppointment,
} from "../appointment.api";

const statusOptions = [
  "booked",
  "confirmed",
  "here",
  "examining",
  "complete",
  "cancelled",
  "no_show",
];
const statusLabel = (s) =>
  s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const statusClass = {
  booked: "bg-slate-100 text-slate-700",
  confirmed: "bg-blue-50 text-blue-700",
  here: "bg-amber-50 text-amber-700",
  examining: "bg-violet-50 text-violet-700",
  complete: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-orange-50 text-orange-700",
};
const fullName = (p) =>
  [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ");
const dateKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const prettyDate = (key) =>
  new Date(`${key}T12:00:00`).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
const inputDateTime = (key) => `${key}T09:00`;

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(dateKey(new Date()));
  const [rows, setRows] = useState([]);
  const [clinicians, setClinicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [clinicianId, setClinicianId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [bookingMode, setBookingMode] = useState("existing");
  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [patientSearching, setPatientSearching] = useState(false);
  const [reassigningId, setReassigningId] = useState("");
  const [selectedClinicianForRow, setSelectedClinicianForRow] = useState("");
  const [form, setForm] = useState({
    patientId: "",
    appointmentDate: inputDateTime(dateKey(new Date())),
    type: "Eye Examination",
    durationMinutes: 30,
    clinicianId: "",
    reason: "",
    notes: "",
  });
  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    alternatePhone: "",
    email: "",
    source: "walk_in",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await getAppointments({
        date: selectedDate,
        status,
        clinicianId,
        search: query.trim(),
      });
      setRows(
        Array.isArray(r?.data)
          ? r.data
          : Array.isArray(r?.data?.appointments)
            ? r.data.appointments
            : [],
      );
    } catch (e) {
      setError(e?.response?.data?.message || "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate, status, clinicianId, query]);

  useEffect(() => {
    const timer = setTimeout(() => load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    getAppointmentClinicians()
      .then((r) => setClinicians(r?.data || []))
      .catch(() => setClinicians([]));
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (!patientQuery.trim()) {
        setPatientResults([]);
        return;
      }
      setPatientSearching(true);
      try {
        const r = await getPatients({
          page: 1,
          limit: 8,
          search: patientQuery.trim(),
          status: "active",
        });
        setPatientResults(
          Array.isArray(r?.data?.patients)
            ? r.data.patients
            : Array.isArray(r?.data)
              ? r.data
              : [],
        );
      } catch {
        setPatientResults([]);
      } finally {
        setPatientSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [patientQuery]);

  const filtered = useMemo(
    () =>
      rows.filter((a) => {
        const n = fullName(a.patientId).toLowerCase();
        const q = query.trim().toLowerCase();
        return (
          !q ||
          n.includes(q) ||
          a.patientId?.patientNumber?.toLowerCase().includes(q) ||
          a.patientId?.phone?.toLowerCase().includes(q)
        );
      }),
    [rows, query],
  );

  const counts = useMemo(
    () =>
      Object.fromEntries(
        statusOptions.map((s) => [
          s,
          rows.filter((r) => r.status === s).length,
        ]),
      ),
    [rows],
  );

  const moveDate = (amount) => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + amount);
    const next = dateKey(d);
    setSelectedDate(next);
    setForm((f) => ({ ...f, appointmentDate: inputDateTime(next) }));
  };

  const selectPatient = (patient) => {
    setForm((f) => ({ ...f, patientId: patient._id }));
    setPatientQuery(fullName(patient));
    setPatientResults([]);
  };

  const reassignClinician = async (appointment) => {
    const nextClinicianId = selectedClinicianForRow;
    if (!nextClinicianId || nextClinicianId === appointment?.clinicianId?._id) return;
    setReassigningId(appointment._id);
    setError("");
    try {
      await updateAppointment(appointment._id, { clinicianId: nextClinicianId });
      setSelectedClinicianForRow("");
      await load();
    } catch (e) {
      setError(e?.message || "Unable to reassign clinician.");
    } finally {
      setReassigningId("");
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let patientId = form.patientId;

      if (bookingMode === "new") {
        if (!newPatient.firstName.trim() || !newPatient.phone.trim()) {
          throw new Error("First name and phone number are required.");
        }

        const created = await createPatient({
          firstName: newPatient.firstName.trim(),
          lastName: newPatient.lastName.trim(),
          dateOfBirth: newPatient.dateOfBirth || null,
          gender: newPatient.gender,
          phone: newPatient.phone.trim(),
          alternatePhone: newPatient.alternatePhone.trim(),
          email: newPatient.email.trim().toLowerCase(),
          source: newPatient.source,
          notes: newPatient.notes.trim(),
        });

        patientId =
          created?.data?.patient?._id ||
          created?.data?._id ||
          created?.patient?._id ||
          null;

        if (!patientId) {
          throw new Error("Patient was created but no patient ID was returned.");
        }
      }

      if (!patientId) {
        throw new Error("Select an existing patient before booking.");
      }

      await createAppointment({
        ...form,
        patientId,
        durationMinutes: Number(form.durationMinutes),
      });

      setShowForm(false);
      setBookingMode("existing");
      setPatientQuery("");
      setPatientResults([]);
      setForm({
        patientId: "",
        appointmentDate: inputDateTime(selectedDate),
        type: "Eye Examination",
        durationMinutes: 30,
        clinicianId: "",
        reason: "",
        notes: "",
      });
      setNewPatient({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        phone: "",
        alternatePhone: "",
        email: "",
        source: "walk_in",
        notes: "",
      });

      await load();
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Unable to create appointment.",
      );
    }
  };

  return (
    <DocumentShell
      eyebrow="Front desk"
      title="Appointments"
      subtitle="A complete daily appointment register for patient flow, clinician scheduling and visit status."
      code="APPOINTMENTS"
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
          <button
            onClick={() => {
              setBookingMode("existing");
              setShowForm(true);
              setPatientQuery("");
              setPatientResults([]);
              setForm((current) => ({
                ...current,
                patientId: "",
                appointmentDate: inputDateTime(selectedDate),
              }));
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white"
          >
            <Plus size={14} />
            Book Appointment
          </button>
        </div>
      }
    >
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Section number="01" title="Appointment date">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => moveDate(-1)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50"
            >
              <ChevronLeft size={17} />
            </button>
            <label className="relative">
              <CalendarDays
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setForm((f) => ({
                    ...f,
                    appointmentDate: inputDateTime(e.target.value),
                  }));
                }}
                className="h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none"
              />
            </label>
            <button
              onClick={() => moveDate(1)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:bg-slate-50"
            >
              <ChevronRight size={17} />
            </button>
            <button
              onClick={() => {
                const today = dateKey(new Date());
                setSelectedDate(today);
                setForm((f) => ({
                  ...f,
                  appointmentDate: inputDateTime(today),
                }));
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600"
            >
              Today
            </button>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
              Selected day
            </div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {prettyDate(selectedDate)}
            </div>
          </div>
        </div>
      </Section>

      {showForm && (
        <BookingModal
          bookingMode={bookingMode}
          setBookingMode={setBookingMode}
          form={form}
          setForm={setForm}
          newPatient={newPatient}
          setNewPatient={setNewPatient}
          clinicians={clinicians}
          patientQuery={patientQuery}
          setPatientQuery={setPatientQuery}
          patientResults={patientResults}
          setPatientResults={setPatientResults}
          patientSearching={patientSearching}
          selectPatient={selectPatient}
          save={save}
          onClose={() => {
            setShowForm(false);
            setPatientQuery("");
            setPatientResults([]);
          }}
        />
      )}

      <Section
        number={showForm ? "03" : "02"}
        title="Daily appointment register"
      >
        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="Search patient, patient number or phone..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:bg-white"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"
          >
            <option value="">All statuses</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
          <select
            value={clinicianId}
            onChange={(e) => setClinicianId(e.target.value)}
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
        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">
            Loading appointments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays className="mx-auto text-slate-300" size={30} />
            <p className="mt-3 text-sm font-semibold text-slate-600">
              No appointments for this day
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Create an appointment or change the filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Visit</th>
                  <th className="px-4 py-3">Clinician</th>
                  <th className="px-4 py-3">Reason / Notes</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Open</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-4">
                      <div className="text-sm font-bold text-slate-800">
                        {new Date(a.appointmentDate).toLocaleTimeString(
                          "en-IN",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock3 size={11} />
                        {a.durationMinutes} min
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() =>
                          navigate(`/patients/${a.patientId?._id}`)
                        }
                        className="text-left"
                      >
                        <div className="text-sm font-semibold text-slate-900 hover:underline">
                          {fullName(a.patientId) || "Unknown patient"}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-400">
                          {a.patientId?.patientNumber || "—"} ·{" "}
                          {a.patientId?.phone || "No phone"}
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {a.type || "Eye Examination"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[210px]">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                            <UserRound size={14} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-700">
                              {fullName(a.clinicianId) || "Unassigned"}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {a.clinicianId?.role || "No clinician assigned"}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-1.5">
                          <select
                            value={
                              selectedClinicianForRow && reassigningId === a._id
                                ? selectedClinicianForRow
                                : a.clinicianId?._id || ""
                            }
                            onChange={(e) =>
                              setSelectedClinicianForRow(e.target.value)
                            }
                            disabled={reassigningId === a._id}
                            className="h-8 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-600 outline-none focus:border-violet-300"
                            aria-label={`Assign clinician for ${fullName(a.patientId)}`}
                          >
                            <option value="">Unassigned</option>
                            {clinicians.map((c) => (
                              <option key={c._id} value={c._id}>
                                {fullName(c)} · {c.role}
                              </option>
                            ))}
                          </select>
                          {selectedClinicianForRow !== (a.clinicianId?._id || "") &&
                            reassigningId !== a._id && (
                              <button
                                type="button"
                                onClick={() => reassignClinician(a)}
                                className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-violet-700"
                              >
                                Save
                              </button>
                            )}
                          {reassigningId === a._id && (
                            <span className="text-[10px] font-semibold text-violet-600">
                              Saving…
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[260px] px-4 py-4">
                      <div className="text-xs font-medium text-slate-600">
                        {a.reason || "Routine visit"}
                      </div>
                      <div className="mt-1 truncate text-[10px] text-slate-400">
                        {a.notes || "No notes"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${statusClass[a.status] || statusClass.booked}`}
                      >
                        {statusLabel(a.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => navigate(`/appointments/${a._id}`)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                      >
                        Open record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section number={showForm ? "04" : "03"} title="Daily workflow summary">
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
          Appointment status is managed from the Dashboard only.
        </div>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
          {statusOptions.map((s) => (
            <div
              key={s}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {statusLabel(s)}
              </div>
              <div className="mt-2 text-2xl font-bold text-slate-900">
                {counts[s] || 0}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </DocumentShell>
  );
}


function BookingModal({
  bookingMode,
  setBookingMode,
  form,
  setForm,
  newPatient,
  setNewPatient,
  clinicians,
  patientQuery,
  setPatientQuery,
  patientResults,
  setPatientResults,
  patientSearching,
  selectPatient,
  save,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
                Appointment booking
              </div>
              <h2
                id="booking-modal-title"
                className="mt-1 text-xl font-bold tracking-tight text-slate-900"
              >
                Book Appointment
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Select the patient, schedule the visit, and assign a clinician.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <form onSubmit={save} className="min-h-0 overflow-y-auto">
          <div className="grid xl:grid-cols-[1.05fr_1fr]">
            <section className="border-b border-slate-200 p-5 sm:p-6 xl:border-b-0 xl:border-r">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
                    Step 01
                  </div>
                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    {bookingMode === "existing"
                      ? "Select existing patient"
                      : "Create new patient"}
                  </h3>
                </div>

                <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode("existing");
                      setPatientResults([]);
                    }}
                    className={`rounded-lg px-3 py-2 text-[10px] font-bold ${
                      bookingMode === "existing"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode("new");
                      setPatientQuery("");
                      setPatientResults([]);
                      setForm((current) => ({
                        ...current,
                        patientId: "",
                      }));
                    }}
                    className={`rounded-lg px-3 py-2 text-[10px] font-bold ${
                      bookingMode === "new"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    New
                  </button>
                </div>
              </div>

              {bookingMode === "existing" ? (
                <div>
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Search patient
                    </span>
                    <div className="relative">
                      <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        required
                        autoFocus
                        value={patientQuery}
                        onChange={(e) => {
                          setPatientQuery(e.target.value);
                          setForm((current) => ({
                            ...current,
                            patientId: "",
                          }));
                        }}
                        placeholder="Name, phone or patient number"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-10 text-sm outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
                      />
                      {patientQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setPatientQuery("");
                            setPatientResults([]);
                            setForm((current) => ({
                              ...current,
                              patientId: "",
                            }));
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-white"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </label>

                  {patientResults.length > 0 && (
                    <div className="mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                      {patientResults.map((patient) => (
                        <button
                          type="button"
                          key={patient._id}
                          onClick={() => selectPatient(patient)}
                          className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-blue-50/60"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <UserRound size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-xs font-bold text-slate-800">
                              {fullName(patient) || "Unnamed patient"}
                            </div>
                            <div className="mt-0.5 truncate text-[10px] text-slate-400">
                              {patient.patientNumber || "No number"} ·{" "}
                              {patient.phone || "No phone"}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {patientSearching && (
                    <div className="mt-2 text-[10px] text-slate-400">
                      Searching patients...
                    </div>
                  )}

                  {form.patientId ? (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Patient selected
                      </div>
                      <div className="mt-1 text-sm font-bold text-slate-900">
                        {patientQuery}
                      </div>
                      <div className="mt-1 text-[10px] text-emerald-700">
                        Existing patient is ready for booking.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                      <UserRound className="mx-auto text-slate-300" size={24} />
                      <p className="mt-2 text-xs font-semibold text-slate-600">
                        Choose an existing patient
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="First name"
                    value={newPatient.firstName}
                    required
                    onChange={(value) =>
                      setNewPatient((current) => ({
                        ...current,
                        firstName: value,
                      }))
                    }
                  />
                  <Input
                    label="Surname"
                    value={newPatient.lastName}
                    onChange={(value) =>
                      setNewPatient((current) => ({
                        ...current,
                        lastName: value,
                      }))
                    }
                  />
                  <Input
                    label="Date of birth"
                    type="date"
                    value={newPatient.dateOfBirth}
                    onChange={(value) =>
                      setNewPatient((current) => ({
                        ...current,
                        dateOfBirth: value,
                      }))
                    }
                  />
                  <Input
                    label="Phone"
                    value={newPatient.phone}
                    required
                    onChange={(value) =>
                      setNewPatient((current) => ({
                        ...current,
                        phone: value,
                      }))
                    }
                  />
                  <Input
                    label="Alternate phone"
                    value={newPatient.alternatePhone}
                    onChange={(value) =>
                      setNewPatient((current) => ({
                        ...current,
                        alternatePhone: value,
                      }))
                    }
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={newPatient.email}
                    onChange={(value) =>
                      setNewPatient((current) => ({
                        ...current,
                        email: value,
                      }))
                    }
                  />
                  <Select
                    label="Patient source"
                    value={newPatient.source}
                    onChange={(value) =>
                      setNewPatient((current) => ({
                        ...current,
                        source: value,
                      }))
                    }
                    options={[
                      ["walk_in", "Walk-in"],
                      ["appointment", "Appointment"],
                      ["website", "Website"],
                      ["referral", "Referral"],
                      ["campaign", "Campaign"],
                      ["other", "Other"],
                    ]}
                  />
                  <Input
                    label="Gender"
                    value={newPatient.gender}
                    onChange={(value) =>
                      setNewPatient((current) => ({
                        ...current,
                        gender: value,
                      }))
                    }
                  />
                  <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Patient notes
                    </span>
                    <textarea
                      rows={4}
                      value={newPatient.notes}
                      onChange={(e) =>
                        setNewPatient((current) => ({
                          ...current,
                          notes: e.target.value,
                        }))
                      }
                      className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-violet-300 focus:bg-white"
                      placeholder="Front-desk notes or communication instructions..."
                    />
                  </label>
                </div>
              )}
            </section>

            <section className="p-5 sm:p-6">
              <div className="mb-5">
                <div className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-600">
                  Step 02
                </div>
                <h3 className="mt-1 text-base font-bold text-slate-900">
                  Visit details
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                  required
                />
                <Field
                  label="Duration (minutes)"
                  type="number"
                  min="5"
                  step="5"
                  value={form.durationMinutes}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      durationMinutes: value,
                    }))
                  }
                  required
                />
                <Field
                  label="Visit type"
                  value={form.type}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, type: value }))
                  }
                  required
                />
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Clinician
                  </span>
                  <select
                    value={form.clinicianId}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        clinicianId: e.target.value,
                      }))
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-violet-300 focus:bg-white"
                  >
                    <option value="">Unassigned</option>
                    {clinicians.map((clinician) => (
                      <option key={clinician._id} value={clinician._id}>
                        {fullName(clinician)} · {clinician.role || "Clinician"}
                      </option>
                    ))}
                  </select>
                </label>
                <Field
                  label="Reason for visit"
                  value={form.reason}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, reason: value }))
                  }
                  placeholder="Routine eye examination"
                />
                <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    Assignment
                  </div>
                  <div className="mt-1 text-xs font-semibold text-slate-700">
                    {form.clinicianId
                      ? "Clinician assigned"
                      : "Appointment will remain unassigned"}
                  </div>
                </div>
                <Field
                  className="sm:col-span-2"
                  label="Appointment notes"
                  type="textarea"
                  value={form.notes}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, notes: value }))
                  }
                  placeholder="Front-desk instructions, patient requests or preparation notes..."
                />
              </div>
            </section>
          </div>

          <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="text-[10px] text-slate-400">
              Verify patient, time and clinician before booking.
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:from-slate-800 hover:to-violet-600"
              >
                <CalendarDays size={14} />
                Book Appointment
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-50"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-violet-300 focus:bg-white"
      >
        {options.map(([valueOption, labelOption]) => (
          <option key={valueOption} value={valueOption}>
            {labelOption}
          </option>
        ))}
      </select>
    </label>
  );
}
