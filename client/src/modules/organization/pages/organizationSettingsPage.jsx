import React, { useEffect, useState } from "react";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  Clock3,
  Save,
  Loader2,
  Users,
  MapPin,
} from "lucide-react";

import {
  getMyOrganization,
  getOrganizationSummary,
  updateMyOrganization,
} from "../api/oganization.api"

const initialForm = {
  name: "",
  email: "",
  phone: "",
  country: "India",
  currency: "INR",
  timezone: "Asia/Kolkata",
};

export default function OrganizationSettingsPage() {
  const [form, setForm] = useState(initialForm);
  const [organization, setOrganization] = useState(null);
  const [statistics, setStatistics] = useState({
    branches: 0,
    staff: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getOrganizationSummary();

      const data = response?.data;

      if (!data?.organization) {
        throw new Error("Organization information not found");
      }

      const org = data.organization;

      setOrganization(org);

      setStatistics(
        data.statistics || {
          branches: 0,
          staff: 0,
        }
      );

      setForm({
        name: org.name || "",
        email: org.email || "",
        phone: org.phone || "",
        country: org.country || "India",
        currency: org.currency || "INR",
        timezone: org.timezone || "Asia/Kolkata",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load organization"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setSuccess("");

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!form.name.trim()) {
      setError("Organization name is required");
      return;
    }

    if (!form.email.trim()) {
      setError("Organization email is required");
      return;
    }

    try {
      setSaving(true);

      const response = await updateMyOrganization({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        currency: form.currency.trim(),
        timezone: form.timezone.trim(),
      });

      const updatedOrganization = response?.data;

      if (updatedOrganization) {
        setOrganization(updatedOrganization);

        setForm({
          name: updatedOrganization.name || "",
          email: updatedOrganization.email || "",
          phone: updatedOrganization.phone || "",
          country: updatedOrganization.country || "India",
          currency: updatedOrganization.currency || "INR",
          timezone:
            updatedOrganization.timezone || "Asia/Kolkata",
        });
      }

      setSuccess(
        response?.message ||
          "Organization updated successfully"
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update organization"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading organization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                  <Building2 className="h-5 w-5" />
                </div>

                <div>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Organization Settings
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    Manage your organization information and regional settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Active Branches
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {statistics.branches}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <MapPin className="h-5 w-5 text-slate-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Active Staff
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {statistics.staff}
                </p>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Users className="h-5 w-5 text-slate-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-base font-semibold text-slate-900">
                Organization Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Update the details used across your VividOpt workspace.
              </p>
            </div>

            <div className="space-y-6 p-6">

              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Organization Name
                </label>

                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="VividOpt"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Organization Email
                </label>

                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phone
                </label>

                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* Country / Currency */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Country
                  </label>

                  <input
                    type="text"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Currency
                  </label>

                  <select
                    name="currency"
                    value={form.currency}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="INR">
                      INR — Indian Rupee
                    </option>
                    <option value="USD">
                      USD — US Dollar
                    </option>
                    <option value="AED">
                      AED — UAE Dirham
                    </option>
                    <option value="GBP">
                      GBP — British Pound
                    </option>
                    <option value="EUR">
                      EUR — Euro
                    </option>
                  </select>
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Timezone
                </label>

                <div className="relative">
                  <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="text"
                    name="timezone"
                    value={form.timezone}
                    onChange={handleChange}
                    placeholder="Asia/Kolkata"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Used for appointments, reports and other time-sensitive operations.
                </p>
              </div>

              {/* Save */}
              <div className="flex justify-end border-t border-slate-100 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Organization summary */}
          <aside className="space-y-6">

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">
                Organization
              </h3>

              <div className="mt-5 space-y-4">

                <div>
                  <p className="text-xs text-slate-400">
                    Organization ID
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-slate-600">
                    {organization?._id || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Slug
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {organization?.slug || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Status
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                      organization?.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : organization?.status === "suspended"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {organization?.status || "unknown"}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Created
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {organization?.createdAt
                      ? new Date(
                          organization.createdAt
                        ).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
              <Globe className="h-5 w-5 text-slate-300" />

              <h3 className="mt-4 text-sm font-semibold">
                Regional Configuration
              </h3>

              <p className="mt-2 text-xs leading-5 text-slate-400">
                Currency and timezone settings will be used throughout
                billing, appointments, reports and operational workflows.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-[11px] text-slate-400">
                    Currency
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {form.currency}
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 p-3">
                  <p className="text-[11px] text-slate-400">
                    Country
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {form.country}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}