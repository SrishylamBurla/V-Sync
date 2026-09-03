import { NavLink } from "react-router-dom";
import { BarChart3, Eye, Factory, Glasses, LayoutDashboard, Package, Settings, Wallet, UserCog } from "lucide-react";
import { useAuth } from "../../modules/auth/AuthContext";

const navigation = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard, roles: null },
  { label: "Clinical", path: "/clinical", icon: Eye, roles: ["super_admin", "organization_admin", "branch_manager", "optometrist", "doctor"] },
  { label: "Optical", path: "/optical", icon: Glasses, roles: ["super_admin", "organization_admin", "branch_manager", "sales_executive"] },
  { label: "Inventory", path: "/inventory", icon: Package, roles: ["super_admin", "organization_admin", "branch_manager", "inventory_manager"] },
  { label: "Laboratory", path: "/lab", icon: Factory, roles: ["super_admin", "organization_admin", "branch_manager", "lab_technician"] },
  { label: "Billing", path: "/billing", icon: Wallet, roles: ["super_admin", "organization_admin", "branch_manager", "cashier"] },
  { label: "Reports", path: "/reports", icon: BarChart3, roles: ["super_admin", "organization_admin", "branch_manager", "cashier"] },
  { label: "Staff", path: "/staff", icon: UserCog, roles: ["super_admin", "organization_admin", "branch_manager"] },
  { label: "Settings", path: "/settings", icon: Settings, roles: ["super_admin", "organization_admin", "branch_manager"] },
];

export default function Sidebar({ mobileOpen = false, onClose }) {
  const { user } = useAuth();
  const items = navigation.filter((item) => !item.roles || item.roles.includes(user?.role));
  return (
    <nav className={`${mobileOpen ? "flex" : "hidden"} fixed inset-x-0 top-16 z-40 border-b border-slate-200 bg-white p-3 shadow-xl lg:static lg:flex lg:items-center lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none`}>
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-1 px-1 lg:px-0">
        {items.map((item) => {
          const Icon = item.icon;
          return <NavLink key={item.path} to={item.path} onClick={onClose} className={({ isActive }) => `group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${isActive ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"}`}><Icon size={15} strokeWidth={1.9} /><span>{item.label}</span></NavLink>;
        })}
      </div>
    </nav>
  );
}
