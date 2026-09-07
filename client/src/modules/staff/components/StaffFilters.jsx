import {
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

const roles = [
  {
    value: "",
    label: "All roles",
  },
  {
    value: "branch_manager",
    label: "Branch Manager",
  },
  {
    value: "optometrist",
    label: "Optometrist",
  },
  {
    value: "doctor",
    label: "Doctor",
  },
  {
    value: "sales_executive",
    label: "Sales Executive",
  },
  {
    value: "cashier",
    label: "Cashier",
  },
  {
    value: "inventory_manager",
    label: "Inventory Manager",
  },
  {
    value: "lab_technician",
    label: "Lab Technician",
  },
  {
    value: "receptionist",
    label: "Receptionist",
  },
];

const statuses = [
  {
    value: "",
    label: "All status",
  },
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
  {
    value: "suspended",
    label: "Suspended",
  },
];

export default function StaffFilters({
  search,
  status,
  role,
  onSearchChange,
  onStatusChange,
  onRoleChange,
  onClear,
}) {
  const hasFilters = search || status || role;

  return (
    <div className="border border-slate-200 bg-white p-3">
      <div className="flex flex-col gap-3 xl:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) =>
              onSearchChange(e.target.value)
            }
            placeholder="Search staff management..."
            className="h-10 w-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          />
        </div>

        {/* Role */}
        <div className="relative">
          <SlidersHorizontal
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <select
            value={role}
            onChange={(e) =>
              onRoleChange(e.target.value)
            }
            className="h-10 min-w-[190px] appearance-none border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            {roles.map((item) => (
              <option
                key={item.value}
                value={item.value}
              >
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <select
          value={status}
          onChange={(e) =>
            onStatusChange(e.target.value)
          }
          className="h-10 min-w-[150px] border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
        >
          {statuses.map((item) => (
            <option
              key={item.value}
              value={item.value}
            >
              {item.label}
            </option>
          ))}
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 transition hover:bg-slate-50"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}