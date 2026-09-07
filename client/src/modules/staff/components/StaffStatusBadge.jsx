const STATUS_CONFIG = {
  active: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200",
  },

  inactive: {
    label: "Inactive",
    className:
      "bg-slate-100 text-slate-600 border-slate-200",
  },

  suspended: {
    label: "Suspended",
    className:
      "bg-rose-50 text-rose-700 border-rose-200",
  },

  pending: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-700 border-amber-200",
  },
};

export default function StaffStatusBadge({ status }) {
  const config =
    STATUS_CONFIG[status] || STATUS_CONFIG.inactive;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] ${config.className}`}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />

      {config.label}
    </span>
  );
}