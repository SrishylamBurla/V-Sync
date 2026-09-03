import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { deactivatePatient, getPatients, updatePatient } from "../patient.api";

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
      setPagination(response?.data?.pagination || response?.pagination || null);
    } catch (err) {
      setPatients([]);
      setPagination(null);
      setError(err?.response?.data?.message || "Unable to load patients.");
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

  const stats = useMemo(() => {
    const activeCount = patients.filter((p) => p.status === "active").length;
    const withEmail = patients.filter((p) => p.email).length;
    const withRecall = patients.filter((p) => p.nextRecallAt).length;

    return {
      current: patients.length,
      activeCount,
      withEmail,
      withRecall,
    };
  }, [patients]);

  const openEdit = (patient) => {
    setMenuId(null);
    setEditingPatient({
      _id: patient._id,
      firstName: patient.firstName || "",
      lastName: patient.lastName || "",
      dateOfBirth: patient.dateOfBirth
        ? new Date(patient.dateOfBirth).toISOString().slice(0, 10)
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
      setError(err?.response?.data?.message || "Unable to update patient.");
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (patient) => {
    setMenuId(null);

    if (!window.confirm(`Deactivate ${fullName(patient)}?`)) return;

    setActionBusy(patient._id);
    setError("");

    try {
      await deactivatePatient(patient._id);
      await loadPatients();
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to deactivate patient.");
    } finally {
      setActionBusy("");
    }
  };

  return (
    <div className="space-y-6 py-5 sm:py-7">
      <header className="overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-violet-600">
              Patient management
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Patients
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Search, review and maintain patient records from one operational
              workspace.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadPatients}
              className="inline-flex items-center gap-2 rounded-xl border border-white bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw size={14} />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => navigate("/patients/new")}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-violet-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-slate-800 hover:to-violet-600"
            >
              <Plus size={15} />
              Add patient
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            <X size={15} />
          </button>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Users} label="Records on page" value={stats.current} />
        <Metric
          icon={UserRound}
          label="Active on page"
          value={stats.activeCount}
        />
        <Metric icon={Phone} label="With email" value={stats.withEmail} />
        <Metric
          icon={CalendarPlus}
          label="Recall tracked"
          value={stats.withRecall}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient, phone, email or patient number..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="h-12 min-w-[190px] rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-600 outline-none focus:border-blue-300"
          >
            <option value="active">Active patients</option>
            <option value="inactive">Inactive patients</option>
            <option value="">All patients</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
                Patient directory
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Patient register
              </h2>
            </div>

            {pagination && (
              <div className="text-xs text-slate-500">
                Page {pagination.page || page} of {pagination.totalPages || 1}
              </div>
            )}
          </div>
        </header>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center text-sm text-slate-400">
            Loading patient records...
          </div>
        ) : patients.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <Users size={24} />
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              No patients found
            </p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
              Try another search, change the status filter, or register a new
              patient.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Last consult</th>
                  <th className="px-5 py-3">Recall</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {patients.map((patient) => (
                  <tr
                    key={patient._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
                  >
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => navigate(`/patients/${patient._id}`)}
                        className="flex items-center gap-3 text-left"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-blue-100 text-sm font-bold text-violet-700">
                          {(patient.firstName?.[0] || "") +
                            (patient.lastName?.[0] || "")}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900 group-hover:text-violet-700">
                            {fullName(patient) || "Unnamed patient"}
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-400">
                            {patient.patientNumber || "No patient number"}
                          </div>
                        </div>
                      </button>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-700">
                        {patient.phone || "—"}
                      </div>
                      <div className="mt-0.5 max-w-[240px] truncate text-[10px] text-slate-400">
                        {patient.email || "No email"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                        {patient.source
                          ? patient.source.replaceAll("_", " ")
                          : "Not recorded"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs font-medium text-slate-600">
                      {formatDate(patient.lastConsultationAt)}
                    </td>

                    <td className="px-5 py-4 text-xs font-medium text-slate-600">
                      {formatDate(patient.nextRecallAt)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          patient.status === "inactive"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {patient.status === "inactive" ? "Inactive" : "Active"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="relative inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/patients/${patient._id}/consultations/new`,
                            )
                          }
                          className="rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold text-white hover:bg-slate-800"
                        >
                          Consult
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setMenuId((current) =>
                              current === patient._id ? null : patient._id,
                            )
                          }
                          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                          aria-label={`Actions for ${fullName(patient)}`}
                        >
                          <MoreHorizontal size={17} />
                        </button>

                        {menuId === patient._id && (
                          <div className="absolute right-0 top-11 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl">
                            <button
                              type="button"
                              onClick={() => {
                                setMenuId(null);
                                setPreviewPatient(patient);
                              }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              <Eye size={14} />
                              Quick view
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/patients/${patient._id}`)
                              }
                              className="block w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Open patient
                            </button>

                            <button
                              type="button"
                              onClick={() => openEdit(patient)}
                              className="block w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              Edit patient
                            </button>

                            <button
                              type="button"
                              disabled={actionBusy === patient._id}
                              onClick={() => deactivate(patient)}
                              className="block w-full px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              {actionBusy === patient._id
                                ? "Working..."
                                : "Deactivate"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && (pagination.totalPages || 1) > 1 && (
          <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-slate-500">
              {pagination.total ?? patients.length} total patient records
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40"
              >
                <ChevronLeft size={13} />
                Previous
              </button>

              <span className="px-2 text-xs font-semibold text-slate-600">
                {page}
              </span>

              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40"
              >
                Next
                <ChevronRight size={13} />
              </button>
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

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 text-blue-700">
          <Icon size={17} />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {label}
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function PatientPreviewModal({ patient, onClose, onOpen, onConsult }) {
  const initials =
    (
      (patient.firstName?.[0] || "") + (patient.lastName?.[0] || "")
    ).toUpperCase() || "?";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="border-b border-slate-200 bg-gradient-to-r from-violet-50 via-white to-cyan-50 px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-lg font-black text-white shadow-sm">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[.2em] text-violet-600">
                  Patient snapshot
                </p>
                <h2 className="mt-1 truncate text-xl font-bold text-slate-900">
                  {fullName(patient) || "Unnamed patient"}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {patient.patientNumber || "No patient number"} ·{" "}
                  {patient.status === "inactive" ? "Inactive" : "Active"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
              aria-label="Close patient preview"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="max-h-[calc(92vh-150px)] overflow-y-auto p-5 sm:p-7">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBlock label="Phone" value={patient.phone || "Not recorded"} />
            <InfoBlock label="Email" value={patient.email || "Not recorded"} />
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
                  ? patient.source.replaceAll("_", " ")
                  : "Not recorded"
              }
            />
            <InfoBlock
              label="Last consultation"
              value={formatDate(patient.lastConsultationAt)}
            />
            <InfoBlock
              label="Next recall"
              value={formatDate(patient.nextRecallAt)}
            />
            <InfoBlock
              label="Alternate phone"
              value={patient.alternatePhone || "Not recorded"}
            />
            <InfoBlock label="Created" value={formatDate(patient.createdAt)} />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Clinical notes
                </h3>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Record
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {patient.notes?.trim() ||
                  "No patient notes have been recorded."}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900">
                Patient timeline
              </h3>
              <div className="mt-3 space-y-3">
                <TimelineItem
                  label="Registered"
                  value={formatDate(patient.createdAt)}
                />
                <TimelineItem
                  label="Last consultation"
                  value={formatDate(patient.lastConsultationAt)}
                />
                <TimelineItem
                  label="Next recall"
                  value={formatDate(patient.nextRecallAt)}
                />
              </div>
            </section>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onConsult}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
              >
                Start consultation
              </button>
              <button
                type="button"
                onClick={onOpen}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-violet-500 hover:to-blue-500"
              >
                Open patient record
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="mt-1.5 break-words text-sm font-semibold capitalize text-slate-800">
        {value}
      </div>
    </div>
  );
}

function TimelineItem({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-xs font-bold text-slate-800">{value}</span>
    </div>
  );
}

function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}

function EditPatientModal({ form, setForm, saving, onClose, onSubmit }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-600">
              Patient maintenance
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
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
            onChange={(v) => setForm({ ...form, firstName: v })}
          />
          <EditInput
            label="Surname"
            value={form.lastName}
            onChange={(v) => setForm({ ...form, lastName: v })}
          />
          <EditInput
            label="Date of birth"
            type="date"
            value={form.dateOfBirth}
            onChange={(v) => setForm({ ...form, dateOfBirth: v })}
          />
          <EditInput
            label="Gender"
            value={form.gender}
            onChange={(v) => setForm({ ...form, gender: v })}
          />
          <EditInput
            label="Phone"
            value={form.phone}
            required
            onChange={(v) => setForm({ ...form, phone: v })}
          />
          <EditInput
            label="Alternate phone"
            value={form.alternatePhone}
            onChange={(v) => setForm({ ...form, alternatePhone: v })}
          />
          <EditInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />
          <EditInput
            label="Source"
            value={form.source}
            onChange={(v) => setForm({ ...form, source: v })}
          />
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Notes
            </span>
            <textarea
              rows={6}
              value={form.notes}
              onChange={(event) =>
                setForm({ ...form, notes: event.target.value })
              }
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-5 sm:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Edit3 size={14} />
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-blue-300 focus:bg-white"
      />
    </label>
  );
}
