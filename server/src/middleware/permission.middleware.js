import { ROLE_PERMISSIONS } from "../config/rolePermissions.js";

export const requirePermission =
  (permission) =>
  (req, res, next) => {
    const role = req.user?.role;

    if (!role) {
      return res.status(403).json({
        success: false,
        message: "User role not found",
      });
    }

    const permissions =
      ROLE_PERMISSIONS[role] || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };