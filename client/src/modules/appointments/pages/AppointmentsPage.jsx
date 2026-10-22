import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
  RefreshCw,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getPatients, createPatient } from "../../patients/patient.api";

import {
  getAppointments,
  getAppointmentClinicians,
  createAppointment,
  updateAppointment,
} from "../appointment.api";

// ============================================================
// CONSTANTS
// ============================================================

const appointmentTypeOptions = [
  ["Comprehensive", "Comprehensive"],
  ["Short consult", "Short consult"],
  ["Contact lens evaluation", "Contact lens evaluation"],
  ["Binocular vision evaluation", "Binocular vision evaluation"],
  ["Pediatric eye test", "Pediatric eye test"],
  ["Vision therapy", "Vision therapy"],
];

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
  const [searchParams, setSearchParams] = useSearchParams();

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
    type: "Comprehensive",
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
        type: "Comprehensive",
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

  // /appointments/book and dashboard Book Appointment both land on
  // this page so the application has one booking workflow and one UI.
  useEffect(() => {
    if (searchParams.get("book") !== "1") return;

    const timer = window.setTimeout(() => {
      resetBookingForm();
      setForm((current) => ({
        ...current,
        appointmentDate: inputDateTime(selectedDate),
      }));
      setShowForm(true);

      const next = new URLSearchParams(searchParams);
      next.delete("book");
      setSearchParams(next, { replace: true });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [searchParams, selectedDate, resetBookingForm, setSearchParams]);

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
    <div className="mx-auto w-full max-w-[1700px] space-y-5 pb-8 pt-6">
      <div className="space-y-5">
        <header className="relative isolate overflow-hidden rounded-[26px] border border-slate-200/80 bg-white px-5 py-6 shadow-[0_4px_24px_rgba(15,23,42,0.045)] sm:px-7 sm:py-7">
          <div className="pointer-events-none absolute -right-10 -top-14 -z-10 h-48 w-48 rounded-full bg-violet-100/70 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-[26%] -z-10 h-32 w-32 rounded-full bg-blue-50 blur-3xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-200 sm:flex">
                <CalendarDays size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-700">
                    Front desk · Scheduling
                  </div>
                </div>
                <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-950 sm:text-[27px]">
                  Appointments
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  A clear view of your clinic schedule, bookings and clinician assignments.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={openBookingModal}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-violet-700"
            >
              <Plus size={15} />
              Book appointment
            </button>
            </div>
          </div>
        </header>

        {/* DAILY OVERVIEW */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewMetric
            icon={CalendarDays}
            label="Appointments in view"
            value={filtered.length}
            caption="For the selected date and filters"
            tone="violet"
          />
          <OverviewMetric
            icon={CheckCircle2}
            label="Confirmed"
            value={counts.confirmed || 0}
            caption="Confirmed bookings"
            tone="blue"
          />
          <OverviewMetric
            icon={Clock3}
            label="In clinic"
            value={(counts.here || 0) + (counts.examining || 0)}
            caption="Arrived or being examined"
            tone="amber"
          />
          <OverviewMetric
            icon={CheckCircle2}
            label="Completed"
            value={counts.complete || 0}
            caption="Visits marked complete"
            tone="emerald"
          />
        </section>

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-sm">
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
        title="Schedule controls"
        description="Choose a day to review, create or manage appointments."
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

          <div className="min-w-[245px] rounded-2xl border border-violet-100/80 bg-gradient-to-r from-violet-50/80 to-blue-50/60 px-4 py-3.5">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-violet-600">
              Selected day
            </div>
            <div className="mt-1 text-sm font-extrabold text-slate-900 sm:text-base">
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
        number="02"
        title="Daily appointment register"
        description={`${prettyDate(selectedDate)} · ${filtered.length} appointment${filtered.length === 1 ? "" : "s"} shown`}
      >
        {/* FILTER BAR */}

        <div className="mb-5 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-4 lg:grid-cols-[minmax(260px,1fr)_210px_230px]">
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
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
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
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 outline-none transition hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
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

          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-12 text-center">
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
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-violet-700 hover:to-blue-700"
            >
              <Plus size={14} />
              Book appointment
            </button>
          </div>
        ) : (
          /* TABLE */

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="w-full min-w-[1180px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
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
                      className="border-b border-slate-100 last:border-0 transition-colors hover:bg-violet-50/30"
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
        number="03"
        title="Appointment status"
        description="A quick breakdown of the current schedule by workflow status."
      >
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/80 px-4 py-3 text-xs leading-5 text-blue-700">
          Appointment status is managed from the
          Dashboard only.
        </div>

        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
          {statusOptions.map((statusValue) => (
            <div
              key={statusValue}
              className="rounded-xl border border-slate-200/80 bg-white p-3.5 transition hover:border-violet-200 hover:bg-violet-50/20"
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {statusLabel(statusValue)}
              </div>

              <div className="mt-1.5 text-xl font-extrabold tabular-nums text-slate-900">
                {counts[statusValue] || 0}
              </div>
            </div>
          ))}
        </div>
      </Section>
      </div>
    </div>
  );
}

// ============================================================
// LOCAL UI HELPERS
// ============================================================

function OverviewMetric({ icon: Icon, label, value, caption, tone = "violet" }) {
  const toneStyles = {
    violet: { icon: "bg-violet-50 text-violet-700", line: "bg-violet-500" },
    blue: { icon: "bg-blue-50 text-blue-700", line: "bg-blue-500" },
    amber: { icon: "bg-amber-50 text-amber-700", line: "bg-amber-500" },
    emerald: { icon: "bg-emerald-50 text-emerald-700", line: "bg-emerald-500" },
  };
  const style = toneStyles[tone] || toneStyles.violet;

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_2px_12px_rgba(15,23,42,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_28px_rgba(15,23,42,0.07)]">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-500">
          {label}
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.icon}`}>
          <Icon size={17} strokeWidth={2} />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-black tracking-tight tabular-nums text-slate-950">{value}</span>
        <span className="text-[10px] font-semibold text-slate-400">visits</span>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-slate-500">{caption}</p>
      <div className={`absolute inset-x-0 bottom-0 h-[2px] opacity-60 ${style.line}`} />
    </article>
  );
}

function Section({ number, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-[22px] border border-slate-200/90 bg-white shadow-[0_3px_18px_rgba(15,23,42,0.035)]">
      <header className="border-b border-slate-100 bg-slate-50/55 px-5 py-4 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 min-w-7 items-center justify-center rounded-lg bg-violet-50 px-1.5 text-[10px] font-black text-violet-600 ring-1 ring-violet-100">
            {number}
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-black tracking-tight text-slate-900 sm:text-base">
              {title}
            </h2>
            {description && (
              <p className="mt-1.5 max-w-xl text-sm leading-5 text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>
      </header>
      <div className="p-4 sm:p-5 lg:p-6">{children}</div>
    </section>
  );
}

function Field({
  label: title,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  max,
  step,
  placeholder,
  className = "",
}) {
  const controlClassName =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50";

  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {title}{required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {type === "textarea" ? (
        <textarea
          required={required}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`${controlClassName} min-h-[104px] resize-y py-3 leading-5`}
        />
      ) : (
        <input
          required={required}
          type={type}
          min={min}
          max={max}
          step={step}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`${controlClassName} h-11`}
        />
      )}
    </label>
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
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-2 backdrop-blur-md sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_30px_100px_rgba(2,6,23,0.28)]">
        {/* HEADER */}

        <header className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-violet-50/90 via-white to-blue-50/80 px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-violet-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Appointment booking
              </div>

              <h2
                id="booking-modal-title"
                className="mt-1 text-2xl font-black tracking-tight text-slate-950"
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

            <section className="border-b border-slate-200 bg-slate-50/45 p-5 sm:p-6 lg:p-7 xl:border-b-0 xl:border-r">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[.18em] text-blue-600">
                    Step 01 · Patient
                  </div>

                  <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900">
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
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
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

            <section className="p-5 sm:p-6 lg:p-7">
              <div className="mb-5">
                <div className="text-[10px] font-black uppercase tracking-[.18em] text-violet-600">
                  Step 02 · Schedule
                </div>

                <h3 className="mt-1 text-lg font-black tracking-tight text-slate-900">
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

                <Select
                  label="Visit type"
                  value={form.type}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      type: value,
                    }))
                  }
                  options={appointmentTypeOptions}
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

          <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-7">
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
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-violet-100 transition hover:from-violet-700 hover:to-blue-700"
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
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
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
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
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