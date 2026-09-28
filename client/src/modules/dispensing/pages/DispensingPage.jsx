import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Glasses,
  PackageCheck,
  RefreshCw,
  Search,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  DocumentShell,
  Section,
  Table,
} from "../../../components/common/DocumentUI";

import { getDispensingList, updateDispensing } from "../dispensing.api";

const statuses = [
  "ordered",
  "not_ready",
  "ready",
  "notified",
  "collected",
  "cancelled",
];

const next = {
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
  const type = String(value || "").toLowerCase().replace(/[_-]/g, " ");

  if (
    type.includes("contact") ||
    type.includes("lens") ||
    type.includes("contact_lens")
  ) {
    return "contact_lens";
  }

  return "spectacle";
};

const isSpectacle = (row) =>
  normalizeItemType(row?.itemType) === "spectacle";

const isContactLens = (row) =>
  normalizeItemType(row?.itemType) === "contact_lens";

export default function DispensingPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeType, setActiveType] = useState("spectacle");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getDispensingList(
        status ? { status } : {},
      );

      setRows(response?.data || []);
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          "Unable to load dispensing jobs",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  /*
   * Separate the jobs first.
   *
   * Spectacle jobs and contact-lens jobs remain in the same
   * API response, but are never displayed together.
   */
  const spectacleRows = useMemo(
    () => rows.filter(isSpectacle),
    [rows],
  );

  const contactLensRows = useMemo(
    () => rows.filter(isContactLens),
    [rows],
  );

  const activeRows =
    activeType === "spectacle"
      ? spectacleRows
      : contactLensRows;

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
          spectacleRows.filter(
            (row) => row.status === value,
          ).length,
        ]),
      ),
    [spectacleRows],
  );

  const contactLensCounts = useMemo(
    () =>
      Object.fromEntries(
        statuses.map((value) => [
          value,
          contactLensRows.filter(
            (row) => row.status === value,
          ).length,
        ]),
      ),
    [contactLensRows],
  );

  const activeCounts =
    activeType === "spectacle"
      ? spectacleCounts
      : contactLensCounts;

  const advance = async (row) => {
    const target = next[row?.status];

    if (!target || !row?._id) {
      return;
    }

    try {
      setError("");

      const response = await updateDispensing(
        row._id,
        target,
      );

      setRows((currentRows) =>
        currentRows.map((item) =>
          item._id === row._id
            ? response?.data || item
            : item,
        ),
      );
    } catch (error) {
      setError(
        error?.response?.data?.message ||
          "Unable to update dispensing status",
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

    /*
     * Never navigate using ":id".
     * The actual MongoDB ObjectId must be supplied.
     */
    navigate(`/dispensing/${row._id}`);
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
      : "Contact Lens Jobs";

  const activeDescription =
    activeType === "spectacle"
      ? "Manage spectacle orders from prescription and frame selection through collection."
      : "Manage contact lens orders from lens selection and fitting through collection.";

  return (
    <DocumentShell
      eyebrow="Optical operations"
      title="Dispensing"
      subtitle="Manage spectacle and contact-lens dispensing as separate workflows."
      code="DISPENSING"
      actions={
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      }
    >
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
        <div className="grid gap-4 md:grid-cols-2">
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
                  activeType === "spectacle"
                    ? "text-white"
                    : "text-slate-900"
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
                Frames, lenses, prescription and spectacle
                dispensing orders.
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
                Contact lens orders, brands, replacement,
                parameters and dispensing.
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
          {statuses.map((currentStatus) => {
            const count =
              activeCounts[currentStatus] || 0;

            const selected =
              status === currentStatus;

            return (
              <button
                key={currentStatus}
                type="button"
                onClick={() =>
                  setStatus(
                    selected ? "" : currentStatus,
                  )
                }
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    selected
                      ? "text-slate-300"
                      : "text-slate-400"
                  }`}
                >
                  {label(currentStatus)}
                </div>

                <div className="mt-2 text-2xl font-bold">
                  {count}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* =========================================================
          03. ACTIVE JOB REGISTER
      ========================================================== */}

      <Section
        number="03"
        title={activeTitle}
        description={activeDescription}
      >
        {/* Search / filter */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder={
                activeType === "spectacle"
                  ? "Search spectacle job, patient, frame, lens..."
                  : "Search contact lens job, patient, brand, model..."
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-slate-300 focus:bg-white"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
          >
            <option value="">All statuses</option>

            {statuses.map((currentStatus) => (
              <option
                key={currentStatus}
                value={currentStatus}
              >
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
                    onClick={() =>
                      openPatient(row.patientId?._id)
                    }
                    className="text-left"
                  >
                    <span className="block font-semibold text-slate-800 hover:underline">
                      {patientName(row.patientId)}
                    </span>

                    <span className="text-[10px] text-slate-400">
                      {row.patientId?.patientNumber ||
                        "No patient number"}
                      {" · "}
                      {row.patientId?.phone ||
                        "No phone"}
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
                            {row.frame?.code ||
                              row.frame?.description ||
                              "—"}
                          </div>

                          {row.frame?.description &&
                            row.frame?.code && (
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
                            {row.lens?.code ||
                              row.lens?.description ||
                              "—"}
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
                : [
                    /* -------------------------------------------------
                       Contact-lens-specific information
                    -------------------------------------------------- */

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
                      render: (row) =>
                        row.quantity || "—",
                    },
                  ]),

              {
                key: "dueDate",
                label: "Due",
                render: (row) =>
                  row.dueDate
                    ? new Date(
                        row.dueDate,
                      ).toLocaleDateString("en-IN")
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
                    <span className="text-xs text-slate-400">
                      —
                    </span>
                  ),
              },
            ]}
            rows={filteredRows}
            empty={
              activeType === "spectacle"
                ? "No spectacle jobs found."
                : "No contact lens jobs found."
            }
          />
        )}
      </Section>

      {/* =========================================================
          04. CURRENT WORKFLOW
      ========================================================== */}

      <Section
        number="04"
        title={`${activeTitle} — Workflow`}
      >
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
    </DocumentShell>
  );
}