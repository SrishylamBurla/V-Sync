import {
  Plus,
  RefreshCw,
  Download,
  Printer,
} from "lucide-react";

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getStaff,
  updateStaffStatus,
} from "../api/staff.api";

import StaffStats from "../components/StaffStats";
import StaffFilters from "../components/StaffFilters";
import StaffTable from "../components/StaffTable";

export default function StaffListPage() {
  const navigate = useNavigate();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");

  const [pagination, setPagination] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
  });

  /**
   * Load staff
   */
  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getStaff({
        page: 1,
        limit: 100,

        search: search.trim() || undefined,

        status:
          status && status !== "all"
            ? status
            : undefined,

        role:
          role && role !== "all"
            ? role
            : undefined,
      });

      const records = response?.data || [];

      setStaff(records);

      setPagination(
        response?.pagination || null
      );

      /**
       * Calculate statistics from the
       * currently loaded organization staff.
       */
      const total = records.length;

      const active = records.filter(
        (member) =>
          member.status === "active"
      ).length;

      const inactive = records.filter(
        (member) =>
          member.status === "inactive"
      ).length;

      const suspended = records.filter(
        (member) =>
          member.status === "suspended"
      ).length;

      setStats({
        total,
        active,
        inactive,
        suspended,
      });
    } catch (error) {
      console.error(
        "Failed to load staff:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to load staff"
      );

      setStaff([]);

      setStats({
        total: 0,
        active: 0,
        inactive: 0,
        suspended: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [search, status, role]);

  /**
   * Load whenever filters change.
   */
  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  /**
   * Deactivate staff
   */
  const handleDeactivate = async (member) => {
    const name = [
      member.firstName,
      member.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const confirmed = window.confirm(
      `Deactivate ${
        name || "this staff member"
      }?`
    );

    if (!confirmed) return;

    try {
      await updateStaffStatus(
        member._id,
        "inactive"
      );

      await loadStaff();
    } catch (error) {
      console.error(
        "Failed to deactivate staff:",
        error
      );

      window.alert(
        error?.response?.data?.message ||
          "Unable to deactivate staff member."
      );
    }
  };

  /**
   * Activate staff
   */
  const handleActivate = async (member) => {
    const name = [
      member.firstName,
      member.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    const confirmed = window.confirm(
      `Activate ${
        name || "this staff member"
      }?`
    );

    if (!confirmed) return;

    try {
      await updateStaffStatus(
        member._id,
        "active"
      );

      await loadStaff();
    } catch (error) {
      console.error(
        "Failed to activate staff:",
        error
      );

      window.alert(
        error?.response?.data?.message ||
          "Unable to activate staff member."
      );
    }
  };

  /**
   * Clear filters
   */
  const handleClearFilters = () => {
    setSearch("");
    setStatus("");
    setRole("");
  };

  /**
   * Export current staff register
   */
  const handleExport = () => {
    if (!staff.length) {
      window.alert(
        "There are no staff records to export."
      );

      return;
    }

    const rows = [
      [
        "Name",
        "Email",
        "Phone",
        "Role",
        "Status",
        "Branches",
        "Default Branch",
        "Created",
      ],

      ...staff.map((member) => {
        const name = [
          member.firstName,
          member.lastName,
        ]
          .filter(Boolean)
          .join(" ");

        const branches =
          Array.isArray(member.branchIds)
            ? member.branchIds
                .map((branch) => {
                  if (
                    typeof branch === "string"
                  ) {
                    return branch;
                  }

                  return (
                    branch?.name ||
                    branch?.code ||
                    ""
                  );
                })
                .filter(Boolean)
                .join(" | ")
            : "";

        const defaultBranch =
          typeof member.defaultBranchId ===
          "object"
            ? member.defaultBranchId?.name ||
              member.defaultBranchId?.code ||
              ""
            : member.defaultBranchId || "";

        return [
          name,
          member.email || "",
          member.phone || "",
          member.role || "",
          member.status || "",
          branches,
          defaultBranch,
          member.createdAt || "",
        ];
      }),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replaceAll(
                '"',
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download = "staff-register.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#f5f7f9]">
      <main className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:px-8">
        {/* PAGE HEADER */}
        <div className="mb-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                Administration
              </p>

              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Staff Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Manage staff accounts, roles,
                branch access and permissions
                from one operational workspace.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadStaff}
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 border border-slate-200 bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={14}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

                Refresh
              </button>

              <button
                type="button"
                onClick={handleExport}
                className="inline-flex h-10 items-center gap-2 border border-slate-200 bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 transition hover:bg-slate-50"
              >
                <Download size={14} />

                Export
              </button>

              <button
                type="button"
                onClick={() =>
                  window.print()
                }
                className="inline-flex h-10 items-center gap-2 border border-slate-200 bg-white px-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 transition hover:bg-slate-50"
              >
                <Printer size={14} />

                Print
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/staff/new")
                }
                className="inline-flex h-10 items-center gap-2 bg-slate-950 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-slate-800"
              >
                <Plus size={15} />

                New staff
              </button>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-center justify-between border border-rose-200 bg-rose-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-rose-700">
                Unable to load staff
              </p>

              <p className="mt-0.5 text-xs text-rose-500">
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={loadStaff}
              className="text-xs font-semibold text-rose-700 underline underline-offset-4"
            >
              Retry
            </button>
          </div>
        )}

        {/* DOCUMENT */}
        <article className="border border-slate-200 bg-white">
          {/* DOCUMENT HEADER */}
          <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Staff
                </p>

                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Staff Management
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/staff/new")
                }
                className="inline-flex h-9 items-center gap-2 border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Plus size={14} />

                Add record
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="border-b border-slate-200 p-5 sm:p-7">
            <StaffStats stats={stats} />
          </div>

          {/* REGISTER */}
          <section>
            <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
              <div className="mb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Section 01
                </p>

                <h3 className="mt-1 text-base font-semibold text-slate-900">
                  Staff Register
                </h3>
              </div>

              <StaffFilters
                search={search}
                status={status}
                role={role}
                onSearchChange={setSearch}
                onStatusChange={setStatus}
                onRoleChange={setRole}
                onClear={handleClearFilters}
              />
            </div>

            <div className="p-5 sm:p-7">
              <StaffTable
                staff={staff}
                loading={loading}
                onView={(member) =>
                  navigate(
                    `/staff/${member._id}`
                  )
                }
                onEdit={(member) =>
                  navigate(
                    `/staff/${member._id}/edit`
                  )
                }
                onResetPassword={(member) => {
                  navigate(
                    `/staff/${member._id}/edit`,
                    {
                      state: {
                        openResetPassword: true,
                      },
                    }
                  );
                }}
                onDeactivate={
                  handleDeactivate
                }
                onActivate={handleActivate}
              />

              {/* PAGINATION SUMMARY */}
              {pagination && (
                <div className="mt-4 flex flex-col justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center">
                  <span>
                    Showing{" "}
                    <span className="font-medium text-slate-600">
                      {staff.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-slate-600">
                      {pagination.total || 0}
                    </span>{" "}
                    staff members
                  </span>

                  <span>
                    Page{" "}
                    <span className="font-medium text-slate-600">
                      {pagination.page || 1}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-slate-600">
                      {pagination.totalPages || 1}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* ROLES */}
          <section className="border-t border-slate-200">
            <div className="px-5 py-5 sm:px-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Section 02
              </p>

              <h3 className="mt-1 text-base font-semibold text-slate-900">
                Roles & Permissions
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Select a staff member to review
                their access and permissions.
              </p>
            </div>

            <div className="border-t border-slate-100 px-5 py-12 text-center sm:px-7">
              <p className="text-sm font-medium text-slate-600">
                Select a staff member
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Role and branch access will
                appear here when a record is
                selected.
              </p>
            </div>
          </section>

          {/* ACTIVITY */}
          <section className="border-t border-slate-200">
            <div className="px-5 py-5 sm:px-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Section 03
              </p>

              <h3 className="mt-1 text-base font-semibold text-slate-900">
                Activity
              </h3>
            </div>

            <div className="border-t border-slate-100 px-5 py-10 sm:px-7">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="border border-slate-200 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Staff accounts
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {stats.total}
                  </p>
                </div>

                <div className="border border-slate-200 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Active accounts
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {stats.active}
                  </p>
                </div>

                <div className="border border-slate-200 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Inactive accounts
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-800">
                    {stats.inactive}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ACCOUNT NOTES */}
          <section className="border-t border-slate-200">
            <div className="px-5 py-5 sm:px-7">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Section 04
              </p>

              <h3 className="mt-1 text-base font-semibold text-slate-900">
                Account Notes
              </h3>
            </div>

            <div className="grid grid-cols-1 border-t border-slate-100 sm:grid-cols-3">
              <div className="border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r sm:px-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Created
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Staff account management
                </p>
              </div>

              <div className="border-b border-slate-100 px-5 py-4 sm:border-b-0 sm:border-r sm:px-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Access
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Role and branch controlled
                </p>
              </div>

              <div className="px-5 py-4 sm:px-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Audit
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Changes tracked by account
                </p>
              </div>
            </div>
          </section>
        </article>

        <footer className="py-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            VividOpt · Practice Management
          </p>
        </footer>
      </main>
    </div>
  );
}