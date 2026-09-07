import {
  MoreHorizontal,
  Eye,
  Pencil,
  KeyRound,
  UserX,
  UserCheck,
} from "lucide-react";

import StaffStatusBadge from "./StaffStatusBadge";

const ROLE_LABELS = {
  branch_manager: "Branch Manager",
  optometrist: "Optometrist",
  doctor: "Doctor",
  sales_executive: "Sales Executive",
  cashier: "Cashier",
  inventory_manager: "Inventory Manager",
  lab_technician: "Lab Technician",
  receptionist: "Receptionist",
};

const formatRole = (role) => {
  return (
    ROLE_LABELS[role] ||
    role
      ?.replaceAll("_", " ")
      ?.replace(/\b\w/g, (char) =>
        char.toUpperCase(),
      ) ||
    "Staff"
  );
};

const getStaffName = (staff) => {
  return [staff.firstName, staff.lastName]
    .filter(Boolean)
    .join(" ");
};

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
};

const getBranches = (staff) => {
  if (Array.isArray(staff.branchIds)) {
    return staff.branchIds;
  }

  if (Array.isArray(staff.branches)) {
    return staff.branches;
  }

  return [];
};

const getBranchLabel = (branch) => {
  if (!branch) return null;

  if (typeof branch === "string") {
    return branch;
  }

  return (
    branch.name ||
    branch.code ||
    null
  );
};

export default function StaffTable({
  staff = [],
  loading = false,
  onView,
  onEdit,
  onResetPassword,
  onDeactivate,
  onActivate,
}) {
  if (loading) {
    return (
      <div className="border border-slate-200 bg-white">
        <div className="space-y-3 p-5">
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

  if (!staff.length) {
    return (
      <div className="border border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-700">
          No staff records found
        </p>

        <p className="mt-1 text-xs text-slate-400">
          Try changing your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Staff
              </th>

              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Role
              </th>

              <th className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Branches
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
            {staff.map((member) => {
              const name =
                getStaffName(member) ||
                "Unnamed staff";

              const branches =
                getBranches(member);

              const branchLabels = branches
                .map(getBranchLabel)
                .filter(Boolean);

              const isActive =
                member.status === "active";

              return (
                <tr
                  key={member._id}
                  className="border-b border-slate-100 transition hover:bg-slate-50/70"
                >
                  {/* STAFF */}
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        onView?.(member)
                      }
                      className="text-left"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {name}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {member.email ||
                          member.phone ||
                          "No contact information"}
                      </p>
                    </button>
                  </td>

                  {/* ROLE */}
                  <td className="px-5 py-4">
                    <span className="text-sm text-slate-600">
                      {formatRole(member.role)}
                    </span>
                  </td>

                  {/* BRANCHES */}
                  <td className="px-5 py-4">
                    {branchLabels.length ? (
                      <div className="flex max-w-[280px] flex-wrap gap-1.5">
                        {branchLabels
                          .slice(0, 2)
                          .map((label, index) => (
                            <span
                              key={`${label}-${index}`}
                              className="inline-flex items-center border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600"
                            >
                              {label}
                            </span>
                          ))}

                        {branchLabels.length > 2 && (
                          <span className="inline-flex items-center px-1 py-1 text-[11px] font-medium text-slate-400">
                            +{branchLabels.length - 2} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">
                        No branch
                      </span>
                    )}
                  </td>

                  {/* STATUS */}
                  <td className="px-5 py-4">
                    <StaffStatusBadge
                      status={member.status}
                    />
                  </td>

                  {/* UPDATED */}
                  <td className="px-5 py-4 text-sm text-slate-500">
                    {formatDate(
                      member.updatedAt ||
                        member.createdAt,
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-3 py-4">
                    <div className="group relative">
                      <button
                        type="button"
                        aria-label={`Actions for ${name}`}
                        className="flex h-8 w-8 items-center justify-center text-slate-400 outline-none hover:bg-slate-100 hover:text-slate-700 focus:bg-slate-100 focus:text-slate-700"
                      >
                        <MoreHorizontal size={17} />
                      </button>

                      <div className="invisible absolute right-0 top-9 z-30 w-48 border border-slate-200 bg-white py-1 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                        {/* VIEW */}
                        <button
                          type="button"
                          onClick={() =>
                            onView?.(member)
                          }
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
                        >
                          <Eye size={14} />
                          View
                        </button>

                        {/* EDIT */}
                        <button
                          type="button"
                          onClick={() =>
                            onEdit?.(member)
                          }
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>

                        {/* RESET PASSWORD */}
                        <button
                          type="button"
                          onClick={() =>
                            onResetPassword?.(
                              member,
                            )
                          }
                          className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
                        >
                          <KeyRound size={14} />
                          Reset Password
                        </button>

                        <div className="my-1 border-t border-slate-100" />

                        {/* ACTIVATE / DEACTIVATE */}
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() =>
                              onDeactivate?.(
                                member,
                              )
                            }
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"
                          >
                            <UserX size={14} />
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              onActivate?.(
                                member,
                              )
                            }
                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs text-emerald-600 hover:bg-emerald-50"
                          >
                            <UserCheck size={14} />
                            Activate
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}