import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FilePlus2,
  Phone,
  Save,
  Search,
  ShieldCheck,
  UserRound,
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

export default function AddPatientPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [saved, setSaved] = useState(false);

  const fullName = useMemo(
    () => [form.firstName, form.lastName].filter(Boolean).join(" "),
    [form.firstName, form.lastName]
  );

  const change = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSaved(false);
  };

  const validate = () => {
    const firstName = form.firstName.trim();
    const phone = form.phone.replace(/\D/g, "");

    if (!firstName) return "First name is required.";
    if (phone.length < 10 || phone.length > 15) {
      return "Enter a valid phone number.";
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Enter a valid email address.";
    }

    return "";
  };

  const checkDuplicate = async () => {
    const phone = form.phone.replace(/\D/g, "");
    if (phone.length < 10) return;

    setChecking(true);
    try {
      const response = await getPatients({
        page: 1,
        limit: 5,
        search: phone,
        status: "",
      });

      const rows = Array.isArray(response?.data?.patients)
        ? response.data.patients
        : Array.isArray(response?.data)
          ? response.data
          : [];

      if (rows.length) {
        setWarning(
          `${rows.length} existing patient record${rows.length > 1 ? "s" : ""} matched this phone number. Please check before creating a duplicate.`
        );
      } else {
        setWarning("");
      }
    } catch {
      setWarning("");
    } finally {
      setChecking(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSaved(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

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
        response?.data ||
        response?.patient ||
        null;

      setSaved(true);

      if (patient?._id) {
        navigate(`/patients/${patient._id}`);
      } else {
        navigate("/patients");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || "Unable to create patient."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-5 sm:py-7">
      <header className="overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:p-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => navigate("/patients")}
              className="mt-1 rounded-xl border border-white bg-white p-2.5 text-slate-500 shadow-sm hover:bg-slate-50"
              aria-label="Back to patients"
            >
              <ArrowLeft size={17} />
            </button>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.18em] text-violet-700">
                <FilePlus2 size={12} />
                Patient intake
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
                New patient
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Create a clean patient record with essential identity,
                contact, acquisition source and front-desk notes.
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-2xl border border-white/80 bg-white/75 px-4 py-3 text-xs text-slate-500 md:flex">
            <ShieldCheck size={15} className="text-emerald-600" />
            Ready for consultation, appointments and optical workflows
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {warning && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Search size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1">{warning}</div>
          <button
            type="button"
            onClick={() => navigate("/patients")}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm"
          >
            Review patients
          </button>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={17} />
          Patient created successfully.
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-cyan-50 to-white px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <UserRound size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Identity & contact
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Keep registration fast; detailed clinical history belongs in consultation.
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-3">
            <Input
              label="First name"
              value={form.firstName}
              required
              onChange={(value) => change("firstName", value)}
            />

            <Input
              label="Surname"
              value={form.lastName}
              onChange={(value) => change("lastName", value)}
            />

            <Input
              label="Date of birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(value) => change("dateOfBirth", value)}
            />

            <Select
              label="Gender"
              value={form.gender}
              onChange={(value) => change("gender", value)}
              options={genderOptions}
            />

            <div>
              <Input
                label="Phone"
                value={form.phone}
                required
                placeholder="10-digit mobile number"
                onChange={(value) => change("phone", value)}
              />
              <button
                type="button"
                onClick={checkDuplicate}
                disabled={checking || form.phone.replace(/\D/g, "").length < 10}
                className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 disabled:opacity-40"
              >
                <Search size={12} />
                {checking ? "Checking..." : "Check existing patient"}
              </button>
            </div>

            <Input
              label="Alternate phone"
              value={form.alternatePhone}
              onChange={(value) => change("alternatePhone", value)}
            />

            <Input
              className="lg:col-span-2"
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => change("email", value)}
            />

            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Record preview
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-800">
                {fullName || "Patient name"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {form.phone || "Phone not entered"}
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 bg-gradient-to-r from-amber-50 via-orange-50 to-white px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
                <Phone size={18} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Source & front-desk notes
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Capture acquisition source and useful administrative notes.
                </p>
              </div>
            </div>
          </header>

          <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">
            <Select
              label="Patient source"
              value={form.source}
              onChange={(value) => change("source", value)}
              options={sourceOptions}
            />

            <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/60 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Workflow note
              </div>
              <div className="mt-1 text-xs leading-5 text-slate-600">
                Source supports acquisition reporting. Clinical information,
                allergies and examination findings should be captured inside
                the consultation.
              </div>
            </div>

            <label className="block lg:col-span-2">
              <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Patient notes
              </span>

              <textarea
                rows={7}
                value={form.notes}
                onChange={(event) => change("notes", event.target.value)}
                placeholder="Front-desk notes, preferences, accessibility needs, communication instructions..."
                className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
              />
            </label>
          </div>
        </section>

        <footer className="sticky bottom-0 z-20 -mx-1 border-t border-slate-200 bg-white/95 px-1 py-4 backdrop-blur sm:static sm:bg-transparent sm:px-0">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/patients")}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:from-slate-800 hover:to-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Creating patient..." : "Create patient"}
            </button>
          </div>
        </footer>
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
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>

      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
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
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
      >
        {options.map(([value, labelText]) => (
          <option key={value} value={value}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  );
}
