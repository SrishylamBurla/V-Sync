import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock3,
  ContactRound,
  Glasses,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Users,
  ClipboardList,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { canAccessModule } from "../../config/access";

import { getAppointments, updateAppointment } from "../appointments/appointment.api";
import { getDispensingList } from "../optical/spectacle.api";
import { getContactLenses } from "../contactLenses/contactLens.api";
import { getSundryJobs } from "../dispensing/sundryJob.api";
import { getConsultations, updateConsultationStatus } from "../clinical/consultation.api";

const PAGE_SIZE = 10;

const APPOINTMENT_STATUS = {
  booked: "Booked",
  confirmed: "Confirmed",
  here: "Here",
  examining: "Examining",
  complete: "Complete",
  cancelled: "Cancelled",
  no_show: "No show",
};

const APPOINTMENT_STATUS_CLASS = {
  booked: "bg-slate-100 text-slate-600",
  confirmed: "bg-blue-50 text-blue-700",
  here: "bg-amber-50 text-amber-700",
  examining: "bg-violet-50 text-violet-700",
  complete: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-orange-50 text-orange-700",
};

const CONSULTATION_STATUS_OPTIONS = [
  ["draft", "Draft"],
  ["in_progress", "In progress"],
  ["completed", "Completed"],
  ["cancelled", "Cancelled"],
];

const getConsultationStatusClass = (status) => {
  switch (normalizeStatus(status)) {
    case "draft":
      return "bg-slate-100 text-slate-600";
    case "in_progress":
      return "bg-blue-50 text-blue-700";
    case "completed":
      return "bg-emerald-50 text-emerald-700";
    case "cancelled":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

const consultationStatusLabel = (status) => {
  const value = normalizeStatus(status);
  return (
    CONSULTATION_STATUS_OPTIONS.find(([key]) => key === value)?.[1] ||
    (value ? value.replaceAll("_", " ") : "Completed")
  );
};


const DISPENSING_CATEGORY = {
  all: {
    label: "All",
    shortLabel: "All",
    icon: PackageCheck,
  },
  spectacles: {
    label: "Spectacles",
    shortLabel: "Spectacles",
    icon: Glasses,
  },
  contact_lenses: {
    label: "Contact lenses",
    shortLabel: "Contact",
    icon: ContactRound,
  },
  sundries: {
    label: "Sundry",
    shortLabel: "Sundry",
    icon: ShoppingBag,
  },
};

const DISPENSING_STATUS_OPTIONS = [
  ["", "All statuses"],
  ["draft", "Draft"],
  ["ordered", "Ordered"],
  ["not_ready", "Not ready"],
  ["ready", "Ready"],
  ["notified", "Notified"],
  ["collected", "Collected"],
  ["cancelled", "Cancelled"],
  ["dispensed", "Dispensed"],
  ["delivered", "Delivered"],
];

const dateKey = (date) => {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "";
  }

  return `${value.getFullYear()}-${String(
    value.getMonth() + 1,
  ).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};

const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatShortDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fullName = (person) =>
  [
    person?.firstName,
    person?.middleName,
    person?.lastName,
  ]
    .filter(Boolean)
    .join(" ") || "Unknown patient";

const normalizeList = (response, keys = []) => {
  if (Array.isArray(response?.data)) return response.data;

  for (const key of keys) {
    if (Array.isArray(response?.data?.[key])) {
      return response.data[key];
    }
  }

  const fallbackKey = keys[0];

  if (
    fallbackKey &&
    Array.isArray(response?.[fallbackKey])
  ) {
    return response[fallbackKey];
  }

  return [];
};

const normalizeStatus = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const consultationTypeLabel = (value) =>
  String(value || "consultation")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getPatientFromRecord = (record) =>
  record?.patientId ||
  record?.patient ||
  {};

const getPatientNumber = (record) => {
  const patient = getPatientFromRecord(record);

  return (
    patient?.patientNumber ||
    patient?.patientNo ||
    record?.patientNumber ||
    "No patient number"
  );
};

const getRecordDate = (record) =>
  record?.updatedAt ||
  record?.createdAt ||
  record?.jobDate ||
  record?.orderDate ||
  record?.orderDateTime ||
  record?.dueDate ||
  record?.specDueDate ||
  record?.appointmentDate;

const getRecordDueDate = (record) =>
  record?.specDueDate ||
  record?.dueDate ||
  record?.labDueDate ||
  record?.expectedDate ||
  record?.deliveryDate;

const getRecordNumber = (record) =>
  record?.jobNumber ||
  record?.jobNo ||
  record?.orderNumber ||
  record?.orderNo ||
  record?.recordNumber ||
  record?._id?.slice(-8) ||
  "—";

const getSundryItem = (record) =>
  record?.item ||
  record?.inventoryItem ||
  record?.inventoryItemId ||
  {};

const getRecordItem = (record, category) => {
  if (category === "spectacles") {
    return (
      record?.frame?.code ||
      record?.frame?.description ||
      record?.frameItemId?.code ||
      record?.frameItemId?.description ||
      "Spectacle"
    );
  }

  if (category === "contact_lenses") {
    return (
      record?.item?.code ||
      record?.item?.description ||
      record?.lens?.code ||
      record?.lens?.description ||
      record?.contactLens?.code ||
      record?.contactLens?.description ||
      record?.lensCode ||
      "Contact lens"
    );
  }

  const item = getSundryItem(record);

  return (
    item?.code ||
    item?.description ||
    item?.name ||
    record?.itemName ||
    "Sundry"
  );
};

const getRecordSecondary = (record, category) => {
  if (category === "spectacles") {
    return (
      record?.frame?.brand ||
      record?.frame?.model ||
      record?.frame?.size ||
      "Spectacle dispensing"
    );
  }

  if (category === "contact_lenses") {
    return (
      record?.item?.brand ||
      record?.item?.model ||
      record?.contactLens?.brand ||
      record?.contactLens?.model ||
      "Contact-lens dispensing"
    );
  }

  const item = getSundryItem(record);

  return (
    item?.brand ||
    item?.model ||
    `${record?.quantity || 1} item`
  );
};

const getCategoryLabel = (category) =>
  DISPENSING_CATEGORY[category]?.label ||
  "Dispensing";

const normalizeDispensingRecord = (
  record,
  category,
) => ({
  ...record,
  _dashboardCategory: category,
  _dashboardCategoryLabel:
    getCategoryLabel(category),
  _dashboardDate: getRecordDate(record),
  _dashboardDueDate:
    getRecordDueDate(record),
  _dashboardPatient:
    getPatientFromRecord(record),
  _dashboardPatientName:
    fullName(getPatientFromRecord(record)),
  _dashboardPatientNumber:
    getPatientNumber(record),
  _dashboardNumber:
    getRecordNumber(record),
  _dashboardItem:
    getRecordItem(
      record,
      category,
    ),
  _dashboardSecondary:
    getRecordSecondary(
      record,
      category,
    ),
  _dashboardStatus:
    normalizeStatus(
      record?.status,
    ),
});

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const today = dateKey(new Date());
  const role = user?.role;

  const canAppointments = canAccessModule(
    "appointments",
    role,
  );
  const canPatients = canAccessModule(
    "patients",
    role,
  );
  const canClinical = canAccessModule(
    "clinical",
    role,
  );
  const canDispensing = canAccessModule(
    "dispensing",
    role,
  );
  const canInventory = canAccessModule(
    "inventory",
    role,
  );
  const canBilling = canAccessModule(
    "billing",
    role,
  );

  const [
    appointments,
    setAppointments,
  ] = useState([]);

  const [
    spectacleJobs,
    setSpectacleJobs,
  ] = useState([]);

  const [
    contactOrders,
    setContactOrders,
  ] = useState([]);

  const [
    sundryJobs,
    setSundryJobs,
  ] = useState([]);

  const [consultations, setConsultations] = useState([]);

  const [dispensingPage, setDispensingPage] = useState(1);
  const [consultationsPage, setConsultationsPage] = useState(1);

  const [
    appointmentsLoading,
    setAppointmentsLoading,
  ] = useState(true);

  const [
    dispensingLoading,
    setDispensingLoading,
  ] = useState(true);

  const [consultationsLoading, setConsultationsLoading] = useState(true);
  const [updatingAppointmentId, setUpdatingAppointmentId] = useState("");
  const [updatingConsultationId, setUpdatingConsultationId] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  const [
    dispensingCategory,
    setDispensingCategory,
  ] = useState("all");

  const [
    dispensingStatus,
    setDispensingStatus,
  ] = useState("");

  const [
    dispensingSearch,
    setDispensingSearch,
  ] = useState("");

  const loadAppointments =
    useCallback(async () => {
      if (!canAppointments) {
        setAppointments([]);
        setAppointmentsLoading(false);
        return;
      }

      setAppointmentsLoading(true);

      try {
        const response =
          await getAppointments({
            date: today,
          });

        setAppointments(
          normalizeList(
            response,
            ["appointments"],
          ),
        );
      } catch (err) {
        setAppointments([]);

        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to load today's appointments.",
        );
      } finally {
        setAppointmentsLoading(false);
      }
    }, [canAppointments, today]);

  // Appointment status is intentionally editable from the dashboard only.
  const updateDashboardAppointmentStatus = useCallback(
    async (appointmentId, nextStatus, previousStatus) => {
      if (!appointmentId || !nextStatus || nextStatus === previousStatus) return;

      setUpdatingAppointmentId(appointmentId);
      setError("");

      // Update the visible row immediately; roll it back if the server rejects the change.
      setAppointments((current) =>
        current.map((item) =>
          item._id === appointmentId
            ? { ...item, status: nextStatus }
            : item,
        ),
      );

      try {
        const response = await updateAppointment(appointmentId, {
          status: nextStatus,
          statusNote: `Status changed from ${previousStatus || "booked"} to ${nextStatus} from the dashboard`,
        });
        const updated = response?.data?.appointment ?? response?.data ?? response?.appointment ?? response;

        setAppointments((current) =>
          current.map((item) =>
            item._id === appointmentId
              ? {
                  ...item,
                  ...(updated && typeof updated === "object" && updated._id === appointmentId ? updated : {}),
                  status: nextStatus,
                }
              : item,
          ),
        );
      } catch (err) {
        setAppointments((current) =>
          current.map((item) =>
            item._id === appointmentId
              ? { ...item, status: previousStatus || "booked" }
              : item,
          ),
        );
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to update appointment status.",
        );
      } finally {
        setUpdatingAppointmentId("");
      }
    },
    [],
  );

  const loadConsultations = useCallback(async () => {
    if (!canClinical) {
      setConsultations([]);
      setConsultationsLoading(false);
      return;
    }

    setConsultationsLoading(true);

    try {
      const response = await getConsultations({
        page: 1,
        limit: 50,
      });

      const data = response?.data ?? response;
      setConsultations(
        Array.isArray(data?.consultations)
          ? data.consultations
          : Array.isArray(data)
            ? data
            : Array.isArray(response?.consultations)
              ? response.consultations
              : [],
      );
    } catch (err) {
      setConsultations([]);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load consultations.",
      );
    } finally {
      setConsultationsLoading(false);
    }
  }, [canClinical]);

  const updateDashboardConsultationStatus = useCallback(
    async (consultationId, nextStatus) => {
      if (!consultationId || !nextStatus) return;

      setUpdatingConsultationId(consultationId);
      setError("");

      try {
        const response = await updateConsultationStatus(
          consultationId,
          nextStatus,
        );

        const updated = response?.data ?? response;
        setConsultations((current) =>
          current.map((item) =>
            item._id === consultationId
              ? updated || { ...item, status: nextStatus }
              : item,
          ),
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to update consultation status.",
        );
      } finally {
        setUpdatingConsultationId("");
      }
    },
    [],
  );

  const loadDispensing =
    useCallback(async () => {
      if (!canDispensing) {
        setSpectacleJobs([]);
        setContactOrders([]);
        setSundryJobs([]);
        setDispensingLoading(false);
        return;
      }

      setDispensingLoading(true);

      const [
        spectaclesResult,
        contactsResult,
        sundriesResult,
      ] = await Promise.allSettled([
        getDispensingList({
          page: 1,
          limit: 50,
        }),
        getContactLenses({
          page: 1,
          limit: 50,
        }),
        getSundryJobs({
          page: 1,
          limit: 50,
        }),
      ]);

      if (
        spectaclesResult.status ===
        "fulfilled"
      ) {
        setSpectacleJobs(
          normalizeList(
            spectaclesResult.value,
            [
              "spectacles",
              "jobs",
            ],
          ),
        );
      } else {
        setSpectacleJobs([]);
      }

      if (
        contactsResult.status ===
        "fulfilled"
      ) {
        setContactOrders(
          normalizeList(
            contactsResult.value,
            [
              "contactLenses",
              "orders",
              "jobs",
            ],
          ),
        );
      } else {
        setContactOrders([]);
      }

      if (
        sundriesResult.status ===
        "fulfilled"
      ) {
        setSundryJobs(
          normalizeList(
            sundriesResult.value,
            [
              "sundryJobs",
              "jobs",
            ],
          ),
        );
      } else {
        setSundryJobs([]);
      }

      const failures = [
        spectaclesResult,
        contactsResult,
        sundriesResult,
      ].filter(
        (result) =>
          result.status ===
          "rejected",
      );

      if (failures.length) {
        const failure =
          failures[0]?.reason;

        setError(
          failure?.response?.data
            ?.message ||
            failure?.message ||
            "Some dispensing information could not be loaded.",
        );
      }

      setDispensingLoading(false);
    }, [canDispensing]);

  const refresh =
    useCallback(async () => {
      setError("");

      await Promise.all([
        loadAppointments(),
        loadDispensing(),
        loadConsultations(),
      ]);
    }, [
      loadAppointments,
      loadDispensing,
      loadConsultations,
    ]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        void refresh();
      }, 0);

    return () =>
      window.clearTimeout(timer);
  }, [refresh]);

  const appointmentCounts =
    useMemo(() => {
      const total =
        appointments.length;

      return {
        total,

        waiting:
          appointments.filter(
            (item) =>
              [
                "booked",
                "confirmed",
                "here",
              ].includes(
                normalizeStatus(
                  item.status,
                ),
              ),
          ).length,

        examining:
          appointments.filter(
            (item) =>
              normalizeStatus(
                item.status,
              ) === "examining",
          ).length,

        completed:
          appointments.filter(
            (item) =>
              normalizeStatus(
                item.status,
              ) === "complete",
          ).length,

        cancelled:
          appointments.filter(
            (item) =>
              [
                "cancelled",
                "no_show",
              ].includes(
                normalizeStatus(
                  item.status,
                ),
              ),
          ).length,
      };
    }, [appointments]);

  const spectacleCounts =
    useMemo(() => {
      const open =
        spectacleJobs.filter(
          (job) =>
            ![
              "collected",
              "cancelled",
            ].includes(
              normalizeStatus(
                job.status,
              ),
            ),
        );

      return {
        total:
          spectacleJobs.length,

        open: open.length,

        ready:
          spectacleJobs.filter(
            (job) =>
              normalizeStatus(
                job.status,
              ) === "ready",
          ).length,

        notified:
          spectacleJobs.filter(
            (job) =>
              normalizeStatus(
                job.status,
              ) === "notified",
          ).length,
      };
    }, [spectacleJobs]);

  const contactCounts =
    useMemo(() => {
      const closedStatuses =
        [
          "collected",
          "cancelled",
          "dispensed",
          "delivered",
        ];

      const readyStatuses =
        [
          "ready",
          "collected",
          "dispensed",
          "delivered",
        ];

      return {
        total:
          contactOrders.length,

        open:
          contactOrders.filter(
            (job) =>
              !closedStatuses.includes(
                normalizeStatus(
                  job.status,
                ),
              ),
          ).length,

        ready:
          contactOrders.filter(
            (job) =>
              readyStatuses.includes(
                normalizeStatus(
                  job.status,
                ),
              ),
          ).length,
      };
    }, [contactOrders]);

  const sundryCounts =
    useMemo(() => {
      const closedStatuses =
        [
          "collected",
          "cancelled",
        ];

      const open =
        sundryJobs.filter(
          (job) =>
            !closedStatuses.includes(
              normalizeStatus(
                job.status,
              ),
            ),
        );

      return {
        total:
          sundryJobs.length,

        open:
          open.length,

        ready:
          sundryJobs.filter(
            (job) =>
              normalizeStatus(
                job.status,
              ) === "ready",
          ).length,

        notified:
          sundryJobs.filter(
            (job) =>
              normalizeStatus(
                job.status,
              ) === "notified",
          ).length,
      };
    }, [sundryJobs]);

  const upcomingAppointments =
    useMemo(
      () =>
        [...appointments]
          .sort(
            (a, b) =>
              new Date(
                a.appointmentDate,
              ).getTime() -
              new Date(
                b.appointmentDate,
              ).getTime(),
          )
          .slice(0, 8),
      [appointments],
    );

  const dispensingRecords =
    useMemo(() => {
      const records = [
        ...spectacleJobs.map(
          (job) =>
            normalizeDispensingRecord(
              job,
              "spectacles",
            ),
        ),

        ...contactOrders.map(
          (job) =>
            normalizeDispensingRecord(
              job,
              "contact_lenses",
            ),
        ),

        ...sundryJobs.map(
          (job) =>
            normalizeDispensingRecord(
              job,
              "sundries",
            ),
        ),
      ];

      const filteredByCategory =
        dispensingCategory ===
        "all"
          ? records
          : records.filter(
              (record) =>
                record._dashboardCategory ===
                dispensingCategory,
            );

      const filteredByStatus =
        dispensingStatus
          ? filteredByCategory.filter(
              (record) =>
                record._dashboardStatus ===
                dispensingStatus,
            )
          : filteredByCategory;

      const search =
        dispensingSearch
          .trim()
          .toLowerCase();

      const filteredBySearch =
        search
          ? filteredByStatus.filter(
              (record) =>
                [
                  record._dashboardNumber,
                  record._dashboardItem,
                  record._dashboardSecondary,
                  record._dashboardPatientName,
                  record._dashboardPatientNumber,
                  record._dashboardStatus,
                ]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase()
                  .includes(search),
            )
          : filteredByStatus;

      return filteredBySearch.sort(
        (a, b) =>
          new Date(
            b._dashboardDate,
          ).getTime() -
          new Date(
            a._dashboardDate,
          ).getTime(),
      );
    }, [
      spectacleJobs,
      contactOrders,
      sundryJobs,
      dispensingCategory,
      dispensingStatus,
      dispensingSearch,
    ]);

  const dispensingPageCount = Math.max(
    1,
    Math.ceil(
      dispensingRecords.length / PAGE_SIZE,
    ),
  );

  const consultationsPageCount = Math.max(
    1,
    Math.ceil(
      consultations.length / PAGE_SIZE,
    ),
  );

  useEffect(() => {
    setDispensingPage(1);
  }, [
    dispensingCategory,
    dispensingStatus,
    dispensingSearch,
  ]);

  useEffect(() => {
    setDispensingPage((current) =>
      Math.min(
        current,
        dispensingPageCount,
      ),
    );
  }, [dispensingPageCount]);

  useEffect(() => {
    setConsultationsPage((current) =>
      Math.min(
        current,
        consultationsPageCount,
      ),
    );
  }, [consultationsPageCount]);

  const visibleDispensingRecords =
    useMemo(() => {
      const start =
        (dispensingPage - 1) *
        PAGE_SIZE;

      return dispensingRecords.slice(
        start,
        start + PAGE_SIZE,
      );
    }, [
      dispensingRecords,
      dispensingPage,
    ]);

  const visibleConsultations =
    useMemo(() => {
      const start =
        (consultationsPage - 1) *
        PAGE_SIZE;

      return consultations.slice(
        start,
        start + PAGE_SIZE,
      );
    }, [
      consultations,
      consultationsPage,
    ]);

  const quickActions = [
    canAppointments && {
      icon: CalendarClock,
      label: "Appointments",
      description:
        "Open today's schedule and booking workflow.",
      onClick: () =>
        navigate("/appointments"),
    },

    canPatients && {
      icon: Users,
      label: "Patients",
      description:
        "Search records and open patient workspaces.",
      onClick: () =>
        navigate("/patients"),
    },

    canClinical && {
      icon: Activity,
      label: "Clinical",
      description:
        "Open consultation and examination workflow.",
      onClick: () =>
        navigate("/clinical"),
    },

    canDispensing && {
      icon: Glasses,
      label: "Dispensing",
      description:
        "Manage spectacle, contact-lens and sundry jobs.",
      onClick: () =>
        navigate("/dispensing"),
    },

    canInventory && {
      icon: PackageCheck,
      label: "Inventory",
      description:
        "Review stock and catalogue operations.",
      onClick: () =>
        navigate("/inventory"),
    },

    canBilling && {
      icon: CheckCircle2,
      label: "Billing",
      description:
        "Open invoices, payments and billing.",
      onClick: () =>
        navigate("/billing"),
    },
  ].filter(Boolean);

  const clearDispensingFilters =
    () => {
      setDispensingCategory("all");
      setDispensingStatus("");
      setDispensingSearch("");
    };

  return (
    <div className="py-3 sm:py-3">
      <div className="space-y-3 sm:space-y-3">
        {/* SINGLE PAGE HEADING */}
        <header className="flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-[0_6px_24px_rgba(15,23,42,0.035)] sm:flex-row sm:items-center sm:justify-between sm:px-3">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.18em] text-violet-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Practice dashboard
            </div>

            <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Dashboard
              </h1>

              <span className="text-xs font-medium text-slate-500">
                {formatDate(
                  new Date(),
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                void refresh()
              }
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw
                size={14}
                className={
                  appointmentsLoading ||
                  dispensingLoading ||
                  consultationsLoading
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>

            {canAppointments && (
              <button
                type="button"
                onClick={() =>
                  navigate("/appointments?book=1")
                }
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-blue-700 px-3 text-xs font-bold text-white shadow-sm shadow-violet-100 transition hover:from-violet-800 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-violet-100"
              >
                <Plus size={14} />
                Book Appointment
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-800">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
              className="rounded-lg p-1 text-amber-600 hover:bg-amber-100"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        )}

        {/* KPI STRIP */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric
            icon={CalendarClock}
            label="Appointments"
            value={
              appointmentsLoading
                ? "—"
                : appointmentCounts.total
            }
            note={`${appointmentCounts.completed} completed today`}
            onClick={() =>
              navigate(
                "/appointments",
              )
            }
          />

          <Metric
            icon={Clock3}
            label="Waiting / upcoming"
            value={
              appointmentsLoading
                ? "—"
                : appointmentCounts.waiting
            }
            note={`${appointmentCounts.examining} currently examining`}
            onClick={() =>
              navigate(
                "/appointments",
              )
            }
          />

          <Metric
            icon={Glasses}
            label="Spectacle jobs"
            value={
              dispensingLoading
                ? "—"
                : spectacleCounts.open
            }
            note={`${spectacleCounts.ready} ready · ${spectacleCounts.notified} notified`}
            onClick={() =>
              navigate(
                "/dispensing/spectacle-jobs",
              )
            }
          />

          <Metric
            icon={ContactRound}
            label="Contact lens jobs"
            value={
              dispensingLoading
                ? "—"
                : contactCounts.open
            }
            note={`${contactCounts.ready} ready / completed`}
            onClick={() =>
              navigate(
                "/dispensing/contact-lenses",
              )
            }
          />

          <Metric
            icon={ShoppingBag}
            label="Sundry jobs"
            value={
              dispensingLoading
                ? "—"
                : sundryCounts.open
            }
            note={`${sundryCounts.ready} ready · ${sundryCounts.notified} notified`}
            onClick={() =>
              navigate(
                "/dispensing/sundries",
              )
            }
          />
        </section>

        <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* PREMIUM APPOINTMENT SCHEDULE */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.045)]">
            <header className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-white via-white to-violet-50/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md shadow-violet-100">
                  <CalendarClock size={19} />
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-bold uppercase tracking-[0.18em] text-violet-600">
                    Front desk · Daily schedule
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <h2 className="text-lg font-bold tracking-tight text-slate-950">
                      Today’s appointments
                    </h2>
                    <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[12px] font-semibold text-slate-500">
                      {appointmentsLoading ? "Loading" : `${appointmentCounts.total} scheduled`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Review patient visits, assigned clinicians, and appointment status.
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/appointments")}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                >
                  View schedule
                  <ArrowRight size={14} />
                </button>
                {canAppointments && (
                  <button
                    type="button"
                    onClick={() => navigate("/appointments?book=1")}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-100"
                  >
                    <Plus size={14} />
                    Book appointment
                  </button>
                )}
              </div>
            </header>

            {appointmentsLoading ? (
              <div className="p-3 sm:p-3">
                <LoadingRow text="Loading today’s schedule..." />
              </div>
            ) : upcomingAppointments.length ? (
              <>
                <div className="hidden grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-3 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400 sm:grid">
                  <span>Time</span>
                  <span>Patient & visit</span>
                  <span className="pr-6">Status</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {upcomingAppointments.map((appointment) => {
                    const patient = appointment.patientId || appointment.patient || {};
                    const clinician = appointment.clinicianId || appointment.optometristId || {};
                    const status = normalizeStatus(appointment.status) || "booked";
                    const patientName = fullName(patient);
                    const appointmentType = appointment.type || "Comprehensive";
                    const duration = appointment.durationMinutes || 30;

                    const isUpdatingStatus = updatingAppointmentId === appointment._id;

                    return (
                      <div
                        key={appointment._id}
                        className="group grid w-full grid-cols-[64px_minmax(0,1fr)] items-center gap-3 px-3.5 py-3.5 text-left transition hover:bg-violet-50/40 sm:grid-cols-[76px_minmax(0,1fr)_auto] sm:gap-3 sm:px-3"
                      >
                        <div className="flex min-h-[58px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50/90 px-2 py-2 transition group-hover:border-violet-100 group-hover:bg-white">
                          <span className="text-sm font-bold tracking-tight text-slate-900">
                            {formatTime(appointment.appointmentDate)}
                          </span>
                          <span className="mt-0.5 text-[12px] font-medium text-slate-400">
                            {duration} min
                          </span>
                        </div>

                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <button
                              type="button"
                              onClick={() => appointment._id && navigate(`/appointments/${appointment._id}`)}
                              className="max-w-full truncate text-left text-sm font-bold text-slate-900 transition hover:text-violet-700 hover:underline focus:outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-violet-300"
                              aria-label={`Open appointment for ${patientName}`}
                            >
                              {patientName}
                            </button>
                            {patient.patientNumber && (
                              <span className="rounded-lg border border-slate-200 bg-white px-1.5 py-0.5 text-[12px] font-semibold text-slate-500">
                                {patient.patientNumber}
                              </span>
                            )}
                          </div>
                          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-slate-500">
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                              <ClipboardList size={12} className="shrink-0 text-violet-500" />
                              <span className="truncate">{appointmentType}</span>
                            </span>
                            <span className="inline-flex min-w-0 items-center gap-1.5">
                              <Users size={12} className="shrink-0 text-slate-400" />
                              <span className="truncate">{[clinician.firstName, clinician.lastName].filter(Boolean).join(" ") || "Clinician unassigned"}</span>
                            </span>
                            {patient.phone && (
                              <span className="hidden items-center gap-1.5 text-slate-400 md:inline-flex">
                                <Clock3 size={11} />
                                {patient.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="col-start-2 flex min-w-0 flex-wrap items-center justify-between gap-2 sm:col-start-auto sm:justify-end">
                          <div className="flex min-w-0 items-center gap-2">
                            <StatusBadge status={status} />
                            <select
                              value={status}
                              disabled={!canAppointments || Boolean(updatingAppointmentId)}
                              onChange={(event) => {
                                const nextStatus = event.target.value;
                                if (nextStatus !== status) {
                                  void updateDashboardAppointmentStatus(
                                    appointment._id,
                                    nextStatus,
                                    status,
                                  );
                                }
                              }}
                              className={`h-9 max-w-[145px] rounded-xl border border-slate-200 px-2.5 text-[12px] font-bold outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100 disabled:cursor-wait disabled:opacity-60 ${APPOINTMENT_STATUS_CLASS[status] || "bg-white text-slate-600"}`}
                              aria-label={`Change appointment status for ${patientName}`}
                              title="Change appointment status"
                            >
                              {Object.entries(APPOINTMENT_STATUS).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            {isUpdatingStatus && (
                              <RefreshCw size={13} className="shrink-0 animate-spin text-violet-600" aria-label="Saving status" />
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => appointment._id && navigate(`/appointments/${appointment._id}`)}
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:border-violet-200 hover:text-violet-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
                            aria-label={`Open appointment for ${patientName}`}
                            title="Open appointment"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <footer className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-3">
                  <span className="text-[12px] text-slate-500">
                    {appointmentCounts.waiting} waiting / upcoming · {appointmentCounts.examining} examining · {appointmentCounts.completed} completed
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate("/appointments")}
                    className="inline-flex items-center gap-1.5 self-start text-[12px] font-bold text-violet-700 transition hover:text-violet-900 sm:self-auto"
                  >
                    Manage all appointments <ArrowRight size={12} />
                  </button>
                </footer>
              </>
            ) : (
              <div className="flex flex-col items-center px-3 py-6 text-center sm:py-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-50 text-violet-600 ring-1 ring-violet-100">
                  <CalendarClock size={24} />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">No appointments scheduled today</h3>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  New bookings will appear here with their visit type, scheduled time, and assigned clinician.
                </p>
                {canAppointments && (
                  <button
                    type="button"
                    onClick={() => navigate("/appointments?book=1")}
                    className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-bold text-white transition hover:bg-violet-700"
                  >
                    <Plus size={14} /> Book appointment
                  </button>
                )}
              </div>
            )}
          </section>

          {/* APPOINTMENT STATUS */}
          <SectionCard
            eyebrow="Appointment flow"
            title="Today's status"
            meta="Patient movement"
          >
            <div className="space-y-3 p-3 sm:p-3.5">
              <ProgressRow
                label="Waiting / upcoming"
                value={
                  appointmentCounts.waiting
                }
                total={
                  appointmentCounts.total
                }
              />

              <ProgressRow
                label="Examining"
                value={
                  appointmentCounts.examining
                }
                total={
                  appointmentCounts.total
                }
              />

              <ProgressRow
                label="Completed"
                value={
                  appointmentCounts.completed
                }
                total={
                  appointmentCounts.total
                }
              />

              <ProgressRow
                label="Cancelled / no show"
                value={
                  appointmentCounts.cancelled
                }
                total={
                  appointmentCounts.total
                }
              />
            </div>
          </SectionCard>
        </section>

        {/* DISPENSING */}
        {canDispensing && (
          <SectionCard
            eyebrow="Dispensing"
            title="Dispensing activity"
            meta={`${dispensingRecords.length} matching records · Page ${dispensingPage} of ${dispensingPageCount}`}
            actionLabel="Open dispensing"
            onAction={() =>
              navigate(
                "/dispensing",
              )
            }
          >
            {/* CATEGORY FILTERS */}
            <div className="border-b border-slate-100 px-3 py-2.5 sm:px-3.5">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-1">
                  {Object.entries(
                    DISPENSING_CATEGORY,
                  ).map(
                    ([
                      key,
                      option,
                    ]) => {
                      const Icon =
                        option.icon;

                      const active =
                        dispensingCategory ===
                        key;

                      const count =
                        key ===
                        "spectacles"
                          ? spectacleCounts.total
                          : key ===
                              "contact_lenses"
                            ? contactCounts.total
                            : key ===
                                "sundries"
                              ? sundryCounts.total
                              : spectacleCounts.total +
                                contactCounts.total +
                                sundryCounts.total;

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setDispensingCategory(
                              key,
                            )
                          }
                          className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-bold transition ${
                            active
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                          }`}
                        >
                          <Icon
                            size={11}
                          />
                          {option.shortLabel}
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[12px] ${
                              active
                                ? "bg-white/10 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {dispensingLoading
                              ? "—"
                              : count}
                          </span>
                        </button>
                      );
                    },
                  )}
                </div>

                <div className="flex flex-col gap-1.5 sm:flex-row">
                  <div className="relative min-w-0 sm:w-52">
                    <Search
                      size={11}
                      className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={
                        dispensingSearch
                      }
                      onChange={(
                        event,
                      ) =>
                        setDispensingSearch(
                          event.target.value,
                        )
                      }
                      placeholder="Search job, patient, item..."
                      className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-6 pr-2.5 text-[12px] font-medium text-slate-700 outline-none placeholder:text-slate-300 focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                    />
                  </div>

                  <select
                    value={
                      dispensingStatus
                    }
                    onChange={(event) =>
                      setDispensingStatus(
                        event.target.value,
                      )
                    }
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-semibold text-slate-600 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                  >
                    {DISPENSING_STATUS_OPTIONS.map(
                      ([
                        value,
                        label,
                      ]) => (
                        <option
                          key={value}
                          value={
                            value
                          }
                        >
                          {label}
                        </option>
                      ),
                    )}
                  </select>

                  {(
                    dispensingCategory !==
                      "all" ||
                    dispensingStatus ||
                    dispensingSearch
                  ) && (
                    <button
                      type="button"
                      onClick={
                        clearDispensingFilters
                      }
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[12px] font-bold text-slate-500 transition hover:bg-slate-50"
                      title="Clear filters"
                    >
                      <X
                        size={10}
                      />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* CATEGORY SUMMARY */}
            <div className="grid gap-2 border-b border-slate-100 p-3 sm:grid-cols-3 sm:p-3.5">
              <SummaryMetric
                icon={Glasses}
                label="Spectacle jobs"
                value={
                  dispensingLoading
                    ? "—"
                    : spectacleCounts.total
                }
                active={
                  dispensingCategory ===
                  "spectacles"
                }
                onClick={() =>
                  setDispensingCategory(
                    "spectacles",
                  )
                }
              />

              <SummaryMetric
                icon={ContactRound}
                label="Contact lens jobs"
                value={
                  dispensingLoading
                    ? "—"
                    : contactCounts.total
                }
                active={
                  dispensingCategory ===
                  "contact_lenses"
                }
                onClick={() =>
                  setDispensingCategory(
                    "contact_lenses",
                  )
                }
              />

              <SummaryMetric
                icon={ShoppingBag}
                label="Sundry jobs"
                value={
                  dispensingLoading
                    ? "—"
                    : sundryCounts.total
                }
                active={
                  dispensingCategory ===
                  "sundries"
                }
                onClick={() =>
                  setDispensingCategory(
                    "sundries",
                  )
                }
              />
            </div>

            {dispensingLoading ? (
              <LoadingRow text="Loading dispensing jobs..." />
            ) : dispensingRecords.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left">
                  <thead className="bg-slate-50 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5">
                        Type
                      </th>

                      <th className="px-3 py-2.5">
                        Job
                      </th>

                      <th className="px-3 py-2.5">
                        Patient
                      </th>

                      <th className="px-3 py-2.5">
                        Item
                      </th>

                      <th className="px-3 py-2.5">
                        Status
                      </th>

                      <th className="px-3 py-2.5">
                        Updated
                      </th>

                      <th className="px-3 py-2.5 text-right">
                        Due
                      </th>
                    </tr>
                  </thead>

                  <tbody className="text-[12px]">
                    {visibleDispensingRecords.map(
                      (record) => {
                        const category =
                          record._dashboardCategory;

                        const target =
                          category ===
                          "spectacles"
                            ? `/dispensing/spectacles/${record._id}`
                            : category ===
                                "contact_lenses"
                              ? `/dispensing/contact-lenses/${record._id}`
                              : `/dispensing/sundries/${record._id}`;

                        return (
                          <tr
                            key={`${category}-${record._id}`}
                            className="border-t border-slate-100 transition-colors hover:bg-violet-50/30"
                          >
                            <td className="px-3 py-2.5">
                              <CategoryBadge
                                category={
                                  category
                                }
                              />
                            </td>

                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    target,
                                  )
                                }
                                className="font-bold text-slate-800 hover:underline"
                              >
                                {
                                  record._dashboardNumber
                                }
                              </button>
                            </td>

                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                onClick={() =>
                                  record._dashboardPatient
                                    ? navigate(
                                        `/patients/${record._dashboardPatient._id}`,
                                      )
                                    : null
                                }
                                className="text-left"
                              >
                                <div className="font-semibold text-slate-700 hover:underline">
                                  {
                                    record._dashboardPatientName
                                  }
                                </div>

                                <div className="mt-0.5 text-[12px] text-slate-400">
                                  {
                                    record._dashboardPatientNumber
                                  }
                                </div>
                              </button>
                            </td>

                            <td className="px-3 py-2.5">
                              <div className="font-semibold text-slate-700">
                                {
                                  record._dashboardItem
                                }
                              </div>

                              <div className="mt-0.5 truncate text-[12px] text-slate-400">
                                {
                                  record._dashboardSecondary
                                }
                              </div>
                            </td>

                            <td className="px-3 py-2.5">
                              <DispensingStatusBadge
                                status={
                                  record._dashboardStatus
                                }
                              />
                            </td>

                            <td className="px-3 py-2.5 text-slate-500">
                              {formatShortDate(
                                record._dashboardDate,
                              )}
                            </td>

                            <td className="px-3 py-2.5 text-right text-slate-500">
                              {formatShortDate(
                                record._dashboardDueDate,
                              )}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>

                <Pagination
                  page={dispensingPage}
                  totalPages={dispensingPageCount}
                  totalItems={dispensingRecords.length}
                  onPageChange={setDispensingPage}
                />
              </div>
            ) : (
              <EmptyState
                icon={
                  dispensingCategory ===
                  "spectacles"
                    ? Glasses
                    : dispensingCategory ===
                        "contact_lenses"
                      ? ContactRound
                      : dispensingCategory ===
                          "sundries"
                        ? ShoppingBag
                        : PackageCheck
                }
                title={
                  dispensingSearch ||
                  dispensingStatus ||
                  dispensingCategory !==
                    "all"
                    ? "No dispensing jobs match the selected filters"
                    : "No dispensing jobs"
                }
                actionLabel="Open dispensing"
                onAction={() =>
                  navigate(
                    "/dispensing",
                  )
                }
              />
            )}
          </SectionCard>
        )}

        {/* CONSULTATION LIST */}
        {canClinical && (
          <SectionCard
            eyebrow="Clinical"
            title="Consultations"
            meta={`${consultations.length} records · Page ${consultationsPage} of ${consultationsPageCount}`}
            actionLabel="Open clinical"
            onAction={() => navigate("/clinical")}
          >
            {consultationsLoading ? (
              <LoadingRow text="Loading consultations..." />
            ) : consultations.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left">
                  <thead className="bg-slate-50 text-[12px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5">Patient</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Optometrist</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px]">
                    {visibleConsultations.map((consultation) => {
                      const patient = consultation.patientId || {};
                      const optometrist = consultation.optometristId || {};
                      const consultationId = consultation._id;
                      const currentStatus =
                        normalizeStatus(consultation.status) || "completed";

                      return (
                        <tr
                          key={consultationId}
                          className="border-t border-slate-100 transition-colors hover:bg-violet-50/30"
                        >
                          <td className="px-3 py-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                patient?._id &&
                                navigate(`/patients/${patient._id}`)
                              }
                              className="text-left"
                            >
                              <div className="font-semibold text-slate-700 hover:underline">
                                {fullName(patient)}
                              </div>
                              <div className="mt-0.5 text-[12px] text-slate-400">
                                {getPatientNumber({ patientId: patient })}
                              </div>
                            </button>
                          </td>

                          <td className="px-3 py-2.5">
                            <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[12px] font-bold text-slate-600">
                              {consultationTypeLabel(consultation.consultationType)}
                            </span>
                          </td>

                          <td className="px-3 py-2.5 text-slate-500">
                            {formatShortDate(consultation.consultationDate)}
                          </td>

                          <td className="px-3 py-2.5 text-slate-600">
                            {[optometrist.firstName, optometrist.lastName]
                              .filter(Boolean)
                              .join(" ") || "—"}
                          </td>

                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-[12px] font-bold uppercase tracking-[0.06em] ${getConsultationStatusClass(
                                  currentStatus,
                                )}`}
                              >
                                {consultationStatusLabel(currentStatus)}
                              </span>

                              <select
                                value={currentStatus}
                                disabled={updatingConsultationId === consultationId}
                                onChange={(event) =>
                                  void updateDashboardConsultationStatus(
                                    consultationId,
                                    event.target.value,
                                  )
                                }
                                className="h-8 rounded-lg border border-slate-200 bg-white px-1.5 text-[12px] font-semibold text-slate-600 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Change status for ${fullName(patient)}`}
                              >
                                {CONSULTATION_STATUS_OPTIONS.map(([value, text]) => (
                                  <option key={value} value={value}>
                                    {text}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                consultationId &&
                                navigate(
                                  `/clinical/consultations/${consultationId}`,
                                )
                              }
                              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-bold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                            >
                              View
                              <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <Pagination
                  page={consultationsPage}
                  totalPages={consultationsPageCount}
                  totalItems={consultations.length}
                  onPageChange={setConsultationsPage}
                />
              </div>
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No consultations"
                actionLabel="Open clinical"
                onAction={() => navigate("/clinical")}
              />
            )}
          </SectionCard>
        )}

        {/* QUICK ACTIONS */}
        {quickActions.length >
          0 && (
          <SectionCard
            eyebrow="Workspace"
            title="Quick actions"
            meta="Role-based shortcuts"
          >
            <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 sm:p-3.5">
              {quickActions.map(
                (action) => (
                  <QuickAction
                    key={
                      action.label
                    }
                    {...action}
                  />
                ),
              )}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   SHARED UI
============================================================ */

function SectionCard({
  eyebrow,
  title,
  meta,
  actionLabel,
  onAction,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_6px_24px_rgba(15,23,42,0.035)]">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/60 px-3 py-3 sm:px-3">
        <div className="min-w-0">
          <div className="text-[12px] font-bold uppercase tracking-[0.17em] text-violet-600">
            {eyebrow}
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-sm font-bold tracking-tight text-slate-900 sm:text-[15px]">
              {title}
            </h2>

            {meta && (
              <span className="text-[12px] text-slate-500">
                {meta}
              </span>
            )}
          </div>
        </div>

        {actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-bold text-slate-600 transition hover:bg-slate-50"
          >
            {actionLabel}
            <ArrowRight size={10} />
          </button>
        )}
      </header>

      {children}
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  note,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl border border-slate-200/90 bg-white p-3 text-left shadow-[0_4px_18px_rgba(15,23,42,0.025)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_10px_28px_rgba(109,40,217,0.08)] focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-blue-50 text-violet-700 ring-1 ring-violet-100/80 transition group-hover:from-violet-100 group-hover:to-blue-100">
          <Icon size={17} />
        </span>

        <span className="min-w-0">
          <span className="block truncate text-[12px] font-bold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </span>

          <span className="mt-0.5 block text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </span>
        </span>
      </div>

      <div className="mt-3 truncate text-[12px] text-slate-500">
        {note}
      </div>
    </button>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  active = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-left transition ${
        active
          ? "border-violet-200 bg-white shadow-sm ring-1 ring-violet-100"
          : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/30"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100">
          <Icon size={12} />
        </span>

        <span className="text-sm font-bold text-slate-900">
          {value}
        </span>
      </div>

      <div className="mt-1.5 truncate text-[12px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </div>
    </button>
  );
}

function CategoryBadge({
  category,
}) {
  const option =
    DISPENSING_CATEGORY[
      category
    ];

  const Icon =
    option?.icon ||
    PackageCheck;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[12px] font-bold uppercase tracking-[0.07em] text-slate-600">
      <Icon size={9} />
      {option?.shortLabel ||
        "Dispensing"}
    </span>
  );
}

function DispensingStatusBadge({
  status,
}) {
  const key =
    normalizeStatus(status);

  const classes = {
    draft:
      "bg-slate-100 text-slate-600",
    ordered:
      "bg-blue-50 text-blue-700",
    not_ready:
      "bg-amber-50 text-amber-700",
    ready:
      "bg-emerald-50 text-emerald-700",
    notified:
      "bg-violet-50 text-violet-700",
    collected:
      "bg-slate-900 text-white",
    cancelled:
      "bg-rose-50 text-rose-700",
    dispensed:
      "bg-emerald-50 text-emerald-700",
    delivered:
      "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[12px] font-bold uppercase tracking-[0.08em] ${
        classes[key] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {key
        ? key.replaceAll(
            "_",
            " ",
          )
        : "Draft"}
    </span>
  );
}

function StatusBadge({
  status,
}) {
  const key =
    normalizeStatus(status);

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[12px] font-bold tracking-[0.02em] ${
        APPOINTMENT_STATUS_CLASS[
          key
        ] ||
        "bg-slate-100 text-slate-600"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {
        APPOINTMENT_STATUS[key] ||
        key ||
        "Booked"
      }
    </span>
  );
}

function ProgressRow({
  label,
  value,
  total,
}) {
  const percent =
    total > 0
      ? Math.round(
          (value / total) *
            100,
        )
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[12px] font-medium text-slate-600">
          {label}
        </span>

        <span className="text-[12px] font-bold text-slate-700">
          {value}/{total}
        </span>
      </div>

      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  description,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3.5 text-left shadow-sm shadow-slate-100/70 transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/30 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
    >
      <span className="flex h-9 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 ring-1 ring-slate-100">
        <Icon size={13} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[12px] font-bold text-slate-700">
          {label}
        </span>

        <span className="mt-0.5 block truncate text-[12px] text-slate-400">
          {description}
        </span>
      </span>

      <ArrowRight
        size={11}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600"
      />
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  actionLabel,
  onAction,
  showAction = true,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-3 py-6 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-300">
        <Icon size={17} />
      </span>

      <div className="mt-2 text-[12px] font-semibold text-slate-600">
        {title}
      </div>

      {showAction &&
        actionLabel && (
          <button
            type="button"
            onClick={onAction}
            className="mt-2 inline-flex h-8 items-center gap-1 rounded-lg bg-slate-950 px-2.5 text-[12px] font-bold text-white"
          >
            {actionLabel}
            <ArrowRight
              size={10}
            />
          </button>
        )}
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}) {
  if (totalItems <= PAGE_SIZE) {
    return null;
  }

  const start =
    (page - 1) * PAGE_SIZE + 1;

  const end = Math.min(
    page * PAGE_SIZE,
    totalItems,
  );

  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-[12px] font-semibold text-slate-400">
        Showing {start}–{end} of {totalItems}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() =>
            onPageChange(
              Math.max(1, page - 1),
            )
          }
          disabled={page <= 1}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft size={10} />
          Previous
        </button>

        <span className="inline-flex h-8 min-w-[64px] items-center justify-center rounded-lg bg-slate-950 px-2 text-[12px] font-bold text-white">
          Page {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() =>
            onPageChange(
              Math.min(
                totalPages,
                page + 1,
              ),
            )
          }
          disabled={page >= totalPages}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Next page"
        >
          Next
          <ChevronRight size={10} />
        </button>
      </div>
    </div>
  );
}

function LoadingRow({
  text,
}) {
  return (
    <div className="flex items-center justify-center gap-2 px-3 py-6 text-[12px] text-slate-400">
      <RefreshCw
        size={12}
        className="animate-spin"
      />
      {text}
    </div>
  );
}
 