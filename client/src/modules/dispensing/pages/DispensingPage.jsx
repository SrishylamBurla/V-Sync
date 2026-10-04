import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Glasses,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getDispensingList, updateDispensing } from "../dispensing.api";
import { updateSpectacleStatus } from "../../optical/spectacle.api";
import {
  getSundryJobs,
  updateSundryJobStatus,
} from "../sundryJob.api";

const statuses = [
  "draft",
  "ordered",
  "not_ready",
  "ready",
  "notified",
  "collected",
  "cancelled",
];

const sundryStatuses = [
  "ordered",
  "not_ready",
  "ready",
  "notified",
  "collected",
  "cancelled",
];

const next = {
  draft: "ordered",
  ordered: "not_ready",
  not_ready: "ready",
  ready: "notified",
  notified: "collected",
};

const label = (value) =>
  String(value || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const patientName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ") || "Unknown patient";

const normalizeItemType = (value) => {
  const type = String(value || "")
    .toLowerCase()
    .replace(/[_-]/g, " ");

  if (
    type.includes("contact") ||
    type.includes("lens") ||
    type.includes("contact_lens")
  ) {
    return "contact_lens";
  }

  return "spectacle";
};

const isSpectacle = (row) => normalizeItemType(row?.itemType) === "spectacle";

const isContactLens = (row) =>
  normalizeItemType(row?.itemType) === "contact_lens";

const isSundry = (row) => row?._dispensingType === "sundry";

export default function DispensingPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [sundryRows, setSundryRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeType, setActiveType] = useState("spectacle");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [dispensingResult, sundryResult] = await Promise.allSettled([
        getDispensingList(status ? { status } : {}),
        getSundryJobs(status ? { status } : {}),
      ]);

      if (dispensingResult.status === "fulfilled") {
        setRows(dispensingResult.value?.data || []);
      } else {
        setRows([]);
      }

      if (sundryResult.status === "fulfilled") {
        const data = sundryResult.value?.data;
        setSundryRows(Array.isArray(data) ? data : []);
      } else {
        setSundryRows([]);
      }

      const failures = [dispensingResult, sundryResult].filter(
        (result) => result.status === "rejected",
      );

      if (failures.length) {
        const failure = failures[0]?.reason;
        setError(
          failure?.response?.data?.message ||
            failure?.message ||
            "Unable to load dispensing jobs",
        );
      }
    } catch (error) {
      setError(
        error?.response?.data?.message || "Unable to load dispensing jobs",
      );
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  /*
   * Separate the jobs first.
   *
   * Spectacle jobs and contact-lens jobs remain in the same
   * API response, but are never displayed together.
   */
  const spectacleRows = useMemo(() => rows.filter(isSpectacle), [rows]);

  const contactLensRows = useMemo(() => rows.filter(isContactLens), [rows]);

  const normalizedSundryRows = useMemo(
    () =>
      sundryRows.map((row) => ({
        ...row,
        _dispensingType: "sundry",
        recordNumber:
          row.recordNumber ||
          row.jobNumber ||
          row.jobNo ||
          row.orderNumber ||
          row._id,
        dueDate:
          row.dueDate ||
          row.expectedDate ||
          row.deliveryDate,
      })),
    [sundryRows],
  );

  const activeRows =
    activeType === "spectacle"
      ? spectacleRows
      : activeType === "contact_lens"
        ? contactLensRows
        : normalizedSundryRows;

  const activeStatuses =
    activeType === "sundry" ? sundryStatuses : statuses;

  /*
   * Search only inside the currently selected dispensing type.
   */
  const filteredRows = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return activeRows;
    }

    return activeRows.filter((row) => {
      const searchable = [
        row.recordNumber,

        patientName(row.patientId),

        row.patientId?.patientNumber,
        row.patientId?.phone,

        row.brand,
        row.model,
        row.itemType,

        row.frame?.code,
        row.frame?.description,

        row.lens?.code,
        row.lens?.description,

        row.supplier,
        row.lensType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(search);
    });
  }, [activeRows, query]);

  /*
   * Status counts are calculated separately for each type.
   */
  const spectacleCounts = useMemo(
    () =>
      Object.fromEntries(
        statuses.map((value) => [
          value,
          spectacleRows.filter((row) => row.status === value).length,
        ]),
      ),
    [spectacleRows],
  );

  const contactLensCounts = useMemo(
    () =>
      Object.fromEntries(
        statuses.map((value) => [
          value,
          contactLensRows.filter((row) => row.status === value).length,
        ]),
      ),
    [contactLensRows],
  );

  const sundryCounts = useMemo(
    () =>
      Object.fromEntries(
        sundryStatuses.map((value) => [
          value,
          normalizedSundryRows.filter((row) => row.status === value).length,
        ]),
      ),
    [normalizedSundryRows],
  );

  const activeCounts =
    activeType === "spectacle"
      ? spectacleCounts
      : activeType === "contact_lens"
        ? contactLensCounts
        : sundryCounts;

  const advance = async (row) => {
    const target = next[row?.status];

    if (!target || !row?._id) {
      return;
    }

    try {
      setError("");

      if (isSundry(row)) {
        const response = await updateSundryJobStatus(row._id, target);
        const updatedRow = response?.data || response?.sundryJob || null;

        setSundryRows((currentRows) =>
          currentRows.map((item) =>
            item._id === row._id ? updatedRow || { ...item, status: target } : item,
          ),
        );
        return;
      }

      const response = isSpectacle(row)
        ? await updateSpectacleStatus(row._id, target)
        : await updateDispensing(row._id, target);

      const updatedRow =
        response?.data?.spectacle ||
        response?.data ||
        response?.spectacle ||
        null;

      setRows((currentRows) =>
        currentRows.map((item) =>
          item._id === row._id ? updatedRow || item : item,
        ),
      );
    } catch (error) {
      setError(
        error?.response?.data?.message || "Unable to update dispensing status",
      );
    }
  };

  const switchType = (type) => {
    setActiveType(type);
    setStatus("");
    setQuery("");
    setError("");
  };
  const openJob = (row) => {
    if (!row?._id) {
      return;
    }

    if (isSpectacle(row)) {
      navigate(`/dispensing/spectacles/${row._id}`);
      return;
    }

    if (isContactLens(row)) {
      navigate(`/dispensing/contact-lenses/${row._id}`);
      return;
    }

    if (isSundry(row)) {
      navigate(`/dispensing/sundries/${row._id}`);
    }
  };

  const openPatient = (patientId) => {
    if (!patientId) {
      return;
    }

    navigate(`/patients/${patientId}`);
  };

  const activeTitle =
    activeType === "spectacle"
      ? "Spectacle Jobs"
      : activeType === "contact_lens"
        ? "Contact Lens Jobs"
        : "Sundry Jobs";

  const activeDescription =
    activeType === "spectacle"
      ? "Manage spectacle orders from prescription and frame selection through collection."
      : activeType === "contact_lens"
        ? "Manage contact lens orders from lens selection and fitting through collection."
        : "Manage sundry dispensing orders from item selection through collection.";

  return (
    <div className="py-4 sm:py-5">
      <div className="space-y-3.5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Dispensing
            </div>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950">
              Dispensing
            </h1>
            <p className="mt-1 text-[10px] text-slate-400">
              One dispensing workspace for spectacle, contact-lens and sundry jobs.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex h-8 items-center gap-1.5 self-start rounded-md border border-slate-200 bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 sm:self-auto"
          >
            <RefreshCw size={12} />
            Refresh
          </button>
        </header>
      {error && (
        <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =========================================================
          01. DISPENSING TYPE SELECTOR
      ========================================================== */}

      <Section
        number="01"
        title="Dispensing"
        description="Choose the type of dispensing work you want to manage."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {/* Spectacle */}
          <button
            type="button"
            onClick={() => switchType("spectacle")}
            className={`group rounded-2xl border p-5 text-left transition ${
              activeType === "spectacle"
                ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  activeType === "spectacle"
                    ? "bg-white/10 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <Glasses size={20} />
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  activeType === "spectacle"
                    ? "bg-white/10 text-slate-200"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {spectacleRows.length} Jobs
              </span>
            </div>

            <div className="mt-5">
              <div
                className={`text-sm font-bold ${
                  activeType === "spectacle" ? "text-white" : "text-slate-900"
                }`}
              >
                Spectacle Jobs
              </div>

              <div
                className={`mt-1 text-xs leading-5 ${
                  activeType === "spectacle"
                    ? "text-slate-300"
                    : "text-slate-500"
                }`}
              >
                Frames, lenses, prescription and spectacle dispensing orders.
              </div>
            </div>
          </button>

          {/* Contact Lens */}
          <button
            type="button"
            onClick={() => switchType("contact_lens")}
            className={`group rounded-2xl border p-5 text-left transition ${
              activeType === "contact_lens"
                ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  activeType === "contact_lens"
                    ? "bg-white/10 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <PackageCheck size={20} />
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  activeType === "contact_lens"
                    ? "bg-white/10 text-slate-200"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {contactLensRows.length} Jobs
              </span>
            </div>

            <div className="mt-5">
              <div
                className={`text-sm font-bold ${
                  activeType === "contact_lens"
                    ? "text-white"
                    : "text-slate-900"
                }`}
              >
                Contact Lens Jobs
              </div>

              <div
                className={`mt-1 text-xs leading-5 ${
                  activeType === "contact_lens"
                    ? "text-slate-300"
                    : "text-slate-500"
                }`}
              >
                Contact lens orders, brands, replacement, parameters and
                dispensing.
              </div>
            </div>
          </button>

          {/* Sundry */}
          <button
            type="button"
            onClick={() => switchType("sundry")}
            className={`group rounded-2xl border p-5 text-left transition ${
              activeType === "sundry"
                ? "border-slate-900 bg-slate-900 text-white shadow-lg"
                : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  activeType === "sundry"
                    ? "bg-white/10 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <ShoppingBag size={20} />
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                  activeType === "sundry"
                    ? "bg-white/10 text-slate-200"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {normalizedSundryRows.length} Jobs
              </span>
            </div>

            <div className="mt-5">
              <div
                className={`text-sm font-bold ${
                  activeType === "sundry" ? "text-white" : "text-slate-900"
                }`}
              >
                Sundry Jobs
              </div>

              <div
                className={`mt-1 text-xs leading-5 ${
                  activeType === "sundry" ? "text-slate-300" : "text-slate-500"
                }`}
              >
                Non-optical sundry items such as accessories and other dispensing products.
              </div>
            </div>
          </button>
        </div>
      </Section>

      {/* =========================================================
          02. STATUS OVERVIEW
      ========================================================== */}

      <Section
        number="02"
        title={`${activeTitle} — Workflow`}
        description="Filter this dispensing workflow by its current stage."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {activeStatuses.map((currentStatus) => {
            const count = activeCounts[currentStatus] || 0;

            const selected = status === currentStatus;

            return (
              <button
                key={currentStatus}
                type="button"
                onClick={() => setStatus(selected ? "" : currentStatus)}
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    selected ? "text-slate-300" : "text-slate-400"
                  }`}
                >
                  {label(currentStatus)}
                </div>

                <div className="mt-2 text-2xl font-bold">{count}</div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* =========================================================
          03. ACTIVE JOB REGISTER
      ========================================================== */}

      <Section number="03" title={activeTitle} description={activeDescription}>
        {/* Search / filter */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={
                activeType === "spectacle"
                  ? "Search spectacle job, patient, frame, lens..."
                  : activeType === "contact_lens"
                    ? "Search contact lens job, patient, brand, model..."
                    : "Search sundry job, patient, item..."
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
          >
            <option value="">All statuses</option>

            {activeStatuses.map((currentStatus) => (
              <option key={currentStatus} value={currentStatus}>
                {label(currentStatus)}
              </option>
            ))}
          </select>
        </div>

        {/* Register */}
        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Loading {activeTitle.toLowerCase()}...
          </div>
        ) : (
          <Table
            columns={[
              {
                key: "record",
                label: "Job",
                render: (row) => (
                  <button
                    type="button"
                    onClick={() => openJob(row)}
                    className="font-semibold text-slate-900 hover:underline"
                  >
                    {row.recordNumber || "—"}
                  </button>
                ),
              },

              {
                key: "patient",
                label: "Patient",
                render: (row) => (
                  <button
                    type="button"
                    onClick={() => openPatient(row.patientId?._id)}
                    className="text-left"
                  >
                    <span className="block font-semibold text-slate-800 hover:underline">
                      {patientName(row.patientId)}
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {row.patientId?.patientNumber || "No patient number"}
                      {" · "}
                      {row.patientId?.phone || "No phone"}
                    </span>
                  </button>
                ),
              },

              /* ---------------------------------------------------
                 Spectacle-specific information
              --------------------------------------------------- */

              ...(activeType === "spectacle"
                ? [
                    {
                      key: "frame",
                      label: "Frame",
                      render: (row) => (
                        <div>
                          <div className="text-xs font-semibold text-slate-700">
                            {row.frame?.code || row.frame?.description || "—"}
                          </div>

                          {row.frame?.description && row.frame?.code && (
                            <div className="mt-0.5 text-[10px] text-slate-400">
                              {row.frame.description}
                            </div>
                          )}
                        </div>
                      ),
                    },
                    {
                      key: "lens",
                      label: "Lens",
                      render: (row) => (
                        <div>
                          <div className="text-xs font-semibold text-slate-700">
                            {row.lens?.code || row.lens?.description || "—"}
                          </div>
                          {row.lens?.supplier && (
                            <div className="mt-0.5 text-[10px] text-slate-400">
                              {row.lens.supplier}
                            </div>
                          )}
                        </div>
                      ),
                    },
                  ]
                : activeType === "contact_lens"
                  ? [
                      {
                        key: "brand",
                        label: "Brand",
                        render: (row) => (
                          <div>
                            <div className="text-xs font-semibold text-slate-700">
                              {row.brand || "—"}
                            </div>
                            {row.model && (
                              <div className="mt-0.5 text-[10px] text-slate-400">
                                {row.model}
                              </div>
                            )}
                          </div>
                        ),
                      },
                      {
                        key: "lensType",
                        label: "Lens",
                        render: (row) => (
                          <div>
                            <div className="text-xs font-semibold text-slate-700">
                              {row.lensType || "—"}
                            </div>
                            {row.replacement && (
                              <div className="mt-0.5 text-[10px] text-slate-400">
                                {row.replacement}
                              </div>
                            )}
                          </div>
                        ),
                      },
                      {
                        key: "quantity",
                        label: "Qty",
                        render: (row) => row.quantity || "—",
                      },
                    ]
                  : [
                      {
                        key: "item",
                        label: "Item",
                        render: (row) => (
                          <div>
                            <div className="text-xs font-semibold text-slate-700">
                              {row.item?.code ||
                                row.item?.description ||
                                row.inventoryItem?.code ||
                                row.inventoryItem?.description ||
                                row.itemName ||
                                "Sundry"}
                            </div>
                            {(row.item?.description || row.inventoryItem?.description) && (
                              <div className="mt-0.5 truncate text-[10px] text-slate-400">
                                {row.item?.description || row.inventoryItem?.description}
                              </div>
                            )}
                          </div>
                        ),
                      },
                      {
                        key: "quantity",
                        label: "Qty",
                        render: (row) => row.quantity || 1,
                      },
                    ]),

              {
                key: "dueDate",
                label: "Due",
                render: (row) =>
                  row.dueDate
                    ? new Date(row.dueDate).toLocaleDateString("en-IN")
                    : "—",
              },

              {
                key: "status",
                label: "Status",
                render: (row) => (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {label(row.status)}
                  </span>
                ),
              },

              {
                key: "action",
                label: "Next",
                render: (row) =>
                  next[row.status] ? (
                    <button
                      type="button"
                      onClick={() => advance(row)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-slate-800"
                    >
                      <CheckCircle2 size={12} />

                      {label(next[row.status])}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  ),
              },
            ]}
            rows={filteredRows}
            empty={
              activeType === "spectacle"
                ? "No spectacle jobs found."
                : activeType === "contact_lens"
                  ? "No contact lens jobs found."
                  : "No sundry jobs found."
            }
          />
        )}
      </Section>

      {/* =========================================================
          04. CURRENT WORKFLOW
      ========================================================== */}

      <Section number="04" title={`${activeTitle} — Workflow`}>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            Ordered
          </span>

          <span>→</span>

          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            Not Ready
          </span>

          <span>→</span>

          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            Ready
          </span>

          <span>→</span>

          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            Notified
          </span>

          <span>→</span>

          <span className="rounded-lg border border-slate-200 bg-white px-3 py-2">
            Collected
          </span>
        </div>
      </Section>
      </div>
    </div>
  );
}

function Section({ number, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <header className="border-b border-slate-100 px-3.5 py-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-5 min-w-5 items-center justify-center rounded bg-slate-100 px-1 text-[8px] font-bold text-slate-500">
            {number}
          </span>
          <div className="min-w-0">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-700">
              {title}
            </h2>
            {description && (
              <p className="mt-0.5 text-[9px] leading-4 text-slate-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </header>
      <div className="p-3 sm:p-3.5">{children}</div>
    </section>
  );
}

function Table({ columns, rows, empty = "No records found." }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-[10px]">
        <thead>
          <tr className="border-b border-slate-200 text-[8px] uppercase tracking-[0.08em] text-slate-400">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-2.5 py-2 font-bold ${column.align === "right" ? "text-right" : ""}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr key={row._id || row.id || index} className="border-b border-slate-100 last:border-0">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-2.5 py-2.5 text-slate-600 ${column.align === "right" ? "text-right" : ""}`}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-10 text-center text-[9px] text-slate-400"
              >
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
