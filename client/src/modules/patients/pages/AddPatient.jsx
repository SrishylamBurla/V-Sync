import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  FilePlus2,
  LoaderCircle,
  Mail,
  Phone,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPatient, getPatients } from "../patient.api";

const sourceOptions = [
  ["walk_in", "Walk-in"],
  ["appointment", "Appointment"],
  ["website", "Website"],
  ["referral", "Referral"],
  ["campaign", "Campaign"],
  ["other", "Other"],
];

const genderOptions = [
  ["", "Select gender"],
  ["male", "Male"],
  ["female", "Female"],
  ["other", "Other"],
  ["prefer_not_to_say", "Prefer not to say"],
];

const initialForm = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  alternatePhone: "",
  email: "",
  source: "walk_in",
  notes: "",
};

const digitsOnly = (value = "") => String(value).replace(/\D/g, "");

const getPatientRows = (response) => {
  if (Array.isArray(response?.data?.patients)) return response.data.patients;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.patients)) return response.patients;
  return [];
};

const getPatientName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ") || "Patient record";

const getInitials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "P";
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? age : null;
};

const getRequestError = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function AddPatientPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [duplicateState, setDuplicateState] = useState("idle");
  const [duplicatePatients, setDuplicatePatients] = useState([]);
  const [duplicateError, setDuplicateError] = useState("");

  const fullName = useMemo(
    () => [form.firstName, form.lastName].map((part) => part.trim()).filter(Boolean).join(" "),
    [form.firstName, form.lastName],
  );
  const initials = useMemo(() => getInitials(fullName), [fullName]);
  const age = useMemo(() => calculateAge(form.dateOfBirth), [form.dateOfBirth]);

  const change = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });

    if (name === "phone") {
      setDuplicateState("idle");
      setDuplicatePatients([]);
      setDuplicateError("");
    }
  };

  const validate = () => {
    const nextErrors = {};
    const firstName = form.firstName.trim();
    const phone = digitsOnly(form.phone);
    const email = form.email.trim();

    if (!firstName) nextErrors.firstName = "Enter the patient's first name.";
    if (phone.length < 10 || phone.length > 15) {
      nextErrors.phone = "Enter a valid phone number (10–15 digits).";
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (form.dateOfBirth) {
      const birthDate = new Date(`${form.dateOfBirth}T00:00:00`);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
        nextErrors.dateOfBirth = "Date of birth cannot be in the future.";
      }
    }

    return nextErrors;
  };

  const checkDuplicate = async () => {
    const phone = digitsOnly(form.phone);
    if (phone.length < 10 || checking || saving) return;

    setChecking(true);
    setDuplicateState("checking");
    setDuplicatePatients([]);
    setDuplicateError("");

    try {
      const response = await getPatients({
        page: 1,
        limit: 5,
        search: phone,
        status: "",
      });
      const rows = getPatientRows(response);

      if (rows.length) {
        setDuplicatePatients(rows);
        setDuplicateState("matches");
      } else {
        setDuplicateState("clear");
      }
    } catch (requestError) {
      setDuplicateState("error");
      setDuplicateError(getRequestError(requestError));
    } finally {
      setChecking(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setError("");
    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      setError("Please review the highlighted fields before saving the patient.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        alternatePhone: form.alternatePhone.trim(),
        email: form.email.trim().toLowerCase(),
        notes: form.notes.trim(),
      };

      const response = await createPatient(payload);
      const patient =
        response?.data?.patient ||
        response?.data?.data ||
        response?.data ||
        response?.patient ||
        null;
      const patientId = patient?._id || patient?.id;

      if (patientId) {
        navigate(`/patients/${patientId}`);
      } else {
        navigate("/patients");
      }
    } catch (requestError) {
      setError(getRequestError(requestError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3 px-1 pb-4 pt-4 sm:pt-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <button
            type="button"
            onClick={() => navigate("/patients")}
            className="inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={14} />
            Patients
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700">New patient</span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/70 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
          <ShieldCheck size={13} />
          Secure patient registration
        </div>
      </div>

      <header className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.045)]">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-100/65 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-[28%] h-48 w-48 rounded-full bg-sky-100/60 blur-3xl" />
        <div className="relative flex flex-col gap-3 p-3 sm:p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-200">
              <FilePlus2 size={21} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">
                Patient intake · Front desk
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-[28px]">
                Register a new patient
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Create the patient profile with their essential identity and contact details. Clinical history can be added during consultation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-3 shadow-sm backdrop-blur-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <BadgeCheck size={17} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-800">Ready for care workflows</div>
              <div className="mt-0.5 text-[10px] text-slate-500">Appointments · Clinical · Dispensing</div>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-3.5 text-sm text-red-800 shadow-sm"
        >
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
          <div>
            <div className="font-semibold">Unable to save patient</div>
            <p className="mt-0.5 leading-5 text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={submit} noValidate className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="min-w-0 space-y-3">
          <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_3px_18px_rgba(15,23,42,0.035)]">
            <SectionHeader
              icon={UserRound}
              eyebrow="01 · Patient profile"
              title="Personal information"
              description="The primary details used to identify the patient across the practice."
            />

            <div className="grid gap-x-3 gap-y-3 p-3 sm:grid-cols-2 sm:p-3 xl:grid-cols-3">
              <Input
                name="firstName"
                label="First name"
                value={form.firstName}
                required
                autoComplete="given-name"
                error={fieldErrors.firstName}
                onChange={(value) => change("firstName", value)}
              />
              <Input
                name="lastName"
                label="Surname"
                value={form.lastName}
                autoComplete="family-name"
                onChange={(value) => change("lastName", value)}
              />
              <Input
                name="dateOfBirth"
                label="Date of birth"
                type="date"
                value={form.dateOfBirth}
                error={fieldErrors.dateOfBirth}
                onChange={(value) => change("dateOfBirth", value)}
              />
              <Select
                name="gender"
                label="Gender"
                value={form.gender}
                options={genderOptions}
                onChange={(value) => change("gender", value)}
              />
              <Input
                name="phone"
                label="Phone number"
                value={form.phone}
                required
                type="tel"
                autoComplete="tel"
                placeholder="Enter mobile number"
                error={fieldErrors.phone}
                onChange={(value) => change("phone", value)}
              />
              <Input
                name="alternatePhone"
                label="Alternate phone"
                value={form.alternatePhone}
                type="tel"
                placeholder="Optional contact number"
                autoComplete="tel-national"
                onChange={(value) => change("alternatePhone", value)}
              />
              <Input
                name="email"
                label="Email address"
                value={form.email}
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                error={fieldErrors.email}
                className="sm:col-span-2"
                onChange={(value) => change("email", value)}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_3px_18px_rgba(15,23,42,0.035)]">
            <SectionHeader
              icon={Phone}
              eyebrow="02 · Registration details"
              title="Source and front-desk notes"
              description="Record how the patient found the practice and any useful administrative context."
            />
            <div className="space-y-3 p-3 sm:p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  name="source"
                  label="Patient source"
                  value={form.source}
                  options={sourceOptions}
                  onChange={(value) => change("source", value)}
                />
                <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-3">
                  <ShieldCheck size={16} className="mt-0.5 shrink-0 text-sky-700" />
                  <p className="text-xs leading-5 text-slate-600">
                    Keep examination findings, allergies and clinical history inside the patient's consultation record.
                  </p>
                </div>
              </div>

              <label className="block" htmlFor="patient-notes">
                <span className="mb-1.5 block text-[11px] font-semibold text-slate-700">
                  Patient notes <span className="font-normal text-slate-400">(optional)</span>
                </span>
                <textarea
                  id="patient-notes"
                  name="notes"
                  rows={4}
                  value={form.notes}
                  onChange={(event) => change("notes", event.target.value)}
                  placeholder="Front-desk notes, communication preferences or accessibility requirements..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-sm leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
                />
              </label>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 rounded-[20px] border border-slate-200 bg-white/95 p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-3">
            <p className="px-1 text-[11px] leading-5 text-slate-400">
              <span className="text-red-500">*</span> Required fields
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/patients")}
                disabled={saving}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Creating patient…" : "Create patient"}
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-4">
          <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_3px_18px_rgba(15,23,42,0.035)]">
            <div className="border-b border-slate-100 px-3 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-700">Live preview</div>
              <h2 className="mt-1 text-sm font-bold text-slate-900">Patient profile</h2>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-sky-100 text-sm font-bold text-violet-800 ring-1 ring-violet-100">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-900">{fullName || "Patient name"}</div>
                  <div className="mt-0.5 text-[11px] text-slate-400">New patient record</div>
                </div>
              </div>
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <PreviewLine icon={Phone} label="Phone" value={form.phone || "Not entered"} />
                <PreviewLine icon={Mail} label="Email" value={form.email || "Not entered"} />
                <PreviewLine icon={CalendarDays} label="Age" value={age === null ? "Not provided" : `${age} years`} />
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-[0_3px_18px_rgba(15,23,42,0.035)]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Users size={15} />
              </div>
              <h2 className="text-xs font-bold text-slate-800">Check for duplicates</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Search existing records using the phone number before registering a new profile.
            </p>
            <button
              type="button"
              onClick={checkDuplicate}
              disabled={checking || saving || digitsOnly(form.phone).length < 10}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checking ? <LoaderCircle size={14} className="animate-spin" /> : <Search size={14} />}
              {checking ? "Searching records…" : "Check existing patient"}
            </button>

            {duplicateState === "matches" && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3" role="status">
                <div className="flex items-start gap-2 text-xs font-semibold text-amber-900">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  {duplicatePatients.length} possible matching record{duplicatePatients.length === 1 ? "" : "s"} found
                </div>
                <div className="mt-2 space-y-2">
                  {duplicatePatients.slice(0, 3).map((patient, index) => (
                    <div key={patient?._id || patient?.id || index} className="rounded-lg bg-white/80 px-2.5 py-2">
                      <div className="text-xs font-semibold text-slate-800">{getPatientName(patient)}</div>
                      <div className="mt-0.5 text-[10px] text-slate-500">
                        {patient?.patientNumber || "Patient record"} {patient?.phone || patient?.mobile ? `· ${patient.phone || patient.mobile}` : ""}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/patients")}
                  className="mt-2 text-[11px] font-bold text-amber-900 underline decoration-amber-400 underline-offset-2 hover:text-amber-700"
                >
                  Review patient records
                </button>
              </div>
            )}

            {duplicateState === "clear" && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-800" role="status">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                No matching records were returned for this phone number.
              </div>
            )}

            {duplicateState === "error" && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs leading-5 text-red-700" role="alert">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{duplicateError || "Could not check for duplicate records."}</span>
              </div>
            )}
          </section>

          <div className="rounded-[20px] border border-violet-100 bg-gradient-to-br from-violet-50/80 to-sky-50/80 p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <ShieldCheck size={15} className="text-violet-700" />
              Registration guidance
            </div>
            <p className="mt-2 text-[11px] leading-5 text-slate-600">
              Use the patient's correct contact details. Detailed vision findings and treatment information should be documented in the clinical workflow.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function SectionHeader({ icon: Icon, eyebrow, title, description }) {
  return (
    <header className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/60 px-3 py-3 sm:px-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm ring-1 ring-slate-100">
        <Icon size={17} strokeWidth={1.9} />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-violet-700">{eyebrow}</div>
        <h2 className="mt-0.5 text-sm font-bold text-slate-900">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
      </div>
    </header>
  );
}

function PreviewLine({ icon: Icon, label, value }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Icon size={14} className="shrink-0 text-slate-400" />
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="truncate text-xs font-medium text-slate-700">{value}</div>
      </div>
    </div>
  );
}

function Input({
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  className = "",
  error = "",
  autoComplete,
}) {
  const id = `patient-${name}`;
  return (
    <label className={`block min-w-0 ${className}`} htmlFor={id}>
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <input
        id={id}
        name={name}
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-10 w-full rounded-xl border bg-slate-50/70 px-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:bg-white focus:ring-4 ${
          error
            ? "border-red-300 focus:border-red-400 focus:ring-red-50"
            : "border-slate-200 focus:border-violet-400 focus:ring-violet-50"
        }`}
      />
      {error && (
        <span id={`${id}-error`} className="mt-1.5 block text-[11px] font-medium text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

function Select({ name, label, value, onChange, options }) {
  const id = `patient-${name}`;
  return (
    <label className="block min-w-0" htmlFor={id}>
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-700">{label}</span>
      <select
        id={id}
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
