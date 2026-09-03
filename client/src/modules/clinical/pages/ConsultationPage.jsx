import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  Eye,
  FileText,
  History,
  Pill,
  Save,
  Stethoscope,
} from "lucide-react";
import { getPatient } from "../../patients/patient.api";
import {
  createConsultation,
  getPatientConsultations,
} from "../consultation.api";
import { useAuth } from "../../auth/AuthContext";

const emptyEye = () => ({
  sphere: "",
  cylinder: "",
  axis: "",
  va: "",
  add: "",
  inter: "",
  prism: "",
  base: "",
});
const emptyRx = () => ({ right: emptyEye(), left: emptyEye(), note: "" });
const initialForm = () => ({
  consultationDate: new Date().toISOString().slice(0, 10),
  consultationType: "spectacle",
  medication: "",
  allergy: "",
  pupils: "",
  symptoms: "",
  ophthalmoscopy: "",
  biomicroscopy: "",
  visualField: "",
  colourVision: "",
  otherTests: [],
  previousRx: emptyRx(),
  subjectiveRx: emptyRx(),
  givenRx: emptyRx(),
  pd: { right: "", left: "", total: "" },
  recallDue: "",
  recallLetter: "",
  notes: "",
});
const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-100";

export default function ConsultationPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null),
    [history, setHistory] = useState([]),
    [form, setForm] = useState(initialForm),
    [activeTab, setActiveTab] = useState("clinical"),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(false);

  const fullName = useMemo(
    () =>
      [patient?.firstName, patient?.middleName, patient?.lastName]
        .filter(Boolean)
        .join(" "),
    [patient],
  );

  useEffect(() => {
    let active = true;
    Promise.all([getPatient(patientId), getPatientConsultations(patientId)])
      .then(([patientResponse, historyResponse]) => {
        if (!active) return;
        setPatient(patientResponse?.data || null);
        setHistory(historyResponse?.data || []);
      })
      .catch((err) => {
        if (active)
          setError(
            err?.response?.data?.message || "Unable to load consultation.",
          );
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [patientId]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSaved(false);
  };
  const updateRx = (rxType, eye, field, value) => {
    setForm((current) => ({
      ...current,
      [rxType]: {
        ...current[rxType],
        [eye]: { ...current[rxType][eye], [field]: value },
      },
    }));
    setSaved(false);
  };
  const copySubjectiveToGiven = () => {
    setForm((current) => ({
      ...current,
      givenRx: JSON.parse(JSON.stringify(current.subjectiveRx)),
    }));
    setSaved(false);
  };
  const addOtherTest = () =>
    setForm((current) => ({
      ...current,
      otherTests: [...current.otherTests, { name: "", result: "" }],
    }));
  const updateOtherTest = (index, field, value) =>
    setForm((current) => ({
      ...current,
      otherTests: current.otherTests.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  const removeOtherTest = (index) =>
    setForm((current) => ({
      ...current,
      otherTests: current.otherTests.filter((_, i) => i !== index),
    }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaved(false);
    try {
      setSaving(true);
      await createConsultation({
        patientId,
        ...form,
        recallDue: form.recallDue || null,
        optometristId: user?._id,
      });
      setSaved(true);
      const response = await getPatientConsultations(patientId);
      setHistory(response?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to save consultation.");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-6 text-sm text-slate-500">
        Loading patient...
      </div>
    );
  if (!patient)
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
          {error || "Patient not found."}
        </div>
      </div>
    );

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate("/patients")}
            className="mt-1 rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Consultation
              </h1>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                {patient.patientNumber}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {fullName} · {patient.phone || "No phone"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {user?.firstName} {user?.lastName}
        </div>
      </div>
      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <Check size={17} /> Consultation saved successfully.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex flex-wrap gap-2">
                <TabButton
                  active={activeTab === "clinical"}
                  onClick={() => setActiveTab("clinical")}
                  icon={<Stethoscope size={16} />}
                >
                  Clinical
                </TabButton>
                <TabButton
                  active={activeTab === "rx"}
                  onClick={() => setActiveTab("rx")}
                  icon={<Eye size={16} />}
                >
                  Prescription
                </TabButton>
                <TabButton
                  active={activeTab === "recall"}
                  onClick={() => setActiveTab("recall")}
                  icon={<CalendarDays size={16} />}
                >
                  Recall
                </TabButton>
                <TabButton
                  active={activeTab === "notes"}
                  onClick={() => setActiveTab("notes")}
                  icon={<FileText size={16} />}
                >
                  Notes
                </TabButton>
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <Field label="Consultation date">
                  <input
                    type="date"
                    value={form.consultationDate}
                    onChange={(e) =>
                      updateField("consultationDate", e.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </Field>
                <Field label="Consultation type">
                  <select
                    value={form.consultationType}
                    onChange={(e) =>
                      updateField("consultationType", e.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="spectacle">Spectacle consultation</option>
                    <option value="short_spectacle">
                      Short spectacle consultation
                    </option>
                    <option value="contact_lens">
                      Contact lens consultation
                    </option>
                  </select>
                </Field>
              </div>
              {activeTab === "clinical" && (
                <div className="space-y-5">
                  <ClinicalField
                    icon={<Pill size={17} />}
                    label="Medication"
                    value={form.medication}
                    onChange={(v) => updateField("medication", v)}
                    placeholder="Current medication..."
                  />
                  <ClinicalField
                    label="Allergy"
                    value={form.allergy}
                    onChange={(v) => updateField("allergy", v)}
                    placeholder="Medication / environmental allergies..."
                    danger={Boolean(form.allergy)}
                  />
                  <div className="grid gap-5 md:grid-cols-2">
                    <ClinicalField
                      label="Pupils"
                      value={form.pupils}
                      onChange={(v) => updateField("pupils", v)}
                    />
                    <ClinicalField
                      label="Symptoms"
                      value={form.symptoms}
                      onChange={(v) => updateField("symptoms", v)}
                    />
                    <ClinicalField
                      label="Ophthalmoscopy"
                      value={form.ophthalmoscopy}
                      onChange={(v) => updateField("ophthalmoscopy", v)}
                    />
                    <ClinicalField
                      label="Biomicroscopy"
                      value={form.biomicroscopy}
                      onChange={(v) => updateField("biomicroscopy", v)}
                    />
                    <ClinicalField
                      label="Visual field"
                      value={form.visualField}
                      onChange={(v) => updateField("visualField", v)}
                    />
                    <ClinicalField
                      label="Colour vision"
                      value={form.colourVision}
                      onChange={(v) => updateField("colourVision", v)}
                    />
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          Other tests
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Additional test names and results.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addOtherTest}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        Add test
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.otherTests.length === 0 && (
                        <p className="py-3 text-xs text-slate-400">
                          No additional tests added.
                        </p>
                      )}
                      {form.otherTests.map((test, index) => (
                        <div
                          key={index}
                          className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"
                        >
                          <input
                            value={test.name}
                            onChange={(e) =>
                              updateOtherTest(index, "name", e.target.value)
                            }
                            placeholder="Test name"
                            className={inputClass}
                          />
                          <input
                            value={test.result}
                            onChange={(e) =>
                              updateOtherTest(index, "result", e.target.value)
                            }
                            placeholder="Result"
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={() => removeOtherTest(index)}
                            className="rounded-xl border border-slate-200 px-3 text-xs text-slate-500 hover:bg-white"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "rx" && (
                <div className="space-y-6">
                  <RxCard
                    title="Previous Rx"
                    rx={form.previousRx}
                    rxType="previous"
                    updateRx={updateRx}
                    updateRxNote={(type, value) =>
                      setForm((current) => ({
                        ...current,
                        [type]: { ...current[type], note: value },
                      }))
                    }
                  />
                  <RxCard
                    title="Subjective Rx"
                    rx={form.subjectiveRx}
                    rxType="subjective"
                    updateRx={updateRx}
                    updateRxNote={(type, value) =>
                      setForm((current) => ({
                        ...current,
                        [type]: { ...current[type], note: value },
                      }))
                    }
                  />
                  <RxCard
                    title="Given Rx"
                    rx={form.givenRx}
                    rxType="given"
                    updateRx={updateRx}
                    updateRxNote={(type, value) =>
                      setForm((current) => ({
                        ...current,
                        [type]: { ...current[type], note: value },
                      }))
                    }
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={copySubjectiveToGiven}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      SU → GI
                    </button>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <ClipboardList size={17} className="text-slate-500" />
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">
                          Pupillary distance
                        </h3>
                        <p className="text-xs text-slate-400">
                          Values will transfer to a future spectacle job.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Right PD">
                        <input
                          value={form.pd.right}
                          onChange={(e) =>
                            updateField("pd", {
                              ...form.pd,
                              right: e.target.value,
                            })
                          }
                          placeholder="e.g. 31"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Left PD">
                        <input
                          value={form.pd.left}
                          onChange={(e) =>
                            updateField("pd", {
                              ...form.pd,
                              left: e.target.value,
                            })
                          }
                          placeholder="e.g. 31"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Total PD">
                        <input
                          value={form.pd.total}
                          onChange={(e) =>
                            updateField("pd", {
                              ...form.pd,
                              total: e.target.value,
                            })
                          }
                          placeholder="e.g. 62"
                          className={inputClass}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "recall" && (
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Recall due">
                    <input
                      type="date"
                      value={form.recallDue}
                      onChange={(e) => updateField("recallDue", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Recall letter">
                    <input
                      value={form.recallLetter}
                      onChange={(e) =>
                        updateField("recallLetter", e.target.value)
                      }
                      placeholder="e.g. Standard / 2 Year"
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}
              {activeTab === "notes" && (
                <Field label="Consultation notes">
                  <textarea
                    rows={10}
                    value={form.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    placeholder="Additional consultation notes..."
                    className={`${inputClass} h-auto resize-y py-3`}
                  />
                </Field>
              )}
            </div>
          </section>
          <div className="flex flex-col-reverse gap-3 pb-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/patients")}
              className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save Consultation"}
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
                {patient.firstName?.[0]}
                {patient.lastName?.[0]}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-slate-800">
                  {fullName}
                </h2>
                <p className="text-xs text-slate-400">
                  {patient.patientNumber}
                </p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
              <Info
                label="DOB"
                value={
                  patient.dateOfBirth
                    ? new Date(patient.dateOfBirth).toLocaleDateString()
                    : "—"
                }
              />
              <Info label="Phone" value={patient.phone || "—"} />
              <Info
                label="Last consult"
                value={
                  patient.lastConsultationAt
                    ? new Date(patient.lastConsultationAt).toLocaleDateString()
                    : "—"
                }
              />
              <Info
                label="Recall"
                value={
                  patient.nextRecallAt
                    ? new Date(patient.nextRecallAt).toLocaleDateString()
                    : "—"
                }
              />
            </div>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <History size={17} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-800">
                Consultation history
              </h2>
            </div>
            <div className="mt-4 space-y-3">
              {history.length === 0 && (
                <p className="text-xs text-slate-400">
                  No previous consultations.
                </p>
              )}
              {history.slice(0, 6).map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">
                      {new Date(item.consultationDate).toLocaleDateString()}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 text-[10px] font-medium text-slate-400">
                      {item.consultationType?.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {item.optometristId
                      ? `${item.optometristId.firstName || ""} ${item.optometristId.lastName || ""}`.trim()
                      : "Clinician"}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"}`}
    >
      {icon}
      {children}
    </button>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </label>
      {children}
    </div>
  );
}
function ClinicalField({
  label,
  value,
  onChange,
  placeholder,
  danger = false,
  icon,
}) {
  return (
    <div>
      <label
        className={`mb-2 flex items-center gap-2 text-xs font-semibold ${danger ? "text-red-600" : "text-slate-600"}`}
      >
        {icon}
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className={`${inputClass} h-auto resize-y py-3 ${danger ? "border-red-200 bg-red-50/40 focus:border-red-300" : ""}`}
      />
    </div>
  );
}
function RxCard({ title, rx, rxType, updateRx, updateRxNote }) {
  const fields = [
    ["sphere", "Sphere"],
    ["cylinder", "Cylinder"],
    ["axis", "Axis"],
    ["va", "VA"],
    ["add", "Add"],
    ["inter", "Inter"],
    ["prism", "Prism"],
    ["base", "Base"],
  ];

  const eyes = [
    ["right", "OD", "Right Eye"],
    ["left", "OS", "Left Eye"],
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-[11px] text-slate-400">
            {rxType === "given"
              ? "Prescription issued to the patient."
              : "Stored for clinical reference."}
          </p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
          {rxType}
        </span>
      </div>

      <div className="p-4">
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 via-blue-50/60 to-slate-50">
                <th className="sticky left-0 z-10 w-28 border-b border-r border-blue-100 bg-blue-50 px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-blue-700">
                  Eye
                </th>
                {fields.map(([field, label]) => (
                  <th
                    key={field}
                    className="border-b border-slate-200 bg-slate-50/80 px-2.5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {eyes.map(([eye, code, eyeLabel]) => (
                <tr key={eye} className={`group ${eye === "right" ? "bg-blue-50/35" : "bg-rose-50/35"}`}>
                  <th className={`sticky left-0 z-10 border-r border-b border-slate-200 px-4 py-2.5 text-left ${eye === "right" ? "bg-blue-50" : "bg-rose-50"}`}>
                    <div className={`text-xs font-bold ${eye === "right" ? "text-blue-800" : "text-rose-800"}`}>{code}</div>
                    <div className={`mt-0.5 text-[9px] font-medium uppercase tracking-wide ${eye === "right" ? "text-blue-500" : "text-rose-500"}`}>
                      {eyeLabel}
                    </div>
                  </th>

                  {fields.map(([field]) => (
                    <td
                      key={field}
                      className={`border-b border-slate-200 p-1.5 align-middle ${eye === "right" ? "bg-blue-50/10" : "bg-rose-50/10"}`}
                    >
                      <input
                        aria-label={`${code} ${field}`}
                        value={rx?.[eye]?.[field] || ""}
                        onChange={(e) =>
                          updateRx(rxType, eye, field, e.target.value)
                        }
                        className={`${inputClass} h-10 min-w-[88px] px-2.5 text-center text-xs font-medium bg-white ${eye === "right" ? "border-blue-100 focus:border-blue-400 focus:ring-blue-100" : "border-rose-100 focus:border-rose-400 focus:ring-rose-100"}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Rx Note
          </label>
          <textarea
            value={rx?.note || ""}
            onChange={(e) => updateRxNote(rxType, e.target.value)}
            rows={2}
            className={`${inputClass} h-auto resize-y py-2.5`}
            placeholder="Prescription note..."
          />
        </div>
      </div>
    </div>
  );
}
function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </div>
      <div className="mt-1 truncate text-xs font-medium text-slate-700">
        {value}
      </div>
    </div>
  );
}
