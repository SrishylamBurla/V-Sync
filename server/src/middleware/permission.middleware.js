import { ROLE_PERMISSIONS } from "../config/rolePermissions.js";

export const requirePermission =
  (permission) =>
  (req, res, next) => {
    console.log("\n========== PERMISSION DEBUG ==========");
    console.log("User ID:", req.user?._id);
    console.log("User role:", req.user?.role);
    console.log("Required:", permission);
    console.log(
      "ROLE_PERMISSIONS keys:",
      Object.keys(ROLE_PERMISSIONS)
    );

    const role = String(req.user?.role || "")
      .trim()
      .toLowerCase();

    console.log("Normalized role:", role);

    const permissions = ROLE_PERMISSIONS[role] || [];

    console.log("User permissions:", permissions);
    console.log(
      "Has permission:",
      permissions.includes(permission)
    );
    console.log("======================================\n");

    if (!req.user?.role) {
      return res.status(403).json({
        success: false,
        message: "User role not found",
      });
    }

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
        debug: {
          role,
          requiredPermission: permission,
          availablePermissions: permissions,
        },
      });
    }

    next();
  };