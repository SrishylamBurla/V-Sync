import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
  UserCheck,
  UserX,
  KeyRound,
} from "lucide-react";

import {
  getStaffMember,
  updateStaffStatus,
} from "../api/staff.api";

const ROLE_LABELS = {
  branch_manager: "Branch Manager",
  optometrist: "Optometrist",
  doctor: "Doctor",
  sales_executive: "Sales Executive",
  cashier: "Cashier",
  inventory_manager: "Inventory Manager",
  lab_technician: "Lab Technician",
  receptionist: "Receptionist",
};

const STATUS_CONFIG = {
  active: {
    label: "Active",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-600 border-gray-200",
    icon: UserX,
  },
  suspended: {
    label: "Suspended",
    className: "bg-red-50 text-red-700 border-red-200",
    icon: UserX,
  },
};

const formatDate = (date) => {
  if (!date) return "Not available";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "Never";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (staff) => {
  const first = staff?.firstName?.charAt(0) || "";
  const last = staff?.lastName?.charAt(0) || "";

  return `${first}${last}`.toUpperCase() || "ST";
};

const getBranchName = (branch) => {
  if (!branch) return "Unknown branch";

  if (typeof branch === "string") {
    return branch;
  }

  return branch.name || branch.code || "Unknown branch";
};

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
      <Icon size={17} />
    </div>

    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-gray-800">
        {value || "Not available"}
      </p>
    </div>
  </div>
);

const Section = ({ title, description, children }) => (
  <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-100 px-5 py-4">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>

      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>

    <div className="p-5">{children}</div>
  </section>
);

export default function StaffDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState("");

  const loadStaff = useCallback(async () => {
    if (!id) {
      setError("Staff ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await getStaffMember(id);

      const record = response?.data || response;

      if (!record) {
        throw new Error("Staff member was not found.");
      }

      setStaff(record);
    } catch (err) {
      console.error("Failed to load staff:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to load staff member."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const handleStatusChange = async () => {
    if (!staff?._id) return;

    const nextStatus =
      staff.status === "active" ? "inactive" : "active";

    const confirmed = window.confirm(
      nextStatus === "inactive"
        ? `Deactivate ${staff.firstName} ${staff.lastName || ""}?`
        : `Activate ${staff.firstName} ${staff.lastName || ""}?`
    );

    if (!confirmed) return;

    try {
      setUpdatingStatus(true);
      setError("");

      await updateStaffStatus(staff._id, nextStatus);

      setStaff((current) =>
        current
          ? {
              ...current,
              status: nextStatus,
            }
          : current
      );
    } catch (err) {
      console.error("Failed to update staff status:", err);

      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Unable to update staff status."
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleResetPassword = () => {
    navigate(`/staff/${id}/edit`, {
      state: {
        openResetPassword: true,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-gray-200 bg-white">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw
                size={28}
                className="animate-spin text-gray-400"
              />

              <p className="text-sm text-gray-500">
                Loading staff details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !staff) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <button
            type="button"
            onClick={() => navigate("/staff")}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
          >
            <ArrowLeft size={17} />
            Back to Staff
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-base font-semibold text-red-800">
              Unable to load staff
            </h2>

            <p className="mt-2 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={loadStaff}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status =
    STATUS_CONFIG[staff?.status] || STATUS_CONFIG.inactive;

  const StatusIcon = status.icon;

  const fullName =
    `${staff?.firstName || ""} ${staff?.lastName || ""}`.trim();

  const branches = Array.isArray(staff?.branchIds)
    ? staff.branchIds
    : [];

  const defaultBranchId = staff?.defaultBranchId;

  const defaultBranch =
    typeof defaultBranchId === "object"
      ? defaultBranchId
      : branches.find(
          (branch) =>
            branch?._id?.toString() === defaultBranchId?.toString()
        );

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() =>
                location.state?.from
                  ? navigate(location.state.from)
                  : navigate("/staff")
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
              title="Back"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <p className="text-sm text-gray-500">Staff Management</p>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Staff Details
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadStaff}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => navigate(`/staff/${id}/edit`)}
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              <Edit3 size={16} />
              Edit Staff
            </button>
          </div>
        </div>

        {/* Error */}
        {error && staff && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="h-28 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700" />

          <div className="px-5 pb-5 sm:px-7">
            <div className="-mt-12 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gray-100 text-2xl font-bold text-gray-700 shadow-md">
                  {getInitials(staff)}
                </div>

                <div className="pb-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {fullName || "Unnamed Staff"}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {ROLE_LABELS[staff?.role] || staff?.role || "Staff"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
                >
                  <StatusIcon size={14} />
                  {status.label}
                </span>

                <button
                  type="button"
                  onClick={handleStatusChange}
                  disabled={updatingStatus}
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    staff?.status === "active"
                      ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                      : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  {updatingStatus ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : staff?.status === "active" ? (
                    <UserX size={16} />
                  ) : (
                    <UserCheck size={16} />
                  )}

                  {staff?.status === "active"
                    ? "Deactivate"
                    : "Activate"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contact */}
          <div className="lg:col-span-2">
            <Section
              title="Personal Information"
              description="Basic contact and account information."
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <InfoItem
                  icon={User}
                  label="Full Name"
                  value={fullName}
                />

                <InfoItem
                  icon={ShieldCheck}
                  label="Role"
                  value={
                    ROLE_LABELS[staff?.role] ||
                    staff?.role ||
                    "Not available"
                  }
                />

                <InfoItem
                  icon={Mail}
                  label="Email"
                  value={staff?.email}
                />

                <InfoItem
                  icon={Phone}
                  label="Phone"
                  value={staff?.phone}
                />
              </div>
            </Section>
          </div>

          {/* Account */}
          <Section
            title="Account"
            description="Account status and activity."
          >
            <div className="space-y-5">
              <InfoItem
                icon={Clock3}
                label="Last Login"
                value={formatDateTime(staff?.lastLoginAt)}
              />

              <InfoItem
                icon={CalendarDays}
                label="Created"
                value={formatDate(staff?.createdAt)}
              />

              <InfoItem
                icon={CalendarDays}
                label="Last Updated"
                value={formatDate(staff?.updatedAt)}
              />
            </div>
          </Section>
        </div>

        {/* Branch Access */}
        <Section
          title="Branch Access"
          description="Branches where this staff member is authorized to work."
        >
          {branches.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6 text-center">
              <Building2 className="mx-auto text-gray-400" size={28} />

              <p className="mt-2 text-sm font-medium text-gray-700">
                No branches assigned
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Assign at least one branch from Edit Staff.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch, index) => {
                const branchId =
                  typeof branch === "object"
                    ? branch?._id
                    : branch;

                const isDefault =
                  defaultBranch?.name &&
                  defaultBranch?._id?.toString() ===
                    branchId?.toString();

                return (
                  <div
                    key={branchId || index}
                    className={`rounded-xl border p-4 ${
                      isDefault
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                          <Building2 size={18} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {getBranchName(branch)}
                          </p>

                          {branch?.code && (
                            <p className="mt-0.5 text-xs text-gray-500">
                              {branch.code}
                            </p>
                          )}

                          {branch?.address?.city && (
                            <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                              <MapPin size={12} />
                              {branch.address.city}
                            </p>
                          )}
                        </div>
                      </div>

                      {isDefault && (
                        <span className="shrink-0 rounded-full bg-gray-900 px-2 py-1 text-[10px] font-semibold text-white">
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Security */}
        <Section
          title="Security"
          description="Manage credentials and account access."
        >
          <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm">
                <KeyRound size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Password
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Reset the staff member's password securely.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetPassword}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              <KeyRound size={16} />
              Reset Password
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}