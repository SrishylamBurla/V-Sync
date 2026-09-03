import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Search,
  UserPlus,
  UserRound,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPatients, createPatient } from "../../patients/patient.api";
import {
  getAppointmentClinicians,
  createAppointment,
} from "../appointment.api";

const fullName = (p) =>
  [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ");
const dateKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50";
const sourceOptions = [
  ["walk_in", "Walk-in"],
  ["appointment", "Appointment"],
  ["website", "Website"],
  ["referral", "Referral"],
  ["campaign", "Campaign"],
  ["other", "Other"],
];

export default function BookAppointmentPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const mode = params.get("mode") === "new" ? "new" : "existing";
  const today = dateKey(new Date());
  const [clinicians, setClinicians] = useState([]);
  const [clinicianLoading, setClinicianLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    appointmentDate: `${today}T09:00`,
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

  useEffect(() => {
    let active = true;
    setClinicianLoading(true);
    getAppointmentClinicians()
      .then((r) => {
        if (active) setClinicians(Array.isArray(r?.data) ? r.data : []);
      })
      .catch(() => {
        if (active) setClinicians([]);
      })
      .finally(() => {
        if (active) setClinicianLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (mode !== "existing") return;
    const t = setTimeout(async () => {
      setPatientLoading(true);
      try {
        const r = await getPatients({
          page: 1,
          limit: 15,
          search: query.trim(),
          status: "active",
        });
        const d = r?.data;
        setPatients(
          Array.isArray(d)
            ? d
            : Array.isArray(d?.patients)
              ? d.patients
              : Array.isArray(d?.data)
                ? d.data
                : [],
        );
      } catch {
        setPatients([]);
      } finally {
        setPatientLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, mode]);

  const switchMode = (next) => {
    setSuccess("");
    setError("");
    setSelectedPatient(null);
    setQuery("");
    setParams({ mode: next });
  };

  const createAndBook = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      let patientId = selectedPatient?._id;
      if (mode === "new") {
        if (!newPatient.firstName.trim() || !newPatient.phone.trim())
          throw new Error("First name and phone number are required.");
        const created = await createPatient({
          ...newPatient,
          firstName: newPatient.firstName.trim(),
          lastName: newPatient.lastName.trim(),
          phone: newPatient.phone.trim(),
          alternatePhone: newPatient.alternatePhone.trim(),
          email: newPatient.email.trim(),
          notes: newPatient.notes.trim(),
        });
        patientId = created?.data?._id;
        if (!patientId)
          throw new Error(
            "Patient was created but no patient ID was returned.",
          );
      }
      if (!patientId)
        throw new Error("Select an existing patient before booking.");
      const response = await createAppointment({
        ...form,
        patientId,
        durationMinutes: Number(form.durationMinutes),
      });
      setSuccess(response?.message || "Appointment booked successfully.");
      const id = response?.data?._id;
      setTimeout(
        () => navigate(id ? `/appointments/${id}` : "/appointments"),
        500,
      );
    } catch (e) {
      setError(
        e?.response?.data?.message || e.message || "Unable to book appointment",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 py-5 sm:py-7">
      <section className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="mb-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={14} /> Dashboard
            </button>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-blue-700">
              <CalendarClock size={12} /> Appointment booking
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              Book Appointment
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Choose whether this is an existing patient or a new patient, then
              complete the visit details.
            </p>
          </div>
          <div className="rounded-2xl border border-white/80 bg-white p-2 shadow-sm">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => switchMode("existing")}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${mode === "existing" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <UserRound size={14} className="mr-1.5 inline" />
                Existing Patient
              </button>
              <button
                type="button"
                onClick={() => switchMode("new")}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${mode === "new" ? "bg-violet-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <UserPlus size={14} className="mr-1.5 inline" />
                New Patient
              </button>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={17} />
          {success}
        </div>
      )}

      <form
        onSubmit={createAndBook}
        className="grid gap-6 xl:grid-cols-[1fr_1.2fr]"
      >
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
              Step 01
            </div>
            <h2 className="mt-1 text-base font-bold text-slate-900">
              {mode === "existing" ? "Select patient" : "Create new patient"}
            </h2>
          </header>
          <div className="p-5 sm:p-6">
            {mode === "existing" ? (
              <div>
                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Search patient
                  </span>
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setSelectedPatient(null);
                      }}
                      placeholder="Name, phone or patient number"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </label>
                {selectedPatient ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          {fullName(selectedPatient)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {selectedPatient.patientNumber} ·{" "}
                          {selectedPatient.phone || "No phone"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null);
                          setQuery("");
                        }}
                        className="text-xs font-semibold text-slate-500"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : patientLoading ? (
                  <div className="mt-4 text-xs text-slate-400">
                    Searching patients...
                  </div>
                ) : (
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                    {patients.length ? (
                      patients.map((p) => (
                        <button
                          type="button"
                          key={p._id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setQuery(fullName(p));
                          }}
                          className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                            <UserRound size={15} />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-800">
                              {fullName(p)}
                            </div>
                            <div className="mt-0.5 text-[10px] text-slate-400">
                              {p.patientNumber} · {p.phone || "No phone"}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Start typing to search for an existing patient.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="First name"
                  required
                  value={newPatient.firstName}
                  onChange={(v) =>
                    setNewPatient({ ...newPatient, firstName: v })
                  }
                />
                <Input
                  label="Surname"
                  value={newPatient.lastName}
                  onChange={(v) =>
                    setNewPatient({ ...newPatient, lastName: v })
                  }
                />
                <Input
                  label="Date of birth"
                  type="date"
                  value={newPatient.dateOfBirth}
                  onChange={(v) =>
                    setNewPatient({ ...newPatient, dateOfBirth: v })
                  }
                />
                <Input
                  label="Phone"
                  required
                  value={newPatient.phone}
                  onChange={(v) => setNewPatient({ ...newPatient, phone: v })}
                />
                <Select
                  label="Patient source"
                  value={newPatient.source}
                  onChange={(v) => setNewPatient({ ...newPatient, source: v })}
                  options={sourceOptions}
                />
                <Input
                  label="Email"
                  type="email"
                  value={newPatient.email}
                  onChange={(v) => setNewPatient({ ...newPatient, email: v })}
                />
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Patient notes
                  </span>
                  <textarea
                    rows={5}
                    value={newPatient.notes}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, notes: e.target.value })
                    }
                    placeholder="Front-desk notes, preferences or communication instructions..."
                    className={`${inputClass} h-auto py-3 resize-y`}
                  />
                </label>
              </div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-600">
              Step 02
            </div>
            <h2 className="mt-1 text-base font-bold text-slate-900">
              Visit details
            </h2>
          </header>
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <Input
              label="Date & time"
              type="datetime-local"
              required
              value={form.appointmentDate}
              onChange={(v) => setForm({ ...form, appointmentDate: v })}
            />
            <Input
              label="Duration (minutes)"
              type="number"
              value={form.durationMinutes}
              onChange={(v) => setForm({ ...form, durationMinutes: v })}
            />
            <Input
              label="Visit type"
              value={form.type}
              onChange={(v) => setForm({ ...form, type: v })}
            />
            <Select
              label="Assign clinician"
              required
              disabled={clinicianLoading}
              value={form.clinicianId}
              onChange={(v) => setForm({ ...form, clinicianId: v })}
              options={[
                [
                  "",
                  clinicianLoading
                    ? "Loading clinicians…"
                    : clinicians.length
                      ? "Select optometrist / doctor"
                      : "No active clinicians available",
                ],
                ...clinicians.map((c) => [
                  c._id,
                  `${fullName(c)} · ${c.role || "Clinician"}`,
                ]),
              ]}
            />
            <div className="sm:col-span-2 xl:col-span-2 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <UserRound size={16} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {form.clinicianId
                      ? "Clinician assigned"
                      : "Clinician assignment required"}
                  </div>
                  <div className="mt-1 text-[11px] leading-5 text-slate-500">
                    {form.clinicianId
                      ? "This appointment will be scheduled against the selected optometrist / doctor."
                      : "Select the clinician who will handle this visit before confirming the appointment."}
                  </div>
                </div>
              </div>
            </div>

            <Input
              label="Reason for visit"
              value={form.reason}
              onChange={(v) => setForm({ ...form, reason: v })}
              placeholder="Routine eye examination"
            />
            <label className="sm:col-span-2">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Appointment notes
              </span>
              <textarea
                rows={7}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Front-desk instructions, patient requests or preparation notes..."
                className={`${inputClass} h-auto py-3 resize-y`}
              />
            </label>
            <div className="flex justify-end sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-sm disabled:opacity-50"
              >
                <CalendarClock size={15} />
                {saving ? "Booking..." : "Book Appointment"}
              </button>
            </div>
          </div>
        </section>
      </form>
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
        className={inputClass}
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  placeholder = "",
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <select
        value={value}
        required={required}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
