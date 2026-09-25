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

// ============================================================
// MODULE ACCESS
// ============================================================
//
// The application uses modules rather than creating a
// completely different UI for every employee role.
//
// Example:
// Doctor + Optometrist both access Clinical Management.
//
// Individual permissions can still be enforced by the backend.
//

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

  clinical: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.OPTOMETRIST,
    ROLES.DOCTOR,
  ],

  // ----------------------------------------------------------
  // Optical
  // ----------------------------------------------------------

  optical: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.SALES_EXECUTIVE,
    ROLES.OPTOMETRIST,
    ROLES.DOCTOR,
  ],

  // ----------------------------------------------------------
  // Operations
  // ----------------------------------------------------------

  dispensing: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.SALES_EXECUTIVE,
    ROLES.OPTOMETRIST,
    ROLES.DOCTOR,
    ROLES.RECEPTIONIST,
    ROLES.LAB_TECHNICIAN,
  ],

  inventory: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.INVENTORY_MANAGER,
  ],

  catalogue: [
    ROLES.SUPER_ADMIN,
    ROLES.ORGANIZATION_ADMIN,
    ROLES.BRANCH_MANAGER,
    ROLES.INVENTORY_MANAGER,
    ROLES.SALES_EXECUTIVE,
    ROLES.OPTOMETRIST,
    ROLES.DOCTOR,
  ],

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

  organizations: [ROLES.SUPER_ADMIN],
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

// Backward-compatible helper.
//
// Existing components can continue using:
//
// canAccess("clinical", user.role)
//

export const canAccess = (module, role) =>
  canAccessModule(module, role);

// ============================================================
// MAIN NAVIGATION
// ============================================================

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
    path: "/patients",
    access: "patients",
  },

  {
    key: "appointments",
    label: "Appointments",
    path: "/appointments",
    access: "appointments",
  },

  {
    key: "clinical",
    label: "Clinical",
    path: "/clinical",
    access: "clinical",
  },

  {
    key: "optical",
    label: "Optical",
    path: "/optical",
    access: "optical",
  },

  // ==========================================================
  // OPERATIONS
  // ==========================================================

  {
    key: "operations",
    label: "Operations",
    dropdown: true,

    children: [
      {
        key: "dispensing",
        label: "Dispensing",
        path: "/dispensing",
        access: "dispensing",
      },

      {
        key: "inventory",
        label: "Inventory",
        path: "/inventory",
        access: "inventory",
      },

      {
        key: "catalogue",
        label: "Catalogue",
        path: "/catalogue",
        access: "catalogue",
      },

      {
        key: "laboratory",
        label: "Laboratory",
        path: "/lab",
        access: "laboratory",
      },
    ],
  },

  // ==========================================================
  // FINANCE
  // ==========================================================

  {
    key: "finance",
    label: "Finance",
    dropdown: true,

    children: [
      {
        key: "billing",
        label: "Billing",
        path: "/billing",
        access: "billing",
      },

      {
        key: "finance-management",
        label: "Finance",
        path: "/finance",
        access: "finance",
      },

      {
        key: "reports",
        label: "Reports",
        path: "/reports",
        access: "reports",
      },
    ],
  },

  // ==========================================================
  // MORE
  // ==========================================================

  {
    key: "more",
    label: "More",
    dropdown: true,

    children: [
      {
        key: "recall",
        label: "Recall",
        path: "/recall",
        access: "recall",
      },

      {
        key: "communications",
        label: "Letters & Images",
        path: "/communications",
        access: "communications",
      },

      {
        key: "staff",
        label: "Staff",
        path: "/staff",
        access: "staff",
      },

      {
        key: "branches",
        label: "Branches",
        path: "/branches",
        access: "branches",
      },

      {
        key: "settings",
        label: "Settings",
        path: "/settings",
        access: "settings",
      },
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
            canAccessModule(child.access, role)
          )
        : [];

      // Don't display an empty dropdown.
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
//
// Route keys intentionally map to MODULE_ACCESS.
//
// This means App.jsx / AccessRoute.jsx do not need to
// duplicate role arrays.
//

export const ROUTE_ACCESS = {
  // Core
  dashboard: "dashboard",
  patients: "patients",
  appointments: "appointments",

  // Clinical / Optical
  clinical: "clinical",
  optical: "optical",

  // Operations
  dispensing: "dispensing",
  inventory: "inventory",
  catalogue: "catalogue",
  laboratory: "laboratory",

  // Finance
  billing: "billing",
  finance: "finance",
  reports: "reports",

  // Communication
  recall: "recall",
  communications: "communications",

  // Administration
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

  // Super admin organization route is intentionally restricted.
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

  normalizeRole,
  getAccessLevel,

  isSuperAdmin,
  isOrganizationAdmin,
  isPracticeUser,

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