import {
  Bell,
  ChevronDown,
  LogOut,
  Search,
  Command,
  Users,
  UserPlus,
  CalendarClock,
  FileText,
  ClipboardPlus,
  Glasses,
  ContactRound,
  PackageCheck,
  CreditCard,
  RotateCcw,
  Activity,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../modules/auth/AuthContext";

const roleLabel = (role = "") =>
  role.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const nav = [
  { label: "Overview", path: "/dashboard", roles: null },
  { label: "Appointments", path: "/appointments", roles: null },
  {
    label: "Clinical",
    path: "/clinical",
    roles: ["super_admin", "organization_admin", "branch_manager", "optometrist", "doctor"],
  },
  {
    label: "Optical",
    path: "/optical",
    roles: ["super_admin", "organization_admin", "branch_manager", "sales_executive", "optometrist", "doctor"],
  },
  {
    label: "Dispensing",
    path: "/dispensing",
    roles: ["super_admin", "organization_admin", "branch_manager", "sales_executive", "optometrist", "doctor", "receptionist", "lab_technician"],
  },
  {
    label: "Inventory",
    path: "/inventory",
    roles: ["super_admin", "organization_admin", "branch_manager", "inventory_manager"],
  },
  {
    label: "Catalogue",
    path: "/catalogue",
    roles: ["super_admin", "organization_admin", "branch_manager", "inventory_manager", "sales_executive", "optometrist", "doctor"],
  },
  {
    label: "Laboratory",
    path: "/lab",
    roles: ["super_admin", "organization_admin", "branch_manager", "lab_technician"],
  },
  {
    label: "Billing",
    path: "/billing",
    roles: ["super_admin", "organization_admin", "branch_manager", "cashier"],
  },
  {
    label: "Recall",
    path: "/recall",
    roles: ["super_admin", "organization_admin", "branch_manager", "optometrist", "doctor", "receptionist"],
  },
  {
    label: "Letters & Images",
    path: "/communications",
    roles: ["super_admin", "organization_admin", "branch_manager", "optometrist", "doctor", "receptionist"],
  },
  {
    label: "Newsletters",
    path: "/newsletters",
    roles: ["super_admin", "organization_admin", "branch_manager"],
  },
  {
    label: "Reports",
    path: "/reports",
    roles: ["super_admin", "organization_admin", "branch_manager", "cashier"],
  },
  {
    label: "Staff",
    path: "/staff",
    roles: ["super_admin", "organization_admin", "branch_manager"],
  },
  {
    label: "Settings",
    path: "/settings",
    roles: ["super_admin", "organization_admin", "branch_manager"],
  },
  {
    label: "Finance",
    path: "/finance",
    roles: ["super_admin", "organization_admin", "branch_manager", "cashier"],
  },
];

export default function Topbar() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [patientOpen, setPatientOpen] = useState(false);
  const profileRef = useRef(null);
  const patientRef = useRef(null);
  const patientCloseTimerRef = useRef(null);

  const { user, organization, logout } = useAuth();
  const location = useLocation();

  const items = nav.filter(
    (item) => !item.roles || item.roles.includes(user?.role)
  );

  const patientRoute = location.pathname.match(
    /^\/patients\/([^/]+)(?:\/consultations\/new)?$/
  );
  const currentPatientId =
    patientRoute && patientRoute[1] !== "new" ? patientRoute[1] : null;

  const patientActive =
    location.pathname === "/patients" ||
    location.pathname === "/patients/new" ||
    location.pathname.startsWith("/patients/") ||
    location.pathname.startsWith("/appointments") ||
    location.pathname.startsWith("/clinical") ||
    location.pathname.startsWith("/optical") ||
    location.pathname.startsWith("/dispensing") ||
    location.pathname.startsWith("/billing") ||
    location.pathname.startsWith("/recall") ||
    location.pathname.startsWith("/communications") ||
    location.pathname.startsWith("/newsletters");

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (patientRef.current && !patientRef.current.contains(event.target)) {
        setPatientOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setPatientOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const closeMenus = () => {
    setProfileOpen(false);
    setPatientOpen(false);
  };

  return (
    <header className="sticky top-0 z-[100] border-b border-slate-200 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-3 px-3 sm:px-5 lg:gap-5 lg:px-7">
        <NavLink
          to="/dashboard"
          onClick={closeMenus}
          className="flex shrink-0 items-center gap-2.5"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-[11px] font-black tracking-tight text-white shadow-sm">
            VS
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="text-[20px] font-bold leading-none tracking-tight text-slate-950">
              V-Sync
            </div>
            <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.22em] text-slate-400">
              Practice Management
            </div>
          </div>
        </NavLink>

        <div className="hidden min-w-0 flex-1 md:block">
          <div className="relative mx-auto w-full max-w-[510px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Global search"
              placeholder="Search patients, appointments, jobs..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-16 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
            />
            <span className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-medium text-slate-400">
              <Command size={10} />
              K
            </span>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <div className="hidden border-r border-slate-200 pr-4 text-right xl:block">
            <div className="max-w-[170px] truncate text-[11px] font-semibold text-slate-700">
              {organization?.name || "VividOpt Practice"}
            </div>
            <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Single branch
            </div>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Bell size={18} strokeWidth={1.9} />
            <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setProfileOpen((value) => !value);
                setPatientOpen(false);
              }}
              className="flex items-center gap-2 rounded-xl p-1.5 pr-1 transition hover:bg-slate-100"
              aria-expanded={profileOpen}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-bold text-white">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              <div className="hidden text-left lg:block">
                <div className="max-w-[120px] truncate text-[11px] font-semibold text-slate-800">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {roleLabel(user?.role)}
                </div>
              </div>
              <ChevronDown
                size={13}
                className={`hidden text-slate-400 transition-transform lg:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 z-[240] w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <div className="truncate text-xs font-semibold text-slate-800">
                    {user?.email}
                  </div>
                  <div className="mt-1 text-[9px] uppercase tracking-wider text-slate-400">
                    {roleLabel(user?.role)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <nav className="relative z-[120] border-t border-slate-100 bg-white">
        <div className="relative mx-auto flex h-[46px] max-w-[1500px] items-center px-3 sm:px-5 lg:px-7">
          <div
            ref={patientRef}
            className="relative z-[240] shrink-0"
            onMouseEnter={() => {
              window.clearTimeout(patientCloseTimerRef.current);
              setPatientOpen(true);
            }}
            onMouseLeave={() => {
              window.clearTimeout(patientCloseTimerRef.current);
              patientCloseTimerRef.current = window.setTimeout(() => {
                setPatientOpen(false);
              }, 160);
            }}
          >
            <button
              type="button"
              onClick={() => {
                window.clearTimeout(patientCloseTimerRef.current);
                setPatientOpen((value) => !value);
                setProfileOpen(false);
              }}
              className={`inline-flex h-8 items-center gap-1 whitespace-nowrap px-3 text-[11px] font-semibold transition ${
                patientActive
                  ? "text-slate-950"
                  : "text-slate-500 hover:text-slate-950"
              }`}
              aria-haspopup="menu"
              aria-expanded={patientOpen}
            >
              <span className="text-xs font-semibold">Patients</span>
              <ChevronDown
                size={12}
                className={`transition-transform ${patientOpen ? "rotate-180" : ""}`}
              />
            </button>

            {patientOpen && (
              <div
                className="absolute left-0 top-[34px] z-[260] w-[760px] max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl"
                onMouseEnter={() => {
                  window.clearTimeout(patientCloseTimerRef.current);
                }}
                onMouseLeave={() => {
                  window.clearTimeout(patientCloseTimerRef.current);
                  patientCloseTimerRef.current = window.setTimeout(() => {
                    setPatientOpen(false);
                  }, 160);
                }}
              >
                <div className="flex items-center justify-between border-b border-slate-100 px-3 pb-3 pt-1">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-600">
                      Patient workspace
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      Access patient records, clinical activity and follow-up workflows
                    </div>
                  </div>
                  <NavLink
                    to="/patients"
                    onClick={closeMenus}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                  >
                    Open directory
                  </NavLink>
                </div>

                <div className="grid grid-cols-2 gap-2.5 p-1.5">
                  <PatientMenuGroup
                    title="Patient Management"
                    items={[
                      {
                        to: "/patients",
                        title: "Patient Directory",
                        description: "Search, review and manage patients",
                        active: location.pathname === "/patients",
                      },
                      {
                        to: "/patients/new",
                        title: "Register Patient",
                        description: "Create a new patient record",
                        active: location.pathname === "/patients/new",
                      },
                      {
                        to: "/appointments/book",
                        title: "Book Appointment",
                        description: "Schedule a visit for a patient",
                        active: location.pathname.startsWith("/appointments/book"),
                      },
                      ...(currentPatientId
                        ? [
                            {
                              to: `/patients/${currentPatientId}`,
                              title: "Current Patient Record",
                              description: "Open the complete patient file",
                              active:
                                location.pathname === `/patients/${currentPatientId}`,
                            },
                          ]
                        : []),
                    ]}
                    onClick={closeMenus}
                  />

                  <PatientMenuGroup
                    title="Clinical & Consultation"
                    items={[
                      {
                        to: "/clinical",
                        title: "Clinical / Consultation",
                        description: "Examinations, Rx and clinical history",
                        active: location.pathname.startsWith("/clinical"),
                      },
                      ...(currentPatientId
                        ? [
                            {
                              to: `/patients/${currentPatientId}/consultations/new`,
                              title: "New Consultation",
                              description: "Start a clinical examination",
                              active:
                                location.pathname ===
                                `/patients/${currentPatientId}/consultations/new`,
                            },
                          ]
                        : []),
                      {
                        to: "/recall",
                        title: "Recall",
                        description: "Recall due dates and follow-up",
                        active: location.pathname.startsWith("/recall"),
                      },
                      {
                        to: "/communications",
                        title: "Letters & Images",
                        description: "Patient letters, images and documents",
                        active: location.pathname.startsWith("/communications"),
                      },
                    ]}
                    onClick={closeMenus}
                  />

                  <PatientMenuGroup
                    title="Optical & Orders"
                    items={[
                      {
                        to: "/optical",
                        title: "Spectacles & Optical",
                        description: "Spectacle prescriptions and optical jobs",
                        active:
                          location.pathname.startsWith("/optical") &&
                          !location.pathname.startsWith("/optical/contact-lenses"),
                      },
                      {
                        to: "/optical/contact-lenses",
                        title: "Contact Lenses",
                        description: "Contact lens records and orders",
                        active: location.pathname.startsWith("/optical/contact-lenses"),
                      },
                      {
                        to: "/dispensing",
                        title: "Dispensing",
                        description: "Preparation, fitting and collection",
                        active: location.pathname.startsWith("/dispensing"),
                      },
                      {
                        to: "/lab",
                        title: "Laboratory",
                        description: "Patient-related lab and job workflow",
                        active: location.pathname.startsWith("/lab"),
                      },
                    ]}
                    onClick={closeMenus}
                  />

                  <PatientMenuGroup
                    title="Visits & Financial"
                    items={[
                      {
                        to: "/appointments",
                        title: "Appointments",
                        description: "View and manage patient visits",
                        active: location.pathname.startsWith("/appointments"),
                      },
                      {
                        to: "/billing",
                        title: "Billing & Payments",
                        description: "Invoices, payments and balances",
                        active: location.pathname.startsWith("/billing"),
                      },
                      {
                        to: "/finance",
                        title: "Finance",
                        description: "Financial transactions and accounts",
                        active: location.pathname.startsWith("/finance"),
                      },
                      {
                        to: "/newsletters",
                        title: "Newsletters",
                        description: "Patient communications and campaigns",
                        active: location.pathname.startsWith("/newsletters"),
                      },
                    ]}
                    onClick={closeMenus}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={closeMenus}
                className={({ isActive }) =>
                  `inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-[11px] font-semibold transition ${
                    isActive
                      ? "bg-slate-950 text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

function PatientMenuGroup({ title, items, onClick }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-1.5">
      <div className="px-2.5 pb-1.5 pt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => (
          <PatientMenuLink
            key={item.to}
            {...item}
            onClick={onClick}
          />
        ))}
      </div>
    </div>
  );
}

function PatientMenuLink({
  to,
  title,
  description,
  active = false,
  onClick,
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`group flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition ${
        active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-white hover:shadow-sm"
      }`}
      role="menuitem"
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-bold">{title}</span>
        <span
          className={`mt-0.5 block text-[9px] leading-4 ${
            active ? "text-white/70" : "text-slate-400 group-hover:text-slate-500"
          }`}
        >
          {description}
        </span>
      </span>
      <ChevronDown
        size={11}
        className={`-rotate-90 shrink-0 ${
          active ? "text-white/60" : "text-slate-300 group-hover:text-slate-500"
        }`}
      />
    </NavLink>
  );
}
