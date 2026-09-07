import {
  Building2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const items = [
  {
    key: "total",
    label: "Total branches",
    icon: Building2,
  },
  {
    key: "active",
    label: "Active",
    icon: CheckCircle2,
  },
  {
    key: "inactive",
    label: "Inactive",
    icon: XCircle,
  },
];

export default function BranchStats({
  stats = {},
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.key}
            className="border border-slate-200 bg-white p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {item.label}
                </p>

                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {stats[item.key] ?? 0}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-slate-50">
                <Icon
                  size={15}
                  className="text-slate-500"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}