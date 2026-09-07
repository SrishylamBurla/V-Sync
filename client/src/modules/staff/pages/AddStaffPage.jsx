import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Info,
  Save,
  UserPlus,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { createStaff } from "../api/staff.api";
import { getBranches } from "../../branches/api/branch.api";

const ROLES = [
  {
    value: "branch_manager",
    label: "Branch Manager",
    description: "Manages day-to-day branch operations.",
  },
  {
    value: "optometrist",
    label: "Optometrist",
    description: "Performs eye examinations and clinical assessments.",
  },
  {
    value: "doctor",
    label: "Doctor",
    description: "Provides medical and clinical eye care.",
  },
  {
    value: "sales_executive",
    label: "Sales Executive",
    description: "Handles customers, sales and optical products.",
  },
  {
    value: "cashier",
    label: "Cashier",
    description: "Handles billing and payment operations.",
  },
  {
    value: "inventory_manager",
    label: "Inventory Manager",
    description: "Manages stock and inventory operations.",
  },
  {
    value: "lab_technician",
    label: "Lab Technician",
    description: "Handles optical laboratory workflows.",
  },
  {
    value: "receptionist",
    label: "Receptionist",
    description: "Handles reception, appointments and patient registration.",
  },
];

const initialForm = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "",
  password: "",
  confirmPassword: "",
  status: "active",
  branchIds: [],
  defaultBranchId: "",
};

export default function AddStaffPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);

  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");

  /*
   * Load branches available to the current user.
   */
  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoadingBranches(true);

        const response = await getBranches({
          page: 1,
          limit: 100,
          status: "active",
        });

        const records =
          response?.data?.branches ||
          response?.data?.records ||
          response?.data ||
          [];

        setBranches(
          Array.isArray(records)
            ? records
            : [],
        );
      } catch (error) {
        console.error(
          "Failed to load branches:",
          error,
        );

        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, []);

  const selectedRole = useMemo(
    () =>
      ROLES.find(
        (item) => item.value === form.role,
      ),
    [form.role],
  );

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setServerError("");
  };

  const toggleBranch = (branchId) => {
    setForm((current) => {
      const exists =
        current.branchIds.includes(branchId);

      const branchIds = exists
        ? current.branchIds.filter(
            (id) => id !== branchId,
          )
        : [...current.branchIds, branchId];

      let defaultBranchId =
        current.defaultBranchId;

      if (
        defaultBranchId &&
        !branchIds.includes(defaultBranchId)
      ) {
        defaultBranchId = "";
      }

      if (!defaultBranchId && branchIds.length === 1) {
        defaultBranchId = branchIds[0];
      }

      return {
        ...current,
        branchIds,
        defaultBranchId,
      };
    });

    setErrors((current) => ({
      ...current,
      branchIds: "",
      defaultBranchId: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.firstName.trim()) {
      nextErrors.firstName =
        "First name is required.";
    }

    if (!form.lastName.trim()) {
      nextErrors.lastName =
        "Last name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email =
        "Email address is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email,
      )
    ) {
      nextErrors.email =
        "Enter a valid email address.";
    }

    if (!form.phone.trim()) {
      nextErrors.phone =
        "Phone number is required.";
    }

    if (!form.role) {
      nextErrors.role =
        "Select a staff role.";
    }

    if (!form.password) {
      nextErrors.password =
        "Password is required.";
    } else if (form.password.length < 8) {
      nextErrors.password =
        "Password must contain at least 8 characters.";
    }

    if (
      !form.confirmPassword
    ) {
      nextErrors.confirmPassword =
        "Please confirm the password.";
    } else if (
      form.password !==
      form.confirmPassword
    ) {
      nextErrors.confirmPassword =
        "Passwords do not match.";
    }

    if (!form.branchIds.length) {
      nextErrors.branchIds =
        "Assign at least one branch.";
    }

    if (
      form.branchIds.length &&
      !form.defaultBranchId
    ) {
      nextErrors.defaultBranchId =
        "Select a default branch.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSuccess("");
    setServerError("");

    if (!validate()) {
      return;
    }

    try {
      setSaving(true);

      const payload = {
        firstName: form.firstName.trim(),
        middleName:
          form.middleName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        role: form.role,
        password: form.password,
        status: form.status,
        branchIds: form.branchIds,
        defaultBranchId:
          form.defaultBranchId,
      };

      await createStaff(payload);

      setSuccess(
        "Staff member created successfully.",
      );

      setTimeout(() => {
        navigate("/staff");
      }, 700);
    } catch (error) {
      console.error(
        "Failed to create staff:",
        error,
      );

      setServerError(
        error?.response?.data?.message ||
          "Unable to create staff member. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/staff")}
              className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft size={14} />
              Staff Management
            </button>

            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Administration
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Add Staff
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Create a staff account and configure
              its role and branch access.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/staff")}
            className="inline-flex h-10 items-center justify-center border border-slate-200 bg-white px-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Server error */}
          {serverError && (
            <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {serverError}
            </div>
          )}

          {success && (
            <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {/* Personal information */}
          <section className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Section 01
              </p>

              <h2 className="mt-1 text-base font-semibold text-slate-900">
                Personal Information
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Basic identity and contact information
                for the staff account.
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-3">
              <Field
                label="First name"
                required
                value={form.firstName}
                onChange={(value) =>
                  updateField(
                    "firstName",
                    value,
                  )
                }
                error={errors.firstName}
              />

              <Field
                label="Middle name"
                value={form.middleName}
                onChange={(value) =>
                  updateField(
                    "middleName",
                    value,
                  )
                }
              />

              <Field
                label="Last name"
                required
                value={form.lastName}
                onChange={(value) =>
                  updateField(
                    "lastName",
                    value,
                  )
                }
                error={errors.lastName}
              />

              <Field
                label="Email address"
                required
                type="email"
                value={form.email}
                onChange={(value) =>
                  updateField(
                    "email",
                    value,
                  )
                }
                error={errors.email}
              />

              <Field
                label="Phone number"
                required
                type="tel"
                value={form.phone}
                onChange={(value) =>
                  updateField(
                    "phone",
                    value,
                  )
                }
                error={errors.phone}
              />

              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Account status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    updateField(
                      "status",
                      e.target.value,
                    )
                  }
                  className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white"
                >
                  <option value="active">
                    Active
                  </option>
                  <option value="inactive">
                    Inactive
                  </option>
                </select>
              </div>
            </div>
          </section>

          {/* Role */}
          <section className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Section 02
              </p>

              <h2 className="mt-1 text-base font-semibold text-slate-900">
                Role & Access
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Choose the operational role for this
                staff account.
              </p>
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-7">
              {ROLES.map((role) => {
                const selected =
                  form.role === role.value;

                return (
                  <button
                    type="button"
                    key={role.value}
                    onClick={() =>
                      updateField(
                        "role",
                        role.value,
                      )
                    }
                    className={`relative min-h-[125px] border p-4 text-left transition ${
                      selected
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {selected && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-white text-slate-950">
                        <Check size={12} />
                      </span>
                    )}

                    <p className="pr-5 text-sm font-semibold">
                      {role.label}
                    </p>

                    <p
                      className={`mt-2 text-xs leading-5 ${
                        selected
                          ? "text-slate-300"
                          : "text-slate-400"
                      }`}
                    >
                      {role.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {errors.role && (
              <p className="px-5 pb-5 text-xs text-rose-600 sm:px-7">
                {errors.role}
              </p>
            )}

            {selectedRole && (
              <div className="mx-5 mb-5 flex gap-3 border border-slate-200 bg-slate-50 p-4 sm:mx-7">
                <Info
                  size={16}
                  className="mt-0.5 shrink-0 text-slate-500"
                />

                <div>
                  <p className="text-xs font-semibold text-slate-700">
                    Selected role
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {selectedRole.label} —{" "}
                    {selectedRole.description}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Branch access */}
          <section className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Section 03
              </p>

              <h2 className="mt-1 text-base font-semibold text-slate-900">
                Branch Access
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Assign the branches where this staff
                member can operate.
              </p>
            </div>

            <div className="p-5 sm:p-7">
              {loadingBranches ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-14 animate-pulse bg-slate-100"
                    />
                  ))}
                </div>
              ) : branches.length ? (
                <div className="space-y-2">
                  {branches.map((branch) => {
                    const selected =
                      form.branchIds.includes(
                        branch._id,
                      );

                    return (
                      <button
                        type="button"
                        key={branch._id}
                        onClick={() =>
                          toggleBranch(
                            branch._id,
                          )
                        }
                        className={`flex w-full items-center justify-between border p-4 text-left transition ${
                          selected
                            ? "border-slate-950 bg-slate-50"
                            : "border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-5 w-5 items-center justify-center border ${
                              selected
                                ? "border-slate-950 bg-slate-950 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {selected && (
                              <Check size={12} />
                            )}
                          </span>

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {branch.name ||
                                branch.branchName ||
                                "Unnamed branch"}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {branch.code ||
                                branch.city ||
                                "Active branch"}
                            </p>
                          </div>
                        </div>

                        {selected && (
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                            Assigned
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-slate-200 px-5 py-10 text-center">
                  <p className="text-sm font-medium text-slate-600">
                    No active branches found
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Create an active branch before
                    assigning staff.
                  </p>
                </div>
              )}

              {errors.branchIds && (
                <p className="mt-2 text-xs text-rose-600">
                  {errors.branchIds}
                </p>
              )}

              {form.branchIds.length > 0 && (
                <div className="mt-6">
                  <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Default branch
                  </label>

                  <select
                    value={
                      form.defaultBranchId
                    }
                    onChange={(e) =>
                      updateField(
                        "defaultBranchId",
                        e.target.value,
                      )
                    }
                    className="h-11 w-full border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400 focus:bg-white sm:max-w-md"
                  >
                    <option value="">
                      Select default branch
                    </option>

                    {branches
                      .filter((branch) =>
                        form.branchIds.includes(
                          branch._id,
                        ),
                      )
                      .map((branch) => (
                        <option
                          key={branch._id}
                          value={branch._id}
                        >
                          {branch.name ||
                            branch.branchName}
                        </option>
                      ))}
                  </select>

                  {errors.defaultBranchId && (
                    <p className="mt-2 text-xs text-rose-600">
                      {errors.defaultBranchId}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Credentials */}
          <section className="border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Section 04
              </p>

              <h2 className="mt-1 text-base font-semibold text-slate-900">
                Login Credentials
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                These credentials will be used by the
                staff member to sign in.
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
              <PasswordField
                label="Password"
                required
                value={form.password}
                show={showPassword}
                onToggle={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
                onChange={(value) =>
                  updateField(
                    "password",
                    value,
                  )
                }
                error={errors.password}
              />

              <PasswordField
                label="Confirm password"
                required
                value={
                  form.confirmPassword
                }
                show={showConfirmPassword}
                onToggle={() =>
                  setShowConfirmPassword(
                    (current) => !current,
                  )
                }
                onChange={(value) =>
                  updateField(
                    "confirmPassword",
                    value,
                  )
                }
                error={
                  errors.confirmPassword
                }
              />
            </div>
          </section>

          {/* Submit */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-4 border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-slate-700">
                Ready to create staff account?
              </p>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Review role and branch access before
                saving.
              </p>
            </div>

            <div className="ml-auto flex gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() =>
                  navigate("/staff")
                }
                className="h-10 border border-slate-200 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center gap-2 bg-slate-950 px-5 text-xs font-semibold uppercase tracking-[0.08em] text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={14} />

                {saving
                  ? "Creating..."
                  : "Create staff"}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable fields                                                            */
/* -------------------------------------------------------------------------- */

function Field({
  label,
  required = false,
  type = "text",
  value,
  onChange,
  error,
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}

        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className={`h-11 w-full border bg-slate-50 px-3 text-sm text-slate-800 outline-none transition focus:bg-white ${
          error
            ? "border-rose-300 focus:border-rose-400"
            : "border-slate-200 focus:border-slate-400"
        }`}
      />

      {error && (
        <p className="mt-1.5 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

function PasswordField({
  label,
  required,
  value,
  show,
  onToggle,
  onChange,
  error,
}) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}

        {required && (
          <span className="ml-1 text-rose-500">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className={`h-11 w-full border bg-slate-50 px-3 pr-11 text-sm text-slate-800 outline-none transition focus:bg-white ${
            error
              ? "border-rose-300 focus:border-rose-400"
              : "border-slate-200 focus:border-slate-400"
          }`}
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center text-slate-400 hover:text-slate-700"
          aria-label={
            show
              ? "Hide password"
              : "Show password"
          }
        >
          {show ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}