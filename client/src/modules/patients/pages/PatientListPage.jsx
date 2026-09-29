import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  Users,
  X,
  ArrowUpRight,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  deactivatePatient,
  getPatients,
  updatePatient,
} from "../patient.api";

const fullName = (patient) =>
  [patient?.firstName, patient?.middleName, patient?.lastName]
    .filter(Boolean)
    .join(" ");

const PAGE_SIZE = 20;

export default function PatientListPage() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("active");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const [menuId, setMenuId] = useState(null);
  const [confirmPatient, setConfirmPatient] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [previewPatient, setPreviewPatient] = useState(null);

  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState("");

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getPatients({
        page,
        limit: PAGE_SIZE,
        search: search.trim(),
        status,
      });

      const rows = Array.isArray(response?.data?.patients)
        ? response.data.patients
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setPatients(rows);

      setPagination(
        response?.data?.pagination ||
          response?.pagination ||
          null,
      );
    } catch (err) {
      setPatients([]);
      setPagination(null);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load patients.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, status]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    if (!menuId) return;

    const handlePointerDown = (event) => {
      if (!event.target.closest("[data-patient-actions]")) {
        setMenuId(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuId(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuId]);

  const stats = useMemo(() => {
    const activeCount = patients.filter(
      (p) => p.status === "active",
    ).length;

    const withEmail = patients.filter(
      (p) => Boolean(p.email),
    ).length;

    const withRecall = patients.filter(
      (p) => Boolean(p.nextRecallAt),
    ).length;

    const withPhone = patients.filter(
      (p) => Boolean(p.phone),
    ).length;

    return {
      current: patients.length,
      activeCount,
      withEmail,
      withRecall,
      withPhone,
    };
  }, [patients]);

  const openEdit = (patient) => {
    setMenuId(null);

    setEditingPatient({
      _id: patient._id,
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      dateOfBirth: patient.dateOfBirth
        ? new Date(patient.dateOfBirth)
            .toISOString()
            .slice(0, 10)
        : "",
      gender: patient.gender || "",
      phone: patient.phone || "",
      alternatePhone: patient.alternatePhone || "",
      email: patient.email || "",
      source: patient.source || "",
      notes: patient.notes || "",
    });
  };

  const saveEdit = async (event) => {
    event.preventDefault();

    if (!editingPatient?._id) return;

    setSaving(true);
    setError("");

    try {
      await updatePatient(editingPatient._id, {
        firstName: editingPatient.firstName.trim(),
        lastName: editingPatient.lastName.trim(),
        dateOfBirth: editingPatient.dateOfBirth || null,
        gender: editingPatient.gender,
        phone: editingPatient.phone.trim(),
        alternatePhone: editingPatient.alternatePhone.trim(),
        email: editingPatient.email.trim().toLowerCase(),
        source: editingPatient.source,
        notes: editingPatient.notes.trim(),
      });

      setEditingPatient(null);
      await loadPatients();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update patient.",
      );
    } finally {
      setSaving(false);
    }
  };

  const requestDeactivate = (patient) => {
    setMenuId(null);
    setConfirmPatient(patient);
  };

  const deactivate = async () => {
    if (!confirmPatient?._id) return;

    const patient = confirmPatient;

    setConfirmPatient(null);
    setActionBusy(patient._id);
    setError("");

    try {
      await deactivatePatient(patient._id);
      await loadPatients();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to deactivate patient.",
      );
    } finally {
      setActionBusy("");
    }
  };

  const totalPages = pagination?.totalPages || 1;
  const totalPatients =
    pagination?.total ?? patients.length;

  return (
    <div className="mx-auto w-full max-w-[1700px] space-y-6 pb-8">
      {/* ======================================================
          PREMIUM HEADER
      ====================================================== */}

      <section className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.07)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,0.10),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.08),transparent_30%)]" />

        <div className="relative px-5 py-6 sm:px-7 sm:py-8 lg:px-9">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-lg shadow-violet-200 sm:flex">
                <Users size={25} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-violet-600">
                    Patient management
                  </p>
                </div>

                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Patients
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Manage patient records, access clinical history,
                  start consultations and maintain patient information
                  from one workspace.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadPatients}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={() => navigate("/patients/new")}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-violet-700"
              >
                <Plus size={15} />
                Add patient
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 hover:bg-red-100"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ======================================================
          METRICS
      ====================================================== */}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Users}
          label="Records on page"
          value={stats.current}
          accent="violet"
        />

        <Metric
          icon={ShieldCheck}
          label="Active patients"
          value={stats.activeCount}
          accent="emerald"
        />

        <Metric
          icon={Phone}
          label="Contact available"
          value={stats.withPhone}
          accent="blue"
        />

        <Metric
          icon={CalendarPlus}
          label="Recall scheduled"
          value={stats.withRecall}
          accent="amber"
        />
      </section>

      {/* ======================================================
          SEARCH / FILTER BAR
      ====================================================== */}

      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search patient, phone, email or patient number..."
              aria-label="Search patients"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-12 min-w-[190px] rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
          >
            <option value="active">
              Active patients
            </option>
            <option value="inactive">
              Inactive patients
            </option>
            <option value="">
              All patients
            </option>
          </select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-medium text-slate-400">
            {search
              ? `Searching for "${search}"`
              : "Showing patient records"}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400">
            <Clock3 size={13} />
            Page {page} of {totalPages}
          </div>
        </div>
      </section>

      {/* ======================================================
          PATIENT REGISTER
      ====================================================== */}

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]">
        <header className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-violet-50/50 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500">
                Patient directory
              </div>

              <div className="mt-1 flex items-center gap-3">
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  Patient register
                </h2>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                  {totalPatients}
                </span>
              </div>
            </div>

            {pagination && (
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-500 shadow-sm">
                Page {pagination.page || page} of{" "}
                {pagination.totalPages || 1}
              </div>
            )}
          </div>
        </header>

        {loading ? (
          <PatientTableSkeleton />
        ) : patients.length === 0 ? (
          <EmptyPatients
            search={search}
            onAdd={() => navigate("/patients/new")}
            onClear={() => {
              setSearch("");
              setStatus("");
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                  <th className="px-5 py-3.5">
                    Patient
                  </th>
                  <th className="px-5 py-3.5">
                    Contact
                  </th>
                  <th className="px-5 py-3.5">
                    Source
                  </th>
                  <th className="px-5 py-3.5">
                    Last consult
                  </th>
                  <th className="px-5 py-3.5">
                    Recall
                  </th>
                  <th className="px-5 py-3.5">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {patients.map((patient) => {
                  const initials =
                    (
                      (patient.firstName?.[0] || "") +
                      (patient.lastName?.[0] || "")
                    ).toUpperCase() || "?";

                  return (
                    <tr
                      key={patient._id}
                      className="group border-b border-slate-100 last:border-0 transition hover:bg-violet-50/30"
                    >
                      {/* PATIENT */}

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/patients/${patient._id}`,
                            )
                          }
                          className="group/patient flex items-center gap-3 text-left"
                        >
                          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 text-xs font-black text-violet-700">
                            {initials}

                            {patient.status !==
                              "inactive" && (
                              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-bold text-slate-900 transition group-hover/patient:text-violet-700">
                                {fullName(patient) ||
                                  "Unnamed patient"}
                              </span>

                              <ArrowUpRight
                                size={13}
                                className="text-slate-300 opacity-0 transition group-hover/patient:text-violet-500 group-hover/patient:opacity-100"
                              />
                            </div>

                            <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                              {patient.patientNumber ||
                                "No patient number"}
                            </div>
                          </div>
                        </button>
                      </td>

                      {/* CONTACT */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                          <Phone
                            size={13}
                            className="text-slate-400"
                          />
                          {patient.phone || "—"}
                        </div>

                        <div className="mt-1 flex max-w-[240px] items-center gap-2 truncate text-[10px] text-slate-400">
                          <Mail size={12} />
                          <span className="truncate">
                            {patient.email || "No email"}
                          </span>
                        </div>
                      </td>

                      {/* SOURCE */}

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold capitalize text-blue-700">
                          {patient.source
                            ? patient.source.replaceAll(
                                "_",
                                " ",
                              )
                            : "Not recorded"}
                        </span>
                      </td>

                      {/* LAST CONSULT */}

                      <td className="px-5 py-4">
                        <span className="text-xs font-semibold text-slate-600">
                          {formatDate(
                            patient.lastConsultationAt,
                          )}
                        </span>
                      </td>

                      {/* RECALL */}

                      <td className="px-5 py-4">
                        <span
                          className={`text-xs font-semibold ${
                            patient.nextRecallAt
                              ? "text-amber-700"
                              : "text-slate-400"
                          }`}
                        >
                          {formatDate(patient.nextRecallAt)}
                        </span>
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                            patient.status ===
                            "inactive"
                              ? "bg-slate-100 text-slate-500"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              patient.status ===
                              "inactive"
                                ? "bg-slate-400"
                                : "bg-emerald-500"
                            }`}
                          />

                          {patient.status ===
                          "inactive"
                            ? "Inactive"
                            : "Active"}
                        </span>
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4 text-right">
                        <div
                          className="relative inline-flex items-center gap-1"
                          data-patient-actions
                        >
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/patients/${patient._id}/consultations/new`,
                              )
                            }
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-950 px-3 py-2 text-[10px] font-black text-white transition hover:bg-violet-700"
                          >
                            <CalendarPlus size={12} />
                            Consult
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setMenuId((current) =>
                                current === patient._id
                                  ? null
                                  : patient._id,
                              )
                            }
                            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800"
                            aria-label={`Actions for ${fullName(
                              patient,
                            )}`}
                          >
                            <MoreHorizontal size={17} />
                          </button>

                          {menuId === patient._id && (
                            <PatientActionsMenu
                              patient={patient}
                              onPreview={() => {
                                setMenuId(null);
                                setPreviewPatient(patient);
                              }}
                              onOpen={() => {
                                setMenuId(null);
                                navigate(
                                  `/patients/${patient._id}`,
                                );
                              }}
                              onEdit={() =>
                                openEdit(patient)
                              }
                              onDeactivate={() =>
                                requestDeactivate(
                                  patient,
                                )
                              }
                              busy={
                                actionBusy ===
                                patient._id
                              }
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ====================================================
            PAGINATION
        ==================================================== */}

        {!loading &&
          pagination &&
          (pagination.totalPages || 1) > 1 && (
            <footer className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs font-medium text-slate-500">
                Showing{" "}
                <span className="font-bold text-slate-700">
                  {patients.length}
                </span>{" "}
                of{" "}
                <span className="font-bold text-slate-700">
                  {pagination.total ?? patients.length}
                </span>{" "}
                patients
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() =>
                    setPage((current) => current - 1)
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={13} />
                  Previous
                </button>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-slate-950 px-3 text-xs font-black text-white">
                  {page}
                </div>

                <button
                  type="button"
                  disabled={
                    page >= pagination.totalPages
                  }
                  onClick={() =>
                    setPage((current) => current + 1)
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={13} />
                </button>
              </div>
            </footer>
          )}
      </section>

      {/* MODALS */}

      {previewPatient && (
        <PatientPreviewModal
          patient={previewPatient}
          onClose={() => setPreviewPatient(null)}
          onOpen={() => {
            const id = previewPatient._id;
            setPreviewPatient(null);
            navigate(`/patients/${id}`);
          }}
          onConsult={() => {
            const id = previewPatient._id;
            setPreviewPatient(null);
            navigate(
              `/patients/${id}/consultations/new`,
            );
          }}
        />
      )}

      {confirmPatient && (
        <ConfirmDeactivateModal
          patient={confirmPatient}
          busy={actionBusy === confirmPatient._id}
          onClose={() => setConfirmPatient(null)}
          onConfirm={deactivate}
        />
      )}

      {editingPatient && (
        <EditPatientModal
          form={editingPatient}
          setForm={setEditingPatient}
          saving={saving}
          onClose={() => setEditingPatient(null)}
          onSubmit={saveEdit}
        />
      )}
    </div>
  );
}

/* ============================================================
   PATIENT ACTION MENU
============================================================ */

function PatientActionsMenu({
  patient,
  onPreview,
  onOpen,
  onEdit,
  onDeactivate,
  busy,
}) {
  return (
    <div
      role="menu"
      className="absolute right-0 top-11 z-40 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 text-left shadow-[0_20px_50px_rgba(15,23,42,0.16)]"
    >
      <button
        type="button"
        onClick={onPreview}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
      >
        <Eye size={14} />
        Quick view
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
      >
        <UserRound size={14} />
        Open patient
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
      >
        <Edit3 size={14} />
        Edit patient
      </button>

      <div className="my-1 border-t border-slate-100" />

      <button
        type="button"
        disabled={busy}
        onClick={onDeactivate}
        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
      >
        {busy ? "Working..." : "Deactivate"}
      </button>
    </div>
  );
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyPatients({ search, onAdd, onClear }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-50 to-blue-50 text-violet-600">
        <Users size={27} />
      </div>

      <h3 className="mt-5 text-base font-bold text-slate-800">
        No patients found
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        {search
          ? "No patient records match your current search."
          : "There are no patient records matching the selected status."}
      </p>

      <div className="mt-5 flex gap-2">
        {search && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Clear filters
          </button>
        )}

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-700"
        >
          <Plus size={14} />
          Add patient
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   SKELETON
============================================================ */

function PatientTableSkeleton() {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: 7 }).map((_, index) => (
        <div
          key={index}
          className="flex min-w-[1100px] items-center gap-6 px-5 py-5"
        >
          <div className="flex flex-1 items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" />

            <div className="space-y-2">
              <div className="h-3 w-36 animate-pulse rounded bg-slate-100" />
              <div className="h-2.5 w-24 animate-pulse rounded bg-slate-100" />
            </div>
          </div>

          <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
          <div className="h-8 w-28 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   METRIC
============================================================ */

function Metric({ icon: Icon, label, value, accent = "violet" }) {
  const styles = {
    violet:
      "from-violet-50 to-purple-50 text-violet-600",
    emerald:
      "from-emerald-50 to-teal-50 text-emerald-600",
    blue:
      "from-blue-50 to-cyan-50 text-blue-600",
    amber:
      "from-amber-50 to-orange-50 text-amber-600",
  };

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${styles[accent]}`}
        >
          <Icon size={17} />
        </div>

        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
            {label}
          </div>

          <div className="mt-1 text-xl font-black tracking-tight text-slate-900">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CONFIRM DEACTIVATE
============================================================ */

function ConfirmDeactivateModal({
  patient,
  busy,
  onClose,
  onConfirm,
}) {
  const name = fullName(patient) || "this patient";

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () =>
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
  }, [busy, onClose]);

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="p-6 sm:p-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <UserRound size={19} />
          </div>

          <h2 className="mt-5 text-lg font-black tracking-tight text-slate-900">
            Deactivate patient?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            <span className="font-bold text-slate-700">
              {name}
            </span>{" "}
            will be marked inactive. The patient record and
            clinical history will remain available.
          </p>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
              Patient
            </div>

            <div className="mt-1 text-sm font-bold text-slate-800">
              {patient.patientNumber ||
                "No patient number"}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy
                ? "Deactivating..."
                : "Deactivate patient"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   PATIENT PREVIEW
============================================================ */

function PatientPreviewModal({
  patient,
  onClose,
  onOpen,
  onConsult,
}) {
  const initials =
    (
      (patient.firstName?.[0] || "") +
      (patient.lastName?.[0] || "")
    ).toUpperCase() || "?";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-lg font-black text-white shadow-lg">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-600">
                  Patient snapshot
                </p>

                <h2 className="mt-1 truncate text-xl font-black text-slate-900">
                  {fullName(patient) ||
                    "Unnamed patient"}
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  {patient.patientNumber ||
                    "No patient number"}{" "}
                  ·{" "}
                  {patient.status === "inactive"
                    ? "Inactive"
                    : "Active"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
              aria-label="Close patient preview"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-5 sm:p-7">
          <div className="grid gap-3 md:grid-cols-3">
            <InfoBlock
              label="Phone"
              value={patient.phone || "Not recorded"}
            />

            <InfoBlock
              label="Email"
              value={patient.email || "Not recorded"}
            />

            <InfoBlock
              label="Date of birth"
              value={formatDate(patient.dateOfBirth)}
            />

            <InfoBlock
              label="Gender"
              value={patient.gender || "Not recorded"}
            />

            <InfoBlock
              label="Patient source"
              value={
                patient.source
                  ? patient.source.replaceAll(
                      "_",
                      " ",
                    )
                  : "Not recorded"
              }
            />

            <InfoBlock
              label="Last consultation"
              value={formatDate(
                patient.lastConsultationAt,
              )}
            />

            <InfoBlock
              label="Next recall"
              value={formatDate(
                patient.nextRecallAt,
              )}
            />

            <InfoBlock
              label="Alternate phone"
              value={
                patient.alternatePhone ||
                "Not recorded"
              }
            />

            <InfoBlock
              label="Created"
              value={formatDate(patient.createdAt)}
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900">
                  Clinical notes
                </h3>

                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Record
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {patient.notes?.trim() ||
                  "No patient notes have been recorded."}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-black text-slate-900">
                Patient timeline
              </h3>

              <div className="mt-3 space-y-3">
                <TimelineItem
                  label="Registered"
                  value={formatDate(
                    patient.createdAt,
                  )}
                />

                <TimelineItem
                  label="Last consultation"
                  value={formatDate(
                    patient.lastConsultationAt,
                  )}
                />

                <TimelineItem
                  label="Next recall"
                  value={formatDate(
                    patient.nextRecallAt,
                  )}
                />
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onConsult}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-violet-700"
              >
                Start consultation
              </button>

              <button
                type="button"
                onClick={onOpen}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:from-violet-500 hover:to-blue-500"
              >
                Open patient record
                <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   INFO BLOCK
============================================================ */

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}
      </div>

      <div className="mt-1.5 break-words text-sm font-bold capitalize text-slate-800">
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   TIMELINE
============================================================ */

function TimelineItem({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
      <span className="text-xs font-medium text-slate-500">
        {label}
      </span>

      <span className="text-xs font-black text-slate-800">
        {value}
      </span>
    </div>
  );
}

/* ============================================================
   DATE
============================================================ */

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ============================================================
   EDIT PATIENT
============================================================ */

function EditPatientModal({
  form,
  setForm,
  saving,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-[4px]">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[30px] border border-slate-200 bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 px-5 py-5 backdrop-blur sm:px-6">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
              Patient maintenance
            </div>

            <h2 className="mt-1 text-lg font-black text-slate-900">
              Edit patient
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
          >
            <X size={16} />
          </button>
        </header>

        <form
          onSubmit={onSubmit}
          className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6"
        >
          <EditInput
            label="First name"
            value={form.firstName}
            required
            onChange={(v) =>
              setForm({
                ...form,
                firstName: v,
              })
            }
          />

          <EditInput
            label="Surname"
            value={form.lastName}
            onChange={(v) =>
              setForm({
                ...form,
                lastName: v,
              })
            }
          />

          <EditInput
            label="Date of birth"
            type="date"
            value={form.dateOfBirth}
            onChange={(v) =>
              setForm({
                ...form,
                dateOfBirth: v,
              })
            }
          />

          <EditInput
            label="Gender"
            value={form.gender}
            onChange={(v) =>
              setForm({
                ...form,
                gender: v,
              })
            }
          />

          <EditInput
            label="Phone"
            value={form.phone}
            required
            onChange={(v) =>
              setForm({
                ...form,
                phone: v,
              })
            }
          />

          <EditInput
            label="Alternate phone"
            value={form.alternatePhone}
            onChange={(v) =>
              setForm({
                ...form,
                alternatePhone: v,
              })
            }
          />

          <EditInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) =>
              setForm({
                ...form,
                email: v,
              })
            }
          />

          <EditInput
            label="Source"
            value={form.source}
            onChange={(v) =>
              setForm({
                ...form,
                source: v,
              })
            }
          />

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Notes
            </span>

            <textarea
              rows={6}
              value={form.notes}
              onChange={(event) =>
                setForm({
                  ...form,
                  notes: event.target.value,
                })
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              <Edit3 size={14} />
              {saving
                ? "Saving..."
                : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
   EDIT INPUT
============================================================ */

function EditInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </span>

      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50"
      />
    </label>
  );
}