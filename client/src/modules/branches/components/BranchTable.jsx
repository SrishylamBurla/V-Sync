import {
  Eye,
  MoreHorizontal,
  Pencil,
  Power,
} from "lucide-react";

import BranchStatusBadge from "./BranchStatusBadge";

const formatDate = (date) => {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

export default function BranchTable({
  branches = [],
  loading = false,
  onView,
  onEdit,
  onStatusChange,
}) {
  if (loading) {
    return (
      <div className="border border-slate-200 bg-white p-5">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-14 animate-pulse bg-slate-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!branches.length) {
    return (
      <div className="border border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-700">
          No branches found
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Create a branch or change your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Branch
              </th>

              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Code
              </th>

              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Location
              </th>

              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Contact
              </th>

              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Status
              </th>

              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Updated
              </th>

              <th className="w-12 px-3 py-3" />
            </tr>
          </thead>

          <tbody>
            {branches.map((branch) => (
              <tr
                key={branch._id}
                className="border-b border-slate-100 hover:bg-slate-50/70"
              >
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() =>
                      onView?.(branch)
                    }
                    className="text-left"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {branch.name ||
                        branch.branchName ||
                        "Unnamed branch"}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {branch.address?.line1 ||
                        branch.address ||
                        "No address"}
                    </p>
                  </button>
                </td>

                <td className="px-5 py-4 text-sm text-slate-600">
                  {branch.code || "—"}
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm text-slate-600">
                    {branch.city || "—"}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {branch.state || ""}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <p className="text-sm text-slate-600">
                    {branch.phone || "—"}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    {branch.email || ""}
                  </p>
                </td>

                <td className="px-5 py-4">
                  <BranchStatusBadge
                    status={branch.status}
                  />
                </td>

                <td className="px-5 py-4 text-sm text-slate-500">
                  {formatDate(
                    branch.updatedAt ||
                      branch.createdAt,
                  )}
                </td>

                <td className="px-3 py-4">
                  <div className="group relative">
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <MoreHorizontal
                        size={17}
                      />
                    </button>

                    <div className="invisible absolute right-0 top-9 z-30 w-44 border border-slate-200 bg-white py-1 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() =>
                          onView?.(branch)
                        }
                        className="flex w-full items-center gap-3 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        <Eye size={14} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onEdit?.(branch)
                        }
                        className="flex w-full items-center gap-3 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          onStatusChange?.(
                            branch,
                          )
                        }
                        className="flex w-full items-center gap-3 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
                      >
                        <Power size={14} />
                        {branch.status ===
                        "active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}