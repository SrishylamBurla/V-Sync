import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  Glasses,
  LogOut,
  Menu,
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

const PATIENT_NAV = [
  {
    label: "Patient Details",
    to: "/patients",
    icon: Users,
    access: "patients",
  },
  {
    label: "Appointments",
    icon: CalendarDays,
    access: "appointments",
    children: [
      { label: "Make", to: "/appointments?book=1", access: "appointments" },
      { label: "Move", to: "/appointments?mode=move", access: "appointments" },
      { label: "Modify", to: "/appointments?mode=modify", access: "appointments" },
      { label: "Setup", to: "/settings?section=appointments", access: "settings" },
    ],
  },
  {
    label: "Recall List",
    to: "/recall",
    icon: Activity,
    access: "recall",
  },
  {
    label: "SMS / Email",
    to: "/newsletters",
    icon: Bell,
    access: "newsletters",
  },
  {
    label: "Merge records",
    icon: Users,
    access: "patients",
    disabled: true,
    hint: "Not available yet",
  },
  {
    label: "Clinical Management",
    to: "/clinical",
    icon: Stethoscope,
    access: "clinical",
  },
];

const FINANCE_NAV = [
  { label: "Billing", to: "/billing", icon: WalletCards, access: "billing" },
  { label: "Outstanding", to: "/finance?tab=outstanding", icon: WalletCards, access: "finance" },
  { label: "Petty Cash", to: "/finance?tab=petty", icon: WalletCards, access: "finance" },
  { label: "Expenses", to: "/finance?tab=expenses", icon: WalletCards, access: "finance" },
  {
    label: "Business Activity Statement",
    icon: FileBarChart,
    access: "reports",
    disabled: true,
    hint: "Report not available yet",
  },
  { label: "Financial Year", to: "/reports?period=financial-year", icon: FileBarChart, access: "reports" },
  { label: "Reports", to: "/reports", icon: BarChart3, access: "reports" },
];

const INVENTORY_NAV = [
  { label: "Frame Details List", to: "/inventory?category=frame", icon: Boxes, access: "inventory" },
  { label: "Frame Stock-take", to: "/inventory?category=frame&action=stocktake", icon: CheckCircle2, access: "inventory" },
  { label: "Sundry Details", to: "/inventory?category=sundry", icon: Boxes, access: "inventory" },
  {
    label: "Adjustment Report",
    icon: FileBarChart,
    access: "inventory",
    disabled: true,
    hint: "Report not available yet",
  },
  { label: "Lens List", to: "/inventory?category=lens", icon: Glasses, access: "inventory" },
  { label: "Contact Lens List", to: "/catalogue?tab=contact-lenses", icon: Glasses, access: "catalogue" },
  {
    label: "Dispensing",
    icon: ClipboardList,
    access: "dispensing",
    children: [
      { label: "Dispensing Overview", to: "/dispensing", access: "dispensing" },
      { label: "Spectacle Jobs", to: "/dispensing/spectacle-jobs", access: "dispensing" },
      { label: "Prescription History", to: "/dispensing/spectacle-history", access: "dispensing" },
      { label: "Contact Lens Jobs", to: "/dispensing/contact-lenses", access: "dispensing" },
      { label: "Sundry Jobs", to: "/dispensing/sundries", access: "dispensing" },
    ],
  },
  { label: "Optical Catalogue", to: "/catalogue", icon: ClipboardList, access: "catalogue" },
  { label: "Laboratory", to: "/lab", icon: Activity, access: "laboratory" },
];

const MAINTENANCE_NAV = [
  { label: "Setup Frame", to: "/inventory?category=frame&create=1", icon: Boxes, access: "inventory" },
  { label: "Setup Lens", to: "/catalogue?tab=lens&new=1", icon: Glasses, access: "catalogue" },
  { label: "Staff", to: "/staff", icon: Users, access: "staff" },
  { label: "Branches", to: "/branches", icon: Building2, access: "branches" },
  { label: "Practice Settings", to: "/settings", icon: Settings, access: "settings" },
  { label: "Franchise enquiries", to: "/admin/leads", icon: Users, access: "organizations" },
  { label: "Organizations", to: "/admin/organizations", icon: Building2, access: "organizations" },
];

const idOf = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return "";
};

const pathMatches = (pathname, path) => {
  if (!path) return false;
  const cleanPath = String(path).split("?")[0];

  if (cleanPath === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === cleanPath || pathname.startsWith(`${cleanPath}/`);
};

const sectionActive = (pathname, items = []) =>
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
          isActive
            ? "text-slate-950"
            : "text-slate-500 hover:text-slate-900",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span>{children}</span>

          {isActive && (
            <span className="absolute inset-x-3.5 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500" />
          )}
        </>
      )}
    </NavLink>
  );
}

function MenuItems({ items, pathname, onNavigate, mobile = false }) {
  return (
    <div className={mobile ? "space-y-1" : "space-y-1"}>
      {items.map((item) => {
        const Icon = item.icon;

        if (item.children?.length) {
          return (
            <section key={item.label} className={mobile ? "rounded-lg bg-white/70 p-2" : "py-1"}>
              <div className={`flex items-center gap-2 px-3 py-2 text-[12px] font-bold uppercase tracking-[.12em] ${mobile ? "text-slate-500" : "text-slate-400"}`}>
                {Icon ? <Icon size={13} strokeWidth={1.9} /> : null}
                <span>{item.label}</span>
              </div>
              <div className={`space-y-0.5 ${mobile ? "ml-2 border-l border-slate-200 pl-2" : "ml-3 border-l border-slate-100 pl-2"}`}>
                <MenuItems items={item.children} pathname={pathname} onNavigate={onNavigate} mobile={mobile} />
              </div>
            </section>
          );
        }

        if (item.disabled) {
          return (
            <div
              key={item.label}
              title={item.hint || "Not available yet"}
              aria-disabled="true"
              className={`flex min-h-9 cursor-not-allowed items-center gap-2 rounded-lg px-3 ${mobile ? "text-[12px]" : "text-[12px]"} font-medium text-slate-400`}
            >
              {Icon ? <Icon size={14} strokeWidth={1.8} className="shrink-0" /> : null}
              <span className="min-w-0 flex-1">{item.label}</span>
              <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[12px] font-bold uppercase tracking-wide text-slate-400">Planned</span>
            </div>
          );
        }

        if (!item.to) return null;
        const activeItem = pathMatches(pathname, item.to.split("?")[0]);

        return (
          <NavLink
            key={`${item.label}-${item.to}`}
            to={item.to}
            onClick={onNavigate}
            className={[
              "flex min-h-9 items-center gap-2 rounded-lg px-3",
              mobile ? "text-[12px]" : "text-[12px]",
              "font-medium transition-colors duration-150",
              activeItem
                ? "bg-slate-100 text-slate-950"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
            ].join(" ")}
          >
            {Icon ? <Icon size={14} strokeWidth={1.8} className="shrink-0" /> : null}
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );
}

function Dropdown({ label, items, pathname, onNavigate }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const location = useLocation();
  const active = sectionActive(pathname, items.flatMap((item) => [item, ...(item.children || [])]));

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  if (!items?.length) return null;

  const navigateFromMenu = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div ref={rootRef} className="group relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={[
          "relative inline-flex h-10 shrink-0 items-center justify-center gap-1.5",
          "px-3 text-[13px] font-medium leading-none whitespace-nowrap",
          "transition-colors duration-150",
          active || open ? "text-slate-950" : "text-slate-500 hover:text-slate-900",
        ].join(" ")}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`${label} menu`}
      >
        <span>{label}</span>
        <ChevronDown size={13} strokeWidth={1.8} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
        {(active || open) && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-500" />}
      </button>

      <div className={[
        "absolute left-0 top-full z-50 mt-1 w-72 max-w-[min(22rem,90vw)]",
        "max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5",
        "shadow-[0_12px_40px_rgba(15,23,42,0.12)] transition duration-150",
        open
          ? "visible translate-y-0 opacity-100"
          : "invisible pointer-events-none translate-y-1 opacity-0",
      ].join(" ")}>
        <MenuItems items={items} pathname={pathname} onNavigate={navigateFromMenu} />
      </div>
    </div>
  );
}

function MobileSection({ label, items, pathname, onNavigate }) {
  if (!items?.length) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-2">
      <div className="px-2 pb-1.5 pt-1 text-[12px] font-bold uppercase tracking-[.16em] text-slate-400">
        {label}
      </div>
      <MenuItems items={items} pathname={pathname} onNavigate={onNavigate} mobile />
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
    items
      .map((item) => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined,
      }))
      .filter((item) => {
        const hasAccess = !item.access || canAccessModule(item.access, role);
        return hasAccess && (item.disabled || item.to || item.children?.length);
      });

  const patientNav = filterItems(PATIENT_NAV);
  const financeNav = filterItems(FINANCE_NAV);
  const inventoryNav = filterItems(INVENTORY_NAV);
  const maintenanceNav = filterItems(MAINTENANCE_NAV);

  const currentBranch = useMemo(() => {
    if (isSuperAdmin || !branches.length) {
      return null;
    }

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

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMobileOpen(false);
      setProfileOpen(false);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  const closeMenus = () => {
    setProfileOpen(false);
    setMobileOpen(false);
  };

  const mobileSections = [
    { label: "Patients", items: patientNav },
    { label: "Financial", items: financeNav },
    { label: "Inventory", items: inventoryNav },
    { label: "Maintenance", items: maintenanceNav },
  ].filter((section) => section.items.length);

  return (
    <header
      ref={rootRef}
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center gap-3 px-3 sm:px-3 lg:px-4">
        <NavLink
          to="/dashboard"
          className="flex shrink-0 items-center gap-2.5"
          onClick={closeMenus}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-sm shadow-indigo-100">
            <Activity size={18} strokeWidth={2.2} />
          </span>

          <span className="hidden sm:block">
            <span className="block text-[15px] font-bold tracking-tight text-slate-950">
              V-Sync
            </span>

            <span className="block text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Vision Platform
            </span>
          </span>
        </NavLink>

        <div className="hidden h-7 w-px bg-slate-200 lg:block" />

        <div className="ml-auto flex items-center gap-2">
          {!isSuperAdmin && (
            <div className="hidden max-w-[260px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 md:flex">
              <Building2
                size={15}
                className="shrink-0 text-slate-400"
              />

              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-slate-800">
                  {organizationName}
                </div>

                <div className="truncate text-[12px] text-slate-400">
                  {currentBranch?.name || "Default branch"}
                </div>
              </div>
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-slate-50"
              aria-expanded={profileOpen}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[12px] font-bold text-white">
                {(user?.firstName?.[0] || "U").toUpperCase()}
                {(user?.lastName?.[0] || "").toUpperCase()}
              </span>

              <span className="hidden text-left xl:block">
                <span className="block max-w-[125px] truncate text-[12px] font-semibold text-slate-800">
                  {[user?.firstName, user?.lastName]
                    .filter(Boolean)
                    .join(" ") || "User"}
                </span>

                <span className="block text-[12px] text-slate-400">
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
                <div className="border-b border-slate-100 px-3 py-3">
                  <div className="text-[13px] font-semibold text-slate-900">
                    {[user?.firstName, user?.lastName]
                      .filter(Boolean)
                      .join(" ") || "User"}
                  </div>

                  <div className="mt-0.5 truncate text-[12px] text-slate-400">
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
                      <span className="truncate">
                        {organizationName}
                      </span>
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
        <nav className="mx-auto flex h-11 w-full max-w-[1500px] items-center overflow-visible px-3 sm:px-3 lg:px-4">
          <TopNavLink to="/dashboard" onNavigate={closeMenus}>
            Dashboard
          </TopNavLink>

          {patientNav.length > 0 && (
            <Dropdown
              label="Patients"
              items={patientNav}
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

          <div className="ml-auto flex items-center gap-1 text-[12px] font-medium uppercase tracking-[0.14em] text-slate-400">
            <Wrench size={13} />
            <span>
              {isSuperAdmin ? "Platform" : "Workspace"}
            </span>
          </div>
        </nav>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto max-h-[calc(100vh-64px)] overflow-y-auto px-3 py-3 sm:px-3">
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
          </nav>
        </div>
      )}
    </header>
  );
}
