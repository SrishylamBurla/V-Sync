/**
 * V-Sync
 * ---------------------------------------------------------
 * Central navigation / UI access configuration.
 *
 * IMPORTANT:
 * This controls what is DISPLAYED in the frontend.
 * Backend authorization remains the final security boundary.
 *
 * V-Sync has 3 UI access levels:
 *
 * 1. SUPER_ADMIN
 *    Platform-level administrator.
 *
 * 2. ORGANIZATION_ADMIN
 *    Administrator of one organization.
 *
 * 3. PRACTICE_USER
 *    Users working inside the organization:
 *    doctors, optometrists, front desk, branch managers,
 *    receptionists, optical staff, etc.
 *
 * Individual job titles should NOT create completely
 * different application UIs.
 */

// ---------------------------------------------------------
// ACCESS LEVELS
// ---------------------------------------------------------

export const ACCESS_LEVELS = {
  SUPER_ADMIN: "super_admin",
  ORGANIZATION_ADMIN: "organization_admin",
  PRACTICE_USER: "practice_user",
};

// ---------------------------------------------------------
// EXISTING BACKEND ROLES
// ---------------------------------------------------------
//
// Keep these values because your existing backend/user
// records already use them.
//

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

// ---------------------------------------------------------
// ROLE GROUPS
// ---------------------------------------------------------

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

// ---------------------------------------------------------
// NORMALIZE ROLE
// ---------------------------------------------------------

export const normalizeRole = (role) => {
  if (!role) return null;

  return String(role)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
};

// ---------------------------------------------------------
// ACCESS LEVEL RESOLUTION
// ---------------------------------------------------------

export const getAccessLevel = (role) => {
  const normalized = normalizeRole(role);

  if (normalized === ROLES.SUPER_ADMIN) {
    return ACCESS_LEVELS.SUPER_ADMIN;
  }

  if (normalized === ROLES.ORGANIZATION_ADMIN) {
    return ACCESS_LEVELS.ORGANIZATION_ADMIN;
  }

  if (PRACTICE_ROLES.includes(normalized)) {
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

// ---------------------------------------------------------
// MODULE ACCESS
// ---------------------------------------------------------
//
// These are MODULE permissions, not separate UIs.
//
// Example:
// Doctor and Optometrist both use the same Clinical UI.
//
// Receptionist and Doctor may have different permissions
// inside a module, but they should not receive completely
// different navigation architectures.
//

export const MODULE_ACCESS = {
  dashboard: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
    ACCESS_LEVELS.PRACTICE_USER,
  ],

  patients: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
    ACCESS_LEVELS.PRACTICE_USER,
  ],

  appointments: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
    ACCESS_LEVELS.PRACTICE_USER,
  ],

  clinical: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
    ACCESS_LEVELS.PRACTICE_USER,
  ],

  optical: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
    ACCESS_LEVELS.PRACTICE_USER,
  ],

  dispensing: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
    ACCESS_LEVELS.PRACTICE_USER,
  ],

  inventory: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
    ACCESS_LEVELS.PRACTICE_USER,
  ],

  catalogue: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
    ACCESS_LEVELS.PRACTICE_USER,
  ],

  laboratory: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
    ACCESS_LEVELS.PRACTICE_USER,
  ],

  billing: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
    ACCESS_LEVELS.PRACTICE_USER,
  ],

  finance: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
  ],

  recall: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
    ACCESS_LEVELS.PRACTICE_USER,
  ],

  communications: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
    ACCESS_LEVELS.PRACTICE_USER,
  ],

  reports: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
  ],

  staff: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
  ],

  branches: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
  ],

  settings: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
  ],

  organization: [
    ACCESS_LEVELS.SUPER_ADMIN,
    ACCESS_LEVELS.ORGANIZATION_ADMIN,
  ],

  organizations: [
    ACCESS_LEVELS.SUPER_ADMIN,
  ],
};

// ---------------------------------------------------------
// CHECK MODULE ACCESS
// ---------------------------------------------------------

export const canAccessModule = (module, role) => {
  const level = getAccessLevel(role);

  if (!level) return false;

  const allowedLevels = MODULE_ACCESS[module];

  if (!allowedLevels) return false;

  return allowedLevels.includes(level);
};

// Backwards-compatible helper.
//
// If your existing components use:
//
// canAccess("clinical", user.role)
//
// they can continue working.
//

export const canAccess = (module, role) =>
  canAccessModule(module, role);

// ---------------------------------------------------------
// NAVIGATION DEFINITIONS
// ---------------------------------------------------------
//
// Keep navigation definitions here instead of scattering
// role checks throughout Topbar.jsx.
//

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

// ---------------------------------------------------------
// SUPER ADMIN NAVIGATION
// ---------------------------------------------------------

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

// ---------------------------------------------------------
// FILTER NAVIGATION
// ---------------------------------------------------------

export const filterNavigation = (items, role) => {
  return items
    .map((item) => {
      // Normal link
      if (!item.dropdown) {
        return canAccessModule(item.access, role) ? item : null;
      }

      // Dropdown
      const children = (item.children || []).filter((child) =>
        canAccessModule(child.access, role)
      );

      // Don't render empty dropdowns.
      if (!children.length) return null;

      return {
        ...item,
        children,
      };
    })
    .filter(Boolean);
};

// ---------------------------------------------------------
// GET MAIN NAVIGATION
// ---------------------------------------------------------

export const getMainNavigation = (role) =>
  filterNavigation(MAIN_NAV, role);

// ---------------------------------------------------------
// GET SUPER ADMIN NAVIGATION
// ---------------------------------------------------------

export const getSuperAdminNavigation = (role) => {
  if (!isSuperAdmin(role)) return [];

  return filterNavigation(SUPER_ADMIN_NAV, role);
};

// ---------------------------------------------------------
// ROUTE ACCESS
// ---------------------------------------------------------
//
// Useful for ProtectedRoute / RoleRoute.
//
// Keep route names independent from UI labels.
//

export const ROUTE_ACCESS = {
  dashboard: "dashboard",
  patients: "patients",
  appointments: "appointments",

  clinical: "clinical",
  optical: "optical",

  dispensing: "dispensing",
  inventory: "inventory",
  catalogue: "catalogue",
  laboratory: "laboratory",

  billing: "billing",
  finance: "finance",

  recall: "recall",
  communications: "communications",
  reports: "reports",

  staff: "staff",
  branches: "branches",
  settings: "settings",

  organization: "organization",
  organizations: "organizations",
};

export const canAccessRoute = (routeKey, role) => {
  const moduleKey = ROUTE_ACCESS[routeKey];

  if (!moduleKey) return false;

  return canAccessModule(moduleKey, role);
};

// ---------------------------------------------------------
// DEFAULT LANDING PAGE
// ---------------------------------------------------------

export const getDefaultRoute = (role) => {
  const level = getAccessLevel(role);

  switch (level) {
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