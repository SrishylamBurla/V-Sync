import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Save,
  Loader2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getOrganization,
  updateOrganization,
} from "../api/adminOrganization.api";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  country: "India",
  currency: "INR",
  timezone: "Asia/Kolkata",
};

export default function EditOrganizationPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);

  const [organization, setOrganization] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadOrganization();
  }, [id]);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getOrganization(id);

      const org = response?.data?.organization;

      if (!org) {
        throw new Error("Organization not found");
      }

      setOrganization(org);

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
          "Unable to load organization"
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

    setError("");
    setSuccess("");
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

      await updateOrganization(id, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        country: form.country.trim(),
        currency: form.currency.trim(),
        timezone: form.timezone.trim(),
      });

      setSuccess("Organization updated successfully.");

      setTimeout(() => {
        navigate(`/admin/organizations/${id}`);
      }, 700);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update organization"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={17} className="animate-spin" />
          Loading organization...
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error || "Organization not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">

        {/* Back */}
        <button
          type="button"
          onClick={() =>
            navigate(`/admin/organizations/${id}`)
          }
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Back to organization
        </button>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Header */}
          <div className="border-b border-slate-100 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Building2 size={20} />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  Edit Organization
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Update organization information.
                </p>
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6"
          >
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

            <div className="grid gap-5 sm:grid-cols-2">

              {/* Name */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Organization Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Organization name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="organization@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phone
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Country */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Country
                </label>

                <input
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="India"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* Currency */}
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

              {/* Timezone */}
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Timezone
                </label>

                <input
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                  placeholder="Asia/Kolkata"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />

                <p className="mt-2 text-xs text-slate-400">
                  Used for appointments, reports and other
                  time-sensitive operations.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  navigate(`/admin/organizations/${id}`)
                }
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
          </form>
        </div>
      </div>
    </div>
  );
}