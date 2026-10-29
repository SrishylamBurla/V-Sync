/**
 * V-Sync
 * Centralized access, navigation and route configuration.
 *
 * IMPORTANT:
 * This file controls FRONTEND visibility and route access.
 * Backend authorization must remain the final security boundary.
 */

// ============================================================
// ACCESS LEVELS
// ============================================================

export const ACCESS_LEVELS = {
  SUPER_ADMIN: "super_admin",
  ORGANIZATION_ADMIN: "organization_admin",
  PRACTICE_USER: "practice_user",
};

// ============================================================
// ROLES
// ============================================================

export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ORGANIZATION_ADMIN: "organization_admin",

  BRANCH_MANAGER: "branch_manager",
  OPTOMETRIST: "optometrist",
  DOCTOR: "doctor",
  SALES_EXECUTIVE: "sales_executive",
  CASHIER: "cashier",
  INVENTORY_MANAGER: "inventory_manager",
  LAB_TECHNICIAN: "lab_technician",
  RECEPTIONIST: "receptionist",
};

export const ALL_ROLES = Object.values(ROLES);

export const PRACTICE_ROLES = [
  ROLES.BRANCH_MANAGER,
  ROLES.OPTOMETRIST,
  ROLES.DOCTOR,
  ROLES.SALES_EXECUTIVE,
  ROLES.CASHIER,
  ROLES.INVENTORY_MANAGER,
  ROLES.LAB_TECHNICIAN,
  ROLES.RECEPTIONIST,
];

// ============================================================
// ROLE GROUPS
// ============================================================

/**
 * Clinical users
 *
 * These users can work with:
 * - Patient consultations
 * - Refraction
 * - Prescriptions
 * - Contact lens consultation
 * - Binocular vision
 * - Low vision
 * - Clinical records
 */
export const CLINICAL_ROLES = [
  ROLES.OPTOMETRIST,
  ROLES.DOCTOR,
];

/**
 * Optical / dispensing users
 *
 * Doctors and optometrists can create and manage optical jobs.
 *
 * Branch managers are also allowed operational access.
 */
export const DISPENSING_ROLES = [
  ROLES.OPTOMETRIST,
  ROLES.DOCTOR,
  ROLES.BRANCH_MANAGER,
];

// Backward-compatible alias for older imports.
export const OPTICAL_ROLES = DISPENSING_ROLES;

/**
 * Patient-facing operational users.
 */
export const PATIENT_SERVICE_ROLES = [
  ROLES.OPTOMETRIST,
  ROLES.DOCTOR,
  ROLES.RECEPTIONIST,
  ROLES.BRANCH_MANAGER,
];

// ============================================================
// ROLE HELPERS
// ============================================================

export const normalizeRole = (role) => {
  if (!role) return null;

  return String(role)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
};

export const getAccessLevel = (role) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === ROLES.SUPER_ADMIN) {
    return ACCESS_LEVELS.SUPER_ADMIN;
  }

  if (normalizedRole === ROLES.ORGANIZATION_ADMIN) {
    return ACCESS_LEVELS.ORGANIZATION_ADMIN;
  }

  if (PRACTICE_ROLES.includes(normalizedRole)) {
    return ACCESS_LEVELS.PRACTICE_USER;
  }

  return null;
};

export const isSuperAdmin = (role) =>
  getAccessLevel(role) === ACCESS_LEVELS.SUPER_ADMIN;

export const isOrganizationAdmin = (role) =>
  getAccessLevel(role) === ACCESS_LEVELS.ORGANIZATION_ADMIN;

export const isPracticeUser = (role) =>
  getAccessLevel(role) === ACCESS_LEVELS.PRACTICE_USER;

export const isOptometrist = (role) =>
  normalizeRole(role) === ROLES.OPTOMETRIST;

export const isDoctor = (role) =>
  normalizeRole(role) === ROLES.DOCTOR;

export const isClinician = (role) =>
  CLINICAL_ROLES.includes(normalizeRole(role));

// ============================================================
// MODULE ACCESS
// ============================================================

export const MODULE_ACCESS = {
  // ----------------------------------------------------------
  // Core
  // ----------------------------------------------------------

  dashboard: ALL_ROLES,

  patients: ALL_ROLES,

  appointments: ALL_ROLES,

  // ----------------------------------------------------------
  // Clinical
  // ----------------------------------------------------------
  //
  // Explicitly available to:
  // - Super Admin
  // - Organization Admin
  // - Optometrist
  // - Doctor
  // - Branch Manager
  //
  // Other practice users should not see Clinical.
  //

  clinical: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.OPTOMETRIST,
    ROLES.DOCTOR,
  ],

  // Optical Management was retired as a separate module.
  // All optical operational work is exposed through dispensing.

  // ----------------------------------------------------------
  // Dispensing
  // ----------------------------------------------------------
  //
  // Dispensing workflow includes:
  // - Spectacle jobs
  // - Contact lens jobs
  // - Job status
  // - Ready / notified / collected workflow
  //
  // Optometrist and Doctor MUST have access.
  //

  dispensing: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.OPTOMETRIST,
    ROLES.DOCTOR,
  ],

  // ----------------------------------------------------------
  // Inventory
  // ----------------------------------------------------------

  inventory: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.INVENTORY_MANAGER,
  ],

  // ----------------------------------------------------------
  // Catalogue
  // ----------------------------------------------------------

  catalogue: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.INVENTORY_MANAGER,
    ROLES.OPTOMETRIST,
    ROLES.DOCTOR,
  ],

  // ----------------------------------------------------------
  // Laboratory
  // ----------------------------------------------------------

  laboratory: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.LAB_TECHNICIAN,
  ],

  // ----------------------------------------------------------
  // Finance
  // ----------------------------------------------------------

  billing: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.OPTOMETRIST,
    ROLES.DOCTOR,
    ROLES.SALES_EXECUTIVE,
    ROLES.CASHIER,
  ],

  finance: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.CASHIER,
  ],

  reports: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.CASHIER,
  ],

  // ----------------------------------------------------------
  // Patient / Communication
  // ----------------------------------------------------------

  recall: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.OPTOMETRIST,
    ROLES.DOCTOR,
    ROLES.RECEPTIONIST,
  ],

  communications: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.OPTOMETRIST,
    ROLES.DOCTOR,
    ROLES.RECEPTIONIST,
  ],

  newsletters: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.OPTOMETRIST,
    ROLES.DOCTOR,
    ROLES.RECEPTIONIST,
  ],

  // ----------------------------------------------------------
  // Administration
  // ----------------------------------------------------------

  staff: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
  ],

  branches: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
  ],

  settings: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
  ],

  organization: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
  ],

  organizations: [
    ROLES.SUPER_ADMIN,
  ],
};

// ============================================================
// MODULE ACCESS CHECK
// ============================================================

export const canAccessModule = (module, role) => {
  const normalizedRole = normalizeRole(role);
  const allowedRoles = MODULE_ACCESS[module];

  if (!normalizedRole || !allowedRoles) {
    return false;
  }

  return allowedRoles.includes(normalizedRole);
};

// Backward-compatible helper
export const canAccess = (module, role) =>
  canAccessModule(module, role);


export const MAIN_NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    access: "dashboard",
  },
  {
    key: "patients",
    label: "Patients",
    dropdown: true,
    children: [
      { key: "patient-details", label: "Patient Details", path: "/patients", access: "patients" },
      {
        key: "appointments",
        label: "Appointments",
        dropdown: true,
        children: [
          { key: "appointment-make", label: "Make", path: "/appointments?book=1", access: "appointments" },
          { key: "appointment-move", label: "Move", path: "/appointments?mode=move", access: "appointments" },
          { key: "appointment-modify", label: "Modify", path: "/appointments?mode=modify", access: "appointments" },
          { key: "appointment-setup", label: "Setup", path: "/settings?section=appointments", access: "settings" },
        ],
      },
      { key: "recall", label: "Recall List", path: "/recall", access: "recall" },
      { key: "communications", label: "SMS / Email", path: "/newsletters", access: "newsletters" },
      { key: "merge-records", label: "Merge records", access: "patients", disabled: true },
      { key: "clinical", label: "Clinical Management", path: "/clinical", access: "clinical" },
    ],
  },
  {
    key: "financial",
    label: "Financial",
    dropdown: true,
    children: [
      { key: "billing", label: "Billing", path: "/billing", access: "billing" },
      { key: "outstanding", label: "Outstanding", path: "/finance?tab=outstanding", access: "finance" },
      { key: "petty-cash", label: "Petty Cash", path: "/finance?tab=petty", access: "finance" },
      { key: "expenses", label: "Expenses", path: "/finance?tab=expenses", access: "finance" },
      { key: "business-activity-statement", label: "Business Activity Statement", access: "reports", disabled: true },
      { key: "financial-year", label: "Financial Year", path: "/reports?period=financial-year", access: "reports" },
      { key: "reports", label: "Reports", path: "/reports", access: "reports" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    dropdown: true,
    children: [
      { key: "frame-details", label: "Frame Details List", path: "/inventory?category=frame", access: "inventory" },
      { key: "frame-stocktake", label: "Frame Stock-take", path: "/inventory?category=frame&action=stocktake", access: "inventory" },
      { key: "sundry-details", label: "Sundry Details", path: "/inventory?category=sundry", access: "inventory" },
      { key: "adjustment-report", label: "Adjustment Report", access: "inventory", disabled: true },
      { key: "lens-list", label: "Lens List", path: "/inventory?category=lens", access: "inventory" },
      { key: "contact-lens-list", label: "Contact Lens List", path: "/dispensing/contact-lenses", access: "dispensing" },
      { key: "dispensing", label: "Dispensing", dropdown: true, children: [
        { key: "dispensing-overview", label: "Dispensing Overview", path: "/dispensing", access: "dispensing" },
        { key: "spectacle-jobs", label: "Spectacle Jobs", path: "/dispensing/spectacle-jobs", access: "dispensing" },
        { key: "contact-lens-jobs", label: "Contact Lens Jobs", path: "/dispensing/contact-lenses", access: "dispensing" },
        { key: "sundry-jobs", label: "Sundry Jobs", path: "/dispensing/sundries", access: "dispensing" },
      ] },
      { key: "catalogue", label: "Optical Catalogue", path: "/catalogue", access: "catalogue" },
      { key: "laboratory", label: "Laboratory", path: "/lab", access: "laboratory" },
    ],
  },
  {
    key: "maintenance",
    label: "Maintenance",
    dropdown: true,
    children: [
      { key: "setup-frame", label: "Setup Frame", path: "/inventory?category=frame&create=1", access: "inventory" },
      { key: "setup-lens", label: "Setup Lens", path: "/catalogue?tab=lens&new=1", access: "catalogue" },
      { key: "staff", label: "Staff", path: "/staff", access: "staff" },
      { key: "branches", label: "Branches", path: "/branches", access: "branches" },
      { key: "settings", label: "Practice Settings", path: "/settings", access: "settings" },
      { key: "organizations", label: "Organizations", path: "/admin/organizations", access: "organizations" },
    ],
  },
];

// ============================================================
// SUPER ADMIN NAVIGATION
// ============================================================

export const SUPER_ADMIN_NAV = [
  {
    key: "organizations",
    label: "Organizations",
    path: "/admin/organizations",
    access: "organizations",
  },

  {
    key: "reports",
    label: "Reports",
    path: "/reports",
    access: "reports",
  },
];

// ============================================================
// FILTER NAVIGATION
// ============================================================

export const filterNavigation = (items, role) => {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      // --------------------------------------------------------
      // Normal navigation item
      // --------------------------------------------------------

      if (!item.dropdown) {
        return canAccessModule(item.access, role) ? item : null;
      }

      // --------------------------------------------------------
      // Dropdown navigation item
      // --------------------------------------------------------

      const children = Array.isArray(item.children)
        ? item.children.filter((child) =>
            canAccessModule(child.access, role),
          )
        : [];

      if (!children.length) {
        return null;
      }

      return {
        ...item,
        children,
      };
    })
    .filter(Boolean);
};

// ============================================================
// NAVIGATION HELPERS
// ============================================================

export const getMainNavigation = (role) =>
  filterNavigation(MAIN_NAV, role);

export const getSuperAdminNavigation = (role) => {
  if (!isSuperAdmin(role)) {
    return [];
  }

  return filterNavigation(SUPER_ADMIN_NAV, role);
};

// ============================================================
// ROUTE ACCESS MAP
// ============================================================

export const ROUTE_ACCESS = {
  dashboard: "dashboard",
  patients: "patients",
  appointments: "appointments",

  clinical: "clinical",

  dispensing: "dispensing",
  spectacleJobs: "dispensing",
  contactLensJobs: "dispensing",
  sundries: "dispensing",

  inventory: "inventory",
  catalogue: "catalogue",
  laboratory: "laboratory",

  billing: "billing",
  finance: "finance",
  reports: "reports",

  recall: "recall",
  communications: "communications",

  staff: "staff",
  branches: "branches",
  settings: "settings",
  organization: "organization",
  organizations: "organizations",
};

// ============================================================
// ROUTE ACCESS CHECK
// ============================================================

export const canAccessRoute = (routeKey, role) => {
  const moduleKey = ROUTE_ACCESS[routeKey];

  if (!moduleKey) {
    return false;
  }

  if (
    moduleKey === "organizations" &&
    !isSuperAdmin(role)
  ) {
    return false;
  }

  return canAccessModule(moduleKey, role);
};

// ============================================================
// DEFAULT LANDING ROUTE
// ============================================================

export const getDefaultRoute = (role) => {
  const accessLevel = getAccessLevel(role);

  switch (accessLevel) {
    case ACCESS_LEVELS.SUPER_ADMIN:
      return "/dashboard";

    case ACCESS_LEVELS.ORGANIZATION_ADMIN:
      return "/dashboard";

    case ACCESS_LEVELS.PRACTICE_USER:
      return "/dashboard";

    default:
      return "/login";
  }
};

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  ACCESS_LEVELS,
  ROLES,
  ALL_ROLES,
  PRACTICE_ROLES,

  CLINICAL_ROLES,
  DISPENSING_ROLES,
  OPTICAL_ROLES,
  PATIENT_SERVICE_ROLES,

  normalizeRole,
  getAccessLevel,

  isSuperAdmin,
  isOrganizationAdmin,
  isPracticeUser,
  isOptometrist,
  isDoctor,
  isClinician,

  MODULE_ACCESS,
  ROUTE_ACCESS,

  canAccessModule,
  canAccess,
  canAccessRoute,

  MAIN_NAV,
  SUPER_ADMIN_NAV,

  filterNavigation,
  getMainNavigation,
  getSuperAdminNavigation,

  getDefaultRoute,
};