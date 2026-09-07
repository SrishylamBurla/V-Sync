import {
  Users,
  UserCheck,
  UserX,
  Clock3,
} from "lucide-react";

const cards = [
  {
    key: "total",
    label: "Total staff",
    icon: Users,
  },
  {
    key: "active",
    label: "Active",
    icon: UserCheck,
  },
  {
    key: "inactive",
    label: "Inactive",
    icon: UserX,
  },
  {
    key: "pending",
    label: "Pending",
    icon: Clock3,
  },
];

export default function StaffStats({ stats = {} }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.key}
            className="border border-slate-200 bg-white px-4 py-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {card.label}
                </p>

                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {stats[card.key] ?? 0}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center border border-slate-200 bg-slate-50">
                <Icon
                  size={15}
                  strokeWidth={1.8}
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