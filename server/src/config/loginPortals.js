// Kept as a compatibility module for older imports. VividOpt now uses one
// login endpoint and determines the workspace from the authenticated role.
export const getLoginPortal = () => ({ roles: [], label: "VividOpt", redirect: "/dashboard" });
export const getPortalForRole = () => "dashboard";
