import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  Glasses,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  WalletCards,
  Wrench,
  X,
} from "lucide-react";
import { useAuth } from "../../modules/auth/AuthContext";
import { canAccessModule } from "../../config/access";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  organization_admin: "Organization Admin",
  branch_manager: "Branch Manager",
  optometrist: "Optometrist",
  doctor: "Doctor",
  sales_executive: "Sales Executive",
  cashier: "Cashier",
  inventory_manager: "Inventory Manager",
  lab_technician: "Lab Technician",
  receptionist: "Receptionist",
};

const PLATFORM_NAV = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Organizations", to: "/admin/organizations" },
  { label: "Reports", to: "/reports" },
  { label: "Settings", to: "/settings" },
];

const PATIENT_NAV = [
  { label: "Patients", to: "/patients", icon: Users, access: "patients" },
  {
    label: "Appointments",
    to: "/appointments",
    icon: CalendarDays,
    access: "appointments",
  },
  {
    label: "Recall list",
    to: "/recall",
    icon: Activity,
    access: "recall",
  },
  {
    label: "SMS / Email",
    to: "/communications",
    icon: Bell,
    access: "communications",
  },
];

const CLINICAL_NAV = [
  {
    label: "Clinical Management",
    to: "/clinical",
    icon: Stethoscope,
    access: "clinical",
  },
  {
    label: "Optical Management",
    to: "/optical",
    icon: Glasses,
    access: "optical",
  },
  {
    label: "Dispensing",
    to: "/dispensing",
    icon: ClipboardList,
    access: "dispensing",
  },
  {
    label: "Laboratory",
    to: "/lab",
    icon: Activity,
    access: "laboratory",
  },
];

const FINANCE_NAV = [
  {
    label: "Billing",
    to: "/billing",
    icon: WalletCards,
    access: "billing",
  },
  {
    label: "Finance",
    to: "/finance",
    icon: WalletCards,
    access: "finance",
  },
  {
    label: "Reports",
    to: "/reports",
    icon: FileBarChart,
    access: "reports",
  },
];

const INVENTORY_NAV = [
  {
    label: "Inventory",
    to: "/inventory",
    icon: Boxes,
    access: "inventory",
  },
  {
    label: "Catalogue",
    to: "/catalogue",
    icon: ClipboardList,
    access: "catalogue",
  },
];

const MAINTENANCE_NAV = [
  {
    label: "Staff",
    to: "/staff",
    icon: Users,
    access: "staff",
  },
  {
    label: "Branches",
    to: "/branches",
    icon: Building2,
    access: "branches",
  },
  {
    label: "Settings",
    to: "/settings",
    icon: Settings,
    access: "settings",
  },
];

const idOf = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.toString?.() || "";
};

const pathMatches = (pathname, path) => {
  if (path === "/dashboard") return pathname === "/dashboard";
  return pathname === path || pathname.startsWith(`${path}/`);
};

const sectionActive = (pathname, items) =>
  items.some((item) => pathMatches(pathname, item.to));

function TopNavLink({ to, children, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          "relative inline-flex h-11 shrink-0 items-center justify-center",
          "px-3.5 text-[13px] font-medium leading-none whitespace-nowrap",
          "transition-colors duration-150",
          isActive ? "text-slate-950" : "text-slate-500 hover:text-slate-900",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span>{children}</span>
          {isActive && (
            <span className="absolute inset-x-3.5 bottom-0 h-0.5 rounded-full bg-slate-950" />
          )}
        </>
      )}
    </NavLink>
  );
}

function Dropdown({ label, items, pathname, onNavigate }) {
  const active = sectionActive(pathname, items);

  return (
    <div className="group relative">
      <button
        type="button"
        className={[
          "relative inline-flex h-11 shrink-0 items-center justify-center gap-1.5",
          "px-3.5 text-[13px] font-medium leading-none whitespace-nowrap",
          "transition-colors duration-150",
          active ? "text-slate-950" : "text-slate-500 hover:text-slate-900",
        ].join(" ")}
      >
        <span>{label}</span>
        <ChevronDown
          size={13}
          strokeWidth={1.8}
          className="transition-transform duration-150 group-hover:rotate-180"
        />
        {active && (
          <span className="absolute inset-x-3.5 bottom-0 h-0.5 rounded-full bg-slate-950" />
        )}
      </button>

      <div
        className={[
          "invisible absolute left-0 top-full z-50 mt-1 w-60 translate-y-1",
          "overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5",
          "opacity-0 shadow-[0_12px_40px_rgba(15,23,42,0.12)]",
          "transition-all duration-150 group-hover:visible group-hover:translate-y-0",
          "group-hover:opacity-100",
        ].join(" ")}
      >
        {items.map((item) => {
          const Icon = item.icon;
          const activeItem = pathMatches(pathname, item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={[
                "flex h-10 items-center gap-3 rounded-lg px-3 text-[13px]",
                "font-medium leading-none transition-colors duration-150",
                activeItem
                  ? "bg-slate-100 text-slate-950"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
              ].join(" ")}
            >
              <Icon size={15} strokeWidth={1.8} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

function MobileSection({ label, items, pathname, onNavigate }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-2">
      <div className="px-2 pb-1.5 pt-1 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">
        {label}
      </div>

      <div className="grid gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathMatches(pathname, item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={[
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium",
                active
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-600 hover:bg-white hover:text-slate-950",
              ].join(" ")}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </section>
  );
}

export default function Topbar() {
  const { user, organization, branches = [], logout } = useAuth();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef(null);

  const role = user?.role;
  const isSuperAdmin = role === "super_admin";

  const filterItems = (items) =>
    items.filter((item) => canAccessModule(item.access, role));

  const patientNav = filterItems(PATIENT_NAV);
  const clinicalNav = filterItems(CLINICAL_NAV);
  const financeNav = filterItems(FINANCE_NAV);
  const inventoryNav = filterItems(INVENTORY_NAV);
  const maintenanceNav = filterItems(MAINTENANCE_NAV);

  const currentBranch = useMemo(() => {
    if (isSuperAdmin || !branches.length) return null;

    const defaultId = idOf(user?.defaultBranchId);

    return (
      branches.find((branch) => idOf(branch) === defaultId) ||
      branches[0] ||
      null
    );
  }, [branches, isSuperAdmin, user?.defaultBranchId]);

  const roleLabel = ROLE_LABELS[role] || "Staff";
  const organizationName = organization?.name || "Organization";

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const closeMenus = () => {
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const mobileSections = [
    { label: "Patients & Care", items: patientNav },
    { label: "Dispensing", items: clinicalNav },
    { label: "Financial", items: financeNav },
    { label: "Inventory", items: inventoryNav },
    { label: "Maintenance", items: maintenanceNav },
  ].filter((section) => section.items.length);

  return (
    <header
      ref={rootRef}
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center gap-4 px-3 sm:px-5 lg:px-7">
        <NavLink
          to="/dashboard"
          className="flex shrink-0 items-center gap-2.5"
          onClick={closeMenus}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
            <Activity size={18} strokeWidth={2.2} />
          </span>

          <span className="hidden sm:block">
            <span className="block text-[15px] font-bold tracking-tight text-slate-950">
              V-Sync
            </span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Vision Platform
            </span>
          </span>
        </NavLink>

        <div className="hidden h-7 w-px bg-slate-200 lg:block" />

        <div className="hidden min-w-0 flex-1 items-center lg:flex">
          <div className="relative w-full max-w-[330px]">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="search"
              placeholder="Search patients, appointments..."
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {!isSuperAdmin && (
            <div className="hidden max-w-[260px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 md:flex">
              <Building2 size={15} className="shrink-0 text-slate-400" />
              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold text-slate-800">
                  {organizationName}
                </div>
                <div className="truncate text-[10px] text-slate-400">
                  {currentBranch?.name || "Default branch"}
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Notifications"
          >
            <Bell size={18} strokeWidth={1.8} />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-slate-50"
              aria-expanded={profileOpen}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-white">
                {(user?.firstName?.[0] || "U").toUpperCase()}
                {(user?.lastName?.[0] || "").toUpperCase()}
              </span>

              <span className="hidden text-left xl:block">
                <span className="block max-w-[125px] truncate text-[12px] font-semibold text-slate-800">
                  {[user?.firstName, user?.lastName]
                    .filter(Boolean)
                    .join(" ") || "User"}
                </span>
                <span className="block text-[10px] text-slate-400">
                  {roleLabel}
                </span>
              </span>

              <ChevronDown
                size={14}
                className="hidden text-slate-400 xl:block"
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.12)]">
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="text-[13px] font-semibold text-slate-900">
                    {[user?.firstName, user?.lastName]
                      .filter(Boolean)
                      .join(" ") || "User"}
                  </div>
                  <div className="mt-0.5 truncate text-[11px] text-slate-400">
                    {user?.email || ""}
                  </div>
                </div>

                <div className="p-1.5">
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] text-slate-600">
                    <ShieldCheck size={16} />
                    <span>{roleLabel}</span>
                  </div>

                  {!isSuperAdmin && (
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] text-slate-600">
                      <Building2 size={16} />
                      <span className="truncate">{organizationName}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      <div className="hidden border-t border-slate-100 lg:block">
        <nav className="mx-auto flex h-11 w-full max-w-[1500px] items-center overflow-visible px-3 sm:px-5 lg:px-7">
          {isSuperAdmin ? (
            PLATFORM_NAV.map((item) => (
              <TopNavLink key={item.to} to={item.to} onNavigate={closeMenus}>
                {item.label}
              </TopNavLink>
            ))
          ) : (
            <>
              <TopNavLink to="/dashboard" onNavigate={closeMenus}>
                Dashboard
              </TopNavLink>

              {patientNav.length > 0 && (
                <Dropdown
                  label="Patients & Care"
                  items={patientNav}
                  pathname={location.pathname}
                  onNavigate={closeMenus}
                />
              )}

              {clinicalNav.length > 0 && (
                <Dropdown
                  label="Dispensing"
                  items={clinicalNav}
                  pathname={location.pathname}
                  onNavigate={closeMenus}
                />
              )}

              {financeNav.length > 0 && (
                <Dropdown
                  label="Financial"
                  items={financeNav}
                  pathname={location.pathname}
                  onNavigate={closeMenus}
                />
              )}

              {inventoryNav.length > 0 && (
                <Dropdown
                  label="Inventory"
                  items={inventoryNav}
                  pathname={location.pathname}
                  onNavigate={closeMenus}
                />
              )}

              {maintenanceNav.length > 0 && (
                <Dropdown
                  label="Maintenance"
                  items={maintenanceNav}
                  pathname={location.pathname}
                  onNavigate={closeMenus}
                />
              )}
            </>
          )}

          <div className="ml-auto flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
            <Wrench size={13} />
            <span>{isSuperAdmin ? "Platform" : "Workspace"}</span>
          </div>
        </nav>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto max-h-[calc(100vh-64px)] overflow-y-auto px-3 py-3 sm:px-5">
            <div className="relative mb-3">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="search"
                placeholder="Search patients, appointments..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] outline-none"
              />
            </div>

            {isSuperAdmin ? (
              <div className="grid gap-1">
                {PLATFORM_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/dashboard"}
                    onClick={closeMenus}
                    className={({ isActive }) =>
                      [
                        "rounded-lg px-3 py-2.5 text-[13px] font-medium",
                        isActive
                          ? "bg-slate-100 text-slate-950"
                          : "text-slate-600 hover:bg-slate-50",
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <NavLink
                  to="/dashboard"
                  end
                  onClick={closeMenus}
                  className={({ isActive }) =>
                    [
                      "flex items-center rounded-xl px-3 py-3 text-[13px] font-bold",
                      isActive
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 text-slate-700",
                    ].join(" ")
                  }
                >
                  Dashboard
                </NavLink>

                {mobileSections.map((section) => (
                  <MobileSection
                    key={section.label}
                    label={section.label}
                    items={section.items}
                    pathname={location.pathname}
                    onNavigate={closeMenus}
                  />
                ))}
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
