import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ChevronRight,
  Download,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import { getBranches } from "../api/branch.api";
import BranchStatusBadge from "../components/BranchStatusBadge";

export default function BranchListPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const loadBranches = async (showRefresh = false) => {
    try {
      setError("");

      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getBranches();

      setBranches(response?.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load branches"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const filteredBranches = useMemo(() => {
    const query = search.trim().toLowerCase();

    return branches.filter((branch) => {
      const matchesSearch =
        !query ||
        branch.name?.toLowerCase().includes(query) ||
        branch.code?.toLowerCase().includes(query) ||
        branch.city?.toLowerCase().includes(query) ||
        branch.address?.city?.toLowerCase().includes(query) ||
        branch.phone?.toLowerCase().includes(query);

      const matchesStatus =
        status === "all" || branch.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [branches, search, status]);

  const stats = useMemo(() => {
    const active = branches.filter(
      (branch) => branch.status === "active"
    ).length;

    const inactive = branches.filter(
      (branch) => branch.status === "inactive"
    ).length;

    return {
      total: branches.length,
      active,
      inactive,
    };
  }, [branches]);

  const exportBranches = () => {
    const headers = [
      "Name",
      "Code",
      "Phone",
      "Email",
      "City",
      "State",
      "GSTIN",
      "Status",
    ];

    const rows = filteredBranches.map((branch) => [
      branch.name || "",
      branch.code || "",
      branch.phone || "",
      branch.email || "",
      branch.address?.city || "",
      branch.address?.state || "",
      branch.gstin || "",
      branch.status || "",
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "branches.csv";
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <main className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <section className="mb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <Building2 size={14} />
                Administration
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Branch Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage your organization&apos;s optical stores, clinics and
                operating locations from one workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadBranches(true)}
                disabled={refreshing}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={exportBranches}
                disabled={!filteredBranches.length}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={16} />
                Export
              </button>

              <Link
                to="/branches/new"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus size={17} />
                New Branch
              </Link>
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Branches"
            value={stats.total}
            icon={<Building2 size={18} />}
          />

          <StatCard
            label="Active"
            value={stats.active}
            icon={
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            }
          />

          <StatCard
            label="Inactive"
            value={stats.inactive}
            icon={
              <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            }
          />
        </section>

        {/* Workspace */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Filters */}
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-md">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search branches..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value)
                  }
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <LoadingState />
            ) : filteredBranches.length === 0 ? (
              <EmptyState
                hasFilters={Boolean(search || status !== "all")}
              />
            ) : (
              <table className="min-w-[850px] w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Branch
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Location
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Contact
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      GSTIN
                    </th>

                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                    <th className="w-12 px-5 py-3" />
                  </tr>
                </thead>

                <tbody>
                  {filteredBranches.map((branch) => (
                    <tr
                      key={branch._id}
                      className="group border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-4">
                        <Link
                          to={`/branches/${branch._id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                            <Building2 size={19} />
                          </div>

                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 group-hover:text-slate-700">
                              {branch.name}
                            </div>

                            <div className="mt-0.5 text-xs text-slate-500">
                              {branch.code}
                            </div>
                          </div>
                        </Link>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <MapPin
                            size={15}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />

                          <div>
                            <div>
                              {branch.address?.city || "—"}
                              {branch.address?.state
                                ? `, ${branch.address.state}`
                                : ""}
                            </div>

                            {branch.address?.pincode && (
                              <div className="mt-0.5 text-xs text-slate-400">
                                {branch.address.pincode}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {branch.phone ? (
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone
                              size={15}
                              className="text-slate-400"
                            />
                            {branch.phone}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">
                            —
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-slate-600">
                          {branch.gstin || "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <BranchStatusBadge
                          status={branch.status}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          to={`/branches/${branch._id}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <ChevronRight size={17} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && filteredBranches.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50/50 px-5 py-3 text-xs text-slate-500">
              Showing {filteredBranches.length} of {branches.length} branches
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">
          {label}
        </span>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
          {icon}
        </div>
      </div>

      <div className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-8">
      <div className="space-y-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-14 animate-pulse rounded-lg bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ hasFilters }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        <Building2 size={21} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        {hasFilters
          ? "No branches match your filters"
          : "No branches yet"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {hasFilters
          ? "Try changing your search or status filter."
          : "Create your first branch to start managing your organization."}
      </p>

      {!hasFilters && (
        <Link
          to="/branches/new"
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Plus size={16} />
          Create Branch
        </Link>
      )}
    </div>
  );
}