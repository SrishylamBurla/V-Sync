import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
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
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  createSpectacle,
  getLatestConsultationForPatient,
} from "../spectacle.api";

import { getInventory } from "../../inventory/inventory.api";

import {
  DocumentShell,
  Section,
  Field,
  InfoGrid,
} from "../../../components/common/DocumentUI";

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

const emptyExtra = () => ({
  description: "",
  supplier: "",
  price: 0,
});

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

const selectClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

function SearchResult({
  item,
  type,
  onSelect,
}) {
  const description =
    type === "frame"
      ? [item.brand, item.model, item.description]
          .filter(Boolean)
          .join(" · ")
      : [item.description, item.brand, item.model]
          .filter(Boolean)
          .join(" · ");

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 hover:bg-slate-50"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">
            {item.code || "—"}
          </span>

          {item.stock !== undefined && (
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                Number(item.stock) > 0
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {Number(item.stock) > 0
                ? `${item.stock} in stock`
                : "Out of stock"}
            </span>
          )}
        </div>

        <p className="mt-1 truncate text-xs text-slate-500">
          {description || "No description"}
        </p>

        {item.supplier && (
          <p className="mt-1 text-[11px] text-slate-400">
            Supplier: {item.supplier}
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-slate-900">
          ₹{money(item.sellingPrice)}
        </p>

        <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
          Select
          <Check size={12} />
        </span>
      </div>
    </button>
  );
}

function PrescriptionEyeRow({
  eyeName,
  values,
  onChange,
}) {
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
    <tr className="border-b border-slate-100 last:border-b-0">
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
              eyeName === "right"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {eyeName === "right" ? "OD" : "OS"}
          </span>

          <span className="text-xs font-semibold text-slate-700">
            {eyeName === "right" ? "Right Eye" : "Left Eye"}
          </span>
        </div>
      </td>

      {fields.map(([key, label]) => (
        <td key={key} className="px-2 py-3">
          <input
            value={values?.[key] || ""}
            onChange={(event) =>
              onChange(eyeName, key, event.target.value)
            }
            placeholder={label}
            className="h-9 w-[78px] rounded-md border border-slate-200 bg-white px-2 text-center text-xs font-medium outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />
        </td>
      ))}
    </tr>
  );
}

export default function NewSpectaclePage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [frames, setFrames] = useState([]);
  const [lenses, setLenses] = useState([]);

  const [frameSearch, setFrameSearch] = useState("");
  const [lensSearch, setLensSearch] = useState("");

  const [showFrameResults, setShowFrameResults] = useState(false);
  const [showLensResults, setShowLensResults] = useState(false);

  const [consultation, setConsultation] = useState(null);

  const [form, setForm] = useState({
    jobDate: new Date().toISOString().slice(0, 10),
    dueDate: "",

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
    },

    frameItemId: null,

    lens: {
      code: "",
      description: "",
      supplier: "",
      price: 0,
    },

    lensItemId: null,

    extras: [],

    discount: 0,

    notes: "",
  });

  /*
   * ------------------------------------------------------------
   * LOAD DATA
   * ------------------------------------------------------------
   */

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [consultationResponse, frameResponse, lensResponse] =
          await Promise.all([
            getLatestConsultationForPatient(patientId),
            getInventory({ category: "frame" }),
            getInventory({ category: "lens" }),
          ]);

        if (!mounted) return;

        const latestConsultation = consultationResponse?.data || null;

        setConsultation(latestConsultation);

        setFrames(frameResponse?.data || []);
        setLenses(lensResponse?.data || []);

        if (latestConsultation) {
          setForm((previous) => ({
            ...previous,

            consultationId: latestConsultation._id,

            rx: {
              ...previous.rx,
              ...(latestConsultation.givenRx || {}),
            },

            pd: {
              ...previous.pd,
              ...(latestConsultation.pd || {}),
            },
          }));
        }
      } catch (err) {
        if (!mounted) return;

        setError(
          err?.response?.data?.message ||
            "Unable to load spectacle dispensing data.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (patientId) {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [patientId]);

  /*
   * ------------------------------------------------------------
   * DERIVED DATA
   * ------------------------------------------------------------
   */

  const filteredFrames = useMemo(() => {
    const query = frameSearch.trim().toLowerCase();

    if (!query) return [];

    return frames
      .filter((item) =>
        `${item.code || ""} ${item.brand || ""} ${
          item.model || ""
        } ${item.description || ""}`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 12);
  }, [frames, frameSearch]);

  const filteredLenses = useMemo(() => {
    const query = lensSearch.trim().toLowerCase();

    if (!query) return [];

    return lenses
      .filter((item) =>
        `${item.code || ""} ${item.brand || ""} ${
          item.model || ""
        } ${item.description || ""} ${item.supplier || ""}`
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 12);
  }, [lenses, lensSearch]);

  const extrasTotal = useMemo(
    () =>
      form.extras.reduce(
        (sum, item) => sum + Number(item.price || 0),
        0,
      ),
    [form.extras],
  );

  const subtotal =
    Number(form.frame.price || 0) +
    Number(form.lens.price || 0) +
    extrasTotal;

  const total = Math.max(
    0,
    subtotal - Number(form.discount || 0),
  );

  /*
   * ------------------------------------------------------------
   * FORM HELPERS
   * ------------------------------------------------------------
   */

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

  /*
   * ------------------------------------------------------------
   * FRAME
   * ------------------------------------------------------------
   */

  const selectFrame = (item) => {
    setForm((previous) => ({
      ...previous,

      frameItemId: item._id,

      frame: {
        code: item.code || "",
        description:
          item.description ||
          [item.brand, item.model]
            .filter(Boolean)
            .join(" "),
        price: Number(item.sellingPrice || 0),
        ownFrame: false,
      },
    }));

    setFrameSearch(
      [item.code, item.brand, item.model]
        .filter(Boolean)
        .join(" "),
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
      },
    }));

    setFrameSearch("");
  };

  /*
   * ------------------------------------------------------------
   * LENS
   * ------------------------------------------------------------
   */

  const selectLens = (item) => {
    setForm((previous) => ({
      ...previous,

      lensItemId: item._id,

      lens: {
        code: item.code || "",
        description: item.description || "",
        supplier: item.supplier || "",
        price: Number(item.sellingPrice || 0),
      },
    }));

    setLensSearch(
      [item.code, item.description]
        .filter(Boolean)
        .join(" "),
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
      },
    }));

    setLensSearch("");
  };

  /*
   * ------------------------------------------------------------
   * EXTRAS
   * ------------------------------------------------------------
   */

  const addExtra = () => {
    setForm((previous) => ({
      ...previous,

      extras: [
        ...previous.extras,
        emptyExtra(),
      ],
    }));
  };

  const updateExtra = (index, field, value) => {
    setForm((previous) => ({
      ...previous,

      extras: previous.extras.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]:
                field === "price"
                  ? Number(value || 0)
                  : value,
            }
          : item,
      ),
    }));
  };

  const removeExtra = (index) => {
    setForm((previous) => ({
      ...previous,

      extras: previous.extras.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }));
  };

  /*
   * ------------------------------------------------------------
   * VALIDATION
   * ------------------------------------------------------------
   */

  const validate = () => {
    if (!form.jobDate) {
      return "Job date is required.";
    }

    if (!form.dueDate) {
      return "Please select the expected delivery date.";
    }

    if (!form.frameItemId && !form.frame.ownFrame) {
      return "Please select a frame from inventory or mark it as own frame.";
    }

    if (!form.lensItemId) {
      return "Please select a lens from inventory.";
    }

    return "";
  };

  /*
   * ------------------------------------------------------------
   * SAVE
   * ------------------------------------------------------------
   */

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
        patientId,
      });

      const spectacle = response?.data;

      if (spectacle?._id) {
        navigate(`/optical/spectacles/${spectacle._id}`);
        return;
      }

      navigate(`/patients/${patientId}`);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to create spectacle job.",
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------
   */

  return (
    <DocumentShell
      eyebrow="Optical Dispensing"
      title="New Spectacle Job"
      subtitle="Create a spectacle dispensing job using the patient's latest prescription and optical inventory."
      code="NEW SPECTACLE"
      actions={
        <>
          <button
            type="button"
            onClick={() =>
              navigate(`/patients/${patientId}`)
            }
            className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Back
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            className="inline-flex h-10 items-center rounded-lg bg-slate-900 px-4 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={14} className="mr-1.5" />

            {saving ? "Creating..." : "Create Job"}
          </button>
        </>
      }
    >
      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />

          <div>
            <p className="font-semibold">
              Unable to continue
            </p>

            <p className="mt-0.5 text-xs">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          CONSULTATION SUMMARY
      ======================================================= */}

      <Section
        number="01"
        title="Clinical source"
      >
        {loading ? (
          <div className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="h-4 w-48 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-72 rounded bg-slate-200" />
          </div>
        ) : consultation ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200">
                  <ClipboardList size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Latest consultation
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Prescription has been loaded from the
                    patient's latest consultation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Consultation
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {consultation.consultationType ||
                      "General"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Date
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {consultation.consultationDate
                      ? new Date(
                          consultation.consultationDate,
                        ).toLocaleDateString("en-IN")
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Optometrist
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {consultation.optometristId
                      ? [
                          consultation.optometristId
                            .firstName,
                          consultation.optometristId
                            .lastName,
                        ]
                          .filter(Boolean)
                          .join(" ")
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <FileText
                size={18}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <p className="text-sm font-semibold text-amber-900">
                  No previous consultation found
                </p>

                <p className="mt-1 text-xs text-amber-700">
                  You can still continue with the spectacle
                  job, but the prescription will need to be
                  entered manually.
                </p>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ======================================================
          JOB DETAILS
      ======================================================= */}

      <Section
        number="02"
        title="Job details"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Job date"
            type="date"
            value={form.jobDate}
            onChange={(value) =>
              updateForm("jobDate", value)
            }
          />

          <Field
            label="Expected delivery"
            type="date"
            value={form.dueDate}
            onChange={(value) =>
              updateForm("dueDate", value)
            }
          />
        </div>
      </Section>

      {/* ======================================================
          PRESCRIPTION
      ======================================================= */}

      <Section
        number="03"
        title="Prescription"
      >
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Eye
                </th>

                {[
                  "SPH",
                  "CYL",
                  "AXIS",
                  "VA",
                  "ADD",
                  "INTER",
                  "PRISM",
                  "BASE",
                ].map((field) => (
                  <th
                    key={field}
                    className="px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {field}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <PrescriptionEyeRow
                eyeName="right"
                values={form.rx.right}
                onChange={updateRx}
              />

              <PrescriptionEyeRow
                eyeName="left"
                values={form.rx.left}
                onChange={updateRx}
              />
            </tbody>
          </table>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <Field
            label="Right PD"
            value={form.pd.right}
            onChange={(value) =>
              updatePd("right", value)
            }
          />

          <Field
            label="Left PD"
            value={form.pd.left}
            onChange={(value) =>
              updatePd("left", value)
            }
          />

          <Field
            label="Total PD"
            value={form.pd.total}
            onChange={(value) =>
              updatePd("total", value)
            }
          />
        </div>

        <div className="mt-4">
          <Field
            label="Prescription note"
            value={form.rx.note}
            onChange={(value) =>
              setForm((previous) => ({
                ...previous,

                rx: {
                  ...previous.rx,
                  note: value,
                },
              }))
            }
          />
        </div>
      </Section>

      {/* ======================================================
          FRAME
      ======================================================= */}

      <Section
        number="04"
        title="Frame"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Select frame
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Choose a frame from your optical inventory.
            </p>
          </div>

          {form.frameItemId && (
            <button
              type="button"
              onClick={clearFrame}
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Clear
            </button>
          )}
        </div>

        <div className="relative mt-4">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-3 text-slate-400"
          />

          <input
            value={frameSearch}
            onChange={(event) => {
              setFrameSearch(event.target.value);
              setShowFrameResults(true);
            }}
            onFocus={() => {
              if (frameSearch.trim()) {
                setShowFrameResults(true);
              }
            }}
            placeholder="Search by frame code, brand or model..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-3 text-slate-400"
          />

          {showFrameResults &&
            frameSearch.trim() && (
              <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {filteredFrames.length > 0 ? (
                  <div className="max-h-72 overflow-auto">
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
                  <div className="p-5 text-center text-xs text-slate-500">
                    No matching frames found.
                  </div>
                )}
              </div>
            )}
        </div>

        <div className="mt-4">
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-600">
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
                    ownFrame:
                      event.target.checked,
                  },
                }))
              }
              className="h-4 w-4 rounded border-slate-300"
            />

            Patient's own frame
          </label>
        </div>

        <div className="mt-5">
          <InfoGrid
            items={[
              {
                label: "Frame code",
                value: form.frame.code || "—",
              },
              {
                label: "Description",
                value:
                  form.frame.description || "—",
              },
              {
                label: "Price",
                value: `₹${money(form.frame.price)}`,
              },
              {
                label: "Source",
                value: form.frame.ownFrame
                  ? "Patient own frame"
                  : form.frameItemId
                    ? "Inventory"
                    : "Not selected",
              },
            ]}
          />
        </div>
      </Section>

      {/* ======================================================
          LENS
      ======================================================= */}

      <Section
        number="05"
        title="Lens"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Select lens
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Select the lens product to be used for this job.
            </p>
          </div>

          {form.lensItemId && (
            <button
              type="button"
              onClick={clearLens}
              className="text-xs font-semibold text-red-600 hover:text-red-700"
            >
              Clear
            </button>
          )}
        </div>

        <div className="relative mt-4">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-3 text-slate-400"
          />

          <input
            value={lensSearch}
            onChange={(event) => {
              setLensSearch(event.target.value);
              setShowLensResults(true);
            }}
            onFocus={() => {
              if (lensSearch.trim()) {
                setShowLensResults(true);
              }
            }}
            placeholder="Search by lens code, description or supplier..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
          />

          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-3 top-3 text-slate-400"
          />

          {showLensResults &&
            lensSearch.trim() && (
              <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {filteredLenses.length > 0 ? (
                  <div className="max-h-72 overflow-auto">
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
                  <div className="p-5 text-center text-xs text-slate-500">
                    No matching lenses found.
                  </div>
                )}
              </div>
            )}
        </div>

        <div className="mt-5">
          <InfoGrid
            items={[
              {
                label: "Lens code",
                value: form.lens.code || "—",
              },
              {
                label: "Description",
                value:
                  form.lens.description || "—",
              },
              {
                label: "Supplier",
                value: form.lens.supplier || "—",
              },
              {
                label: "Price",
                value: `₹${money(form.lens.price)}`,
              },
              {
                label: "Source",
                value: form.lensItemId
                  ? "Inventory"
                  : "Not selected",
              },
            ]}
          />
        </div>
      </Section>

      {/* ======================================================
          EXTRAS
      ======================================================= */}

      <Section
        number="06"
        title="Additional optical items"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Extras
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Add coatings, accessories or other optical
              items included in this job.
            </p>
          </div>

          <button
            type="button"
            onClick={addExtra}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Plus size={14} className="mr-1.5" />
            Add item
          </button>
        </div>

        {form.extras.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <Package
              size={20}
              className="mx-auto text-slate-300"
            />

            <p className="mt-2 text-xs font-medium text-slate-500">
              No additional optical items added.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {form.extras.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_160px_auto] sm:items-end">
                  <Field
                    label={`Item ${index + 1}`}
                    value={item.description}
                    onChange={(value) =>
                      updateExtra(
                        index,
                        "description",
                        value,
                      )
                    }
                  />

                  <Field
                    label="Supplier"
                    value={item.supplier}
                    onChange={(value) =>
                      updateExtra(
                        index,
                        "supplier",
                        value,
                      )
                    }
                  />

                  <Field
                    label="Price"
                    type="number"
                    value={item.price}
                    onChange={(value) =>
                      updateExtra(
                        index,
                        "price",
                        value,
                      )
                    }
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeExtra(index)
                    }
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-red-100 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ======================================================
          PRICING
      ======================================================= */}

      <Section
        number="07"
        title="Pricing"
      >
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Discount"
              type="number"
              value={form.discount}
              onChange={(value) =>
                updateForm(
                  "discount",
                  Number(value || 0),
                )
              }
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                Items
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800">
                {1 +
                  1 +
                  form.extras.length}{" "}
                optical item
                {1 + 1 + form.extras.length !==
                1
                  ? "s"
                  : ""}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <IndianRupee
                  size={15}
                  className="text-slate-500"
                />

                <p className="text-xs font-semibold text-slate-700">
                  Job summary
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Frame
                </span>

                <span className="font-medium text-slate-700">
                  ₹{money(form.frame.price)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Lens
                </span>

                <span className="font-medium text-slate-700">
                  ₹{money(form.lens.price)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  Extras
                </span>

                <span className="font-medium text-slate-700">
                  ₹{money(extrasTotal)}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Subtotal
                  </span>

                  <span className="font-semibold text-slate-800">
                    ₹{money(subtotal)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Discount
                  </span>

                  <span className="font-medium text-red-600">
                    − ₹{money(form.discount)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-900 px-4 py-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    Total
                  </span>

                  <span className="text-xl font-bold text-white">
                    ₹{money(total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ======================================================
          NOTES
      ======================================================= */}

      <Section
        number="08"
        title="Notes"
      >
        <Field
          label="Job notes"
          type="textarea"
          value={form.notes}
          onChange={(value) =>
            updateForm("notes", value)
          }
        />
      </Section>

      {/* ======================================================
          FINAL ACTION BAR
      ======================================================= */}

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <UserRound size={14} />

            <span>
              Spectacle job will be created under this
              patient's organization and branch.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                navigate(`/patients/${patientId}`)
              }
              className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={save}
              disabled={saving || loading}
              className="inline-flex h-10 items-center rounded-lg bg-slate-900 px-5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={14} className="mr-1.5" />

              {saving
                ? "Creating Job..."
                : "Create Spectacle Job"}
            </button>
          </div>
        </div>
      </div>
    </DocumentShell>
  );
}