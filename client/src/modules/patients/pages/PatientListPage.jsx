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
  const totalPatients = pagination?.total ?? patients.length;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-3 pb-4 pt-4 text-slate-800">
      {/* Page header */}
      <header className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <Users size={21} />
          </div>
          <div className="min-w-0">
            <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-blue-700">
              Patient management
            </div>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-[27px]">
              Patients
            </h1>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Manage patient records and start consultations from one workspace.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadPatients}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate("/patients/new")}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <Plus size={15} />
            Add patient
          </button>
        </div>
      </header>

      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="rounded-lg p-1 hover:bg-red-100">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Summary metrics */}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Metric icon={Users} label="Records on page" value={stats.current} accent="blue" />
        <Metric icon={ShieldCheck} label="Active on page" value={stats.activeCount} accent="emerald" />
        <Metric icon={Phone} label="With phone" value={stats.withPhone} accent="violet" />
        <Metric icon={CalendarPlus} label="Recall scheduled" value={stats.withRecall} accent="amber" />
      </section>

      {/* Search and register */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-3 sm:p-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, phone, email or patient number"
                aria-label="Search patients"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-8 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-3 focus:ring-blue-50"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
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
              aria-label="Filter by patient status"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-400 focus:ring-3 focus:ring-blue-50 md:w-48"
            >
              <option value="active">Active patients</option>
              <option value="inactive">Inactive patients</option>
              <option value="">All patients</option>
            </select>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] text-slate-500">
            <span>{search ? `Results for “${search}”` : "Patient directory"}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> Page {page} of {totalPages}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-3 sm:px-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Patient register</h2>
            <p className="mt-0.5 text-[12px] text-slate-500">{totalPatients} patient record{totalPatients === 1 ? "" : "s"}</p>
          </div>
          {pagination && (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-slate-600">
              Page {pagination.page || page} / {pagination.totalPages || 1}
            </span>
          )}
        </div>

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
          <>
            {/* Mobile patient cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {patients.map((patient) => {
                const initials = ((patient.firstName?.[0] || "") + (patient.lastName?.[0] || "")).toUpperCase() || "?";
                return (
                  <article key={patient._id} className="p-3 transition hover:bg-slate-50/70">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => navigate(`/patients/${patient._id}`)}
                        aria-label={`Open ${fullName(patient) || "patient"}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100"
                      >
                        {initials}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button type="button" onClick={() => navigate(`/patients/${patient._id}`)} className="truncate text-sm font-bold text-slate-900 hover:text-blue-700">
                            {fullName(patient) || "Unnamed patient"}
                          </button>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold ${patient.status === "inactive" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${patient.status === "inactive" ? "bg-slate-400" : "bg-emerald-500"}`} />
                            {patient.status === "inactive" ? "Inactive" : "Active"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[12px] text-slate-500">{patient.patientNumber || "No patient number"}</p>
                        <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-slate-600">
                          <span className="flex min-w-0 items-center gap-2"><Phone size={12} className="shrink-0 text-slate-400" />{patient.phone || "No phone recorded"}</span>
                          {patient.email && <span className="flex min-w-0 items-center gap-2"><Mail size={12} className="shrink-0 text-slate-400" /><span className="truncate">{patient.email}</span></span>}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[12px] text-slate-500">Recall: {formatDate(patient.nextRecallAt)}</span>
                          <div className="relative flex items-center gap-1.5" data-patient-actions>
                            <button type="button" onClick={() => navigate(`/patients/${patient._id}/consultations/new`)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-700 px-2.5 text-[12px] font-semibold text-white hover:bg-blue-800"><CalendarPlus size={12} />Consult</button>
                            <button type="button" onClick={() => setMenuId((current) => current === patient._id ? null : patient._id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50" aria-label={`Actions for ${fullName(patient)}`}><MoreHorizontal size={16} /></button>
                            {menuId === patient._id && (
                              <PatientActionsMenu
                                patient={patient}
                                onPreview={() => { setMenuId(null); setPreviewPatient(patient); }}
                                onOpen={() => { setMenuId(null); navigate(`/patients/${patient._id}`); }}
                                onEdit={() => openEdit(patient)}
                                onDeactivate={() => requestDeactivate(patient)}
                                busy={actionBusy === patient._id}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Desktop / tablet register */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-3 py-3">Patient</th>
                    <th className="px-3 py-3">Contact</th>
                    <th className="px-3 py-3">Source</th>
                    <th className="px-3 py-3">Last consultation</th>
                    <th className="px-3 py-3">Next recall</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((patient) => {
                    const initials = ((patient.firstName?.[0] || "") + (patient.lastName?.[0] || "")).toUpperCase() || "?";
                    return (
                      <tr key={patient._id} className="group transition hover:bg-blue-50/30">
                        <td className="px-3 py-3.5">
                          <button type="button" onClick={() => navigate(`/patients/${patient._id}`)} className="group/patient flex items-center gap-3 text-left">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[12px] font-bold text-blue-700 ring-1 ring-blue-100">{initials}</div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="max-w-[220px] truncate text-sm font-semibold text-slate-800 group-hover/patient:text-blue-700">{fullName(patient) || "Unnamed patient"}</span>
                                <ArrowUpRight size={12} className="text-slate-300 opacity-0 transition group-hover/patient:text-blue-600 group-hover/patient:opacity-100" />
                              </div>
                              <div className="mt-0.5 text-[12px] text-slate-500">{patient.patientNumber || "No patient number"}</div>
                            </div>
                          </button>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-700"><Phone size={12} className="text-slate-400" />{patient.phone || "—"}</div>
                          <div className="mt-1 flex max-w-[220px] items-center gap-2 truncate text-[12px] text-slate-500"><Mail size={11} className="shrink-0 text-slate-400" /><span className="truncate">{patient.email || "No email"}</span></div>
                        </td>
                        <td className="px-3 py-3.5"><span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[12px] font-medium capitalize text-slate-600">{patient.source ? patient.source.replaceAll("_", " ") : "Not recorded"}</span></td>
                        <td className="px-3 py-3.5 text-xs text-slate-600">{formatDate(patient.lastConsultationAt)}</td>
                        <td className={`px-3 py-3.5 text-xs ${patient.nextRecallAt ? "font-semibold text-amber-700" : "text-slate-400"}`}>{formatDate(patient.nextRecallAt)}</td>
                        <td className="px-3 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${patient.status === "inactive" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${patient.status === "inactive" ? "bg-slate-400" : "bg-emerald-500"}`} />
                            {patient.status === "inactive" ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-right">
                          <div className="relative inline-flex items-center gap-1.5" data-patient-actions>
                            <button type="button" onClick={() => navigate(`/patients/${patient._id}/consultations/new`)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-700 px-3 text-[12px] font-semibold text-white transition hover:bg-blue-800"><CalendarPlus size={12} />Consult</button>
                            <button type="button" onClick={() => setMenuId((current) => current === patient._id ? null : patient._id)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-800" aria-label={`Actions for ${fullName(patient)}`}><MoreHorizontal size={16} /></button>
                            {menuId === patient._id && (
                              <PatientActionsMenu
                                patient={patient}
                                onPreview={() => { setMenuId(null); setPreviewPatient(patient); }}
                                onOpen={() => { setMenuId(null); navigate(`/patients/${patient._id}`); }}
                                onEdit={() => openEdit(patient)}
                                onDeactivate={() => requestDeactivate(patient)}
                                busy={actionBusy === patient._id}
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
          </>
        )}

        {!loading && pagination && (pagination.totalPages || 1) > 1 && (
          <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-3 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-3">
            <div className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-800">{patients.length}</span> of <span className="font-semibold text-slate-800">{pagination.total ?? patients.length}</span> patients
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={14} />Previous</button>
              <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-blue-700 px-3 text-xs font-bold text-white">{page}</span>
              <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next<ChevronRight size={14} /></button>
            </div>
          </footer>
        )}
      </section>

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
            navigate(`/patients/${id}/consultations/new`);
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
      className="absolute right-0 top-10 z-40 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-lg"
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
    <div className="flex min-h-[280px] flex-col items-center justify-center px-3 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <Users size={27} />
      </div>

      <h3 className="mt-3 text-sm font-bold text-slate-800">
        No patients found
      </h3>

      <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
        {search
          ? "No patient records match your current search."
          : "There are no patient records matching the selected status."}
      </p>

      <div className="mt-4 flex gap-2">
        {search && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            Clear filters
          </button>
        )}

        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-800"
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
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-3 sm:px-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-3 w-36 max-w-full animate-pulse rounded bg-slate-100" />
            <div className="h-2.5 w-24 max-w-full animate-pulse rounded bg-slate-100" />
          </div>
          <div className="hidden h-3 w-28 animate-pulse rounded bg-slate-100 sm:block" />
          <div className="hidden h-3 w-24 animate-pulse rounded bg-slate-100 lg:block" />
          <div className="hidden h-5 w-16 animate-pulse rounded-full bg-slate-100 md:block" />
          <div className="h-8 w-16 shrink-0 animate-pulse rounded-lg bg-slate-100" />
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
      "bg-blue-50 text-blue-700",
    emerald:
      "bg-emerald-50 text-emerald-700",
    blue:
      "bg-sky-50 text-sky-700",
    amber:
      "bg-amber-50 text-amber-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition-colors hover:border-slate-300">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${styles[accent]}`}
        >
          <Icon size={17} />
        </div>

        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">
            {label}
          </div>

          <div className="mt-1 text-lg font-bold tracking-tight text-slate-900">
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
      className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[4px]"
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
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="p-3 sm:p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <UserRound size={19} />
          </div>

          <h2 className="mt-4 text-lg font-black tracking-tight text-slate-900">
            Deactivate patient?
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            <span className="font-bold text-slate-700">
              {name}
            </span>{" "}
            will be marked inactive. The patient record and
            clinical history will remain available.
          </p>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
            <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Patient
            </div>

            <div className="mt-1 text-sm font-bold text-slate-800">
              {patient.patientNumber ||
                "No patient number"}
            </div>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={onConfirm}
              className="rounded-xl bg-red-600 px-3 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[4px]"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <header className="border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-3 py-3 sm:px-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 text-lg font-black text-white shadow-lg">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-blue-700">
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

        <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-3 sm:p-4">
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

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
            <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-900">
                  Clinical notes
                </h3>

                <span className="rounded-full bg-white px-2.5 py-1 text-[12px] font-black uppercase tracking-wider text-slate-400">
                  Record
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {patient.notes?.trim() ||
                  "No patient notes have been recorded."}
              </p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-3">
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

          <div className="mt-4 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onConsult}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-800"
              >
                Start consultation
              </button>

              <button
                type="button"
                onClick={onOpen}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm hover:from-violet-500 hover:to-blue-500"
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
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[12px] font-black uppercase tracking-wider text-slate-400">
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[4px]">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:px-3">
          <div>
            <div className="text-[12px] font-black uppercase tracking-[0.18em] text-blue-700">
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
          className="grid gap-3 p-3 sm:grid-cols-2 sm:p-3"
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
            <span className="mb-1.5 block text-[12px] font-black uppercase tracking-wider text-slate-400">
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
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
      <span className="mb-1.5 block text-[12px] font-black uppercase tracking-wider text-slate-400">
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
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}