import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Edit3,
  Glasses,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getSpectacle,
  updateSpectacle,
  updateSpectacleStatus,
} from "../spectacle.api";

/* ============================================================
   STATUS WORKFLOW
============================================================ */

const NEXT_ACTIONS = {
  draft: ["ordered", "cancelled"],
  ordered: ["not_ready", "cancelled"],
  not_ready: ["ready", "cancelled"],
  ready: ["notified", "collected"],
  notified: ["collected"],
  collected: [],
  cancelled: [],
};

const USE_OPTIONS = [
  ["distance", "Distance"],
  ["near", "Near"],
  ["intermediate", "Intermediate"],
  ["bifocal", "Bifocal"],
  ["trifocal", "Trifocal"],
  ["multifocal", "Multifocal"],
];

const RX_COLUMNS = [
  ["sphere", "SPH"],
  ["cylinder", "CYL"],
  ["axis", "AXIS"],
  ["va", "VA"],
  ["add", "ADD"],
  ["inter", "INTER"],
  ["prism", "PRISM"],
  ["base", "BASE"],
];

const EMPTY_LENS = {
  lensCode: "",
  lensDescription: "",
  lensSize: "",
  segmentSize: "",
  segmentHeight: "",
  ocHeight: "",
  horizontalDecentration: "",
  verticalDecentration: "",
  baseCurve: "",
  supplier: "",
  supplierOrderDate: null,
  tint: "",
  price: 0,
};

const EMPTY_EXTRA = {
  name: "",
  description: "",
  price: 0,
  labRequired: false,
};

/* ============================================================
   SAFE HELPERS
============================================================ */

const cloneData = (value) => {
  if (value === null || value === undefined) return value;

  try {
    return structuredClone(value);
  } catch {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return value;
    }
  }
};

const getId = (value) => {
  if (!value) return "";

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  return String(value._id || value.id || "");
};

const displayText = (value, fallback = "—") => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (value instanceof Date) {
    return formatDate(value);
  }

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => displayText(item, ""))
      .filter(Boolean);

    return parts.length
      ? parts.join(", ")
      : fallback;
  }

  if (typeof value === "object") {
    const preferred = [
      "name",
      "label",
      "value",
      "code",
      "description",
      "instructions",
      "title",
    ];

    const parts = preferred
      .filter(
        (key) =>
          value[key] !== undefined &&
          value[key] !== null &&
          value[key] !== "",
      )
      .map(
        (key) =>
          `${pretty(key)}: ${displayText(
            value[key],
            "",
          )}`,
      )
      .filter(Boolean);

    if (parts.length) return parts.join(" · ");

    const fallbackParts = Object.entries(value)
      .filter(
        ([, item]) =>
          item !== undefined &&
          item !== null &&
          item !== "",
      )
      .map(
        ([key, item]) =>
          `${pretty(key)}: ${displayText(
            item,
            "",
          )}`,
      )
      .filter(Boolean);

    return fallbackParts.length
      ? fallbackParts.join(" · ")
      : fallback;
  }

  return fallback;
};

const pretty = (value) =>
  String(value || "—")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) =>
      char.toUpperCase(),
    );

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return displayText(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const dateInput = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const personName = (value) => {
  if (!value) return "—";

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  const name = [
    value.firstName,
    value.middleName,
    value.lastName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    name ||
    value.name ||
    value.fullName ||
    value.username ||
    displayText(value)
  );
};

const getPatient = (job) =>
  typeof job?.patientId === "object"
    ? job.patientId
    : typeof job?.patient === "object"
      ? job.patient
      : {};

const patientName = (patient) =>
  [
    patient?.firstName,
    patient?.middleName,
    patient?.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "Patient";

const getResponseRecord = (response) =>
  response?.spectacle ||
  response?.data?.spectacle ||
  response?.data ||
  response ||
  null;

const normalizeLens = (lens) => ({
  ...EMPTY_LENS,
  ...(lens && typeof lens === "object"
    ? cloneData(lens)
    : {}),
});

const getLens = (jobOrForm, side) => {
  const lenses = jobOrForm?.lenses || {};

  if (
    lenses[side] &&
    typeof lenses[side] === "object"
  ) {
    return normalizeLens(lenses[side]);
  }

  // Legacy fallback.
  if (jobOrForm?.lens) {
    return {
      ...EMPTY_LENS,
      lensCode:
        jobOrForm.lens.code || "",
      lensDescription:
        jobOrForm.lens.description || "",
      supplier:
        jobOrForm.lens.supplier || "",
      price:
        jobOrForm.lens.price || 0,
    };
  }

  return normalizeLens();
};

const normalizeExtra = (extra) => ({
  ...EMPTY_EXTRA,
  ...(extra && typeof extra === "object"
    ? cloneData(extra)
    : {}),
});

const asNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number)
    ? number
    : 0;
};

/*
 * Lens price is stored as ONE job-level amount in pricing.lensPrice.
 * OD/OS can both carry the same catalogue price for reference, so
 * equal mirrored prices must never be added twice.
 */
const getLensTotal = (source) => {
  if (!source) return 0;

  const canonical =
    source?.pricing?.lensPrice;

  if (
    canonical !== undefined &&
    canonical !== null &&
    canonical !== ""
  ) {
    return asNumber(canonical);
  }

  const legacyPrice =
    source?.lens?.price;

  if (
    legacyPrice !== undefined &&
    legacyPrice !== null &&
    legacyPrice !== ""
  ) {
    return asNumber(legacyPrice);
  }

  const right = asNumber(
    source?.lenses?.right?.price,
  );
  const left = asNumber(
    source?.lenses?.left?.price,
  );

  if (right === 0) return left;
  if (left === 0) return right;

  return right === left
    ? right
    : right + left;
};

const parseToApply = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => displayText(item, "").trim())
      .filter(Boolean);
  }

  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeForm = (source) => {
  const current = cloneData(source || {});

  const lenses = current.lenses || {};

  return {
    ...current,
    use: Array.isArray(current.use)
      ? current.use
      : [],
    rx: {
      right: {
        ...(current.rx?.right || {}),
      },
      left: {
        ...(current.rx?.left || {}),
      },
      note: current.rx?.note || "",
    },
    pd: {
      right:
        current.pd?.right ||
        "",
      left:
        current.pd?.left ||
        "",
      total:
        current.pd?.total ||
        "",
    },
    frame: {
      ...(current.frame || {}),
    },
    lenses: {
      right: normalizeLens(
        lenses.right ||
          current.lens ||
          {},
      ),
      left: normalizeLens(
        lenses.left ||
          current.lens ||
          {},
      ),
    },
    extras: Array.isArray(current.extras)
      ? current.extras.map(normalizeExtra)
      : [],
    lab: {
      instructions:
        current.lab?.instructions ||
        "",
      toApply: Array.isArray(
        current.lab?.toApply,
      )
        ? [...current.lab.toApply]
        : parseToApply(
            current.lab?.toApply,
          ),
      toFit: Boolean(
        current.lab?.toFit,
      ),
    },
    pricing: {
      ...(current.pricing || {}),
      framePrice: asNumber(
        current.pricing?.framePrice ??
          current.frame?.price ??
          current.framePrice,
      ),
      lensPrice: getLensTotal(
        current,
      ),
      extrasTotal: asNumber(
        current.pricing?.extrasTotal ??
          (Array.isArray(current.extras)
            ? current.extras.reduce(
                (sum, item) =>
                  sum +
                  asNumber(item?.price),
                0,
              )
            : 0),
      ),
      frameDiscount: asNumber(
        current.pricing?.frameDiscount ??
          current.frame?.discount,
      ),
      lensDiscount: asNumber(
        current.pricing?.lensDiscount,
      ),
      overallDiscount: asNumber(
        current.pricing?.overallDiscount ??
          current.discount,
      ),
      discountReason:
        current.pricing?.discountReason ||
        "",
      subtotal: asNumber(
        current.pricing?.subtotal,
      ),
      total: asNumber(
        current.pricing?.total ??
          current.total,
      ),
      gstRate: asNumber(
        current.pricing?.gstRate,
      ),
      gstAmount: asNumber(
        current.pricing?.gstAmount ??
          current.gst,
      ),
      billTotal: asNumber(
        current.pricing?.billTotal ??
          current.billTotal,
      ),
    },
    notification:
      current.notification ||
      (current.sms && current.email
        ? "sms_email"
        : current.sms
          ? "sms"
          : current.email
            ? "email"
            : "none"),
    electronicOrder:
      current.electronicOrder ||
      current.eOrder ||
      "",
  };
};

/* ============================================================
   MAIN PAGE
============================================================ */

export default function SpectacleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [form, setForm] = useState(null);

  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [updating, setUpdating] =
    useState(false);
  const [editing, setEditing] =
    useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getSpectacle(id);
      const record =
        getResponseRecord(response);

      setJob(record);
      setForm(normalizeForm(record));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load spectacle job.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const startEditing = () => {
    setForm(normalizeForm(job));
    setError("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setForm(normalizeForm(job));
    setError("");
    setEditing(false);
  };

  const updateField = (key, value) => {
    setForm((current) => ({
      ...(current || {}),
      [key]: value,
    }));
  };

  const updateNested = (
    parent,
    key,
    value,
  ) => {
    setForm((current) => ({
      ...(current || {}),
      [parent]: {
        ...(current?.[parent] || {}),
        [key]: value,
      },
    }));
  };

  const updateDeep = (
    parent,
    child,
    key,
    value,
  ) => {
    setForm((current) => ({
      ...(current || {}),
      [parent]: {
        ...(current?.[parent] || {}),
        [child]: {
          ...(current?.[parent]?.[child] || {}),
          [key]: value,
        },
      },
    }));
  };

  const updateRx = (
    side,
    key,
    value,
  ) => {
    updateDeep(
      "rx",
      side,
      key,
      value,
    );
  };

  const updateLens = (
    side,
    key,
    value,
  ) => {
    updateDeep(
      "lenses",
      side,
      key,
      value,
    );
  };

  const updatePricing = (
    key,
    value,
  ) => {
    updateNested(
      "pricing",
      key,
      value,
    );
  };

  const addExtra = () => {
    setForm((current) => ({
      ...(current || {}),
      extras: [
        ...(current?.extras || []),
        normalizeExtra(),
      ],
    }));
  };

  const updateExtra = (
    index,
    key,
    value,
  ) => {
    setForm((current) => {
      const extras = [
        ...(current?.extras || []),
      ];

      extras[index] = {
        ...(extras[index] || {}),
        [key]: value,
      };

      return {
        ...(current || {}),
        extras,
      };
    });
  };

  const removeExtra = (index) => {
    setForm((current) => ({
      ...(current || {}),
      extras: (
        current?.extras || []
      ).filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    }));
  };

  const toggleUse = (value) => {
    setForm((current) => {
      const currentUse =
        Array.isArray(current?.use)
          ? current.use
          : [];

      return {
        ...(current || {}),
        use: currentUse.includes(value)
          ? currentUse.filter(
              (item) => item !== value,
            )
          : [...currentUse, value],
      };
    });
  };

  const editLensRight = normalizeLens(
    form?.lenses?.right,
  );

  const editLensLeft = normalizeLens(
    form?.lenses?.left,
  );

  const editFrame =
    form?.frame || {};

  const editExtras =
    Array.isArray(form?.extras)
      ? form.extras
      : [];

  const editPricing =
    form?.pricing || {};

  const editFramePrice = asNumber(
    editFrame.price ??
      editPricing.framePrice,
  );

  const editLensPrice =
    getLensTotal(form);

  const editExtrasTotal =
    editExtras.reduce(
      (sum, item) =>
        sum + asNumber(item?.price),
      0,
    );

  const editOverallDiscount =
    asNumber(
      editPricing.overallDiscount,
    );

  const editSubtotal =
    editFramePrice +
    editLensPrice +
    editExtrasTotal;

  const editNetTotal = Math.max(
    0,
    editSubtotal -
      editOverallDiscount,
  );

  const editGstRate = asNumber(
    editPricing.gstRate,
  );

  const editGstAmount =
    Number(
      (
        editNetTotal *
        (editGstRate / 100)
      ).toFixed(2),
    );

  const editBillTotal =
    editNetTotal +
    editGstAmount;

  const saveChanges = async () => {
    if (!form) return;

    try {
      setSaving(true);
      setError("");

      const payload =
        cloneData(form) || {};

      // Never post Mongo document/read-only presentation fields
      // back through the general PUT endpoint.
      delete payload._id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;
      delete payload.createdBy;
      delete payload.updatedBy;
      delete payload.patient;

      // Convert populated references back to ids.
      [
        "organizationId",
        "branchId",
        "patientId",
        "consultationId",
        "frameItemId",
        "lensItemId",
        "prescribedById",
        "dispenserId",
        "readyBy",
        "collectedBy",
      ].forEach((key) => {
        if (
          payload[key] &&
          typeof payload[key] === "object"
        ) {
          const relationId =
            getId(payload[key]);

          if (relationId) {
            payload[key] = relationId;
          } else {
            delete payload[key];
          }
        }
      });

      // Keep canonical schema fields.
      payload.patientId =
        getId(
          payload.patientId,
        ) || payload.patientId;

      delete payload.optometrist;
      delete payload.prescribedBy;
      delete payload.dispenser;

      payload.use = Array.isArray(
        payload.use,
      )
        ? payload.use
        : [];

      payload.frame = {
        ...(payload.frame || {}),
        price: editFramePrice,
      };

      payload.lenses = {
        right: {
          ...editLensRight,
          price: asNumber(
            editLensRight.price,
          ),
          supplierOrderDate:
            editLensRight.supplierOrderDate ||
            null,
        },
        left: {
          ...editLensLeft,
          price: asNumber(
            editLensLeft.price,
          ),
          supplierOrderDate:
            editLensLeft.supplierOrderDate ||
            null,
        },
      };

      payload.extras = editExtras.map(
        (item) => ({
          ...item,
          price: asNumber(item?.price),
          labRequired: Boolean(
            item?.labRequired,
          ),
        }),
      );

      payload.lab = {
        ...(payload.lab || {}),
        instructions:
          payload.lab?.instructions ||
          "",
        toApply: parseToApply(
          payload.lab?.toApply,
        ),
        toFit: Boolean(
          payload.lab?.toFit,
        ),
      };

      payload.pricing = {
        ...(payload.pricing || {}),
        framePrice: editFramePrice,
        lensPrice: editLensPrice,
        extrasTotal: editExtrasTotal,
        frameDiscount: asNumber(
          payload.pricing
            ?.frameDiscount,
        ),
        lensDiscount: asNumber(
          payload.pricing
            ?.lensDiscount,
        ),
        overallDiscount:
          editOverallDiscount,
        discountReason:
          payload.pricing
            ?.discountReason ||
          "",
        subtotal: editSubtotal,
        total: editNetTotal,
        gstRate: editGstRate,
        gstAmount: editGstAmount,
        billTotal: editBillTotal,
      };

      // Legacy totals are synchronized as well so older
      // list/detail endpoints continue to display correctly.
      payload.extrasTotal =
        editExtrasTotal;
      payload.discount =
        editOverallDiscount;
      payload.total =
        editNetTotal;
      payload.gst =
        editGstAmount;
      payload.billTotal =
        editBillTotal;

      payload.framePrice =
        editFramePrice;
      payload.lensPrice =
        editLensPrice;

      payload.electronicOrder =
        payload.electronicOrder ||
        "";

      const response =
        await updateSpectacle(
          id,
          payload,
        );

      const updated =
        getResponseRecord(
          response,
        );

      if (updated) {
        setJob(updated);
        setForm(
          normalizeForm(updated),
        );
      } else {
        await load();
      }

      setEditing(false);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save spectacle job.",
      );
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (
    nextStatus,
  ) => {
    try {
      setUpdating(true);
      setError("");

      // Dedicated status endpoint.
      const response =
        await updateSpectacleStatus(
          id,
          nextStatus,
        );

      const updated =
        getResponseRecord(
          response,
        );

      if (updated) {
        setJob(updated);
        setForm(
          normalizeForm(updated),
        );
      } else {
        await load();
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update spectacle status.",
      );
    } finally {
      setUpdating(false);
    }
  };

  const patient = getPatient(job);
  const name = patientName(patient);

  const status = String(
    job?.status || "draft",
  ).toLowerCase();

  const jobNumber = displayText(
    job?.jobNumber ||
      job?._id,
    "Spectacle Job",
  );

  const rx = job?.rx || {};
  const lenses = job?.lenses || {};
  const frame = job?.frame || {};
  const extras = Array.isArray(
    job?.extras,
  )
    ? job.extras
    : [];
  const lab = job?.lab || {};
  const pricing = job?.pricing || {};

  const displayedLensRight =
    normalizeLens(
      lenses.right,
    );

  const displayedLensLeft =
    normalizeLens(
      lenses.left,
    );

  const displayedFramePrice =
    asNumber(
      pricing.framePrice ??
        frame.price ??
        job?.framePrice,
    );

  const displayedLensPrice =
    getLensTotal(job);

  const displayedExtrasTotal =
    asNumber(
      pricing.extrasTotal,
    ) ||
    extras.reduce(
      (sum, item) =>
        sum + asNumber(item?.price),
      0,
    );

  const displayedDiscount =
    asNumber(
      pricing.overallDiscount,
    ) ||
    asNumber(job?.discount);

  const displayedSubtotal =
    asNumber(
      pricing.subtotal,
    ) ||
    (
      displayedFramePrice +
      displayedLensPrice +
      displayedExtrasTotal
    );

  const displayedTotal =
    asNumber(
      pricing.total,
    ) ||
    asNumber(job?.total) ||
    Math.max(
      0,
      displayedSubtotal -
        displayedDiscount,
    );

  const displayedGstRate =
    asNumber(
      pricing.gstRate,
    );

  const displayedGstAmount =
    asNumber(
      pricing.gstAmount,
    ) ||
    asNumber(job?.gst);

  const displayedBillTotal =
    asNumber(
      pricing.billTotal,
    ) ||
    asNumber(job?.billTotal) ||
    (
      displayedTotal +
      displayedGstAmount
    );

  const consultationLinked =
    Boolean(
      job?.consultationId,
    );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <RefreshCw
            size={14}
            className="animate-spin"
          />
          Loading spectacle record...
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-full bg-slate-50 p-4">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {error ||
              "Spectacle job not found."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f6f8fb] p-2.5 sm:p-4 lg:p-5 print:bg-white print:p-0">
      <div className="mx-auto max-w-[1380px]">
        {/* TOP BAR */}
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 print:hidden">
          

          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={status} />

            <button
              type="button"
              onClick={() =>
                window.print()
              }
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <Printer size={12} />
              Print
            </button>

            {editing ? (
              <>
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <X size={12} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveChanges}
                  disabled={saving}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-950 px-3 text-[10px] font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                >
                  {saving ? (
                    <RefreshCw
                      size={12}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={12} />
                  )}
                  {saving
                    ? "Saving..."
                    : "Save changes"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={
                  startEditing
                }
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-950 px-3 text-[10px] font-bold text-white transition hover:bg-slate-800"
              >
                <Edit3 size={12} />
                Edit job
              </button>
            )}
          </div>
        </div>

        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.05)] print:rounded-none print:border-0 print:shadow-none">
          {/* HEADER */}
          <header className="bg-slate-950 px-4 py-4 text-white sm:px-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                  <Glasses size={17} />
                </div>

                <div className="min-w-0">
                  <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    Dispensing / Spectacle
                  </div>

                  <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
                    <h1 className="text-lg font-bold">
                      Spectacle Job
                    </h1>
                    <span className="text-[10px] text-slate-400">
                      {jobNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                <HeaderMetric
                  label="Patient"
                  value={name}
                />
                <HeaderMetric
                  label="Patient No."
                  value={
                    patient.patientNumber
                  }
                />
                <HeaderMetric
                  label="Job Date"
                  value={formatDate(
                    job.jobDate,
                  )}
                />
                <HeaderMetric
                  label="Expected"
                  value={formatDate(
                    job.specDueDate,
                  )}
                />
              </div>
            </div>
          </header>

          {error && (
            <div className="mx-3 mt-2.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-medium text-red-700 sm:mx-4">
              {error}
            </div>
          )}

          <main className="p-2.5 sm:p-3.5">
            <div className="grid gap-2.5">
              {/* JOB INFORMATION */}
              <Panel
                number="01"
                title="Job information"
              >
                {editing ? (
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                    <Field
                      label="Job No."
                      value={
                        form?.jobNumber ||
                        ""
                      }
                      onChange={(value) =>
                        updateField(
                          "jobNumber",
                          value,
                        )
                      }
                    />

                    <Field
                      label="Job Type"
                      value={
                        form?.jobType ||
                        "Spectacle"
                      }
                      onChange={(value) =>
                        updateField(
                          "jobType",
                          value,
                        )
                      }
                    />

                    <DateField
                      label="Job Date"
                      value={dateInput(
                        form?.jobDate,
                      )}
                      onChange={(value) =>
                        updateField(
                          "jobDate",
                          value,
                        )
                      }
                    />

                    <DateField
                      label="Spec Due Date"
                      value={dateInput(
                        form?.specDueDate,
                      )}
                      onChange={(value) =>
                        updateField(
                          "specDueDate",
                          value,
                        )
                      }
                    />

                    <DateField
                      label="Lab Due Date"
                      value={dateInput(
                        form?.labDueDate,
                      )}
                      onChange={(value) =>
                        updateField(
                          "labDueDate",
                          value,
                        )
                      }
                    />

                    <DateField
                      label="Rx Date"
                      value={dateInput(
                        form?.rxDate,
                      )}
                      onChange={(value) =>
                        updateField(
                          "rxDate",
                          value,
                        )
                      }
                    />

                    <Field
                      label="Prescribed By ID"
                      value={getId(
                        form?.prescribedById,
                      )}
                      onChange={(value) =>
                        updateField(
                          "prescribedById",
                          value,
                        )
                      }
                    />

                    <Field
                      label="Dispenser ID"
                      value={getId(
                        form?.dispenserId,
                      )}
                      onChange={(value) =>
                        updateField(
                          "dispenserId",
                          value,
                        )
                      }
                    />

                    <Field
                      label="Billing No."
                      value={
                        form?.billingNo ||
                        ""
                      }
                      onChange={(value) =>
                        updateField(
                          "billingNo",
                          value,
                        )
                      }
                    />

                    <SelectField
                      label="Notification"
                      value={
                        form?.notification ||
                        "none"
                      }
                      onChange={(value) =>
                        updateField(
                          "notification",
                          value,
                        )
                      }
                      options={[
                        [
                          "none",
                          "None",
                        ],
                        [
                          "sms",
                          "SMS",
                        ],
                        [
                          "email",
                          "Email",
                        ],
                        [
                          "sms_email",
                          "SMS + Email",
                        ],
                      ]}
                    />

                    <Field
                      label="Electronic Order"
                      value={
                        form?.electronicOrder ||
                        ""
                      }
                      onChange={(value) =>
                        updateField(
                          "electronicOrder",
                          value,
                        )
                      }
                    />

                    <ReadOnlyInline
                      label="Patient"
                      value={`${name} · ${displayText(
                        patient.patientNumber,
                        "No patient number",
                      )}`}
                      className="sm:col-span-2 lg:col-span-4 xl:col-span-6"
                    />

                    <div className="sm:col-span-2 lg:col-span-4 xl:col-span-6">
                      <FieldLabel>
                        Use
                      </FieldLabel>
                      <div className="flex flex-wrap gap-1.5">
                        {USE_OPTIONS.map(
                          ([
                            value,
                            label,
                          ]) => {
                            const checked =
                              Array.isArray(
                                form?.use,
                              ) &&
                              form.use.includes(
                                value,
                              );

                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() =>
                                  toggleUse(
                                    value,
                                  )
                                }
                                className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 text-[8px] font-bold transition ${
                                  checked
                                    ? "border-slate-950 bg-slate-950 text-white"
                                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                <span
                                  className={`h-2 w-2 rounded-sm border ${
                                    checked
                                      ? "border-white bg-white"
                                      : "border-slate-300"
                                  }`}
                                />
                                {label}
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                      <Info
                        label="Job No."
                        value={
                          job.jobNumber
                        }
                      />
                      <Info
                        label="Job Type"
                        value={
                          job.jobType
                        }
                      />
                      <Info
                        label="Status"
                        value={
                          job.status
                        }
                      />
                      <Info
                        label="Job Date"
                        value={formatDate(
                          job.jobDate,
                        )}
                      />
                      <Info
                        label="Spec Due Date"
                        value={formatDate(
                          job.specDueDate,
                        )}
                      />
                      <Info
                        label="Lab Due Date"
                        value={formatDate(
                          job.labDueDate,
                        )}
                      />
                      <Info
                        label="Rx Date"
                        value={formatDate(
                          job.rxDate,
                        )}
                      />
                      <Info
                        label="Optometrist"
                        value={personName(
                          job.prescribedById,
                        )}
                      />
                      <Info
                        label="Dispenser"
                        value={personName(
                          job.dispenserId,
                        )}
                      />
                      <Info
                        label="Billing No."
                        value={
                          job.billingNo
                        }
                      />
                      <Info
                        label="Notification"
                        value={
                          job.notification ||
                          "none"
                        }
                      />
                      <Info
                        label="Electronic Order"
                        value={
                          job.electronicOrder
                        }
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        Use
                      </span>
                      {(
                        Array.isArray(
                          job.use,
                        )
                          ? job.use
                          : []
                      ).map((item) => (
                        <span
                          key={item}
                          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[8px] font-semibold text-slate-600"
                        >
                          {pretty(item)}
                        </span>
                      ))}
                      {!job.use?.length && (
                        <span className="text-[8px] text-slate-400">
                          No use selected
                        </span>
                      )}
                    </div>
                  </>
                )}
              </Panel>

              {/* RX */}
              <Panel
                number="02"
                title="Prescription & measurements"
                right={
                  consultationLinked ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-700">
                      <Check size={10} />
                      Consultation linked
                    </span>
                  ) : null
                }
              >
                {editing ? (
                  <div className="grid gap-2.5 lg:grid-cols-[1fr_260px]">
                    <RxEditor
                      rx={
                        form?.rx || {}
                      }
                      onChange={
                        updateRx
                      }
                    />

                    <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-1">
                      <Field
                        label="PD OD"
                        value={
                          form?.pd?.right ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "pd",
                            "right",
                            value,
                          )
                        }
                      />
                      <Field
                        label="PD OS"
                        value={
                          form?.pd?.left ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "pd",
                            "left",
                            value,
                          )
                        }
                      />
                      <Field
                        label="PD Total"
                        value={
                          form?.pd?.total ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "pd",
                            "total",
                            value,
                          )
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2.5 lg:grid-cols-[1fr_260px]">
                    <RxTable
                      rx={rx}
                    />
                    <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-1">
                      <Measure
                        label="PD OD"
                        value={
                          job.pd?.right
                        }
                      />
                      <Measure
                        label="PD OS"
                        value={
                          job.pd?.left
                        }
                      />
                      <Measure
                        label="PD Total"
                        value={
                          job.pd?.total
                        }
                      />
                    </div>
                  </div>
                )}

                {editing ? (
                  <TextAreaField
                    label="Rx Note"
                    value={
                      form?.rx?.note ||
                      ""
                    }
                    onChange={(value) =>
                      updateNested(
                        "rx",
                        "note",
                        value,
                      )
                    }
                    className="mt-2"
                  />
                ) : (
                  <Note
                    label="Rx Note"
                    value={
                      job.rx?.note
                    }
                  />
                )}
              </Panel>

              {/* FRAME + LENS */}
              <div className="grid gap-2.5 xl:grid-cols-2">
                <Panel
                  number="03"
                  title="Frame"
                >
                  {editing ? (
                    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                      <Field
                        label="Code"
                        value={
                          editFrame.code ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "frame",
                            "code",
                            value,
                          )
                        }
                      />
                      <Field
                        label="Description"
                        value={
                          editFrame.description ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "frame",
                            "description",
                            value,
                          )
                        }
                      />
                      <Field
                        label="Size"
                        value={
                          editFrame.size ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "frame",
                            "size",
                            value,
                          )
                        }
                      />
                      <Field
                        label="Depth"
                        value={
                          editFrame.depth ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "frame",
                            "depth",
                            value,
                          )
                        }
                      />
                      <Field
                        label="ED"
                        value={
                          editFrame.ed ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "frame",
                            "ed",
                            value,
                          )
                        }
                      />
                      <Field
                        label="Type"
                        value={
                          editFrame.type ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "frame",
                            "type",
                            value,
                          )
                        }
                      />
                      <Field
                        label="SSI"
                        value={
                          editFrame.ssi ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "frame",
                            "ssi",
                            value,
                          )
                        }
                      />
                      <Field
                        label="Other"
                        value={
                          editFrame.other ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "frame",
                            "other",
                            value,
                          )
                        }
                      />
                      <Field
                        label="Fitting"
                        value={
                          editFrame.fitting ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "frame",
                            "fitting",
                            value,
                          )
                        }
                      />
                      <NumberField
                        label="Price"
                        value={
                          editFramePrice
                        }
                        onChange={(value) => {
                          updateNested(
                            "frame",
                            "price",
                            asNumber(value),
                          );
                          updatePricing(
                            "framePrice",
                            asNumber(value),
                          );
                        }}
                      />
                      <NumberField
                        label="Discount"
                        value={
                          editFrame.discount ||
                          editPricing.frameDiscount ||
                          0
                        }
                        onChange={(value) => {
                          updateNested(
                            "frame",
                            "discount",
                            asNumber(value),
                          );
                          updatePricing(
                            "frameDiscount",
                            asNumber(value),
                          );
                        }}
                      />
                      <NumberField
                        label="To Reorder"
                        value={
                          editFrame.toReorder ||
                          0
                        }
                        onChange={(value) =>
                          updateNested(
                            "frame",
                            "toReorder",
                            asNumber(value),
                          )
                        }
                      />
                      <CheckboxField
                        label="Own Frame"
                        checked={Boolean(
                          editFrame.ownFrame,
                        )}
                        onChange={(checked) =>
                          updateNested(
                            "frame",
                            "ownFrame",
                            checked,
                          )
                        }
                      />
                    </div>
                  ) : (
                    <>
                      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
                        <Info
                          label="Code"
                          value={
                            frame.code
                          }
                        />
                        <Info
                          label="Description"
                          value={
                            frame.description
                          }
                        />
                        <Info
                          label="Size"
                          value={
                            frame.size
                          }
                        />
                        <Info
                          label="Depth"
                          value={
                            frame.depth
                          }
                        />
                        <Info
                          label="ED"
                          value={
                            frame.ed
                          }
                        />
                        <Info
                          label="Type"
                          value={
                            frame.type
                          }
                        />
                        <Info
                          label="SSI"
                          value={
                            frame.ssi
                          }
                        />
                        <Info
                          label="Other"
                          value={
                            frame.other
                          }
                        />
                        <Info
                          label="Fitting"
                          value={
                            frame.fitting
                          }
                        />
                        <MoneyInfo
                          label="Price"
                          value={
                            displayedFramePrice
                          }
                        />
                        <MoneyInfo
                          label="Discount"
                          value={
                            frame.discount
                          }
                        />
                        <Info
                          label="Own Frame"
                          value={
                            frame.ownFrame
                              ? "Yes"
                              : "No"
                          }
                        />
                      </div>
                    </>
                  )}
                </Panel>

                <Panel
                  number="04"
                  title="Lenses"
                >
                  {editing ? (
                    <div className="grid gap-2.5">
                      <EyeLensEditor
                        title="Right eye / OD"
                        value={
                          editLensRight
                        }
                        onChange={(
                          key,
                          value,
                        ) =>
                          updateLens(
                            "right",
                            key,
                            value,
                          )
                        }
                      />

                      <EyeLensEditor
                        title="Left eye / OS"
                        value={
                          editLensLeft
                        }
                        onChange={(
                          key,
                          value,
                        ) =>
                          updateLens(
                            "left",
                            key,
                            value,
                          )
                        }
                      />
                    </div>
                  ) : (
                    <div className="grid gap-2.5">
                      <LensView
                        title="Right eye / OD"
                        value={
                          displayedLensRight
                        }
                      />
                      <LensView
                        title="Left eye / OS"
                        value={
                          displayedLensLeft
                        }
                      />
                    </div>
                  )}
                </Panel>
              </div>

              {/* EXTRAS + LAB */}
              <Panel
                number="05"
                title="Extras & lab"
                right={
                  editing ? (
                    <button
                      type="button"
                      onClick={addExtra}
                      className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[8px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      <Plus size={11} />
                      Add extra
                    </button>
                  ) : null
                }
              >
                {editing ? (
                  <div className="grid gap-2.5 lg:grid-cols-[1.1fr_.9fr]">
                    <div className="overflow-x-auto rounded-md border border-slate-200">
                      <table className="w-full min-w-[520px] text-[9px]">
                        <thead className="bg-slate-50 uppercase tracking-[0.08em] text-slate-400">
                          <tr>
                            <th className="px-2 py-2 text-left">
                              Name
                            </th>
                            <th className="px-2 py-2 text-left">
                              Description
                            </th>
                            <th className="px-2 py-2 text-right">
                              Price
                            </th>
                            <th className="px-2 py-2 text-center">
                              Lab
                            </th>
                            <th className="w-8" />
                          </tr>
                        </thead>
                        <tbody>
                          {editExtras.length ? (
                            editExtras.map(
                              (
                                item,
                                index,
                              ) => (
                                <tr
                                  key={
                                    index
                                  }
                                  className="border-t border-slate-100"
                                >
                                  <td className="px-2 py-1.5">
                                    <input
                                      value={
                                        item?.name ||
                                        ""
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        updateExtra(
                                          index,
                                          "name",
                                          event.target.value,
                                        )
                                      }
                                      className={inputClass}
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      value={
                                        item?.description ||
                                        ""
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        updateExtra(
                                          index,
                                          "description",
                                          event.target.value,
                                        )
                                      }
                                      className={inputClass}
                                    />
                                  </td>
                                  <td className="px-2 py-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={
                                        item?.price ??
                                        0
                                      }
                                      onChange={(
                                        event,
                                      ) =>
                                        updateExtra(
                                          index,
                                          "price",
                                          event.target.value,
                                        )
                                      }
                                      className={`${inputClass} text-right`}
                                    />
                                  </td>
                                  <td className="px-2 py-1.5 text-center">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(
                                        item?.labRequired,
                                      )}
                                      onChange={(
                                        event,
                                      ) =>
                                        updateExtra(
                                          index,
                                          "labRequired",
                                          event.target.checked,
                                        )
                                      }
                                    />
                                  </td>
                                  <td className="px-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeExtra(
                                          index,
                                        )
                                      }
                                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                      title="Remove extra"
                                    >
                                      <Trash2
                                        size={
                                          11
                                        }
                                      />
                                    </button>
                                  </td>
                                </tr>
                              ),
                            )
                          ) : (
                            <tr>
                              <td
                                colSpan={
                                  5
                                }
                                className="px-2 py-5 text-center text-[9px] text-slate-400"
                              >
                                No extras.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid gap-1.5">
                      <TextAreaField
                        label="Instructions"
                        value={
                          form?.lab
                            ?.instructions ||
                          ""
                        }
                        onChange={(value) =>
                          updateNested(
                            "lab",
                            "instructions",
                            value,
                          )
                        }
                      />

                      <TextAreaField
                        label="To Apply"
                        value={(
                          Array.isArray(
                            form?.lab
                              ?.toApply,
                          )
                            ? form.lab
                                .toApply
                            : []
                        ).join(", ")}
                        onChange={(value) =>
                          updateNested(
                            "lab",
                            "toApply",
                            value,
                          )
                        }
                        placeholder="Example: AR, UV, tint"
                      />

                      <CheckboxField
                        label="To Fit"
                        checked={Boolean(
                          form?.lab?.toFit,
                        )}
                        onChange={(checked) =>
                          updateNested(
                            "lab",
                            "toFit",
                            checked,
                          )
                        }
                      />

                      <TextAreaField
                        label="Discount Reason"
                        value={
                          form?.pricing
                            ?.discountReason ||
                          ""
                        }
                        onChange={(value) =>
                          updatePricing(
                            "discountReason",
                            value,
                          )
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2.5 lg:grid-cols-[1.1fr_.9fr]">
                    <ExtrasView
                      extras={
                        extras
                      }
                    />

                    <div className="grid gap-1.5 sm:grid-cols-2">
                      <Info
                        label="Instructions"
                        value={
                          lab.instructions
                        }
                      />
                      <Info
                        label="To Apply"
                        value={
                          lab.toApply
                        }
                      />
                      <Info
                        label="To Fit"
                        value={
                          lab.toFit
                            ? "Yes"
                            : "No"
                        }
                      />
                      <Info
                        label="Discount Reason"
                        value={
                          pricing.discountReason
                        }
                      />
                    </div>
                  </div>
                )}
              </Panel>

              {/* PRICING */}
              <Panel
                number="06"
                title="Financial summary"
              >
                {editing ? (
                  <div className="grid gap-2 lg:grid-cols-[1fr_300px]">
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      <NumberField
                        label="Frame"
                        value={
                          editFramePrice
                        }
                        onChange={(value) => {
                          const number =
                            asNumber(
                              value,
                            );
                          updateNested(
                            "frame",
                            "price",
                            number,
                          );
                          updatePricing(
                            "framePrice",
                            number,
                          );
                        }}
                      />
                      <NumberField
                        label="Lens Total"
                        value={
                          editLensPrice
                        }
                        disabled
                      />
                      <NumberField
                        label="Overall Discount"
                        value={
                          editOverallDiscount
                        }
                        onChange={(value) =>
                          updatePricing(
                            "overallDiscount",
                            asNumber(
                              value,
                            ),
                          )
                        }
                      />
                      <NumberField
                        label="GST Rate %"
                        value={
                          editGstRate
                        }
                        onChange={(value) =>
                          updatePricing(
                            "gstRate",
                            asNumber(
                              value,
                            ),
                          )
                        }
                      />
                    </div>

                    <div className="rounded-lg bg-slate-950 p-3 text-white">
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span>
                          Subtotal
                        </span>
                        <span>
                          ₹
                          {money(
                            editSubtotal,
                          )}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[9px] text-red-300">
                        <span>
                          Discount
                        </span>
                        <span>
                          − ₹
                          {money(
                            editOverallDiscount,
                          )}
                        </span>
                      </div>

                      <div className="my-2 border-t border-white/10" />

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-300">
                          Net Total
                        </span>
                        <span className="text-lg font-bold">
                          ₹
                          {money(
                            editNetTotal,
                          )}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                        <span>
                          GST Amount
                        </span>
                        <span>
                          ₹
                          {money(
                            editGstAmount,
                          )}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between rounded-md bg-white/10 px-2.5 py-2">
                        <span className="text-[9px] font-semibold text-slate-300">
                          Bill Total
                        </span>
                        <span className="text-sm font-bold">
                          ₹
                          {money(
                            editBillTotal,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-2 lg:grid-cols-[1fr_300px]">
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                      <MoneyInfo
                        label="Frame"
                        value={
                          displayedFramePrice
                        }
                      />
                      <MoneyInfo
                        label="Lenses"
                        value={
                          displayedLensPrice
                        }
                      />
                      <MoneyInfo
                        label="Extras"
                        value={
                          displayedExtrasTotal
                        }
                      />
                      <MoneyInfo
                        label="Discount"
                        value={
                          displayedDiscount
                        }
                      />
                    </div>

                    <div className="rounded-lg bg-slate-950 p-3 text-white">
                      <div className="flex items-center justify-between text-[9px] text-slate-400">
                        <span>
                          Subtotal
                        </span>
                        <span>
                          ₹
                          {money(
                            displayedSubtotal,
                          )}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[9px] text-red-300">
                        <span>
                          Discount
                        </span>
                        <span>
                          − ₹
                          {money(
                            displayedDiscount,
                          )}
                        </span>
                      </div>

                      <div className="my-2 border-t border-white/10" />

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-300">
                          Net Total
                        </span>
                        <span className="text-lg font-bold">
                          ₹
                          {money(
                            displayedTotal,
                          )}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                        <span>
                          GST
                          {displayedGstRate
                            ? ` (${displayedGstRate}%)`
                            : ""}
                        </span>
                        <span>
                          ₹
                          {money(
                            displayedGstAmount,
                          )}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between rounded-md bg-white/10 px-2.5 py-2">
                        <span className="text-[9px] font-semibold text-slate-300">
                          Bill Total
                        </span>
                        <span className="text-sm font-bold">
                          ₹
                          {money(
                            displayedBillTotal,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Panel>

              {/* WORKFLOW */}
              <Panel
                number="07"
                title="Dispensing workflow"
              >
                <div className="grid grid-cols-2 gap-1.5 md:grid-cols-5">
                  <WorkflowDate
                    label="Ordered"
                    value={
                      job.lensOrderedAt ||
                      job.lensOrderDate
                    }
                  />
                  <WorkflowDate
                    label="Job Ready"
                    value={
                      job.jobReadyAt
                    }
                  />
                  <WorkflowDate
                    label="Notified"
                    value={
                      job.lastNotifiedAt
                    }
                  />
                  <WorkflowDate
                    label="Collected"
                    value={
                      job.collectedAt
                    }
                  />
                  <WorkflowDate
                    label="Cancelled"
                    value={
                      job.status ===
                      "cancelled"
                        ? job.updatedAt
                        : null
                    }
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      Current stage
                    </span>
                    <StatusBadge
                      status={status}
                    />
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(
                      NEXT_ACTIONS[
                        status
                      ] || []
                    ).map(
                      (nextStatus) => (
                        <button
                          key={
                            nextStatus
                          }
                          type="button"
                          disabled={
                            updating ||
                            editing
                          }
                          onClick={() =>
                            changeStatus(
                              nextStatus,
                            )
                          }
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-[9px] font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-wait disabled:opacity-50"
                        >
                          {updating ? (
                            <RefreshCw
                              size={
                                11
                              }
                              className="animate-spin"
                            />
                          ) : (
                            <Check
                              size={
                                11
                              }
                            />
                          )}
                          {pretty(
                            nextStatus,
                          )}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {(job.readyBy ||
                  job.collectedBy) && (
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    <Info
                      label="Ready By"
                      value={
                        personName(
                          job.readyBy,
                        )
                      }
                    />
                    <Info
                      label="Collected By"
                      value={
                        personName(
                          job.collectedBy,
                        )
                      }
                    />
                  </div>
                )}

                {editing && (
                  <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[9px] font-medium text-amber-800">
                    Status is changed only through the
                    dispensing status endpoint.
                    Save job details first, then use
                    the workflow buttons.
                  </div>
                )}
              </Panel>

              {/* NOTES */}
              <Panel
                number="08"
                title="Notes"
              >
                {editing ? (
                  <TextAreaField
                    label=""
                    value={
                      form?.notes || ""
                    }
                    onChange={(value) =>
                      updateField(
                        "notes",
                        value,
                      )
                    }
                    rows={4}
                  />
                ) : (
                  <Note
                    value={job.notes}
                  />
                )}
              </Panel>
            </div>
          </main>

          <footer className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2.5 text-[8px] text-slate-400 sm:px-5">
            <span className="font-semibold text-slate-500">
              V-Sync · Spectacle Dispensing
            </span>
            <span>
              {jobNumber}
            </span>
          </footer>
        </article>

        {editing && (
          <div className="sticky bottom-2 z-20 mt-2 flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur print:hidden">
            <div className="min-w-0">
              <div className="truncate text-[9px] font-bold text-slate-700">
                Editing spectacle job
              </div>
              <div className="truncate text-[8px] text-slate-400">
                {jobNumber} · {name}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 text-[9px] font-semibold text-slate-600 disabled:opacity-50"
              >
                <X size={11} />
                Cancel
              </button>
              <button
                type="button"
                onClick={saveChanges}
                disabled={saving}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-slate-950 px-3 text-[9px] font-bold text-white disabled:opacity-60"
              >
                {saving ? (
                  <RefreshCw
                    size={11}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={11} />
                )}
                {saving
                  ? "Saving..."
                  : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   EDITOR COMPONENTS
============================================================ */

const inputClass =
  "h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-medium text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-200";

function FieldLabel({
  children,
}) {
  return (
    <label className="mb-1 block text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
      {children}
    </label>
  );
}

function Field({
  label,
  value,
  onChange,
  className = "",
  placeholder = "",
  disabled = false,
}) {
  return (
    <div className={className}>
      <FieldLabel>
        {label}
      </FieldLabel>
      <input
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={placeholder}
        disabled={disabled}
        className={`${inputClass} ${
          disabled
            ? "cursor-not-allowed bg-slate-50 text-slate-400"
            : ""
        }`}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div>
      <FieldLabel>
        {label}
      </FieldLabel>
      <input
        type="number"
        step="0.01"
        value={value ?? 0}
        onChange={(event) =>
          onChange?.(
            event.target.value,
          )
        }
        disabled={disabled}
        className={`${inputClass} text-right ${
          disabled
            ? "cursor-not-allowed bg-slate-50 text-slate-400"
            : ""
        }`}
      />
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}) {
  return (
    <div>
      <FieldLabel>
        {label}
      </FieldLabel>
      <input
        type="date"
        value={value || ""}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className={inputClass}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <div>
      <FieldLabel>
        {label}
      </FieldLabel>
      <select
        value={value || ""}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        className={inputClass}
      >
        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (
            <option
              key={optionValue}
              value={
                optionValue
              }
            >
              {
                optionLabel
              }
            </option>
          ),
        )}
      </select>
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  className = "",
  rows = 3,
  placeholder = "",
}) {
  return (
    <div className={className}>
      {label ? (
        <FieldLabel>
          {label}
        </FieldLabel>
      ) : null}

      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value,
          )
        }
        placeholder={
          placeholder
        }
        className="w-full resize-y rounded-md border border-slate-200 bg-white px-2.5 py-2 text-[10px] font-medium leading-4 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
      />
    </div>
  );
}

function CheckboxField({
  label,
  checked,
  onChange,
}) {
  return (
    <div>
      <FieldLabel>
        {label}
      </FieldLabel>
      <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-medium text-slate-600">
        <input
          type="checkbox"
          checked={Boolean(
            checked,
          )}
          onChange={(event) =>
            onChange(
              event.target.checked,
            )
          }
        />
        {checked
          ? "Yes"
          : "No"}
      </label>
    </div>
  );
}

function ReadOnlyInline({
  label,
  value,
  className = "",
}) {
  return (
    <div
      className={`flex min-h-8 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 ${className}`}
    >
      <span className="shrink-0 text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </span>
      <span className="min-w-0 truncate text-[10px] font-semibold text-slate-700">
        {displayText(value)}
      </span>
    </div>
  );
}

/* ============================================================
   RX EDITOR
============================================================ */

function RxEditor({
  rx,
  onChange,
}) {
  const right =
    rx?.right || {};
  const left =
    rx?.left || {};

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full min-w-[650px] border-collapse text-[9px]">
        <thead className="bg-slate-50">
          <tr>
            <th className="border-b border-slate-200 px-2 py-2 text-left text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Eye
            </th>
            {RX_COLUMNS.map(
              ([, label]) => (
                <th
                  key={label}
                  className="border-b border-slate-200 px-1.5 py-2 text-left text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400"
                >
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          <EditableRxRow
            label="OD"
            values={right}
            onChange={(key, value) =>
              onChange(
                "right",
                key,
                value,
              )
            }
          />
          <EditableRxRow
            label="OS"
            values={left}
            onChange={(key, value) =>
              onChange(
                "left",
                key,
                value,
              )
            }
          />
        </tbody>
      </table>
    </div>
  );
}

function EditableRxRow({
  label,
  values,
  onChange,
}) {
  return (
    <tr className="border-t border-slate-100">
      <td className="bg-slate-50 px-2 py-1.5 font-bold text-slate-700">
        {label}
      </td>
      {RX_COLUMNS.map(
        ([key]) => (
          <td
            key={key}
            className="px-1 py-1.5"
          >
            <input
              value={displayText(
                values?.[key],
                "",
              )}
              onChange={(
                event,
              ) =>
                onChange(
                  key,
                  event.target
                    .value,
                )
              }
              className="h-7 w-full min-w-[58px] rounded border border-slate-200 bg-white px-1.5 text-[9px] font-medium text-slate-700 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
            />
          </td>
        ),
      )}
    </tr>
  );
}

/* ============================================================
   LENS
============================================================ */

function EyeLensEditor({
  title,
  value,
  onChange,
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/70 p-2.5">
      <div className="mb-2 text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {title}
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          label="Lens Code"
          value={
            value?.lensCode ||
            ""
          }
          onChange={(next) =>
            onChange(
              "lensCode",
              next,
            )
          }
        />
        <Field
          label="Description"
          value={
            value?.lensDescription ||
            ""
          }
          onChange={(next) =>
            onChange(
              "lensDescription",
              next,
            )
          }
        />
        <Field
          label="Lens Size"
          value={
            value?.lensSize ||
            ""
          }
          onChange={(next) =>
            onChange(
              "lensSize",
              next,
            )
          }
        />
        <Field
          label="Segment Size"
          value={
            value?.segmentSize ||
            ""
          }
          onChange={(next) =>
            onChange(
              "segmentSize",
              next,
            )
          }
        />
        <Field
          label="Segment Height"
          value={
            value?.segmentHeight ||
            ""
          }
          onChange={(next) =>
            onChange(
              "segmentHeight",
              next,
            )
          }
        />
        <Field
          label="OC Height"
          value={
            value?.ocHeight ||
            ""
          }
          onChange={(next) =>
            onChange(
              "ocHeight",
              next,
            )
          }
        />
        <Field
          label="Horizontal Dec."
          value={
            value?.horizontalDecentration ||
            ""
          }
          onChange={(next) =>
            onChange(
              "horizontalDecentration",
              next,
            )
          }
        />
        <Field
          label="Vertical Dec."
          value={
            value?.verticalDecentration ||
            ""
          }
          onChange={(next) =>
            onChange(
              "verticalDecentration",
              next,
            )
          }
        />
        <Field
          label="Base Curve"
          value={
            value?.baseCurve ||
            ""
          }
          onChange={(next) =>
            onChange(
              "baseCurve",
              next,
            )
          }
        />
        <Field
          label="Supplier"
          value={
            value?.supplier ||
            ""
          }
          onChange={(next) =>
            onChange(
              "supplier",
              next,
            )
          }
        />
        <DateField
          label="Supplier Order"
          value={dateInput(
            value?.supplierOrderDate,
          )}
          onChange={(next) =>
            onChange(
              "supplierOrderDate",
              next || null,
            )
          }
        />
        <Field
          label="Tint"
          value={
            value?.tint ||
            ""
          }
          onChange={(next) =>
            onChange(
              "tint",
              next,
            )
          }
        />
        <NumberField
          label="Price"
          value={
            value?.price ??
            0
          }
          onChange={(next) =>
            onChange(
              "price",
              asNumber(next),
            )
          }
        />
      </div>
    </div>
  );
}

function LensView({
  title,
  value,
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50/70 p-2.5">
      <div className="mb-2 text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {title}
      </div>

      <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
        <Info
          label="Lens Code"
          value={
            value?.lensCode
          }
        />
        <Info
          label="Description"
          value={
            value?.lensDescription
          }
        />
        <Info
          label="Lens Size"
          value={
            value?.lensSize
          }
        />
        <Info
          label="Segment Size"
          value={
            value?.segmentSize
          }
        />
        <Info
          label="Segment Height"
          value={
            value?.segmentHeight
          }
        />
        <Info
          label="OC Height"
          value={
            value?.ocHeight
          }
        />
        <Info
          label="Horizontal Dec."
          value={
            value?.horizontalDecentration
          }
        />
        <Info
          label="Vertical Dec."
          value={
            value?.verticalDecentration
          }
        />
        <Info
          label="Base Curve"
          value={
            value?.baseCurve
          }
        />
        <Info
          label="Supplier"
          value={
            value?.supplier
          }
        />
        <Info
          label="Supplier Order"
          value={formatDate(
            value?.supplierOrderDate,
          )}
        />
        <Info
          label="Tint"
          value={
            value?.tint
          }
        />
        <MoneyInfo
          label="Price"
          value={
            value?.price
          }
        />
      </div>
    </div>
  );
}

/* ============================================================
   DISPLAY COMPONENTS
============================================================ */

function Panel({
  number,
  title,
  right,
  children,
}) {
  return (
    <section className="overflow-visible rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
      <div className="flex min-h-9 items-center justify-between border-b border-slate-100 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="flex h-5 min-w-5 items-center justify-center rounded bg-slate-100 px-1 text-[8px] font-bold text-slate-500">
            {number}
          </span>
          <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-700">
            {title}
          </h2>
        </div>
        {right}
      </div>

      <div className="p-2.5 sm:p-3">
        {children}
      </div>
    </section>
  );
}

function HeaderMetric({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-md border border-white/10 bg-white/5 px-2.5 py-2">
      <div className="truncate text-[7px] font-semibold uppercase tracking-[0.1em] text-slate-500">
        {label}
      </div>
      <div className="mt-0.5 truncate text-[10px] font-semibold text-white">
        {displayText(value)}
      </div>
    </div>
  );
}

function Info({
  label,
  value,
}) {
  return (
    <div className="min-w-0 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
      <div className="truncate text-[7px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </div>
      <div className="mt-0.5 break-words text-[10px] font-semibold text-slate-700">
        {displayText(value)}
      </div>
    </div>
  );
}

function MoneyInfo({
  label,
  value,
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
      <div className="text-[7px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </div>
      <div className="mt-0.5 text-[10px] font-bold text-slate-800">
        ₹{money(value)}
      </div>
    </div>
  );
}

function Measure({
  label,
  value,
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
      <div className="text-[7px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </div>
      <div className="mt-0.5 text-[11px] font-bold text-slate-800">
        {displayText(value)}
      </div>
    </div>
  );
}

function WorkflowDate({
  label,
  value,
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
      <div className="text-[7px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[10px] font-bold ${
          value
            ? "text-slate-700"
            : "text-slate-300"
        }`}
      >
        {formatDate(value)}
      </div>
    </div>
  );
}

function Note({
  label,
  value,
}) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-2">
      {label ? (
        <div className="mb-0.5 text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
          {label}
        </div>
      ) : null}
      <div className="whitespace-pre-wrap text-[9px] leading-4 text-slate-600">
        {displayText(
          value,
          "No notes recorded.",
        )}
      </div>
    </div>
  );
}

function ExtrasView({
  extras,
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full min-w-[420px] text-[9px]">
        <thead className="bg-slate-50 uppercase tracking-[0.08em] text-slate-400">
          <tr>
            <th className="px-2.5 py-2 text-left font-bold">
              Item
            </th>
            <th className="px-2.5 py-2 text-left font-bold">
              Description
            </th>
            <th className="px-2.5 py-2 text-center font-bold">
              Lab
            </th>
            <th className="px-2.5 py-2 text-right font-bold">
              Price
            </th>
          </tr>
        </thead>

        <tbody>
          {extras.length ? (
            extras.map(
              (
                item,
                index,
              ) => (
                <tr
                  key={index}
                  className="border-t border-slate-100"
                >
                  <td className="px-2.5 py-2 font-semibold text-slate-700">
                    {displayText(
                      item.name,
                      "Extra",
                    )}
                  </td>
                  <td className="px-2.5 py-2 text-slate-500">
                    {displayText(
                      item.description,
                    )}
                  </td>
                  <td className="px-2.5 py-2 text-center text-slate-500">
                    {item.labRequired
                      ? "Yes"
                      : "No"}
                  </td>
                  <td className="px-2.5 py-2 text-right font-semibold text-slate-700">
                    ₹
                    {money(
                      item.price,
                    )}
                  </td>
                </tr>
              ),
            )
          ) : (
            <tr>
              <td
                colSpan={4}
                className="px-2.5 py-5 text-center text-[9px] text-slate-400"
              >
                No extras recorded.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({
  status,
}) {
  const styles = {
    draft:
      "border-slate-200 bg-slate-100 text-slate-600",
    ordered:
      "border-blue-200 bg-blue-50 text-blue-700",
    not_ready:
      "border-amber-200 bg-amber-50 text-amber-700",
    ready:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    notified:
      "border-violet-200 bg-violet-50 text-violet-700",
    collected:
      "border-slate-200 bg-slate-900 text-white",
    cancelled:
      "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[7px] font-bold uppercase tracking-[0.08em] ${
        styles[status] ||
        styles.draft
      }`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {pretty(status)}
    </span>
  );
}

function RxTable({
  rx,
}) {
  const right =
    rx?.right || {};
  const left =
    rx?.left || {};

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full min-w-[620px] border-collapse text-[9px]">
        <thead className="bg-slate-50">
          <tr>
            <th className="border-b border-slate-200 px-2 py-2 text-left text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400">
              Eye
            </th>
            {RX_COLUMNS.map(
              ([, label]) => (
                <th
                  key={label}
                  className="border-b border-slate-200 px-2 py-2 text-left text-[7px] font-bold uppercase tracking-[0.08em] text-slate-400"
                >
                  {label}
                </th>
              ),
            )}
          </tr>
        </thead>

        <tbody>
          <RxRow
            label="OD"
            values={right}
          />
          <RxRow
            label="OS"
            values={left}
          />
        </tbody>
      </table>
    </div>
  );
}

function RxRow({
  label,
  values,
}) {
  return (
    <tr className="border-t border-slate-100">
      <td className="bg-slate-50 px-2 py-2 font-bold text-slate-700">
        {label}
      </td>
      {RX_COLUMNS.map(
        ([key]) => (
          <td
            key={key}
            className="px-2 py-2 font-medium text-slate-700"
          >
            {displayText(
              values?.[key],
            )}
          </td>
        ),
      )}
    </tr>
  );
}

function EmptyState({
  text,
}) {
  return (
    <div className="flex h-16 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-[9px] text-slate-400">
      {text}
    </div>
  );
}
