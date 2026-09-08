import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Power,
  Ban,
  Users,
  MapPin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  getOrganizations,
  updateOrganizationStatus,
} from "../api/adminOrganization.api";

export default function AdminOrganizationsPage() {
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [error, setError] = useState("");

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const loadOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getOrganizations({
        page: pagination.page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: status !== "all" ? status : undefined,
      });

      setOrganizations(response?.data || []);

      setPagination(
        response?.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        }
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load organizations"
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, status]);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const handleSearch = (e) => {
    setSearch(e.target.value);

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);

    setPagination((prev) => ({
      ...prev,
      page: 1,
    }));
  };

  const handleStatus = async (organization, nextStatus) => {
    const confirmed = window.confirm(
      `Are you sure you want to mark "${organization.name}" as ${nextStatus}?`
    );

    if (!confirmed) return;

    try {
      await updateOrganizationStatus(
        organization._id,
        nextStatus
      );

      await loadOrganizations();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to update organization status"
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                <Building2 size={20} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Organizations
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage organizations registered on VividOpt.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate("/admin/organizations/new")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <Plus size={16} />
            Create Organization
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={handleSearch}
                placeholder="Search organizations..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </div>

            <select
              value={status}
              onChange={handleStatusChange}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-400"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              onClick={loadOrganizations}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading organizations...
            </div>
          ) : organizations.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-3 text-sm font-semibold text-slate-800">
                No organizations found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Organization
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Contact
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Country
                    </th>

                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {organizations.map((organization) => (
                    <tr
                      key={organization._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <Building2 size={17} />
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {organization.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {organization.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-700">
                          {organization.email || "—"}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {organization.phone || "No phone"}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <MapPin size={14} />
                          {organization.country || "India"}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            organization.status === "active"
                              ? "bg-emerald-50 text-emerald-700"
                              : organization.status === "suspended"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {organization.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            title="View"
                            onClick={() =>
                              navigate(
                                `/admin/organizations/${organization._id}`
                              )
                            }
                            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"
                          >
                            <Eye size={15} />
                          </button>

                          {organization.status === "active" ? (
                            <button
                              title="Suspend"
                              onClick={() =>
                                handleStatus(
                                  organization,
                                  "suspended"
                                )
                              }
                              className="rounded-lg border border-amber-200 p-2 text-amber-600 hover:bg-amber-50"
                            >
                              <Ban size={15} />
                            </button>
                          ) : (
                            <button
                              title="Activate"
                              onClick={() =>
                                handleStatus(
                                  organization,
                                  "active"
                                )
                              }
                              className="rounded-lg border border-emerald-200 p-2 text-emerald-600 hover:bg-emerald-50"
                            >
                              <Power size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && organizations.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <p className="text-xs text-slate-500">
                Showing {organizations.length} of{" "}
                {pagination.total} organizations
              </p>

              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: prev.page - 1,
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                >
                  Previous
                </button>

                <span className="flex items-center px-2 text-xs text-slate-500">
                  {pagination.page} /{" "}
                  {Math.max(pagination.pages, 1)}
                </span>

                <button
                  disabled={
                    pagination.page >= pagination.pages
                  }
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: prev.page + 1,
                    }))
                  }
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}