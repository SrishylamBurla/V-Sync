import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Edit3,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  X,
} from "lucide-react";

import {
  getBranch,
  updateBranch,
} from "../api/branch.api";

import BranchStatusBadge from "../components/BranchStatusBadge";

const emptyAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

export default function BranchDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [branch, setBranch] = useState(null);
  const [form, setForm] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBranch = async (showRefresh = false) => {
    try {
      setError("");
      setSuccess("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getBranch(id);

      const data = response?.data;

      setBranch(data);

      setForm({
        name: data?.name || "",
        code: data?.code || "",
        phone: data?.phone || "",
        email: data?.email || "",
        gstin: data?.gstin || "",
        status: data?.status || "active",
        address: {
          ...emptyAddress,
          ...(data?.address || {}),
        },
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load branch."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBranch();
  }, [id]);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const updateAddress = (field, value) => {
    setForm((current) => ({
      ...current,
      address: {
        ...current.address,
        [field]: value,
      },
    }));
  };

  const cancelEdit = () => {
    if (!branch) return;

    setForm({
      name: branch.name || "",
      code: branch.code || "",
      phone: branch.phone || "",
      email: branch.email || "",
      gstin: branch.gstin || "",
      status: branch.status || "active",
      address: {
        ...emptyAddress,
        ...(branch.address || {}),
      },
    });

    setEditing(false);
    setError("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Branch name is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        gstin: form.gstin.trim().toUpperCase(),
        status: form.status,
        address: {
          line1: form.address.line1.trim(),
          line2: form.address.line2.trim(),
          city: form.address.city.trim(),
          state: form.address.state.trim(),
          pincode: form.address.pincode.trim(),
          country:
            form.address.country.trim() || "India",
        },
      };

      const response = await updateBranch(id, payload);

      const updatedBranch = response?.data;

      setBranch(updatedBranch);

      setForm({
        name: updatedBranch?.name || "",
        code: updatedBranch?.code || "",
        phone: updatedBranch?.phone || "",
        email: updatedBranch?.email || "",
        gstin: updatedBranch?.gstin || "",
        status: updatedBranch?.status || "active",
        address: {
          ...emptyAddress,
          ...(updatedBranch?.address || {}),
        },
      });

      setEditing(false);
      setSuccess("Branch updated successfully.");

      window.setTimeout(() => {
        setSuccess("");
      }, 3000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update branch."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!branch || !form) {
    return (
      <div className="min-h-screen bg-[#f5f7f9]">
        <main className="mx-auto max-w-[1100px] px-4 py-8">
          <Link
            to="/branches"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft size={16} />
            Back to branches
          </Link>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <Building2 className="mx-auto text-slate-400" size={28} />

            <h2 className="mt-3 font-semibold text-slate-900">
              Branch not found
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The requested branch could not be found.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <main className="mx-auto w-full max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">

        {/* Top navigation */}
        <div className="mb-5">
          <Link
            to="/branches"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to branches
          </Link>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-md p-1 hover:bg-red-100"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Header */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Building2 size={25} />
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Branch
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                      {branch.name}
                    </h1>

                    <BranchStatusBadge
                      status={branch.status}
                    />
                  </div>

                  <div className="mt-1 text-sm text-slate-500">
                    Branch code:{" "}
                    <span className="font-medium text-slate-700">
                      {branch.code}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadBranch(true)}
                  disabled={refreshing}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                >
                  <RefreshCw
                    size={16}
                    className={
                      refreshing ? "animate-spin" : ""
                    }
                  />
                  Refresh
                </button>

                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    <Edit3 size={16} />
                    Edit Branch
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs - visual for now */}
          <div className="flex overflow-x-auto border-t border-slate-200 px-5 sm:px-6">
            <button
              type="button"
              className="border-b-2 border-slate-900 px-1 py-3.5 text-sm font-medium text-slate-900"
            >
              Overview
            </button>

            <button
              type="button"
              disabled
              className="px-5 py-3.5 text-sm font-medium text-slate-400"
            >
              Staff
            </button>

            <button
              type="button"
              disabled
              className="px-5 py-3.5 text-sm font-medium text-slate-400"
            >
              Patients
            </button>

            <button
              type="button"
              disabled
              className="px-5 py-3.5 text-sm font-medium text-slate-400"
            >
              Appointments
            </button>

            <button
              type="button"
              disabled
              className="px-5 py-3.5 text-sm font-medium text-slate-400"
            >
              Activity
            </button>
          </div>
        </section>

        {/* Content */}
        <form
          onSubmit={handleSave}
          className="mt-5 space-y-5"
        >
          {/* Branch information */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title="Branch information"
              description="Core identification and operating status."
            />

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <Field
                label="Branch name"
                value={form.name}
                disabled={!editing}
                onChange={(value) =>
                  updateField("name", value)
                }
              />

              <Field
                label="Branch code"
                value={form.code}
                disabled
                helper="Branch code cannot be changed after creation."
              />

              <Field
                label="GSTIN"
                value={form.gstin}
                disabled={!editing}
                onChange={(value) =>
                  updateField(
                    "gstin",
                    value.toUpperCase()
                  )
                }
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Status
                </label>

                <select
                  value={form.status}
                  disabled={!editing}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
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

          {/* Contact */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title="Contact information"
              description="Customer-facing contact details for this branch."
            />

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <Field
                label="Phone"
                value={form.phone}
                disabled={!editing}
                onChange={(value) =>
                  updateField("phone", value)
                }
                icon={<Phone size={15} />}
              />

              <Field
                label="Email"
                type="email"
                value={form.email}
                disabled={!editing}
                onChange={(value) =>
                  updateField("email", value)
                }
                icon={<Mail size={15} />}
              />
            </div>
          </section>

          {/* Address */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title="Branch address"
              description="Physical location and postal information."
            />

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field
                  label="Address line 1"
                  value={form.address.line1}
                  disabled={!editing}
                  onChange={(value) =>
                    updateAddress("line1", value)
                  }
                />
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Address line 2"
                  value={form.address.line2}
                  disabled={!editing}
                  onChange={(value) =>
                    updateAddress("line2", value)
                  }
                />
              </div>

              <Field
                label="City"
                value={form.address.city}
                disabled={!editing}
                onChange={(value) =>
                  updateAddress("city", value)
                }
              />

              <Field
                label="State"
                value={form.address.state}
                disabled={!editing}
                onChange={(value) =>
                  updateAddress("state", value)
                }
              />

              <Field
                label="Pincode"
                value={form.address.pincode}
                disabled={!editing}
                onChange={(value) =>
                  updateAddress("pincode", value)
                }
              />

              <Field
                label="Country"
                value={form.address.country}
                disabled={!editing}
                onChange={(value) =>
                  updateAddress("country", value)
                }
              />
            </div>
          </section>

          {/* Branch metadata */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <SectionHeader
              title="Branch record"
              description="System information for this location."
            />

            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <InfoItem
                label="Branch ID"
                value={branch._id}
              />

              <InfoItem
                label="Organization ID"
                value={branch.organizationId}
              />

              <InfoItem
                label="Created"
                value={formatDate(branch.createdAt)}
              />

              <InfoItem
                label="Last updated"
                value={formatDate(branch.updatedAt)}
              />
            </div>
          </section>

          {/* Save actions */}
          {editing && (
            <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                You have unsaved changes.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  <X size={16} />
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

function SectionHeader({ title, description }) {
  return (
    <div className="border-b border-slate-200 px-5 py-4">
      <h2 className="font-semibold text-slate-900">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled = false,
  type = "text",
  helper,
  icon,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value || ""}
          disabled={disabled}
          onChange={(event) =>
            onChange?.(event.target.value)
          }
          className={`h-11 w-full rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 ${
            icon ? "pl-9" : ""
          }`}
        />
      </div>

      {helper && (
        <span className="mt-1.5 block text-xs text-slate-400">
          {helper}
        </span>
      )}
    </label>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 break-all text-sm text-slate-700">
        {value || "—"}
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-5">
          <div className="h-5 w-32 rounded bg-slate-200" />

          <div className="h-32 rounded-2xl bg-white" />

          <div className="h-56 rounded-2xl bg-white" />

          <div className="h-40 rounded-2xl bg-white" />
        </div>
      </main>
    </div>
  );
}