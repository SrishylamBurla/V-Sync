import {
  Search,
  X,
} from "lucide-react";

export default function BranchFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onClear,
}) {
  const hasFilters = search || status;

  return (
    <div className="border border-slate-200 bg-white p-3">
      <div className="flex flex-col gap-3 md:flex-row">
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
            placeholder="Search branches..."
            className="h-10 w-full border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          />
        </div>

        <select
          value={status}
          onChange={(e) =>
            onStatusChange(e.target.value)
          }
          className="h-10 min-w-[150px] border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-400"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">
            Suspended
          </option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-10 items-center justify-center gap-2 border border-slate-200 px-4 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600 hover:bg-slate-50"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}