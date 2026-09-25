import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { getPatients, createPatient } from "../../patients/patient.api";

import {
  DocumentShell,
  Section,
  Field,
} from "../../../components/common/DocumentUI";

import {
  getAppointments,
  getAppointmentClinicians,
  createAppointment,
  updateAppointment,
} from "../appointment.api";

// ============================================================
// CONSTANTS
// ============================================================

const statusOptions = [
  "booked",
  "confirmed",
  "here",
  "examining",
  "complete",
  "cancelled",
  "no_show",
];

const statusLabel = (status = "") =>
  status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const statusClass = {
  booked: "bg-slate-100 text-slate-700",
  confirmed: "bg-blue-50 text-blue-700",
  here: "bg-amber-50 text-amber-700",
  examining: "bg-violet-50 text-violet-700",
  complete: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-orange-50 text-orange-700",
};

// ============================================================
// HELPERS
// ============================================================

const fullName = (person) =>
  [
    person?.firstName,
    person?.middleName,
    person?.lastName,
  ]
    .filter(Boolean)
    .join(" ");

const dateKey = (date) => {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const prettyDate = (key) => {
  if (!key) return "Select a date";

  const value = new Date(`${key}T12:00:00`);

  if (Number.isNaN(value.getTime())) {
    return "Invalid date";
  }

  return value.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const inputDateTime = (key) => `${key}T09:00`;

const getAppointmentRows = (response) => {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.appointments)) {
    return response.data.appointments;
  }

  if (Array.isArray(response?.appointments)) {
    return response.appointments;
  }

  return [];
};

const getPatientRows = (response) => {
  if (Array.isArray(response?.data?.patients)) {
    return response.data.patients;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.patients)) {
    return response.patients;
  }

  return [];
};

// ============================================================
// MAIN PAGE
// ============================================================

export default function AppointmentsPage() {
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // PAGE STATE
  // ----------------------------------------------------------

  const [selectedDate, setSelectedDate] = useState(
    dateKey(new Date()),
  );

  const [rows, setRows] = useState([]);
  const [clinicians, setClinicians] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [clinicianId, setClinicianId] = useState("");

  // ----------------------------------------------------------
  // BOOKING MODAL
  // ----------------------------------------------------------

  const [showForm, setShowForm] = useState(false);
  const [bookingMode, setBookingMode] = useState("existing");

  const [patientQuery, setPatientQuery] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [patientSearching, setPatientSearching] = useState(false);

  // ----------------------------------------------------------
  // REASSIGNMENT
  // IMPORTANT:
  // selectedClinicians is keyed by appointment ID.
  // This prevents one row from affecting another row.
  // ----------------------------------------------------------

  const [reassigningId, setReassigningId] = useState("");
  const [selectedClinicians, setSelectedClinicians] = useState({});

  // ----------------------------------------------------------
  // APPOINTMENT FORM
  // ----------------------------------------------------------

  const [form, setForm] = useState({
    patientId: "",
    appointmentDate: inputDateTime(dateKey(new Date())),
    type: "Eye Examination",
    durationMinutes: 30,
    clinicianId: "",
    reason: "",
    notes: "",
  });

  // ----------------------------------------------------------
  // NEW PATIENT FORM
  // ----------------------------------------------------------

  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    alternatePhone: "",
    email: "",
    source: "walk_in",
    notes: "",
  });

  // ==========================================================
  // LOAD APPOINTMENTS
  // ==========================================================

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getAppointments({
        date: selectedDate,
        status,
        clinicianId,
        search: query.trim(),
      });

      setRows(getAppointmentRows(response));
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load appointments.",
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate, status, clinicianId, query]);

  // ==========================================================
  // INITIAL / FILTERED LOAD
  // ==========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);

    return () => clearTimeout(timer);
  }, [load]);

  // ==========================================================
  // LOAD CLINICIANS
  // ==========================================================

  useEffect(() => {
    let active = true;

    const loadClinicians = async () => {
      try {
        const response = await getAppointmentClinicians();

        if (!active) return;

        setClinicians(
          Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.clinicians)
              ? response.data.clinicians
              : Array.isArray(response?.clinicians)
                ? response.clinicians
                : [],
        );
      } catch {
        if (active) {
          setClinicians([]);
        }
      }
    };

    loadClinicians();

    return () => {
      active = false;
    };
  }, []);

  // ==========================================================
  // PATIENT SEARCH
  // ==========================================================

  useEffect(() => {
    let active = true;

    const timer = setTimeout(async () => {
      const search = patientQuery.trim();

      if (!search) {
        setPatientResults([]);
        setPatientSearching(false);
        return;
      }

      setPatientSearching(true);

      try {
        const response = await getPatients({
          page: 1,
          limit: 8,
          search,
          status: "active",
        });

        if (!active) return;

        setPatientResults(getPatientRows(response));
      } catch {
        if (active) {
          setPatientResults([]);
        }
      } finally {
        if (active) {
          setPatientSearching(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [patientQuery]);

  // ==========================================================
  // FILTERED ROWS
  // ==========================================================

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return rows;
    }

    return rows.filter((appointment) => {
      const patientName = fullName(
        appointment.patientId,
      ).toLowerCase();

      const patientNumber =
        appointment.patientId?.patientNumber?.toLowerCase() || "";

      const phone =
        appointment.patientId?.phone?.toLowerCase() || "";

      return (
        patientName.includes(search) ||
        patientNumber.includes(search) ||
        phone.includes(search)
      );
    });
  }, [rows, query]);

  // ==========================================================
  // STATUS COUNTS
  // ==========================================================

  const counts = useMemo(() => {
    return Object.fromEntries(
      statusOptions.map((statusValue) => [
        statusValue,
        rows.filter(
          (row) => row.status === statusValue,
        ).length,
      ]),
    );
  }, [rows]);

  // ==========================================================
  // DATE NAVIGATION
  // ==========================================================

  const moveDate = (amount) => {
    const current = new Date(
      `${selectedDate}T12:00:00`,
    );

    current.setDate(
      current.getDate() + amount,
    );

    const next = dateKey(current);

    setSelectedDate(next);

    setForm((currentForm) => ({
      ...currentForm,
      appointmentDate: inputDateTime(next),
    }));
  };

  const selectToday = () => {
    const today = dateKey(new Date());

    setSelectedDate(today);

    setForm((currentForm) => ({
      ...currentForm,
      appointmentDate: inputDateTime(today),
    }));
  };

  const handleDateChange = (value) => {
    if (!value) return;

    setSelectedDate(value);

    setForm((currentForm) => ({
      ...currentForm,
      appointmentDate: inputDateTime(value),
    }));
  };

  // ==========================================================
  // PATIENT SELECTION
  // ==========================================================

  const selectPatient = (patient) => {
    setForm((current) => ({
      ...current,
      patientId: patient?._id || "",
    }));

    setPatientQuery(fullName(patient));

    setPatientResults([]);
  };

  // ==========================================================
  // REASSIGN CLINICIAN
  // ==========================================================

  const handleClinicianSelection = (
    appointmentId,
    clinicianValue,
  ) => {
    setSelectedClinicians((current) => ({
      ...current,
      [appointmentId]: clinicianValue,
    }));
  };

  const getSelectedClinician = (appointment) => {
    if (!appointment?._id) {
      return appointment?.clinicianId?._id || "";
    }

    if (
      Object.prototype.hasOwnProperty.call(
        selectedClinicians,
        appointment._id,
      )
    ) {
      return selectedClinicians[appointment._id];
    }

    return appointment?.clinicianId?._id || "";
  };

  const reassignClinician = async (appointment) => {
    if (!appointment?._id) return;

    const nextClinicianId =
      getSelectedClinician(appointment);

    const currentClinicianId =
      appointment?.clinicianId?._id || "";

    if (
      nextClinicianId === currentClinicianId
    ) {
      return;
    }

    setReassigningId(appointment._id);
    setError("");

    try {
      await updateAppointment(
        appointment._id,
        {
          clinicianId:
            nextClinicianId || null,
        },
      );

      setSelectedClinicians((current) => {
        const next = { ...current };

        delete next[appointment._id];

        return next;
      });

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to reassign clinician.",
      );
    } finally {
      setReassigningId("");
    }
  };

  // ==========================================================
  // RESET BOOKING FORM
  // ==========================================================

  const resetBookingForm = useCallback(
    () => {
      setBookingMode("existing");

      setPatientQuery("");
      setPatientResults([]);
      setPatientSearching(false);

      setForm({
        patientId: "",
        appointmentDate:
          inputDateTime(selectedDate),
        type: "Eye Examination",
        durationMinutes: 30,
        clinicianId: "",
        reason: "",
        notes: "",
      });

      setNewPatient({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "",
        phone: "",
        alternatePhone: "",
        email: "",
        source: "walk_in",
        notes: "",
      });
    },
    [selectedDate],
  );

  // ==========================================================
  // OPEN BOOKING MODAL
  // ==========================================================

  const openBookingModal = () => {
    setError("");

    resetBookingForm();

    setForm((current) => ({
      ...current,
      appointmentDate:
        inputDateTime(selectedDate),
    }));

    setShowForm(true);
  };

  // ==========================================================
  // CLOSE BOOKING MODAL
  // ==========================================================

  const closeBookingModal = () => {
    setShowForm(false);

    setPatientQuery("");
    setPatientResults([]);
    setPatientSearching(false);
  };

  // ==========================================================
  // SAVE APPOINTMENT
  // ==========================================================

  const save = async (event) => {
    event.preventDefault();

    setError("");

    try {
      let patientId = form.patientId;

      // ------------------------------------------------------
      // CREATE NEW PATIENT
      // ------------------------------------------------------

      if (bookingMode === "new") {
        if (
          !newPatient.firstName.trim() ||
          !newPatient.phone.trim()
        ) {
          throw new Error(
            "First name and phone number are required.",
          );
        }

        const created = await createPatient({
          firstName:
            newPatient.firstName.trim(),

          lastName:
            newPatient.lastName.trim(),

          dateOfBirth:
            newPatient.dateOfBirth || null,

          gender:
            newPatient.gender,

          phone:
            newPatient.phone.trim(),

          alternatePhone:
            newPatient.alternatePhone.trim(),

          email:
            newPatient.email
              .trim()
              .toLowerCase(),

          source:
            newPatient.source,

          notes:
            newPatient.notes.trim(),
        });

        patientId =
          created?.data?.patient?._id ||
          created?.data?._id ||
          created?.patient?._id ||
          null;

        if (!patientId) {
          throw new Error(
            "Patient was created but no patient ID was returned.",
          );
        }
      }

      // ------------------------------------------------------
      // EXISTING PATIENT VALIDATION
      // ------------------------------------------------------

      if (!patientId) {
        throw new Error(
          "Select an existing patient before booking.",
        );
      }

      // ------------------------------------------------------
      // CREATE APPOINTMENT
      // ------------------------------------------------------

      await createAppointment({
        ...form,
        patientId,
        durationMinutes: Number(
          form.durationMinutes,
        ),
      });

      // ------------------------------------------------------
      // RESET
      // ------------------------------------------------------

      setShowForm(false);

      resetBookingForm();

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to create appointment.",
      );
    }
  };

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <DocumentShell
      eyebrow="Front desk"
      title="Appointments"
      subtitle="A complete daily appointment register for patient flow, clinician scheduling and visit status."
      code="APPOINTMENTS"
      actions={
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw
              size={14}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openBookingModal}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus size={14} />
            Book Appointment
          </button>
        </div>
      }
    >
      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="rounded-lg p-1 text-red-400 transition hover:bg-red-100 hover:text-red-700"
            aria-label="Dismiss error"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* ======================================================
          DATE
      ======================================================= */}

      <Section
        number="01"
        title="Appointment date"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => moveDate(-1)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Previous day"
            >
              <ChevronLeft size={17} />
            </button>

            <label className="relative">
              <CalendarDays
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  handleDateChange(
                    event.target.value,
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-50"
              />
            </label>

            <button
              type="button"
              onClick={() => moveDate(1)}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Next day"
            >
              <ChevronRight size={17} />
            </button>

            <button
              type="button"
              onClick={selectToday}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Today
            </button>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">
              Selected day
            </div>

            <div className="mt-1 text-lg font-bold text-slate-900">
              {prettyDate(selectedDate)}
            </div>
          </div>
        </div>
      </Section>

      {/* ======================================================
          BOOKING MODAL
      ======================================================= */}

      {showForm && (
        <BookingModal
          bookingMode={bookingMode}
          setBookingMode={setBookingMode}
          form={form}
          setForm={setForm}
          newPatient={newPatient}
          setNewPatient={setNewPatient}
          clinicians={clinicians}
          patientQuery={patientQuery}
          setPatientQuery={setPatientQuery}
          patientResults={patientResults}
          setPatientResults={setPatientResults}
          patientSearching={patientSearching}
          selectPatient={selectPatient}
          save={save}
          onClose={closeBookingModal}
        />
      )}

      {/* ======================================================
          DAILY REGISTER
      ======================================================= */}

      <Section
        number={showForm ? "03" : "02"}
        title="Daily appointment register"
      >
        {/* FILTER BAR */}

        <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  load();
                }
              }}
              placeholder="Search patient, patient number or phone..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-50"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none transition focus:border-violet-300"
          >
            <option value="">
              All statuses
            </option>

            {statusOptions.map(
              (statusValue) => (
                <option
                  key={statusValue}
                  value={statusValue}
                >
                  {statusLabel(statusValue)}
                </option>
              ),
            )}
          </select>

          <select
            value={clinicianId}
            onChange={(event) =>
              setClinicianId(event.target.value)
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 outline-none transition focus:border-violet-300"
          >
            <option value="">
              All clinicians
            </option>

            {clinicians.map((clinician) => (
              <option
                key={clinician._id}
                value={clinician._id}
              >
                {fullName(clinician)}
              </option>
            ))}
          </select>
        </div>

        {/* LOADING */}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw
              size={24}
              className="animate-spin text-violet-500"
            />

            <p className="mt-3 text-sm font-semibold text-slate-600">
              Loading appointments...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Updating the daily register
            </p>
          </div>
        ) : filtered.length === 0 ? (
          /* EMPTY */

          <div className="py-16 text-center">
            <CalendarDays
              className="mx-auto text-slate-300"
              size={30}
            />

            <p className="mt-3 text-sm font-semibold text-slate-600">
              No appointments for this day
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Create an appointment or change the
              filters.
            </p>

            <button
              type="button"
              onClick={openBookingModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Plus size={14} />
              Book appointment
            </button>
          </div>
        ) : (
          /* TABLE */

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[1250px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">
                    Time
                  </th>

                  <th className="px-4 py-3">
                    Patient
                  </th>

                  <th className="px-4 py-3">
                    Visit
                  </th>

                  <th className="px-4 py-3">
                    Clinician
                  </th>

                  <th className="px-4 py-3">
                    Reason / Notes
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>

                  <th className="px-4 py-3">
                    Open
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((appointment) => {
                  const appointmentId =
                    appointment._id;

                  const selectedClinician =
                    getSelectedClinician(
                      appointment,
                    );

                  const currentClinician =
                    appointment
                      .clinicianId?._id || "";

                  const hasClinicianChange =
                    selectedClinician !==
                    currentClinician;

                  const isReassigning =
                    reassigningId ===
                    appointmentId;

                  return (
                    <tr
                      key={appointmentId}
                      className="border-b border-slate-100 last:border-0 transition hover:bg-slate-50/70"
                    >
                      {/* TIME */}

                      <td className="px-4 py-4">
                        <div className="text-sm font-bold text-slate-800">
                          {appointment.appointmentDate
                            ? new Date(
                                appointment.appointmentDate,
                              ).toLocaleTimeString(
                                "en-IN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "—"}
                        </div>

                        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock3 size={11} />

                          {appointment.durationMinutes ||
                            30}{" "}
                          min
                        </div>
                      </td>

                      {/* PATIENT */}

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              appointment.patientId?._id
                            ) {
                              navigate(
                                `/patients/${appointment.patientId._id}`,
                              );
                            }
                          }}
                          className="text-left"
                        >
                          <div className="text-sm font-semibold text-slate-900 transition hover:text-violet-700 hover:underline">
                            {fullName(
                              appointment.patientId,
                            ) ||
                              "Unknown patient"}
                          </div>

                          <div className="mt-1 text-[10px] text-slate-400">
                            {appointment.patientId
                              ?.patientNumber ||
                              "—"}{" "}
                            ·{" "}
                            {appointment.patientId
                              ?.phone ||
                              "No phone"}
                          </div>
                        </button>
                      </td>

                      {/* VISIT */}

                      <td className="px-4 py-4 text-sm text-slate-700">
                        <div className="font-semibold">
                          {appointment.type ||
                            "Eye Examination"}
                        </div>

                        {appointment.reason && (
                          <div className="mt-1 max-w-[160px] truncate text-[10px] text-slate-400">
                            {appointment.reason}
                          </div>
                        )}
                      </td>

                      {/* CLINICIAN */}

                      <td className="px-4 py-4">
                        <div className="min-w-[235px]">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                              <UserRound
                                size={14}
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-700">
                                {fullName(
                                  appointment.clinicianId,
                                ) ||
                                  "Unassigned"}
                              </div>

                              <div className="text-[10px] text-slate-400">
                                {appointment
                                  .clinicianId
                                  ?.role ||
                                  "No clinician assigned"}
                              </div>
                            </div>
                          </div>

                          {/* REASSIGNMENT */}

                          <div className="mt-2 flex items-center gap-1.5">
                            <select
                              value={
                                selectedClinician
                              }
                              onChange={(event) =>
                                handleClinicianSelection(
                                  appointmentId,
                                  event.target
                                    .value,
                                )
                              }
                              disabled={
                                isReassigning
                              }
                              className="h-8 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-600 outline-none transition focus:border-violet-300 focus:ring-2 focus:ring-violet-50 disabled:cursor-wait disabled:bg-slate-50 disabled:opacity-70"
                              aria-label={`Assign clinician for ${fullName(
                                appointment.patientId,
                              )}`}
                            >
                              <option value="">
                                Unassigned
                              </option>

                              {clinicians.map(
                                (clinician) => (
                                  <option
                                    key={
                                      clinician._id
                                    }
                                    value={
                                      clinician._id
                                    }
                                  >
                                    {fullName(
                                      clinician,
                                    )}{" "}
                                    ·{" "}
                                    {clinician.role ||
                                      "Clinician"}
                                  </option>
                                ),
                              )}
                            </select>

                            {hasClinicianChange &&
                              !isReassigning && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    reassignClinician(
                                      appointment,
                                    )
                                  }
                                  className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-[10px] font-bold text-white transition hover:bg-violet-700"
                                >
                                  Save
                                </button>
                              )}

                            {isReassigning && (
                              <span className="whitespace-nowrap text-[10px] font-semibold text-violet-600">
                                Saving...
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* REASON / NOTES */}

                      <td className="max-w-[260px] px-4 py-4">
                        <div className="text-xs font-medium text-slate-600">
                          {appointment.reason ||
                            "Routine visit"}
                        </div>

                        <div className="mt-1 truncate text-[10px] text-slate-400">
                          {appointment.notes ||
                            "No notes"}
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${
                            statusClass[
                              appointment.status
                            ] ||
                            statusClass.booked
                          }`}
                        >
                          {statusLabel(
                            appointment.status ||
                              "booked",
                          )}
                        </span>
                      </td>

                      {/* OPEN */}

                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/appointments/${appointmentId}`,
                            )
                          }
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                        >
                          Open record
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ======================================================
          WORKFLOW SUMMARY
      ======================================================= */}

      <Section
        number={showForm ? "04" : "03"}
        title="Daily workflow summary"
      >
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
          Appointment status is managed from the
          Dashboard only.
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
          {statusOptions.map((statusValue) => (
            <div
              key={statusValue}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {statusLabel(statusValue)}
              </div>

              <div className="mt-2 text-2xl font-bold text-slate-900">
                {counts[statusValue] || 0}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </DocumentShell>
  );
}

// ============================================================
// BOOKING MODAL
// ============================================================

function BookingModal({
  bookingMode,
  setBookingMode,
  form,
  setForm,
  newPatient,
  setNewPatient,
  clinicians,
  patientQuery,
  setPatientQuery,
  patientResults,
  setPatientResults,
  patientSearching,
  selectPatient,
  save,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}

        <header className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
                Appointment booking
              </div>

              <h2
                id="booking-modal-title"
                className="mt-1 text-xl font-bold tracking-tight text-slate-900"
              >
                Book Appointment
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Select the patient, schedule the
                visit, and assign a clinician.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* FORM */}

        <form
          onSubmit={save}
          className="min-h-0 overflow-y-auto"
        >
          <div className="grid xl:grid-cols-[1.05fr_1fr]">
            {/* ==================================================
                PATIENT
            =================================================== */}

            <section className="border-b border-slate-200 p-5 sm:p-6 xl:border-b-0 xl:border-r">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600">
                    Step 01
                  </div>

                  <h3 className="mt-1 text-base font-bold text-slate-900">
                    {bookingMode ===
                    "existing"
                      ? "Select existing patient"
                      : "Create new patient"}
                  </h3>
                </div>

                <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode(
                        "existing",
                      );

                      setPatientResults([]);
                    }}
                    className={`rounded-lg px-3 py-2 text-[10px] font-bold transition ${
                      bookingMode ===
                      "existing"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    Existing
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode("new");

                      setPatientQuery("");
                      setPatientResults([]);

                      setForm(
                        (current) => ({
                          ...current,
                          patientId: "",
                        }),
                      );
                    }}
                    className={`rounded-lg px-3 py-2 text-[10px] font-bold transition ${
                      bookingMode === "new"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "text-slate-500 hover:bg-white"
                    }`}
                  >
                    New
                  </button>
                </div>
              </div>

              {/* EXISTING PATIENT */}

              {bookingMode ===
              "existing" ? (
                <div>
                  <label className="block">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Search patient
                    </span>

                    <div className="relative">
                      <Search
                        size={15}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        required
                        autoFocus
                        value={patientQuery}
                        onChange={(event) => {
                          setPatientQuery(
                            event.target
                              .value,
                          );

                          setForm(
                            (current) => ({
                              ...current,
                              patientId: "",
                            }),
                          );
                        }}
                        placeholder="Name, phone or patient number"
                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-10 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-50"
                      />

                      {patientQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setPatientQuery(
                              "",
                            );

                            setPatientResults(
                              [],
                            );

                            setForm(
                              (current) => ({
                                ...current,
                                patientId: "",
                              }),
                            );
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                          aria-label="Clear patient search"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </label>

                  {/* RESULTS */}

                  {patientResults.length >
                    0 && (
                    <div className="mt-2 max-h-60 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg">
                      {patientResults.map(
                        (patient) => (
                          <button
                            type="button"
                            key={
                              patient._id
                            }
                            onClick={() =>
                              selectPatient(
                                patient,
                              )
                            }
                            className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-blue-50/60"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                              <UserRound
                                size={15}
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="truncate text-xs font-bold text-slate-800">
                                {fullName(
                                  patient,
                                ) ||
                                  "Unnamed patient"}
                              </div>

                              <div className="mt-0.5 truncate text-[10px] text-slate-400">
                                {patient.patientNumber ||
                                  "No number"}{" "}
                                ·{" "}
                                {patient.phone ||
                                  "No phone"}
                              </div>
                            </div>
                          </button>
                        ),
                      )}
                    </div>
                  )}

                  {/* SEARCHING */}

                  {patientSearching && (
                    <div className="mt-2 text-[10px] text-slate-400">
                      Searching patients...
                    </div>
                  )}

                  {/* SELECTED */}

                  {form.patientId ? (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Patient selected
                      </div>

                      <div className="mt-1 text-sm font-bold text-slate-900">
                        {patientQuery}
                      </div>

                      <div className="mt-1 text-[10px] text-emerald-700">
                        Existing patient is ready
                        for booking.
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                      <UserRound
                        className="mx-auto text-slate-300"
                        size={24}
                      />

                      <p className="mt-2 text-xs font-semibold text-slate-600">
                        Choose an existing
                        patient
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* NEW PATIENT */

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="First name"
                    value={
                      newPatient.firstName
                    }
                    required
                    onChange={(value) =>
                      setNewPatient(
                        (current) => ({
                          ...current,
                          firstName:
                            value,
                        }),
                      )
                    }
                  />

                  <Input
                    label="Surname"
                    value={
                      newPatient.lastName
                    }
                    onChange={(value) =>
                      setNewPatient(
                        (current) => ({
                          ...current,
                          lastName:
                            value,
                        }),
                      )
                    }
                  />

                  <Input
                    label="Date of birth"
                    type="date"
                    value={
                      newPatient.dateOfBirth
                    }
                    onChange={(value) =>
                      setNewPatient(
                        (current) => ({
                          ...current,
                          dateOfBirth:
                            value,
                        }),
                      )
                    }
                  />

                  <Input
                    label="Phone"
                    value={
                      newPatient.phone
                    }
                    required
                    onChange={(value) =>
                      setNewPatient(
                        (current) => ({
                          ...current,
                          phone: value,
                        }),
                      )
                    }
                  />

                  <Input
                    label="Alternate phone"
                    value={
                      newPatient.alternatePhone
                    }
                    onChange={(value) =>
                      setNewPatient(
                        (current) => ({
                          ...current,
                          alternatePhone:
                            value,
                        }),
                      )
                    }
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={
                      newPatient.email
                    }
                    onChange={(value) =>
                      setNewPatient(
                        (current) => ({
                          ...current,
                          email: value,
                        }),
                      )
                    }
                  />

                  <Select
                    label="Patient source"
                    value={
                      newPatient.source
                    }
                    onChange={(value) =>
                      setNewPatient(
                        (current) => ({
                          ...current,
                          source: value,
                        }),
                      )
                    }
                    options={[
                      [
                        "walk_in",
                        "Walk-in",
                      ],
                      [
                        "appointment",
                        "Appointment",
                      ],
                      [
                        "website",
                        "Website",
                      ],
                      [
                        "referral",
                        "Referral",
                      ],
                      [
                        "campaign",
                        "Campaign",
                      ],
                      [
                        "other",
                        "Other",
                      ],
                    ]}
                  />

                  <Input
                    label="Gender"
                    value={
                      newPatient.gender
                    }
                    onChange={(value) =>
                      setNewPatient(
                        (current) => ({
                          ...current,
                          gender: value,
                        }),
                      )
                    }
                  />

                  <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Patient notes
                    </span>

                    <textarea
                      rows={4}
                      value={
                        newPatient.notes
                      }
                      onChange={(event) =>
                        setNewPatient(
                          (current) => ({
                            ...current,
                            notes:
                              event.target
                                .value,
                          }),
                        )
                      }
                      className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-50"
                      placeholder="Front-desk notes or communication instructions..."
                    />
                  </label>
                </div>
              )}
            </section>

            {/* ==================================================
                VISIT DETAILS
            =================================================== */}

            <section className="p-5 sm:p-6">
              <div className="mb-5">
                <div className="text-[10px] font-bold uppercase tracking-[.18em] text-violet-600">
                  Step 02
                </div>

                <h3 className="mt-1 text-base font-bold text-slate-900">
                  Visit details
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Date & time"
                  type="datetime-local"
                  value={
                    form.appointmentDate
                  }
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        appointmentDate:
                          value,
                      }),
                    )
                  }
                  required
                />

                <Field
                  label="Duration (minutes)"
                  type="number"
                  min="5"
                  step="5"
                  value={
                    form.durationMinutes
                  }
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        durationMinutes:
                          value,
                      }),
                    )
                  }
                  required
                />

                <Field
                  label="Visit type"
                  value={form.type}
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        type: value,
                      }),
                    )
                  }
                  required
                />

                <label className="block">
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Clinician
                  </span>

                  <select
                    value={form.clinicianId}
                    onChange={(event) =>
                      setForm(
                        (current) => ({
                          ...current,
                          clinicianId:
                            event.target
                              .value,
                        }),
                      )
                    }
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-50"
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {clinicians.map(
                      (clinician) => (
                        <option
                          key={
                            clinician._id
                          }
                          value={
                            clinician._id
                          }
                        >
                          {fullName(
                            clinician,
                          )}{" "}
                          ·{" "}
                          {clinician.role ||
                            "Clinician"}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <Field
                  label="Reason for visit"
                  value={form.reason}
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        reason: value,
                      }),
                    )
                  }
                  placeholder="Routine eye examination"
                />

                <div className="rounded-xl border border-violet-100 bg-violet-50/70 px-3 py-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                    Assignment
                  </div>

                  <div className="mt-1 text-xs font-semibold text-slate-700">
                    {form.clinicianId
                      ? "Clinician assigned"
                      : "Appointment will remain unassigned"}
                  </div>
                </div>

                <Field
                  className="sm:col-span-2"
                  label="Appointment notes"
                  type="textarea"
                  value={form.notes}
                  onChange={(value) =>
                    setForm(
                      (current) => ({
                        ...current,
                        notes: value,
                      }),
                    )
                  }
                  placeholder="Front-desk instructions, patient requests or preparation notes..."
                />
              </div>
            </section>
          </div>

          {/* FOOTER */}

          <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span className="text-[10px] text-slate-400">
              Verify patient, time and clinician
              before booking.
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-violet-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-slate-800 hover:to-violet-600"
              >
                <CalendarDays size={14} />
                Book Appointment
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// INPUT
// ============================================================

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-50"
      />
    </label>
  );
}

// ============================================================
// SELECT
// ============================================================

function Select({
  label,
  value,
  onChange,
  options,
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-50"
      >
        {options.map(
          ([valueOption, labelOption]) => (
            <option
              key={valueOption}
              value={valueOption}
            >
              {labelOption}
            </option>
          ),
        )}
      </select>
    </label>
  );
}