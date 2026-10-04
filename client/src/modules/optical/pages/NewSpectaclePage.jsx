
import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ClipboardList,
  FileText,
  IndianRupee,
  Package,
  Plus,
  Save,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createSpectacle,
  getLatestConsultationForPatient,
} from "../spectacle.api";

import { getInventory } from "../../inventory/inventory.api";

import { getPatients, getPatient } from "../../patients/patient.api";

import { DocumentShell } from "../../../components/common/DocumentUI";

const eye = () => ({
  sphere: "",
  cylinder: "",
  axis: "",
  va: "",
  add: "",
  inter: "",
  prism: "",
  base: "",
});

const money = (value) => Number(value || 0).toFixed(2);

const displayText = (value) => {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => displayText(item))
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object") {
    // Preserve useful structured inventory text without rendering
    // the object itself as a React child.
    const preferredKeys = [
      "instructions",
      "toApply",
      "toFit",
      "name",
      "label",
      "description",
      "value",
      "text",
    ];

    const preferred = preferredKeys
      .map((key) => displayText(value[key]))
      .filter(Boolean);

    if (preferred.length) {
      return preferred.join(" · ");
    }

    return Object.values(value)
      .map((item) => displayText(item))
      .filter(Boolean)
      .join(" · ");
  }

  return String(value);
};

const emptyExtra = () => ({
  description: "",
  supplier: "",
  price: 0,
});

const inputClass =
  "h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[11px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50 disabled:text-slate-500";

const selectClass =
  "h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

const labelClass =
  "mb-1 block text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400";

const getPatientId = (patient) => patient?._id || patient?.id || "";

const getPatientName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ") || "Unnamed patient";

const getPatientSearchText = (patient) =>
  [
    getPatientName(patient),
    patient?.patientNumber,
    patient?.phone,
    patient?.mobile,
    patient?.email,
  ]
    .filter(Boolean)
    .join(" ");

function CompactField({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  disabled = false,
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>{label}</span>
      <input
        type={type}
        value={value ?? ""}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function CompactSelect({
  label,
  value,
  onChange,
  options,
  className = "",
}) {
  return (
    <label className={`block ${className}`}>
      <span className={labelClass}>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Panel({ number, title, right, children, className = "" }) {
  return (
    <section
      className={`overflow-visible rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] ${className}`}
    >
      <div className="flex min-h-10 items-center justify-between border-b border-slate-100 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[8px] font-bold text-slate-500">
            {number}
          </span>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-700">
            {title}
          </h2>
        </div>
        {right}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function SearchResult({ item, type, onSelect }) {
  const description =
    type === "frame"
      ? [item.brand, item.model, displayText(item.description)].filter(Boolean).join(" · ")
      : [displayText(item.description), item.brand, item.model].filter(Boolean).join(" · ");

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 text-left transition last:border-b-0 hover:bg-slate-50"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[11px] text-slate-800">
            {item.code || "—"}
          </span>

          {item.stock !== undefined && (
            <span
              className={`rounded px-1.5 py-0.5 text-[8px] font-semibold ${
                Number(item.stock) > 0
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {Number(item.stock) > 0 ? `${item.stock} stock` : "Out"}
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-[9px] text-slate-500">
          {description || "No description"}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-[10px] font-semibold text-slate-800">
          ₹{money(item.sellingPrice)}
        </p>
        <span className="mt-0.5 inline-flex items-center gap-1 text-[8px] font-semibold text-slate-400">
          Select <Check size={10} />
        </span>
      </div>
    </button>
  );
}

function PatientSearchResult({ patient, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(patient)}
      className="flex w-full items-center gap-2.5 border-b border-slate-100 px-3 py-2 text-left transition last:border-b-0 hover:bg-slate-50"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <UserRound size={13} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold text-slate-800">
          {getPatientName(patient)}
        </p>

        <div className="mt-0.5 flex flex-wrap gap-x-3 text-[9px] text-slate-400">
          {patient?.patientNumber && <span>{patient.patientNumber}</span>}
          {patient?.phone && <span>{patient.phone}</span>}
        </div>
      </div>

      <Check size={13} className="text-slate-300" />
    </button>
  );
}

function PrescriptionRow({ eyeName, values, onChange }) {
  const fields = [
    ["sphere", "SPH"],
    ["cylinder", "CYL"],
    ["axis", "AXIS"],
    ["va", "VA"],
    ["add", "ADD"],
    ["inter", "INTER"],
    ["prism", "PRISM"],
    ["base", "BASE"],
  ];

  return (
    <div className="grid grid-cols-[52px_repeat(8,minmax(55px,1fr))] gap-1.5">
      <div className="flex items-center gap-1.5">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded text-[9px] font-bold ${
            eyeName === "right"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {eyeName === "right" ? "OD" : "OS"}
        </span>
      </div>

      {fields.map(([key, label]) => (
        <input
          key={key}
          value={values?.[key] || ""}
          onChange={(event) => onChange(eyeName, key, event.target.value)}
          placeholder={label}
          className="h-7 min-w-0 rounded-md border border-slate-200 bg-white px-1.5 text-center text-[9px] font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-100"
        />
      ))}
    </div>
  );
}

export default function NewSpectaclePage() {
  const { patientId: routePatientId } = useParams();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [patients, setPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [showPatientResults, setShowPatientResults] = useState(false);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [frames, setFrames] = useState([]);
  const [lenses, setLenses] = useState([]);
  const [frameSearch, setFrameSearch] = useState("");
  const [lensSearch, setLensSearch] = useState("");
  const [showFrameResults, setShowFrameResults] = useState(false);
  const [showLensResults, setShowLensResults] = useState(false);
  const [consultation, setConsultation] = useState(null);

  const [form, setForm] = useState({
    jobNo: "",
    jobDate: new Date().toISOString().slice(0, 10),
    dueDate: "",
    jobType: "spectacle",
    status: "ordered",
    dispenser: "",
    use: {
      day: false,
      night: false,
      multifocal: false,
      bifocal: false,
    },
    readyDate: "",
    readyBy: "",
    notification: "none",
    collectedDate: "",
    collectedBy: "",
    electronicOrder: "",
    consultationId: null,

    rx: {
      right: eye(),
      left: eye(),
      note: "",
    },

    pd: {
      right: "",
      left: "",
      total: "",
    },

    frame: {
      code: "",
      description: "",
      price: 0,
      ownFrame: false,
      size: "",
      depth: "",
      ed: "",
      type: "",
      ssi: "",
    },

    frameItemId: null,

    lens: {
      code: "",
      description: "",
      supplier: "",
      price: 0,
      size: "",
      segment: "",
      tint: "",
      bc: "",
    },

    lensItemId: null,

    extras: [],
    discount: 0,
    notes: "",
  });

  const activePatientId = routePatientId || getPatientId(selectedPatient);

  useEffect(() => {
    let mounted = true;

    const loadPatients = async () => {
      try {
        setPatientsLoading(true);

        const response = await getPatients({
          page: 1,
          limit: 50,
          search: "",
          status: "active",
        });

        if (!mounted) return;

        const patientList =
          response?.data?.patients || response?.patients || response?.data || [];

        setPatients(Array.isArray(patientList) ? patientList : []);
      } catch (err) {
        if (mounted) console.error("Unable to load patients:", err);
      } finally {
        if (mounted) setPatientsLoading(false);
      }
    };

    loadPatients();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadRoutePatient = async () => {
      if (!routePatientId) {
        setSelectedPatient(null);
        return;
      }

      try {
        const response = await getPatient(routePatientId);
        if (!mounted) return;

        const patient = response?.data || response?.patient || response;

        if (patient) {
          setSelectedPatient(patient);
          setPatientSearch(getPatientName(patient));
        }
      } catch (err) {
        if (!mounted) return;

        setError(
          err?.response?.data?.message ||
            "Unable to load selected patient."
        );
      }
    };

    loadRoutePatient();

    return () => {
      mounted = false;
    };
  }, [routePatientId]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [consultationResponse, frameResponse, lensResponse] =
          await Promise.all([
            getLatestConsultationForPatient(activePatientId),
            getInventory({ category: "frame" }),
            getInventory({ category: "lens" }),
          ]);

        if (!mounted) return;

        const latestConsultation = consultationResponse?.data || null;

        setConsultation(latestConsultation);

        setFrames(
          Array.isArray(frameResponse?.data) ? frameResponse.data : []
        );

        setLenses(
          Array.isArray(lensResponse?.data) ? lensResponse.data : []
        );

        if (latestConsultation) {
          const optometrist =
            latestConsultation.optometristId &&
            typeof latestConsultation.optometristId === "object"
              ? [
                  latestConsultation.optometristId.firstName,
                  latestConsultation.optometristId.lastName,
                ]
                  .filter(Boolean)
                  .join(" ")
              : "";

          setForm((previous) => ({
            ...previous,
            consultationId: latestConsultation._id,
            dispenser: previous.dispenser || "",
            rx: {
              ...previous.rx,
              ...(latestConsultation.givenRx || {}),
            },
            pd: {
              ...previous.pd,
              ...(latestConsultation.pd || {}),
            },
          }));

          if (optometrist) {
            // Kept in consultation display; no staff API is required here.
          }
        } else {
          setConsultation(null);

          setForm((previous) => ({
            ...previous,
            consultationId: null,
          }));
        }
      } catch (err) {
        if (!mounted) return;

        setError(
          err?.response?.data?.message ||
            "Unable to load spectacle dispensing data."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (activePatientId) {
      load();
    } else {
      setLoading(false);
      setConsultation(null);
      setFrames([]);
      setLenses([]);
    }

    return () => {
      mounted = false;
    };
  }, [activePatientId]);

  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();

    if (!query) return patients.slice(0, 20);

    return patients
      .filter((patient) =>
        getPatientSearchText(patient).toLowerCase().includes(query)
      )
      .slice(0, 20);
  }, [patients, patientSearch]);

  const filteredFrames = useMemo(() => {
    const query = frameSearch.trim().toLowerCase();
    if (!query) return [];

    return frames
      .filter((item) =>
        `${item.code || ""} ${item.brand || ""} ${item.model || ""} ${
          item.description || ""
        }`
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 12);
  }, [frames, frameSearch]);

  const filteredLenses = useMemo(() => {
    const query = lensSearch.trim().toLowerCase();
    if (!query) return [];

    return lenses
      .filter((item) =>
        `${item.code || ""} ${item.brand || ""} ${item.model || ""} ${
          item.description || ""
        } ${item.supplier || ""}`
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 12);
  }, [lenses, lensSearch]);

  const extrasTotal = useMemo(
    () =>
      form.extras.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [form.extras]
  );

  const subtotal =
    Number(form.frame.price || 0) +
    Number(form.lens.price || 0) +
    extrasTotal;

  const total = Math.max(0, subtotal - Number(form.discount || 0));

  const optometristName = useMemo(() => {
    const value = consultation?.optometristId;

    if (!value) return "";

    if (typeof value === "string") return value;

    return [value.firstName, value.lastName].filter(Boolean).join(" ");
  }, [consultation]);

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateRx = (eyeName, field, value) => {
    setForm((previous) => ({
      ...previous,
      rx: {
        ...previous.rx,
        [eyeName]: {
          ...previous.rx[eyeName],
          [field]: value,
        },
      },
    }));
  };

  const updatePd = (field, value) => {
    setForm((previous) => ({
      ...previous,
      pd: {
        ...previous.pd,
        [field]: value,
      },
    }));
  };

  const updateUse = (field, checked) => {
    setForm((previous) => ({
      ...previous,
      use: {
        ...previous.use,
        [field]: checked,
      },
    }));
  };

  const selectPatient = (patient) => {
    const id = getPatientId(patient);
    if (!id) return;

    setSelectedPatient(patient);
    setPatientSearch(getPatientName(patient));
    setShowPatientResults(false);
    setConsultation(null);

    setForm((previous) => ({
      ...previous,
      consultationId: null,
      rx: { right: eye(), left: eye(), note: "" },
      pd: { right: "", left: "", total: "" },
      frame: {
        code: "",
        description: "",
        price: 0,
        ownFrame: false,
        size: "",
        depth: "",
        ed: "",
        type: "",
        ssi: "",
      },
      frameItemId: null,
      lens: {
        code: "",
        description: "",
        supplier: "",
        price: 0,
        size: "",
        segment: "",
        tint: "",
        bc: "",
      },
      lensItemId: null,
      extras: [],
      discount: 0,
      notes: "",
    }));

    setFrameSearch("");
    setLensSearch("");
    setError("");
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setPatientSearch("");
    setShowPatientResults(false);
    setConsultation(null);

    setForm((previous) => ({
      ...previous,
      consultationId: null,
      rx: { right: eye(), left: eye(), note: "" },
      pd: { right: "", left: "", total: "" },
      frame: {
        code: "",
        description: "",
        price: 0,
        ownFrame: false,
        size: "",
        depth: "",
        ed: "",
        type: "",
        ssi: "",
      },
      frameItemId: null,
      lens: {
        code: "",
        description: "",
        supplier: "",
        price: 0,
        size: "",
        segment: "",
        tint: "",
        bc: "",
      },
      lensItemId: null,
      extras: [],
      discount: 0,
      notes: "",
    }));

    setFrameSearch("");
    setLensSearch("");
  };

  const selectFrame = (item) => {
    setForm((previous) => ({
      ...previous,
      frameItemId: item._id,
      frame: {
        ...previous.frame,
        code: item.code || "",
        description:
          item.description ||
          [item.brand, item.model].filter(Boolean).join(" "),
        price: Number(item.sellingPrice || 0),
        ownFrame: false,
      },
    }));

    setFrameSearch(
      [item.code, item.brand, item.model].filter(Boolean).join(" ")
    );
    setShowFrameResults(false);
  };

  const clearFrame = () => {
    setForm((previous) => ({
      ...previous,
      frameItemId: null,
      frame: {
        code: "",
        description: "",
        price: 0,
        ownFrame: false,
        size: "",
        depth: "",
        ed: "",
        type: "",
        ssi: "",
      },
    }));

    setFrameSearch("");
  };

  const selectLens = (item) => {
    setForm((previous) => ({
      ...previous,
      lensItemId: item._id,
      lens: {
        ...previous.lens,
        code: item.code || "",
        description: item.description || "",
        supplier: item.supplier || "",
        price: Number(item.sellingPrice || 0),
      },
    }));

    setLensSearch(
      [item.code, item.description].filter(Boolean).join(" ")
    );
    setShowLensResults(false);
  };

  const clearLens = () => {
    setForm((previous) => ({
      ...previous,
      lensItemId: null,
      lens: {
        code: "",
        description: "",
        supplier: "",
        price: 0,
        size: "",
        segment: "",
        tint: "",
        bc: "",
      },
    }));

    setLensSearch("");
  };

  const addExtra = () => {
    setForm((previous) => ({
      ...previous,
      extras: [...previous.extras, emptyExtra()],
    }));
  };

  const updateExtra = (index, field, value) => {
    setForm((previous) => ({
      ...previous,
      extras: previous.extras.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: field === "price" ? Number(value || 0) : value,
            }
          : item
      ),
    }));
  };

  const removeExtra = (index) => {
    setForm((previous) => ({
      ...previous,
      extras: previous.extras.filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  const validate = () => {
    if (!activePatientId) {
      return "Please select a patient before creating the spectacle job.";
    }

    if (!form.jobDate) return "Job date is required.";
    if (!form.dueDate) return "Please select the expected delivery date.";

    if (!form.frameItemId && !form.frame.ownFrame) {
      return "Please select a frame from inventory or mark it as own frame.";
    }

    if (!form.lensItemId) {
      return "Please select a lens from inventory.";
    }

    return "";
  };

  const save = async () => {
    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await createSpectacle({
        ...form,
        patientId: activePatientId,
      });

      const spectacle = response?.data;

      if (spectacle?._id) {
        navigate(`/dispensing/spectacles/${spectacle._id}`);
        return;
      }

      navigate(`/patients/${activePatientId}`);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to create spectacle job."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DocumentShell
      eyebrow="Optical Dispensing"
      title="New Spectacle Job"
      subtitle="Create and track a spectacle dispensing job."
      code={form.jobNo || "NEW SPECTACLE"}
      actions={
        <div className="flex items-center gap-1.5">
          

          <button
            type="button"
            onClick={save}
            disabled={saving || loading || !activePatientId}
            className="inline-flex h-8 items-center rounded-md bg-slate-900 px-3 text-[10px] font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={13} className="mr-1.5" />
            {saving ? "Creating..." : "Save Job"}
          </button>
        </div>
      }
    >
      <div className="space-y-2.5">
        {error && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[10px] text-red-700">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <Panel
          number="01"
          title="Patient Details"
          right={
            selectedPatient && (
              <button
                type="button"
                onClick={clearPatient}
                className="inline-flex items-center gap-1 text-[9px] font-semibold text-red-600 hover:text-red-700"
              >
                <X size={11} />
                Change
              </button>
            )
          }
        >
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div className="relative">
              <label className={labelClass}>Patient</label>
              <div className="relative">
                <Search
                  size={13}
                  className="pointer-events-none absolute left-2.5 top-2 text-slate-400"
                />
                <input
                  value={patientSearch}
                  disabled={Boolean(routePatientId)}
                  onChange={(event) => {
                    setPatientSearch(event.target.value);
                    setShowPatientResults(true);
                  }}
                  onFocus={() => setShowPatientResults(true)}
                  placeholder="Search name, patient number or phone..."
                  className={`${inputClass} pl-8 pr-8`}
                />
                {!routePatientId && (
                  <ChevronDown
                    size={13}
                    className="pointer-events-none absolute right-2.5 top-2 text-slate-400"
                  />
                )}
              </div>

              {!routePatientId && showPatientResults && (
                <div className="absolute left-0 right-0 top-[46px] z-50 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
                  {patientsLoading ? (
                    <div className="p-4 text-center text-[10px] text-slate-500">
                      Loading patients...
                    </div>
                  ) : filteredPatients.length ? (
                    <div className="max-h-60 overflow-auto">
                      {filteredPatients.map((patient) => (
                        <PatientSearchResult
                          key={getPatientId(patient)}
                          patient={patient}
                          onSelect={selectPatient}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-[10px] text-slate-500">
                      No patients found.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="min-w-[300px] rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              {selectedPatient ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200">
                    <UserRound size={13} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-slate-800">
                      {getPatientName(selectedPatient)}
                    </p>
                    <div className="mt-0.5 flex gap-3 text-[9px] text-slate-500">
                      <span>
                        {selectedPatient.patientNumber || "No patient no."}
                      </span>
                      <span>
                        {selectedPatient.phone || "No phone"}
                      </span>
                    </div>
                  </div>
                  <Check
                    size={14}
                    className="ml-auto text-emerald-600"
                  />
                </div>
              ) : (
                <div className="flex h-7 items-center text-[10px] text-slate-400">
                  Select a patient to load the latest prescription.
                </div>
              )}
            </div>
          </div>
        </Panel>

        <Panel number="02" title="Job Details">
          <div className="grid gap-2 md:grid-cols-4">
            <CompactField
              label="Job No."
              value={form.jobNo}
              onChange={(value) => updateForm("jobNo", value)}
              placeholder="Auto / enter job no."
            />

            <div>
              <span className={labelClass}>Optometrist</span>
              <div className="flex h-8 items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-700">
                {optometristName || "From consultation"}
              </div>
            </div>

            <CompactField
              label="Dispenser"
              value={form.dispenser}
              onChange={(value) => updateForm("dispenser", value)}
              placeholder="Dispenser name"
            />

            <CompactSelect
              label="Job Type"
              value={form.jobType}
              onChange={(value) => updateForm("jobType", value)}
              options={[
                { value: "spectacle", label: "Spectacle" },
                { value: "single_vision", label: "Single Vision" },
                { value: "progressive", label: "Progressive" },
                { value: "bifocal", label: "Bifocal" },
                { value: "other", label: "Other" },
              ]}
            />
          </div>

          <div className="mt-2 grid gap-2 lg:grid-cols-[1.2fr_1fr_1fr]">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
              <span className={labelClass}>Job Status</span>
              <div className="flex flex-wrap gap-1">
                {[
                  ["ordered", "Ordered"],
                  ["cn", "CN"],
                  ["pending", "Pending"],
                  ["refund", "Refund"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateForm("status", value)}
                    className={`h-6 rounded px-2 text-[9px] font-semibold transition ${
                      form.status === value
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
              <span className={labelClass}>PD</span>
              <div className="grid grid-cols-3 gap-1">
                <CompactField
                  label="OD"
                  value={form.pd.right}
                  onChange={(value) => updatePd("right", value)}
                />
                <CompactField
                  label="OS"
                  value={form.pd.left}
                  onChange={(value) => updatePd("left", value)}
                />
                <CompactField
                  label="Total"
                  value={form.pd.total}
                  onChange={(value) => updatePd("total", value)}
                />
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
              <span className={labelClass}>Use</span>
              <div className="flex flex-wrap gap-2">
                {[
                  ["day", "D"],
                  ["night", "N"],
                  ["multifocal", "M"],
                  ["bifocal", "BF"],
                ].map(([key, label]) => (
                  <label
                    key={key}
                    className="flex cursor-pointer items-center gap-1 text-[9px] font-semibold text-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(form.use[key])}
                      onChange={(event) =>
                        updateUse(key, event.target.checked)
                      }
                      className="h-3 w-3 rounded border-slate-300"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            <CompactField
              label="Job Date"
              type="date"
              value={form.jobDate}
              onChange={(value) => updateForm("jobDate", value)}
            />
            <CompactField
              label="Expected"
              type="date"
              value={form.dueDate}
              onChange={(value) => updateForm("dueDate", value)}
            />
            <CompactField
              label="Job Ready"
              type="date"
              value={form.readyDate}
              onChange={(value) => updateForm("readyDate", value)}
            />
            <CompactField
              label="Ready By"
              value={form.readyBy}
              onChange={(value) => updateForm("readyBy", value)}
              placeholder="Staff"
            />
          </div>

          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            <CompactSelect
              label="SMS / Email"
              value={form.notification}
              onChange={(value) => updateForm("notification", value)}
              options={[
                { value: "none", label: "None" },
                { value: "sms", label: "SMS" },
                { value: "email", label: "Email" },
                { value: "both", label: "SMS + Email" },
              ]}
            />

            <CompactField
              label="Collected"
              type="date"
              value={form.collectedDate}
              onChange={(value) => updateForm("collectedDate", value)}
            />

            <CompactField
              label="Collected By"
              value={form.collectedBy}
              onChange={(value) => updateForm("collectedBy", value)}
              placeholder="Staff"
            />

            <CompactField
              label="Electronic Order"
              value={form.electronicOrder}
              onChange={(value) => updateForm("electronicOrder", value)}
              placeholder="Order / reference no."
            />
          </div>

          <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Prescription
              </span>
              {consultation && (
                <span className="inline-flex items-center gap-1 text-[8px] font-semibold text-emerald-600">
                  <ClipboardList size={10} />
                  Latest consultation loaded
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <PrescriptionRow
                eyeName="right"
                values={form.rx.right}
                onChange={updateRx}
              />
              <PrescriptionRow
                eyeName="left"
                values={form.rx.left}
                onChange={updateRx}
              />
            </div>

            <input
              value={form.rx.note}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  rx: { ...previous.rx, note: event.target.value },
                }))
              }
              placeholder="Prescription note"
              className="mt-1.5 h-7 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[9px] text-slate-700 outline-none focus:border-slate-400"
            />
          </div>
        </Panel>

        <div className="grid gap-2 lg:grid-cols-2">
          <Panel
            number="03"
            title="Frame Code"
            right={
              form.frameItemId && (
                <button
                  type="button"
                  onClick={clearFrame}
                  className="text-[9px] font-semibold text-red-600"
                >
                  Clear
                </button>
              )
            }
          >
            <div className="relative">
              <Search
                size={12}
                className="pointer-events-none absolute left-2.5 top-2 text-slate-400"
              />
              <input
                value={frameSearch}
                onChange={(event) => {
                  setFrameSearch(event.target.value);
                  setShowFrameResults(true);
                }}
                onFocus={() => {
                  if (frameSearch.trim()) setShowFrameResults(true);
                }}
                placeholder="Search frame code / brand / model..."
                className={`${inputClass} pl-7 pr-7`}
              />
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2.5 top-2 text-slate-400"
              />

              {showFrameResults && frameSearch.trim() && (
                <div className="absolute left-0 right-0 top-9 z-40 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
                  {filteredFrames.length ? (
                    <div className="max-h-56 overflow-auto">
                      {filteredFrames.map((item) => (
                        <SearchResult
                          key={item._id}
                          item={item}
                          type="frame"
                          onSelect={selectFrame}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-[9px] text-slate-500">
                      No matching frames found.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <CompactField
                label="Frame Code"
                value={form.frame.code}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    frame: { ...previous.frame, code: value },
                  }))
                }
              />
              <CompactField
                label="Size"
                value={form.frame.size}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    frame: { ...previous.frame, size: value },
                  }))
                }
              />
              <CompactField
                label="Depth"
                value={form.frame.depth}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    frame: { ...previous.frame, depth: value },
                  }))
                }
              />
              <CompactField
                label="ED"
                value={form.frame.ed}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    frame: { ...previous.frame, ed: value },
                  }))
                }
              />
              <CompactField
                label="Type"
                value={form.frame.type}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    frame: { ...previous.frame, type: value },
                  }))
                }
              />
              <CompactField
                label="SSI"
                value={form.frame.ssi}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    frame: { ...previous.frame, ssi: value },
                  }))
                }
              />
              <CompactField
                label="Cost"
                type="number"
                value={form.frame.price}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    frame: {
                      ...previous.frame,
                      price: Number(value || 0),
                    },
                  }))
                }
              />
              <label className="flex h-8 items-center gap-1.5 self-end rounded-md border border-slate-200 bg-slate-50 px-2 text-[9px] font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={form.frame.ownFrame}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      frameItemId: event.target.checked
                        ? null
                        : previous.frameItemId,
                      frame: {
                        ...previous.frame,
                        ownFrame: event.target.checked,
                      },
                    }))
                  }
                  className="h-3 w-3 rounded border-slate-300"
                />
                Own frame
              </label>
            </div>

            <div className="mt-1.5 flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-[9px]">
              <span className="truncate text-slate-500">
                {displayText(form.frame.description) || "No frame selected"}
              </span>
              <span className="font-bold text-slate-800">
                ₹{money(form.frame.price)}
              </span>
            </div>
          </Panel>

          <Panel
            number="04"
            title="Lens Code"
            right={
              form.lensItemId && (
                <button
                  type="button"
                  onClick={clearLens}
                  className="text-[9px] font-semibold text-red-600"
                >
                  Clear
                </button>
              )
            }
          >
            <div className="relative">
              <Search
                size={12}
                className="pointer-events-none absolute left-2.5 top-2 text-slate-400"
              />
              <input
                value={lensSearch}
                onChange={(event) => {
                  setLensSearch(event.target.value);
                  setShowLensResults(true);
                }}
                onFocus={() => {
                  if (lensSearch.trim()) setShowLensResults(true);
                }}
                placeholder="Search lens code / description / supplier..."
                className={`${inputClass} pl-7 pr-7`}
              />
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2.5 top-2 text-slate-400"
              />

              {showLensResults && lensSearch.trim() && (
                <div className="absolute left-0 right-0 top-9 z-40 overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
                  {filteredLenses.length ? (
                    <div className="max-h-56 overflow-auto">
                      {filteredLenses.map((item) => (
                        <SearchResult
                          key={item._id}
                          item={item}
                          type="lens"
                          onSelect={selectLens}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-[9px] text-slate-500">
                      No matching lenses found.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <CompactField
                label="Lens Code"
                value={form.lens.code}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    lens: { ...previous.lens, code: value },
                  }))
                }
              />
              <CompactField
                label="Lens Size"
                value={form.lens.size}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    lens: { ...previous.lens, size: value },
                  }))
                }
              />
              <CompactField
                label="Segment"
                value={form.lens.segment}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    lens: { ...previous.lens, segment: value },
                  }))
                }
              />
              <CompactField
                label="Tint"
                value={form.lens.tint}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    lens: { ...previous.lens, tint: value },
                  }))
                }
              />
              <CompactField
                label="BC"
                value={form.lens.bc}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    lens: { ...previous.lens, bc: value },
                  }))
                }
              />
              <CompactField
                label="Supplier"
                value={form.lens.supplier}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    lens: { ...previous.lens, supplier: value },
                  }))
                }
              />
              <CompactField
                label="Cost"
                type="number"
                value={form.lens.price}
                onChange={(value) =>
                  setForm((previous) => ({
                    ...previous,
                    lens: {
                      ...previous.lens,
                      price: Number(value || 0),
                    },
                  }))
                }
              />
              <div className="flex h-8 items-center justify-between rounded-md bg-slate-50 px-2 text-[9px]">
                <span className="truncate text-slate-500">
                  {displayText(form.lens.description) || "No lens selected"}
                </span>
                <span className="ml-2 shrink-0 font-bold text-slate-800">
                  ₹{money(form.lens.price)}
                </span>
              </div>
            </div>
          </Panel>
        </div>

        <Panel
          number="05"
          title="Additional Items & Notes"
          right={
            <button
              type="button"
              onClick={addExtra}
              className="inline-flex h-6 items-center rounded-md border border-slate-200 bg-white px-2 text-[9px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Plus size={11} className="mr-1" />
              Add item
            </button>
          }
        >
          <div className="grid gap-2 lg:grid-cols-[1fr_360px]">
            <div>
              {form.extras.length ? (
                <div className="space-y-1.5">
                  {form.extras.map((item, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_1fr_90px_28px] gap-1.5"
                    >
                      <CompactField
                        label={`Item ${index + 1}`}
                        value={item.description}
                        onChange={(value) =>
                          updateExtra(index, "description", value)
                        }
                      />
                      <CompactField
                        label="Supplier"
                        value={item.supplier}
                        onChange={(value) =>
                          updateExtra(index, "supplier", value)
                        }
                      />
                      <CompactField
                        label="Price"
                        type="number"
                        value={item.price}
                        onChange={(value) =>
                          updateExtra(index, "price", value)
                        }
                      />
                      <button
                        type="button"
                        onClick={() => removeExtra(index)}
                        className="mt-3 flex h-8 items-center justify-center rounded-md border border-red-100 bg-white text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-[58px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-[9px] text-slate-400">
                  <Package size={13} className="mr-1.5" />
                  No additional optical items
                </div>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_1fr]">
              <CompactField
                label="Discount"
                type="number"
                value={form.discount}
                onChange={(value) =>
                  updateForm("discount", Number(value || 0))
                }
              />

              <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
                <span className={labelClass}>Items</span>
                <p className="text-[11px] font-bold text-slate-700">
                  {2 + form.extras.length}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <label className={labelClass}>Notes</label>
            <textarea
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
              rows={2}
              placeholder="Job notes..."
              className="w-full resize-none rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[10px] text-slate-700 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-100"
            />
          </div>
        </Panel>

        <div className="grid gap-2 lg:grid-cols-[1fr_320px]">
          <div className="flex items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-[9px] text-slate-500">
            <FileText size={13} className="mr-2 shrink-0 text-slate-400" />
            {selectedPatient
              ? `Job will be created for ${getPatientName(selectedPatient)}.`
              : "Select a patient before creating the spectacle job."}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-900 px-3 py-2.5 text-white">
            <div className="mb-1 flex items-center justify-between text-[9px] text-slate-400">
              <span>Frame</span>
              <span>₹{money(form.frame.price)}</span>
            </div>
            <div className="mb-1 flex items-center justify-between text-[9px] text-slate-400">
              <span>Lens + extras</span>
              <span>₹{money(Number(form.lens.price) + extrasTotal)}</span>
            </div>
            <div className="flex items-end justify-between border-t border-white/10 pt-1.5">
              <span className="text-[9px] font-semibold text-slate-300">
                NET TOTAL
              </span>
              <span className="text-lg font-bold">
                ₹{money(total)}
              </span>
            </div>
          </div>
        </div>

        <div className="sticky bottom-2 z-30 flex items-center justify-between rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
          <div className="hidden items-center gap-2 text-[9px] text-slate-400 sm:flex">
            <IndianRupee size={12} />
            <span>
              {selectedPatient
                ? getPatientName(selectedPatient)
                : "No patient selected"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                activePatientId
                  ? navigate(`/patients/${activePatientId}`)
                  : navigate(-1)
              }
              className="h-8 rounded-md border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={save}
              disabled={saving || loading || !activePatientId}
              className="inline-flex h-8 items-center rounded-md bg-slate-900 px-4 text-[10px] font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={12} className="mr-1.5" />
              {saving ? "Creating Job..." : "Create Spectacle Job"}
            </button>
          </div>
        </div>
      </div>
    </DocumentShell>
  );
}
