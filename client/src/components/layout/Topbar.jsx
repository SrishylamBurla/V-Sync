
// import {
//   Bell,
//   ChevronDown,
//   LogOut,
//   Search,
//   Command,
//   Users,
//   UserPlus,
//   CalendarClock,
//   FileText,
//   ClipboardPlus,
//   Glasses,
//   ContactRound,
//   PackageCheck,
//   CreditCard,
//   RotateCcw,
//   Activity,
//   Building2,
// } from "lucide-react";
// import { useEffect, useRef, useState } from "react";
// import { NavLink, useLocation } from "react-router-dom";
// import { useAuth } from "../../modules/auth/AuthContext";

// const roleLabel = (role = "") =>
//   role.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

// const PLATFORM_NAV = [
//   { label: "Dashboard", path: "/dashboard" },
//   { label: "Organizations", path: "/admin/organizations" },
//   { label: "Branches", path: "/branches" },
//   { label: "Staff", path: "/staff" },
//   { label: "Reports", path: "/reports" },
//   { label: "Audit", path: "/settings" },
// ];

// const MANAGEMENT_NAV = [
//   { label: "Dashboard", path: "/dashboard" },
//   { label: "Branches", path: "/branches" },
//   { label: "Staff", path: "/staff" },
//   { label: "Patients", path: "/patients" },
//   { label: "Appointments", path: "/appointments" },
//   { label: "Clinical", path: "/clinical" },
//   { label: "Optical", path: "/optical" },
//   { label: "Dispensing", path: "/dispensing" },
//   { label: "Inventory", path: "/inventory" },
//   { label: "Laboratory", path: "/lab" },
//   { label: "Billing", path: "/billing" },
//   { label: "Finance", path: "/finance" },
//   { label: "Reports", path: "/reports" },
//   { label: "Recall", path: "/recall" },
//   { label: "Communications", path: "/communications" },
//   { label: "Settings", path: "/settings" },
// ];

// const CLINICAL_NAV = [
//   { label: "My Day", path: "/dashboard" },
//   { label: "Patients", path: "/patients" },
//   { label: "Appointments", path: "/appointments" },
//   { label: "Clinical", path: "/clinical" },
//   { label: "Optical", path: "/optical" },
//   { label: "Recall", path: "/recall" },
// ];

// const FRONT_DESK_NAV = [
//   { label: "Dashboard", path: "/dashboard" },
//   { label: "Patients", path: "/patients" },
//   { label: "Appointments", path: "/appointments" },
//   { label: "Recall", path: "/recall" },
//   { label: "Billing", path: "/billing" },
// ];

// const OPTICAL_NAV = [
//   { label: "Dashboard", path: "/dashboard" },
//   { label: "Patients", path: "/patients" },
//   { label: "Optical", path: "/optical" },
//   { label: "Dispensing", path: "/dispensing" },
//   { label: "Laboratory", path: "/lab" },
//   { label: "Catalogue", path: "/catalogue" },
//   { label: "Inventory", path: "/inventory" },
//   { label: "Billing", path: "/billing" },
// ];

// const BILLING_NAV = [
//   { label: "Dashboard", path: "/dashboard" },
//   { label: "Patients", path: "/patients" },
//   { label: "Appointments", path: "/appointments" },
//   { label: "Billing", path: "/billing" },
//   { label: "Finance", path: "/finance" },
// ];

// const getWorkspace = (role) => {
//   if (role === "super_admin") return "platform";
//   if (["organization_admin", "branch_manager"].includes(role)) return "management";
//   if (["optometrist", "doctor"].includes(role)) return "clinical";
//   if (role === "receptionist") return "frontdesk";
//   if (["sales_executive", "inventory_manager", "lab_technician"].includes(role)) return "optical";
//   if (role === "cashier") return "billing";
//   return "clinical";
// };

// const getWorkspaceNav = (role) => {
//   switch (getWorkspace(role)) {
//     case "platform":
//       return PLATFORM_NAV;
//     case "management":
//       return MANAGEMENT_NAV;
//     case "clinical":
//       return CLINICAL_NAV;
//     case "frontdesk":
//       return FRONT_DESK_NAV;
//     case "optical":
//       return OPTICAL_NAV;
//     case "billing":
//       return BILLING_NAV;
//     default:
//       return CLINICAL_NAV;
//   }
// };

// export default function Topbar() {
//   const [profileOpen, setProfileOpen] = useState(false);
//   const [patientOpen, setPatientOpen] = useState(false);
//   const profileRef = useRef(null);
//   const patientRef = useRef(null);
//   const patientCloseTimerRef = useRef(null);

//   const { user, organization, logout } = useAuth();
//   const location = useLocation();

//   const workspace = getWorkspace(user?.role);
//   const items = getWorkspaceNav(user?.role);

//   const patientRoute = location.pathname.match(
//     /^\/patients\/([^/]+)(?:\/consultations\/new)?$/
//   );
//   const currentPatientId =
//     patientRoute && patientRoute[1] !== "new" ? patientRoute[1] : null;

//   const patientActive =
//     location.pathname === "/patients" ||
//     location.pathname === "/patients/new" ||
//     location.pathname.startsWith("/patients/") ||
//     location.pathname.startsWith("/appointments") ||
//     location.pathname.startsWith("/clinical") ||
//     location.pathname.startsWith("/optical") ||
//     location.pathname.startsWith("/dispensing") ||
//     location.pathname.startsWith("/billing") ||
//     location.pathname.startsWith("/recall") ||
//     location.pathname.startsWith("/communications") ||
//     location.pathname.startsWith("/newsletters");

//   useEffect(() => {
//     const handlePointerDown = (event) => {
//       if (profileRef.current && !profileRef.current.contains(event.target)) {
//         setProfileOpen(false);
//       }
//       if (patientRef.current && !patientRef.current.contains(event.target)) {
//         setPatientOpen(false);
//       }
//     };

//     const handleKeyDown = (event) => {
//       if (event.key === "Escape") {
//         setProfileOpen(false);
//         setPatientOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handlePointerDown);
//     document.addEventListener("keydown", handleKeyDown);
//     return () => {
//       document.removeEventListener("mousedown", handlePointerDown);
//       document.removeEventListener("keydown", handleKeyDown);
//     };
//   }, []);

//   const closeMenus = () => {
//     setProfileOpen(false);
//     setPatientOpen(false);
//   };

//   return (
//     <header className="sticky top-0 z-[100] border-b border-slate-200 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl print:hidden">
//       <div className="mx-auto flex h-[72px] max-w-[1500px] items-center gap-3 px-3 sm:px-5 lg:gap-5 lg:px-7">
//         <NavLink
//           to="/dashboard"
//           onClick={closeMenus}
//           className="flex shrink-0 items-center gap-2.5"
//         >
//           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-[11px] font-black tracking-tight text-white shadow-sm">
//             VS
//           </div>
//           <div className="hidden min-w-0 sm:block">
//             <div className="text-[20px] font-bold leading-none tracking-tight text-slate-950">
//               V-Sync
//             </div>
//             <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.22em] text-slate-400">
//               Practice Management
//             </div>
//           </div>
//         </NavLink>

//         <div className="hidden min-w-0 flex-1 md:block">
//           <div className="relative mx-auto w-full max-w-[510px]">
//             <Search
//               size={15}
//               className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
//             />
//             <input
//               aria-label="Global search"
//               placeholder="Search patients, appointments, jobs..."
//               className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-10 pr-16 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-100"
//             />
//             <span className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[9px] font-medium text-slate-400">
//               <Command size={10} />
//               K
//             </span>
//           </div>
//         </div>

//         <div className="ml-auto flex shrink-0 items-center gap-1.5">
//           <div className="hidden border-r border-slate-200 pr-4 text-right xl:block">
//             <div className="max-w-[190px] truncate text-[11px] font-semibold text-slate-700">
//               {workspace === "platform"
//                 ? "Platform Administration"
//                 : organization?.name || "VividOpt Practice"}
//             </div>
//             <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-400">
//               <Building2 size={10} />
//               {workspace === "platform"
//                 ? "All organizations"
//                 : workspace === "management"
//                   ? "Management workspace"
//                   : workspace === "clinical"
//                     ? "Clinical workspace"
//                     : workspace === "frontdesk"
//                       ? "Front desk workspace"
//                       : workspace === "optical"
//                         ? "Optical workspace"
//                         : "Billing workspace"}
//             </div>
//           </div>

//           <button
//             type="button"
//             aria-label="Notifications"
//             className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
//           >
//             <Bell size={18} strokeWidth={1.9} />
//             <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-white" />
//           </button>

//           <div ref={profileRef} className="relative">
//             <button
//               type="button"
//               onClick={() => {
//                 setProfileOpen((value) => !value);
//                 setPatientOpen(false);
//               }}
//               className="flex items-center gap-2 rounded-xl p-1.5 pr-1 transition hover:bg-slate-100"
//               aria-expanded={profileOpen}
//             >
//               <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-bold text-white">
//                 {user?.firstName?.[0]}
//                 {user?.lastName?.[0]}
//               </div>
//               <div className="hidden text-left lg:block">
//                 <div className="max-w-[120px] truncate text-[11px] font-semibold text-slate-800">
//                   {user?.firstName} {user?.lastName}
//                 </div>
//                 <div className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">
//                   {roleLabel(user?.role)}
//                 </div>
//               </div>
//               <ChevronDown
//                 size={13}
//                 className={`hidden text-slate-400 transition-transform lg:block ${
//                   profileOpen ? "rotate-180" : ""
//                 }`}
//               />
//             </button>

//             {profileOpen && (
//               <div className="absolute right-0 top-12 z-[240] w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
//                 <div className="border-b border-slate-100 px-3 py-2.5">
//                   <div className="truncate text-xs font-semibold text-slate-800">
//                     {user?.email}
//                   </div>
//                   <div className="mt-1 text-[9px] uppercase tracking-wider text-slate-400">
//                     {roleLabel(user?.role)}
//                   </div>
//                 </div>

//                 {user?.role === "super_admin" && (
//                   <NavLink
//                     to="/admin/organizations"
//                     onClick={closeMenus}
//                     className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
//                   >
//                     <Building2 size={14} />
//                     Organizations
//                   </NavLink>
//                 )}

//                 {user?.role === "organization_admin" && (
//                   <NavLink
//                     to="/settings/organization"
//                     onClick={closeMenus}
//                     className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
//                   >
//                     <Building2 size={14} />
//                     Organization Settings
//                   </NavLink>
//                 )}

//                 {["super_admin", "organization_admin", "branch_manager"].includes(
//                   user?.role
//                 ) && (
//                   <NavLink
//                     to="/branches"
//                     onClick={closeMenus}
//                     className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
//                   >
//                     <Building2 size={14} />
//                     Branches
//                   </NavLink>
//                 )}

//                 <button
//                   type="button"
//                   onClick={logout}
//                   className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
//                 >
//                   <LogOut size={14} />
//                   Sign out
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       <nav className="relative z-[120] border-t border-slate-100 bg-white">
//         <div className="relative mx-auto flex h-[46px] max-w-[1500px] items-center px-3 sm:px-5 lg:px-7">
//           <div
//             ref={patientRef}
//             className="relative z-[240] shrink-0"
//             onMouseEnter={() => {
//               window.clearTimeout(patientCloseTimerRef.current);
//               setPatientOpen(true);
//             }}
//             onMouseLeave={() => {
//               window.clearTimeout(patientCloseTimerRef.current);
//               patientCloseTimerRef.current = window.setTimeout(() => {
//                 setPatientOpen(false);
//               }, 160);
//             }}
//           >
//             <button
//               type="button"
//               onClick={() => {
//                 window.clearTimeout(patientCloseTimerRef.current);
//                 setPatientOpen((value) => !value);
//                 setProfileOpen(false);
//               }}
//               className={`inline-flex h-8 items-center gap-1 whitespace-nowrap px-3 text-[11px] font-semibold transition ${
//                 patientActive
//                   ? "text-slate-950"
//                   : "text-slate-500 hover:text-slate-950"
//               }`}
//               aria-haspopup="menu"
//               aria-expanded={patientOpen}
//             >
//               <span className="text-xs font-semibold">Patients</span>
//               <ChevronDown
//                 size={12}
//                 className={`transition-transform ${patientOpen ? "rotate-180" : ""}`}
//               />
//             </button>

//             {patientOpen && (
//               <div
//                 className="absolute left-0 top-[34px] z-[260] w-[760px] max-w-[calc(100vw-24px)] rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl"
//                 onMouseEnter={() => {
//                   window.clearTimeout(patientCloseTimerRef.current);
//                 }}
//                 onMouseLeave={() => {
//                   window.clearTimeout(patientCloseTimerRef.current);
//                   patientCloseTimerRef.current = window.setTimeout(() => {
//                     setPatientOpen(false);
//                   }, 160);
//                 }}
//               >
//                 <div className="flex items-center justify-between border-b border-slate-100 px-3 pb-3 pt-1">
//                   <div>
//                     <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-600">
//                       Patient workspace
//                     </div>
//                     <div className="mt-1 text-xs text-slate-500">
//                       Access patient records, clinical activity and follow-up workflows
//                     </div>
//                   </div>
//                   <NavLink
//                     to="/patients"
//                     onClick={closeMenus}
//                     className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
//                   >
//                     Open directory
//                   </NavLink>
//                 </div>

//                 <div className="grid grid-cols-2 gap-2.5 p-1.5">
//                   <PatientMenuGroup
//                     title="Patient Management"
//                     items={[
//                       {
//                         to: "/patients",
//                         title: "Patient Directory",
//                         description: "Search, review and manage patients",
//                         active: location.pathname === "/patients",
//                       },
//                       {
//                         to: "/patients/new",
//                         title: "Register Patient",
//                         description: "Create a new patient record",
//                         active: location.pathname === "/patients/new",
//                       },
//                       {
//                         to: "/appointments/book",
//                         title: "Book Appointment",
//                         description: "Schedule a visit for a patient",
//                         active: location.pathname.startsWith("/appointments/book"),
//                       },
//                       ...(currentPatientId
//                         ? [
//                             {
//                               to: `/patients/${currentPatientId}`,
//                               title: "Current Patient Record",
//                               description: "Open the complete patient file",
//                               active:
//                                 location.pathname === `/patients/${currentPatientId}`,
//                             },
//                           ]
//                         : []),
//                     ]}
//                     onClick={closeMenus}
//                   />

//                   <PatientMenuGroup
//                     title="Clinical & Consultation"
//                     items={[
//                       {
//                         to: "/clinical",
//                         title: "Clinical / Consultation",
//                         description: "Examinations, Rx and clinical history",
//                         active: location.pathname.startsWith("/clinical"),
//                       },
//                       ...(currentPatientId
//                         ? [
//                             {
//                               to: `/patients/${currentPatientId}/consultations/new`,
//                               title: "New Consultation",
//                               description: "Start a clinical examination",
//                               active:
//                                 location.pathname ===
//                                 `/patients/${currentPatientId}/consultations/new`,
//                             },
//                           ]
//                         : []),
//                       {
//                         to: "/recall",
//                         title: "Recall",
//                         description: "Recall due dates and follow-up",
//                         active: location.pathname.startsWith("/recall"),
//                       },
//                       {
//                         to: "/communications",
//                         title: "Letters & Images",
//                         description: "Patient letters, images and documents",
//                         active: location.pathname.startsWith("/communications"),
//                       },
//                     ]}
//                     onClick={closeMenus}
//                   />

//                   <PatientMenuGroup
//                     title="Optical & Orders"
//                     items={[
//                       {
//                         to: "/optical",
//                         title: "Spectacles & Optical",
//                         description: "Spectacle prescriptions and optical jobs",
//                         active:
//                           location.pathname.startsWith("/optical") &&
//                           !location.pathname.startsWith("/optical/contact-lenses"),
//                       },
//                       {
//                         to: "/optical/contact-lenses",
//                         title: "Contact Lenses",
//                         description: "Contact lens records and orders",
//                         active: location.pathname.startsWith("/optical/contact-lenses"),
//                       },
//                       {
//                         to: "/dispensing",
//                         title: "Dispensing",
//                         description: "Preparation, fitting and collection",
//                         active: location.pathname.startsWith("/dispensing"),
//                       },
//                       {
//                         to: "/lab",
//                         title: "Laboratory",
//                         description: "Patient-related lab and job workflow",
//                         active: location.pathname.startsWith("/lab"),
//                       },
//                     ]}
//                     onClick={closeMenus}
//                   />

//                   <PatientMenuGroup
//                     title="Visits & Financial"
//                     items={[
//                       {
//                         to: "/appointments",
//                         title: "Appointments",
//                         description: "View and manage patient visits",
//                         active: location.pathname.startsWith("/appointments"),
//                       },
//                       {
//                         to: "/billing",
//                         title: "Billing & Payments",
//                         description: "Invoices, payments and balances",
//                         active: location.pathname.startsWith("/billing"),
//                       },
//                       {
//                         to: "/finance",
//                         title: "Finance",
//                         description: "Financial transactions and accounts",
//                         active: location.pathname.startsWith("/finance"),
//                       },
//                       {
//                         to: "/newsletters",
//                         title: "Newsletters",
//                         description: "Patient communications and campaigns",
//                         active: location.pathname.startsWith("/newsletters"),
//                       },
//                     ]}
//                     onClick={closeMenus}
//                   />
//                 </div>
//               </div>
//             )}
//           </div>

//           <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
//             {items.map((item) => (
//               <NavLink
//                 key={item.path}
//                 to={item.path}
//                 onClick={closeMenus}
//                 className={({ isActive }) =>
//                   `inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-[11px] font-semibold transition ${
//                     isActive
//                       ? "bg-slate-950 text-white shadow-sm"
//                       : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"
//                   }`
//                 }
//               >
//                 {item.label}
//               </NavLink>
//             ))}
//           </div>
//         </div>
//       </nav>
//     </header>
//   );
// }

// function PatientMenuGroup({ title, items, onClick }) {
//   return (
//     <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-1.5">
//       <div className="px-2.5 pb-1.5 pt-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
//         {title}
//       </div>
//       <div className="space-y-0.5">
//         {items.map((item) => (
//           <PatientMenuLink
//             key={item.to}
//             {...item}
//             onClick={onClick}
//           />
//         ))}
//       </div>
//     </div>
//   );
// }

// function PatientMenuLink({
//   to,
//   title,
//   description,
//   active = false,
//   onClick,
// }) {
//   return (
//     <NavLink
//       to={to}
//       onClick={onClick}
//       className={`group flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition ${
//         active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-white hover:shadow-sm"
//       }`}
//       role="menuitem"
//     >
//       <span className="min-w-0">
//         <span className="block text-[11px] font-bold">{title}</span>
//         <span
//           className={`mt-0.5 block text-[9px] leading-4 ${
//             active ? "text-white/70" : "text-slate-400 group-hover:text-slate-500"
//           }`}
//         >
//           {description}
//         </span>
//       </span>
//       <ChevronDown
//         size={11}
//         className={`-rotate-90 shrink-0 ${
//           active ? "text-white/60" : "text-slate-300 group-hover:text-slate-500"
//         }`}
//       />
//     </NavLink>
//   );
// }
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  Bell,
  Building2,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  LogOut,
  Menu,
  MoreHorizontal,
  Search,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { useAuth } from "../../modules/auth/AuthContext"

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
  { label: "Audit", to: "/settings" },
];

const COMMON_NAV = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Patients", to: "/patients" },
  { label: "Appointments", to: "/appointments" },
  { label: "Clinical", to: "/clinical" },
  { label: "Optical", to: "/optical" },
];

const OPERATIONS_NAV = [
  { label: "Branches", to: "/branches", icon: Building2 },
  { label: "Staff", to: "/staff", icon: Users },
  { label: "Inventory", to: "/inventory", icon: ClipboardList },
  { label: "Laboratory", to: "/lab", icon: Activity },
  { label: "Dispensing", to: "/dispensing", icon: ClipboardList },
  { label: "Catalogue", to: "/catalogue", icon: ClipboardList },
];

const FINANCE_NAV = [
  { label: "Billing", to: "/billing", icon: WalletCards },
  { label: "Finance", to: "/finance", icon: WalletCards },
  { label: "Reports", to: "/reports", icon: FileBarChart },
];

const MORE_NAV = [
  { label: "Recall", to: "/recall", icon: Activity },
  { label: "Communications", to: "/communications", icon: Bell },
  { label: "Newsletters", to: "/newsletters", icon: FileBarChart },
  { label: "Settings", to: "/settings", icon: Settings },
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

function TopNavLink({ to, children }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      className={({ isActive }) =>
        `relative inline-flex h-11 items-center px-3 text-[13px] font-medium transition-colors ${
          isActive
            ? "text-slate-950"
            : "text-slate-500 hover:text-slate-900"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {children}
          {isActive && (
            <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-slate-950" />
          )}
        </>
      )}
    </NavLink>
  );
}

function Dropdown({ label, items, pathname, open, onToggle }) {
  const active = sectionActive(pathname, items);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-11 items-center gap-1.5 px-3 text-[13px] font-medium transition-colors ${
          active || open
            ? "text-slate-950"
            : "text-slate-500 hover:text-slate-900"
        }`}
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
        {active && (
          <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-slate-950" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+1px)] z-50 w-60 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-[0_16px_45px_rgba(15,23,42,0.12)]">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                    isActive
                      ? "bg-slate-100 font-semibold text-slate-950"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                  }`
                }
              >
                <Icon size={16} strokeWidth={1.8} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Topbar() {
  const { user, organization, branches = [], logout } = useAuth();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef(null);

  const role = user?.role;
  const isSuperAdmin = role === "super_admin";

  const currentBranch = useMemo(() => {
    if (isSuperAdmin || !branches.length) return null;
    const defaultId = idOf(user?.defaultBranchId);
    return (
      branches.find((branch) => idOf(branch) === defaultId) ||
      branches[0] ||
      null
    );
  }, [branches, isSuperAdmin, user?.defaultBranchId]);

  const nav = isSuperAdmin ? PLATFORM_NAV : COMMON_NAV;
  const roleLabel = ROLE_LABELS[role] || "Staff";
  const organizationName = organization?.name || "Organization";

  useEffect(() => {
    setOpenMenu(null);
    setProfileOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpenMenu(null);
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const closeMenus = () => {
    setOpenMenu(null);
    setProfileOpen(false);
    setMobileOpen(false);
  };

  return (
    <header ref={rootRef} className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center gap-4 px-3 sm:px-5 lg:px-7">
        <NavLink to="/dashboard" className="flex shrink-0 items-center gap-2.5" onClick={closeMenus}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white shadow-sm">
            <Activity size={18} strokeWidth={2.2} />
          </span>
          <span className="hidden sm:block">
            <span className="block text-[15px] font-bold tracking-tight text-slate-950">V-Sync</span>
            <span className="block text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Vision Platform
            </span>
          </span>
        </NavLink>

        <div className="hidden h-7 w-px bg-slate-200 lg:block" />

        <div className="hidden min-w-0 flex-1 items-center lg:flex">
          <div className="relative w-full max-w-[330px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
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
              onClick={() => {
                setProfileOpen((value) => !value);
                setOpenMenu(null);
              }}
              className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition hover:bg-slate-50"
              aria-expanded={profileOpen}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-white">
                {(user?.firstName?.[0] || "U").toUpperCase()}
                {(user?.lastName?.[0] || "").toUpperCase()}
              </span>
              <span className="hidden text-left xl:block">
                <span className="block max-w-[125px] truncate text-[12px] font-semibold text-slate-800">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User"}
                </span>
                <span className="block text-[10px] text-slate-400">{roleLabel}</span>
              </span>
              <ChevronDown size={14} className="hidden text-slate-400 xl:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.12)]">
                <div className="border-b border-slate-100 px-4 py-3">
                  <div className="text-[13px] font-semibold text-slate-900">
                    {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User"}
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
        <nav className="mx-auto flex h-11 w-full max-w-[1500px] items-center px-3 sm:px-5 lg:px-7">
          {nav.map((item) => (
            <TopNavLink key={item.to} to={item.to}>
              {item.label}
            </TopNavLink>
          ))}

          {!isSuperAdmin && (
            <>
              <Dropdown
                label="Operations"
                items={OPERATIONS_NAV}
                pathname={location.pathname}
                open={openMenu === "operations"}
                onToggle={() => {
                  setOpenMenu((value) => (value === "operations" ? null : "operations"));
                  setProfileOpen(false);
                }}
              />
              <Dropdown
                label="Finance"
                items={FINANCE_NAV}
                pathname={location.pathname}
                open={openMenu === "finance"}
                onToggle={() => {
                  setOpenMenu((value) => (value === "finance" ? null : "finance"));
                  setProfileOpen(false);
                }}
              />
              <Dropdown
                label="More"
                items={MORE_NAV}
                pathname={location.pathname}
                open={openMenu === "more"}
                onToggle={() => {
                  setOpenMenu((value) => (value === "more" ? null : "more"));
                  setProfileOpen(false);
                }}
              />
            </>
          )}

          <div className="ml-auto flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
            <MoreHorizontal size={14} />
            <span>{isSuperAdmin ? "Platform" : "Operations"}</span>
          </div>
        </nav>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <nav className="mx-auto max-h-[calc(100vh-64px)] overflow-y-auto px-3 py-3 sm:px-5">
            <div className="mb-3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="search"
                placeholder="Search patients, appointments..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] outline-none"
              />
            </div>

            <div className="grid gap-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/dashboard"}
                  onClick={closeMenus}
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2.5 text-[13px] font-medium ${
                      isActive
                        ? "bg-slate-100 text-slate-950"
                        : "text-slate-600 hover:bg-slate-50"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {!isSuperAdmin && (
                <>
                  {[...OPERATIONS_NAV, ...FINANCE_NAV, ...MORE_NAV].map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={closeMenus}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium ${
                            isActive
                              ? "bg-slate-100 text-slate-950"
                              : "text-slate-600 hover:bg-slate-50"
                          }`
                        }
                      >
                        <Icon size={16} />
                        {item.label}
                      </NavLink>
                    );
                  })}
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
