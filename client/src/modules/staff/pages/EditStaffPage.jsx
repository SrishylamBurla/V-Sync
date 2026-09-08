import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Save,
  Shield,
  User,
  UserCheck,
  UserX,
} from "lucide-react";

import {
  getStaffMember,
  updateStaff,
  updateStaffStatus,
  resetStaffPassword,
} from "../api/staff.api";

import { getBranches } from "../../branches/api/branch.api";

const STAFF_ROLES = [
  { value: "branch_manager", label: "Branch Manager" },
  { value: "optometrist", label: "Optometrist" },
  { value: "doctor", label: "Doctor" },
  { value: "sales_executive", label: "Sales Executive" },
  { value: "cashier", label: "Cashier" },
  { value: "inventory_manager", label: "Inventory Manager" },
  { value: "lab_technician", label: "Lab Technician" },
  { value: "receptionist", label: "Receptionist" },
];

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
    description: "Staff member can access the system.",
  },
  {
    value: "inactive",
    label: "Inactive",
    description: "Temporarily disable the account.",
  },
  {
    value: "suspended",
    label: "Suspended",
    description: "Block access due to a security or administrative issue.",
  },
];

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  branchIds: [],
  defaultBranchId: "",
  status: "active",
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const normalizeId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return value._id?.toString() || "";
  }

  return value.toString();
};

const extractRecords = (response) => {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.branches)) {
    return response.branches;
  }

  if (Array.isArray(response?.data?.branches)) {
    return response.data.branches;
  }

  return [];
};

const InputField = ({
  label,
  required,
  icon: Icon,
  error,
  ...props
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        )}

        <input
          {...props}
          className={`w-full rounded-xl border bg-white py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 ${
            Icon ? "pl-10 pr-3" : "px-3"
          } ${
            error
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100"
          }`}
        />
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

const SelectField = ({
  label,
  required,
  error,
  children,
  ...props
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <select
        {...props}
        className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100"
            : "border-gray-200 focus:border-gray-900 focus:ring-2 focus:ring-gray-100"
        }`}
      >
        {children}
      </select>

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

const Section = ({ title, description, children }) => (
  <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="border-b border-gray-100 px-5 py-4">
      <h2 className="text-base font-semibold text-gray-900">
        {title}
      </h2>

      {description && (
        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      )}
    </div>

    <div className="p-5">{children}</div>
  </section>
);

export default function EditStaffPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(emptyForm);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [successMessage, setSuccessMessage] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(
    Boolean(location.state?.openResetPassword)
  );

  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [staffResponse, branchesResponse] = await Promise.all([
        getStaffMember(id),
        getBranches(),
      ]);

      const staff =
        staffResponse?.data || staffResponse;

      if (!staff) {
        throw new Error("Staff member not found.");
      }

      const branchRecords = extractRecords(branchesResponse);

      setBranches(branchRecords);

      setForm({
        firstName: staff.firstName || "",
        lastName: staff.lastName || "",
        email: staff.email || "",
        phone: staff.phone || "",
        role: staff.role || "",
        branchIds: Array.isArray(staff.branchIds)
          ? staff.branchIds.map(normalizeId).filter(Boolean)
          : [],
        defaultBranchId: normalizeId(staff.defaultBranchId),
        status: staff.status || "active",
      });
    } catch (err) {
      console.error("Failed to load staff:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to load staff information."
        )
      );
    } finally {
      setLoading(false);
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const selectedBranches = useMemo(() => {
    return branches.filter((branch) =>
      form.branchIds.includes(normalizeId(branch))
    );
  }, [branches, form.branchIds]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setFieldErrors((current) => ({
      ...current,
      [name]: "",
    }));

    setSuccessMessage("");
  };

  const handleBranchToggle = (branchId) => {
    setForm((current) => {
      const exists = current.branchIds.includes(branchId);

      const branchIds = exists
        ? current.branchIds.filter((id) => id !== branchId)
        : [...current.branchIds, branchId];

      let defaultBranchId = current.defaultBranchId;

      if (
        exists &&
        defaultBranchId === branchId
      ) {
        defaultBranchId = branchIds[0] || "";
      }

      return {
        ...current,
        branchIds,
        defaultBranchId,
      };
    });

    setFieldErrors((current) => ({
      ...current,
      branchIds: "",
      defaultBranchId: "",
    }));
  };

  const validate = () => {
    const errors = {};

    if (!form.firstName.trim()) {
      errors.firstName = "First name is required.";
    }

    if (!form.lastName.trim()) {
      errors.lastName = "Last name is required.";
    }

    if (!form.email.trim()) {
      errors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      errors.email = "Enter a valid email address.";
    }

    if (!form.phone.trim()) {
      errors.phone = "Phone number is required.";
    }

    if (!form.role) {
      errors.role = "Select a role.";
    }

    if (!form.branchIds.length) {
      errors.branchIds = "Assign at least one branch.";
    }

    if (
      form.defaultBranchId &&
      !form.branchIds.includes(form.defaultBranchId)
    ) {
      errors.defaultBranchId =
        "Default branch must be one of the assigned branches.";
    }

    if (!form.defaultBranchId && form.branchIds.length) {
      errors.defaultBranchId =
        "Select a default branch.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccessMessage("");
    setError("");

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        role: form.role,
        branchIds: form.branchIds,
        defaultBranchId: form.defaultBranchId,
        status: form.status,
      };

      await updateStaff(id, payload);

      setSuccessMessage(
        "Staff information updated successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Failed to update staff:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to update staff information."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    if (!id || status === form.status) return;

    try {
      setError("");

      await updateStaffStatus(id, status);

      setForm((current) => ({
        ...current,
        status,
      }));

      setSuccessMessage(
        `Staff account ${status === "active" ? "activated" : "updated"} successfully.`
      );
    } catch (err) {
      console.error("Failed to update status:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to update staff status."
        )
      );
    }
  };

  const validatePassword = () => {
    if (!passwordForm.password) {
      return "Enter a new password.";
    }

    if (passwordForm.password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (
      passwordForm.password !==
      passwordForm.confirmPassword
    ) {
      return "Passwords do not match.";
    }

    return "";
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();

    setError("");
    setSuccessMessage("");

    const passwordError = validatePassword();

    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      setResettingPassword(true);

      await resetStaffPassword(
        id,
        passwordForm.password
      );

      setPasswordForm({
        password: "",
        confirmPassword: "",
      });

      setSuccessMessage(
        "Password has been reset successfully."
      );

      setShowResetPassword(false);
    } catch (err) {
      console.error("Failed to reset password:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to reset password."
        )
      );
    } finally {
      setResettingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto flex min-h-[400px] max-w-5xl items-center justify-center rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2
              size={28}
              className="animate-spin text-gray-400"
            />

            <p className="text-sm text-gray-500">
              Loading staff information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !form.firstName) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <button
            type="button"
            onClick={() => navigate(`/staff/${id}`)}
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={17} />
            Back to Staff
          </button>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-800">
              Unable to load staff
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={loadData}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/staff/${id}`)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:bg-gray-50 hover:text-gray-900"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <p className="text-sm text-gray-500">
                Staff Management
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Edit Staff
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/staff/${id}`)}
            className="hidden rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 sm:block"
          >
            View Profile
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <UserX size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0"
            />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <Section
            title="Personal Information"
            description="Update the staff member's basic information."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="First Name"
                required
                icon={User}
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                placeholder="Enter first name"
                error={fieldErrors.firstName}
              />

              <InputField
                label="Last Name"
                required
                icon={User}
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                placeholder="Enter last name"
                error={fieldErrors.lastName}
              />

              <InputField
                label="Email"
                required
                icon={Mail}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="staff@example.com"
                error={fieldErrors.email}
              />

              <InputField
                label="Phone"
                required
                icon={Phone}
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
                error={fieldErrors.phone}
              />
            </div>
          </Section>

          {/* Role */}
          <Section
            title="Role & Access"
            description="Control the staff member's operational role."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                label="Staff Role"
                required
                name="role"
                value={form.role}
                onChange={handleChange}
                error={fieldErrors.role}
              >
                <option value="">Select role</option>

                {STAFF_ROLES.map((role) => (
                  <option
                    key={role.value}
                    value={role.value}
                  >
                    {role.label}
                  </option>
                ))}
              </SelectField>

              <SelectField
                label="Account Status"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                {STATUS_OPTIONS.map((status) => (
                  <option
                    key={status.value}
                    value={status.value}
                  >
                    {status.label}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <Shield
                  size={19}
                  className="mt-0.5 text-gray-500"
                />

                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Role permissions
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    Permissions are controlled by the selected
                    role. Fine-grained permission management can
                    be added later without changing this staff
                    record.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* Branches */}
          <Section
            title="Branch Access"
            description="Select the branches where this staff member can operate."
          >
            {loadingBranches ? (
              <div className="flex items-center justify-center py-10">
                <Loader2
                  size={24}
                  className="animate-spin text-gray-400"
                />
              </div>
            ) : branches.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <Building2
                  size={30}
                  className="mx-auto text-gray-400"
                />

                <p className="mt-3 text-sm font-semibold text-gray-700">
                  No active branches found
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Create an active branch before assigning staff.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {branches.map((branch) => {
                    const branchId = normalizeId(branch);
                    const selected =
                      form.branchIds.includes(branchId);

                    return (
                      <button
                        key={branchId}
                        type="button"
                        onClick={() =>
                          handleBranchToggle(branchId)
                        }
                        className={`relative rounded-xl border p-4 text-left transition ${
                          selected
                            ? "border-gray-900 bg-gray-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {selected && (
                          <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white">
                            <Check size={13} />
                          </span>
                        )}

                        <div className="flex items-start gap-3 pr-5">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                              selected
                                ? "bg-gray-900 text-white"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            <Building2 size={18} />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-gray-900">
                              {branch.name ||
                                branch.code ||
                                "Unnamed Branch"}
                            </p>

                            {branch.code && (
                              <p className="mt-0.5 text-xs text-gray-500">
                                {branch.code}
                              </p>
                            )}

                            {branch.address?.city && (
                              <p className="mt-1 text-xs text-gray-500">
                                {branch.address.city}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {fieldErrors.branchIds && (
                  <p className="mt-2 text-xs text-red-600">
                    {fieldErrors.branchIds}
                  </p>
                )}

                {/* Default Branch */}
                <div className="mt-6 border-t border-gray-100 pt-5">
                  <SelectField
                    label="Default Branch"
                    required
                    name="defaultBranchId"
                    value={form.defaultBranchId}
                    onChange={handleChange}
                    error={fieldErrors.defaultBranchId}
                  >
                    <option value="">
                      Select default branch
                    </option>

                    {selectedBranches.map((branch) => (
                      <option
                        key={normalizeId(branch)}
                        value={normalizeId(branch)}
                      >
                        {branch.name ||
                          branch.code ||
                          "Unnamed Branch"}
                      </option>
                    ))}
                  </SelectField>

                  <p className="mt-2 text-xs text-gray-500">
                    The default branch will be used as the
                    initial operational context when the staff
                    member signs in.
                  </p>
                </div>
              </>
            )}
          </Section>

          {/* Status */}
          <Section
            title="Account Status"
            description="Control whether this staff member can use the application."
          >
            <div className="grid gap-3 md:grid-cols-3">
              {STATUS_OPTIONS.map((option) => {
                const selected = form.status === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        status: option.value,
                      }))
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-900">
                        {option.label}
                      </span>

                      {selected && (
                        <CheckCircle2
                          size={17}
                          className="text-gray-900"
                        />
                      )}
                    </div>

                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {form.status !== "active" && (
                <button
                  type="button"
                  onClick={() =>
                    handleStatusChange("active")
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
                >
                  <UserCheck size={16} />
                  Activate Account
                </button>
              )}

              {form.status === "active" && (
                <button
                  type="button"
                  onClick={() =>
                    handleStatusChange("inactive")
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  <UserX size={16} />
                  Deactivate Account
                </button>
              )}
            </div>
          </Section>

          {/* Save */}
          <div className="sticky bottom-4 z-10 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-gray-500">
                Changes will be applied to this staff account.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/staff/${id}`)
                  }
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Password */}
        <Section
          title="Password & Security"
          description="Reset the staff member's login password."
        >
          {!showResetPassword ? (
            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm">
                  <KeyRound size={18} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Reset Password
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Set a new password for this staff member.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowResetPassword(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                <KeyRound size={16} />
                Reset Password
              </button>
            </div>
          ) : (
            <form
              onSubmit={handlePasswordReset}
              className="space-y-5"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    New Password
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={passwordForm.password}
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          password:
                            event.target.value,
                        }))
                      }
                      placeholder="Minimum 8 characters"
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-11 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((current) => !current)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Confirm Password
                  </label>

                  <div className="relative">
                    <KeyRound
                      size={17}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        passwordForm.confirmPassword
                      }
                      onChange={(event) =>
                        setPasswordForm((current) => ({
                          ...current,
                          confirmPassword:
                            event.target.value,
                        }))
                      }
                      placeholder="Confirm new password"
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResetPassword(false);
                    setPasswordForm({
                      password: "",
                      confirmPassword: "",
                    });
                  }}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resettingPassword ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </Section>
      </div>
    </div>
  );
}