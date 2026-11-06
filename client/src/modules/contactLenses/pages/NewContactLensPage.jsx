import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, ChevronDown, Loader2, Search, Save,
  UserRound, Eye, Package, CalendarDays, ClipboardList, AlertCircle,
} from "lucide-react";

import {
  createContactLens,
  getLatestContactLensConsultation,
} from "../contactLens.api";
import { getPatients, getPatient } from "../../patients/patient.api";

const emptyEye = () => ({
  power: "",
  sphere: "",
  cylinder: "",
  axis: "",
  bc: "",
  dia: "",
  add: "",
  colour: "",
});

const initialForm = () => ({
  orderType: "order_only",
  lensType: "Soft",
  brand: "",
  model: "",
  supplier: "",
  replacement: "Monthly",
  right: emptyEye(),
  left: emptyEye(),
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  dueDate: "",
  notes: "",
});

const fullName = (p) =>
  [p?.firstName, p?.middleName, p?.lastName].filter(Boolean).join(" ") ||
  "Unnamed patient";

const unwrapPatient = (response) =>
  response?.data?.patient || response?.data || response?.patient || null;

const patientRows = (response) => {
  const candidates = [
    response?.data?.patients,
    response?.patients,
    response?.data?.data,
    response?.data,
  ];
  return candidates.find(Array.isArray) || [];
};

const unwrapConsultation = (response) =>
  response?.data?.consultation || response?.data || null;

const mapRx = (rx = {}) => ({
  power: rx.power ?? rx.sphere ?? "",
  sphere: rx.sphere ?? rx.power ?? "",
  cylinder: rx.cylinder ?? rx.cyl ?? "",
  axis: rx.axis ?? "",
  bc: rx.bc ?? rx.baseCurve ?? "",
  dia: rx.dia ?? rx.diameter ?? "",
  add: rx.add ?? "",
  colour: rx.colour ?? rx.color ?? "",
});

function Field({ label, value, onChange, type = "text", placeholder = "", min, step }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
      />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-8 text-xs text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-3.5 w-3.5 text-slate-400" />
      </div>
    </label>
  );
}

function Section({ icon: Icon, title, description, children, className = "" }) {
  return (
    <section className={`overflow-visible rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <Icon size={16} />
        </span>
        <div className="min-w-0">
          <h2 className="text-xs font-bold text-slate-800">{title}</h2>
          {description && <p className="mt-0.5 text-[10px] text-slate-400">{description}</p>}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function EyePrescription({ title, values, onChange }) {
  const fields = [
    ["power", "Power"],
    ["sphere", "Sphere"],
    ["cylinder", "Cylinder"],
    ["axis", "Axis"],
    ["bc", "Base curve"],
    ["dia", "Diameter"],
    ["add", "Add"],
    ["colour", "Colour"],
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-700">{title}</h3>
        <span className="rounded-md bg-white px-2 py-1 text-[9px] font-semibold text-slate-400">LENS PARAMETERS</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {fields.map(([key, label]) => (
          <Field
            key={key}
            label={label}
            value={values[key]}
            placeholder={key === "bc" ? "e.g. 8.6" : key === "dia" ? "e.g. 14.2" : ""}
            onChange={(value) => onChange(key, value)}
          />
        ))}
      </div>
    </div>
  );
}

export default function NewContactLensPage() {
  const navigate = useNavigate();
  const { patientId: routePatientId } = useParams();

  const [form, setForm] = useState(initialForm);
  const [patient, setPatient] = useState(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [consultationId, setConsultationId] = useState("");
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [loadingConsultation, setLoadingConsultation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const total = useMemo(
    () => Math.max(0, Number(form.quantity || 1) * Number(form.unitPrice || 0) - Number(form.discount || 0)),
    [form.quantity, form.unitPrice, form.discount],
  );

  useEffect(() => {
    if (!routePatientId) return;
    let active = true;
    setLoadingPatient(true);
    getPatient(routePatientId)
      .then((response) => {
        if (!active) return;
        const found = unwrapPatient(response);
        if (found?._id) {
          setPatient(found);
          setPatientSearch(fullName(found));
        } else {
          setError("The patient linked to this page could not be found.");
        }
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.message || "Unable to load the selected patient.");
      })
      .finally(() => {
        if (active) setLoadingPatient(false);
      });
    return () => { active = false; };
  }, [routePatientId]);

  useEffect(() => {
    const query = patientSearch.trim();
    if (!query || (patient && query === fullName(patient))) {
      setPatientResults([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const response = await getPatients({ page: 1, limit: 12, search: query, status: "active" });
        if (active) setPatientResults(patientRows(response));
      } catch {
        if (active) setPatientResults([]);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [patientSearch, patient]);

  useEffect(() => {
    if (!patient?._id) return;
    let active = true;
    setLoadingConsultation(true);
    getLatestContactLensConsultation(patient._id)
      .then((response) => {
        if (!active) return;
        const consultation = unwrapConsultation(response);
        if (!consultation?._id) return;
        setConsultationId(consultation._id);
        const rx = consultation.givenRx || consultation.finalRx || consultation.subjectiveRx || {};
        if (rx.right || rx.left) {
          setForm((current) => ({
            ...current,
            right: { ...current.right, ...mapRx(rx.right || {}) },
            left: { ...current.left, ...mapRx(rx.left || {}) },
          }));
        }
      })
      .catch(() => {
        // A contact-lens consultation is optional when creating an order.
      })
      .finally(() => {
        if (active) setLoadingConsultation(false);
      });
    return () => { active = false; };
  }, [patient?._id]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updateEye = (side, key, value) =>
    setForm((current) => ({ ...current, [side]: { ...current[side], [key]: value } }));

  const selectPatient = (selected) => {
    setPatient(selected);
    setPatientSearch(fullName(selected));
    setPatientResults([]);
    setShowResults(false);
    setConsultationId("");
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!patient?._id) {
      setError("Search for and select a patient before creating the contact lens job.");
      return;
    }
    if (!form.brand.trim() && !form.model.trim()) {
      setError("Enter at least a lens brand or model.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        patientId: patient._id,
        ...(consultationId ? { consultationId } : {}),
        orderType: form.orderType,
        lensType: form.lensType,
        brand: form.brand.trim(),
        model: form.model.trim(),
        supplier: form.supplier.trim(),
        right: form.right,
        left: form.left,
        replacement: form.replacement,
        quantity: Number(form.quantity || 1),
        unitPrice: Number(form.unitPrice || 0),
        discount: Number(form.discount || 0),
        dueDate: form.dueDate || undefined,
        notes: form.notes.trim(),
        status: "draft",
      };
      const response = await createContactLens(payload);
      const created = response?.data;
      setSuccess(`Contact lens job ${created?.orderNumber || ""} created successfully.`);
      if (created?._id) {
        navigate(`/dispensing/contact-lenses/${created._id}`, { replace: true });
      } else {
        navigate("/dispensing/contact-lenses");
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to create the contact lens job. Please check the details and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-[1440px] space-y-4 pb-8">
      <header className="sticky top-0 z-20 -mx-1 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">Dispensing / Contact lenses</div>
            <h1 className="truncate text-lg font-bold text-slate-900">Create contact lens job</h1>
            <p className="text-[11px] text-slate-500">Patient-linked lens order, prescription and collection details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="submit" disabled={saving || loadingPatient} className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? "Creating job..." : "Create contact lens job"}
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700">
          <CheckCircle2 size={15} /> {success}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.8fr)]">
        <div className="space-y-4">
          <Section icon={UserRound} title="Patient details" description="Select the patient who owns this contact lens job">
            <div className="relative">
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Search patient <span className="text-rose-500">*</span></label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setPatient(null);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                  placeholder="Search by patient name, number or phone..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
                {loadingPatient && <Loader2 size={15} className="absolute right-3 top-3 animate-spin text-slate-400" />}
              </div>
              {showResults && patientResults.length > 0 && (
                <div className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl">
                  {patientResults.map((item) => (
                    <button key={item._id} type="button" onClick={() => selectPatient(item)} className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left hover:bg-violet-50">
                      <span>
                        <span className="block text-xs font-semibold text-slate-800">{fullName(item)}</span>
                        <span className="mt-0.5 block text-[10px] text-slate-400">{item.patientNumber || "No patient number"} · {item.phone || "No phone"}</span>
                      </span>
                      <span className="text-[10px] font-semibold text-violet-600">Select</span>
                    </button>
                  ))}
                </div>
              )}
              {showResults && patientSearch.trim().length > 0 && patientResults.length === 0 && !patient && (
                <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-xs text-slate-500 shadow-lg">No matching patients found.</div>
              )}
            </div>
            {patient && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-100 bg-violet-50/60 p-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-violet-600"><UserRound size={17} /></span>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{fullName(patient)}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">{patient.patientNumber || "—"} · {patient.phone || "Phone not available"}</div>
                  </div>
                </div>
                <div className="text-[10px] font-semibold text-emerald-700">Patient selected</div>
              </div>
            )}
          </Section>

          <Section icon={Package} title="Lens & order details" description="Choose the lens modality and enter the order information">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SelectField label="Order type" value={form.orderType} onChange={(v) => update("orderType", v)} options={[
                { value: "order_only", label: "Order only" },
                { value: "consultation_and_order", label: "Consultation + order" },
                { value: "consultation_only", label: "Consultation only" },
                { value: "repeat_order", label: "Repeat order" },
              ]} />
              <SelectField label="Lens type" value={form.lensType} onChange={(v) => update("lensType", v)} options={[
                { value: "Soft", label: "Soft" },
                { value: "RGP", label: "RGP" },
                { value: "Scleral", label: "Scleral" },
                { value: "Toric", label: "Toric" },
                { value: "Multifocal", label: "Multifocal" },
                { value: "Other", label: "Other" },
              ]} />
              <SelectField label="Replacement schedule" value={form.replacement} onChange={(v) => update("replacement", v)} options={[
                { value: "Daily", label: "Daily" },
                { value: "Bi-weekly", label: "Bi-weekly" },
                { value: "Monthly", label: "Monthly" },
                { value: "Quarterly", label: "Quarterly" },
                { value: "Annual", label: "Annual" },
                { value: "Custom", label: "Custom" },
              ]} />
              <Field label="Brand" value={form.brand} onChange={(v) => update("brand", v)} placeholder="Lens brand" />
              <Field label="Model / material" value={form.model} onChange={(v) => update("model", v)} placeholder="Model or material" />
              <Field label="Supplier" value={form.supplier} onChange={(v) => update("supplier", v)} placeholder="Supplier name" />
              <Field label="Expected due date" type="date" value={form.dueDate} onChange={(v) => update("dueDate", v)} />
            </div>
          </Section>

          <Section icon={Eye} title="Contact lens prescription" description="Enter parameters separately for each eye. Existing contact-lens consultation Rx is prefilled when available.">
            {loadingConsultation && <div className="mb-3 flex items-center gap-2 text-[10px] text-slate-400"><Loader2 size={12} className="animate-spin" /> Checking latest contact lens consultation...</div>}
            <div className="grid gap-3 lg:grid-cols-2">
              <EyePrescription title="Right eye · OD" values={form.right} onChange={(key, value) => updateEye("right", key, value)} />
              <EyePrescription title="Left eye · OS" values={form.left} onChange={(key, value) => updateEye("left", key, value)} />
            </div>
            {consultationId && <p className="mt-2 text-[10px] text-emerald-700">Latest contact lens consultation linked to this job.</p>}
          </Section>

          <Section icon={ClipboardList} title="Job notes" description="Add fitting, handling, care or collection instructions">
            <textarea
              rows={4}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Enter fitting observations, patient instructions, care solution details or follow-up notes..."
              className="w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 outline-none placeholder:text-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
          </Section>
        </div>

        <aside className="space-y-4">
          <Section icon={CalendarDays} title="Job summary" description="Review the order before creating it">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-[11px] text-slate-500">Job status</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold capitalize text-amber-700">Draft</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">Patient</span>
                <span className="max-w-[65%] truncate text-right text-[11px] font-semibold text-slate-800">{patient ? fullName(patient) : "Not selected"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">Lens</span>
                <span className="text-right text-[11px] font-semibold text-slate-800">{[form.brand, form.model].filter(Boolean).join(" ") || "Not specified"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Lens type</span>
                <span className="text-[11px] font-semibold text-slate-800">{form.lensType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">Quantity</span>
                <span className="text-[11px] font-semibold text-slate-800">{form.quantity}</span>
              </div>
            </div>
          </Section>

          <Section icon={Package} title="Pricing" description="Order total is calculated automatically">
            <div className="space-y-3">
              <Field label="Quantity" type="number" min="1" step="1" value={form.quantity} onChange={(v) => update("quantity", Math.max(1, Number(v) || 1))} />
              <Field label="Unit price (₹)" type="number" min="0" step="0.01" value={form.unitPrice} onChange={(v) => update("unitPrice", v)} />
              <Field label="Discount (₹)" type="number" min="0" step="0.01" value={form.discount} onChange={(v) => update("discount", v)} />
              <div className="rounded-lg bg-slate-900 p-3 text-white">
                <div className="text-[10px] font-medium text-slate-300">Estimated total</div>
                <div className="mt-1 text-2xl font-bold tabular-nums">₹{total.toFixed(2)}</div>
                <div className="mt-1 text-[9px] text-slate-400">{form.quantity} × ₹{Number(form.unitPrice || 0).toFixed(2)} less ₹{Number(form.discount || 0).toFixed(2)} discount</div>
              </div>
            </div>
          </Section>

          <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-violet-700">Before you save</div>
            <ul className="mt-2 space-y-1.5 text-[10px] leading-relaxed text-slate-600">
              <li>• Confirm the selected patient.</li>
              <li>• Verify OD and OS lens parameters.</li>
              <li>• Check quantity, price and due date.</li>
              <li>• New jobs are created with Draft status.</li>
            </ul>
          </div>
        </aside>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-slate-200 pt-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={() => navigate(-1)} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
        <button type="submit" disabled={saving || !patient?._id} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Creating job..." : "Create contact lens job"}
        </button>
      </div>
    </form>
  );
}
