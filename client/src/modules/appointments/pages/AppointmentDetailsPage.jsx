import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAppointment,
  getAppointmentClinicians,
  updateAppointment,
} from "../appointment.api";

const VISIT_TYPES = [
  "Comprehensive",
  "Short consult",
  "Contact lens evaluation",
  "Binocular vision evaluation",
  "Pediatric eye test",
  "Vision therapy",
];

const statusStyles = {
  booked: "border-slate-200 bg-slate-50 text-slate-700",
  confirmed: "border-blue-200 bg-blue-50 text-blue-700",
  here: "border-amber-200 bg-amber-50 text-amber-700",
  examining: "border-violet-200 bg-violet-50 text-violet-700",
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  no_show: "border-orange-200 bg-orange-50 text-orange-700",
};

const statusLabel = (value = "") =>
  String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const fullName = (person) =>
  [person?.firstName, person?.middleName, person?.lastName]
    .filter(Boolean)
    .join(" ");

const getRecord = (response) =>
  response?.data?.appointment ||
  response?.data?.data?.appointment ||
  response?.data?.data ||
  response?.data ||
  response?.appointment ||
  null;

const getId = (value) => value?._id || value?.id || value || "";

const getDateOfBirth = (patient) =>
  patient?.dateOfBirth ?? patient?.dob ?? patient?.birthDate ?? patient?.date_of_birth ?? null;

// Parse date-only values as local dates to avoid timezone-related off-by-one errors.
const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const text = String(value).trim();
  const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const date = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = parseDate(value);
  if (!date) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  const date = parseDate(value);
  if (!date) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const calculateAge = (dob) => {
  const birth = parseDate(dob);
  if (!birth) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDifference = today.getMonth() - birth.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const normalizeVisitType = (value) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

  const aliases = {
    comprehensive: "Comprehensive",
    "comprehensive consultation": "Comprehensive",
    "eye examination": "Comprehensive",
    "eye exam": "Comprehensive",
    "short consult": "Short consult",
    "short consultation": "Short consult",
    "short spectacle": "Short consult",
    "contact lens": "Contact lens evaluation",
    "contact lenses": "Contact lens evaluation",
    "contact lens evaluation": "Contact lens evaluation",
    "contact lens consultation": "Contact lens evaluation",
    "binocular vision": "Binocular vision evaluation",
    "binocular vision evaluation": "Binocular vision evaluation",
    "pediatric eye test": "Pediatric eye test",
    "paediatric eye test": "Pediatric eye test",
    "pediatric": "Pediatric eye test",
    "vision therapy": "Vision therapy",
  };

  return aliases[normalized] || "";
};

export default function AppointmentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState(null);
  const [clinicians, setClinicians] = useState([]);
  const [selectedClinicianId, setSelectedClinicianId] = useState("");
  const [selectedVisitType, setSelectedVisitType] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingChanges, setSavingChanges] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    getAppointmentClinicians()
      .then((response) => {
        const rows = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.clinicians)
            ? response.data.clinicians
            : Array.isArray(response?.clinicians)
              ? response.clinicians
              : [];
        if (active) setClinicians(rows);
      })
      .catch(() => {
        if (active) setClinicians([]);
      });

    setLoading(true);
    setError("");

    getAppointment(id)
      .then((response) => {
        if (!active) return;
        const record = getRecord(response);
        setAppointment(record);
        setSelectedClinicianId(getId(record?.clinicianId));
        setSelectedVisitType(normalizeVisitType(record?.type));
        if (!record) setError("Appointment not found.");
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.response?.data?.message || "Unable to load appointment record.");
        setAppointment(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Resolve patient before deriving age; this also avoids referencing it before initialization.
  const patient = appointment?.patientId && typeof appointment.patientId === "object"
    ? appointment.patientId
    : null;
  const patientDob = getDateOfBirth(patient);
  const age = useMemo(() => calculateAge(patientDob), [patientDob]);

  const assignedClinician =
    appointment?.clinicianId && typeof appointment.clinicianId === "object"
      ? appointment.clinicianId
      : clinicians.find((item) => item._id === getId(appointment?.clinicianId));

  const patientPhone = patient?.phone || patient?.mobile || patient?.phoneNumber || "";
  const selectedClinician = clinicians.find((item) => item._id === selectedClinicianId);
  const originalClinicianId = getId(appointment?.clinicianId);
  const originalVisitType = normalizeVisitType(appointment?.type);
  const clinicianChanged = Boolean(selectedClinicianId) && selectedClinicianId !== originalClinicianId;
  const visitTypeChanged = Boolean(selectedVisitType) && selectedVisitType !== originalVisitType;
  const hasPendingChanges = clinicianChanged || visitTypeChanged;

  const saveAppointmentChanges = async (event) => {
    event.preventDefault();
    if (!appointment?._id || !hasPendingChanges || savingChanges) return;

    const payload = {};
    if (clinicianChanged) payload.clinicianId = selectedClinicianId;
    if (visitTypeChanged) payload.type = selectedVisitType;

    setSavingChanges(true);
    setError("");
    setSuccess("");

    try {
      const response = await updateAppointment(appointment._id, payload);
      const updated = getRecord(response);

      setAppointment((current) => ({
        ...current,
        ...(updated && typeof updated === "object" ? updated : {}),
        ...(visitTypeChanged ? { type: selectedVisitType } : {}),
        ...(clinicianChanged
          ? {
              clinicianId:
                updated?.clinicianId && typeof updated.clinicianId === "object"
                  ? updated.clinicianId
                  : selectedClinician || selectedClinicianId,
            }
          : {}),
      }));
      if (visitTypeChanged) setSelectedVisitType(selectedVisitType);
      setSuccess("Appointment changes saved.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save appointment changes.",
      );
    } finally {
      setSavingChanges(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center gap-3 text-sm text-slate-500">
        <Loader2 size={18} className="animate-spin text-blue-600" />
        Loading appointment…
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error || "Appointment not found."}
        </div>
      </div>
    );
  }

  const status = appointment.status || "booked";
  const patientName = fullName(patient);
  const initials = patientName
    ? patientName.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
    : "PT";

  return (
    <div className="min-h-full bg-slate-50/70 px-3 py-4 sm:px-5 sm:py-6 lg:px-7">
      <div className="mx-auto max-w-6xl space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
            >
              <ArrowLeft size={17} />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  Appointment details
                </h1>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusStyles[status] || statusStyles.booked}`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {statusLabel(status)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {appointment.appointmentNumber || `Appointment ${appointment._id || ""}`}
                {selectedVisitType ? ` · ${selectedVisitType}` : appointment.type ? ` · ${appointment.type}` : ""}
              </p>
            </div>
          </div>
          {patient?._id && (
            <button
              type="button"
              onClick={() => navigate(`/patients/${patient._id}`)}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <ExternalLink size={14} /> Patient record
            </button>
          )}
        </header>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 size={15} /> {success}
          </div>
        )}

        <main className="grid items-start gap-4 lg:grid-cols-2">
          {/* 01 — Patient */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <UserRound size={17} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">01</p>
                <h2 className="text-sm font-bold text-slate-900">Patient</h2>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">
                    {patientName || "Patient details unavailable"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {patient?.patientNumber ? `Patient ID: ${patient.patientNumber}` : "Patient record"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <Info label="Patient number" value={patient?.patientNumber} />
                <Info label="Date of birth" value={formatDate(patientDob)} />
                <Info label="Age" value={age === null ? "—" : `${age} ${age === 1 ? "year" : "years"}`} />
                <Info label="Phone number" value={patientPhone || "—"} />
              </div>

              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {patient?._id && (
                  <button
                    type="button"
                    onClick={() => navigate(`/patients/${patient._id}`)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-700"
                  >
                    <ExternalLink size={14} /> Open patient
                  </button>
                )}
                {patientPhone && (
                  <a
                    href={`tel:${patientPhone}`}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Phone size={14} /> Call patient
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* 02 — Schedule */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                <CalendarDays size={17} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700">02</p>
                <h2 className="text-sm font-bold text-slate-900">Schedule</h2>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 rounded-lg border border-blue-100 bg-blue-50/70 p-3.5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                    <CalendarClock size={14} /> Appointment date &amp; time
                  </div>
                  <p className="mt-1.5 text-sm font-bold text-slate-900">
                    {formatDateTime(appointment.appointmentDate)}
                  </p>
                </div>

                <div className="col-span-2 min-w-0">
                  <label htmlFor="appointment-visit-type" className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Visit type
                  </label>
                  <select
                    id="appointment-visit-type"
                    value={selectedVisitType}
                    onChange={(event) => {
                      setSelectedVisitType(event.target.value);
                      setSuccess("");
                    }}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="">Select visit type</option>
                    {VISIT_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <Info label="Duration" value={`${appointment.durationMinutes || 30} minutes`} />
                <Info label="Reason for visit" value={appointment.reason || "Routine visit"} />
                <div className="col-span-2">
                  <Info label="Current clinician" value={fullName(assignedClinician) || "Unassigned"} />
                </div>
              </div>

              {appointment.notes && (
                <div className="rounded-lg border border-slate-200 px-3.5 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Appointment notes</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-slate-700">{appointment.notes}</p>
                </div>
              )}

              <form onSubmit={saveAppointmentChanges} className="space-y-3 border-t border-slate-100 pt-4">
                <div>
                  <label htmlFor="appointment-clinician" className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Assign optometrist / doctor
                  </label>
                  <select
                    id="appointment-clinician"
                    value={selectedClinicianId}
                    onChange={(event) => {
                      setSelectedClinicianId(event.target.value);
                      setSuccess("");
                    }}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Select clinician</option>
                    {clinicians.map((item) => (
                      <option key={item._id} value={item._id}>
                        {fullName(item) || "Clinician"}{item.role ? ` · ${statusLabel(item.role)}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] text-slate-400">
                    {hasPendingChanges ? "You have unsaved changes" : "All changes are saved"}
                  </p>
                  <button
                    type="submit"
                    disabled={savingChanges || !hasPendingChanges}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {savingChanges ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {savingChanges ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-800">
        {value === 0 ? "0" : value || "—"}
      </p>
    </div>
  );
}
