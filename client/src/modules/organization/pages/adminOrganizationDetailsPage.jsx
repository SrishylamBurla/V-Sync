import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Edit3,
  MapPin,
  Users,
  Power,
  Ban,
  Loader2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getOrganization,
  updateOrganizationStatus,
} from "../api/adminOrganization.api";

export default function AdminOrganizationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrganization = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getOrganization(id);

      setData(response?.data || null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load organization"
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadOrganization();
  }, [loadOrganization]);

  const changeStatus = async (status) => {
    if (!data?.organization) return;

    const confirmed = window.confirm(
      `Change organization status to "${status}"?`
    );

    if (!confirmed) return;

    try {
      await updateOrganizationStatus(
        data.organization._id,
        status
      );

      await loadOrganization();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to update status"
      );
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

  if (!data?.organization) {
    return (
      <div className="p-6 text-sm text-red-600">
        {error || "Organization not found"}
      </div>
    );
  }

  const organization = data.organization;
  const statistics = data.statistics || {};

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() => navigate("/admin/organizations")}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={16} />
          Organizations
        </button>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Header */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Building2 size={24} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  {organization.name}
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  {organization.slug}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  navigate(
                    `/admin/organizations/${organization._id}/edit`
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Edit3 size={15} />
                Edit
              </button>

              {organization.status === "active" ? (
                <button
                  onClick={() => changeStatus("suspended")}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600"
                >
                  <Ban size={15} />
                  Suspend
                </button>
              ) : (
                <button
                  onClick={() => changeStatus("active")}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <Power size={15} />
                  Activate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Active Branches
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {statistics.branches ?? 0}
                </p>
              </div>

              <MapPin className="text-slate-400" size={20} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Active Staff
                </p>

                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {statistics.staff ?? 0}
                </p>
              </div>

              <Users className="text-slate-400" size={20} />
            </div>
          </div>
        </div>

        {/* Information */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Organization Information
            </h2>

            <div className="mt-5 space-y-4">
              <Info label="Name" value={organization.name} />
              <Info label="Email" value={organization.email} />
              <Info label="Phone" value={organization.phone} />
              <Info label="Country" value={organization.country} />
              <Info label="Currency" value={organization.currency} />
              <Info label="Timezone" value={organization.timezone} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Platform Information
            </h2>

            <div className="mt-5 space-y-4">
              <Info label="Organization ID" value={organization._id} mono />
              <Info label="Slug" value={organization.slug} mono />
              <Info
                label="Status"
                value={organization.status}
              />
              <Info
                label="Created"
                value={
                  organization.createdAt
                    ? new Date(
                        organization.createdAt
                      ).toLocaleString()
                    : "—"
                }
              />
              <Info
                label="Last Updated"
                value={
                  organization.updatedAt
                    ? new Date(
                        organization.updatedAt
                      ).toLocaleString()
                    : "—"
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono = false }) {
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-0">
      <span className="text-xs text-slate-400">
        {label}
      </span>

      <span
        className={`text-sm text-slate-700 ${
          mono ? "break-all font-mono text-xs" : ""
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}