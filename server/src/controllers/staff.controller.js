import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.js";
import Branch from "../models/Branch.js";

const STAFF_ROLES = [
  "branch_manager",
  "optometrist",
  "doctor",
  "sales_executive",
  "cashier",
  "inventory_manager",
  "lab_technician",
  "receptionist",
];

const ADMIN_ROLES = [
  "super_admin",
  "organization_admin",
];

const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Validate that branches belong to the current organization
 * and that branch-manager/staff users only receive valid branches.
 */
const validateBranches = async (organizationId, branchIds = []) => {
  if (!Array.isArray(branchIds)) {
    return {
      valid: false,
      message: "branchIds must be an array",
    };
  }

  if (branchIds.length === 0) {
    return {
      valid: true,
      branches: [],
    };
  }

  const uniqueBranchIds = [
    ...new Set(branchIds.map((id) => id.toString())),
  ];

  const invalidId = uniqueBranchIds.find(
    (id) => !validateObjectId(id)
  );

  if (invalidId) {
    return {
      valid: false,
      message: "One or more branch IDs are invalid",
    };
  }

  const branches = await Branch.find({
    _id: { $in: uniqueBranchIds },
    organizationId,
    status: "active",
  }).select("_id name code");

  if (branches.length !== uniqueBranchIds.length) {
    return {
      valid: false,
      message:
        "One or more selected branches do not belong to your organization or are inactive",
    };
  }

  return {
    valid: true,
    branches,
  };
};

/**
 * Prevent organization admins from creating another administrator.
 */
const canManageRole = (currentUser, targetRole) => {
  if (ADMIN_ROLES.includes(targetRole)) {
    return (
      currentUser.role === "super_admin"
    );
  }

  return STAFF_ROLES.includes(targetRole);
};

/**
 * Branch managers can only manage staff in branches
 * they themselves have access to.
 */
const getManagerBranchIds = (user) => {
  return (user.branchIds || []).map((id) => id.toString());
};

const hasBranchOverlap = (user, branchIds = []) => {
  const managerBranches = getManagerBranchIds(user);

  return branchIds.some((branchId) =>
    managerBranches.includes(branchId.toString())
  );
};

/**
 * GET /staff
 *
 * List staff belonging to the organization.
 */
export const getStaff = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = "",
    status,
    role,
    branchId,
  } = req.query;

  const currentPage = Math.max(Number(page) || 1, 1);
  const pageLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100
  );

  const skip = (currentPage - 1) * pageLimit;

  const filter = {
    organizationId: req.user.organizationId,

    role: {
      $in: STAFF_ROLES,
    },
  };

  if (status && ["active", "inactive", "suspended"].includes(status)) {
    filter.status = status;
  }

  if (role && STAFF_ROLES.includes(role)) {
    filter.role = role;
  }

  if (branchId) {
    if (!validateObjectId(branchId)) {
      res.status(400);
      throw new Error("Invalid branch ID");
    }

    filter.branchIds = branchId;
  }

  if (search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");

    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  /**
   * Branch managers should only see staff
   * from their assigned branches.
   */
  if (req.user.role === "branch_manager") {
    const managerBranchIds = req.user.branchIds || [];

    filter.branchIds = {
      $in: managerBranchIds,
    };
  }

  const [staff, total] = await Promise.all([
    User.find(filter)
      .select(
        "-password -refreshTokenHash"
      )
      .populate({
        path: "branchIds",
        select: "name code status",
      })
      .populate({
        path: "defaultBranchId",
        select: "name code status",
      })
      .sort({
        createdAt: -1,
      })
      .skip(skip)
      .limit(pageLimit),

    User.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: staff,
    pagination: {
      page: currentPage,
      limit: pageLimit,
      total,
      totalPages: Math.ceil(total / pageLimit),
      hasNextPage:
        currentPage < Math.ceil(total / pageLimit),
      hasPreviousPage:
        currentPage > 1,
    },
  });
});

/**
 * GET /staff/:id
 */
export const getStaffMember = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      res.status(400);
      throw new Error("Invalid staff ID");
    }

    const staff = await User.findOne({
      _id: id,
      organizationId: req.user.organizationId,
      role: {
        $in: STAFF_ROLES,
      },
    })
      .select("-password -refreshTokenHash")
      .populate({
        path: "branchIds",
        select: "name code phone email address status",
      })
      .populate({
        path: "defaultBranchId",
        select: "name code phone email address status",
      });

    if (!staff) {
      res.status(404);
      throw new Error("Staff member not found");
    }

    /**
     * Branch managers cannot inspect staff
     * outside their branches.
     */
    if (req.user.role === "branch_manager") {
      const managerBranches = getManagerBranchIds(
        req.user
      );

      const staffBranches = staff.branchIds.map(
        (branch) => branch._id.toString()
      );

      const allowed = staffBranches.some((branchId) =>
        managerBranches.includes(branchId)
      );

      if (!allowed) {
        res.status(403);
        throw new Error(
          "You do not have access to this staff member"
        );
      }
    }

    res.json({
      success: true,
      data: staff,
    });
  }
);

/**
 * POST /staff
 */
export const createStaff = asyncHandler(
  async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      branchIds = [],
      defaultBranchId = null,
    } = req.body;

    if (
      !firstName ||
      !email ||
      !password ||
      !role
    ) {
      res.status(400);
      throw new Error(
        "First name, email, password and role are required"
      );
    }

    if (!STAFF_ROLES.includes(role)) {
      res.status(400);
      throw new Error(
        "Invalid staff role"
      );
    }

    /**
     * Organization admin / branch manager
     * cannot create administrator accounts.
     */
    if (!canManageRole(req.user, role)) {
      res.status(403);
      throw new Error(
        "You do not have permission to create this role"
      );
    }

    /**
     * Branch manager restrictions.
     */
    if (req.user.role === "branch_manager") {
      if (!hasBranchOverlap(req.user, branchIds)) {
        res.status(403);
        throw new Error(
          "You can only assign staff to your branches"
        );
      }

      const managerBranches =
        getManagerBranchIds(req.user);

      const outsideBranch = branchIds.some(
        (branchId) =>
          !managerBranches.includes(
            branchId.toString()
          )
      );

      if (outsideBranch) {
        res.status(403);
        throw new Error(
          "You cannot assign staff to a branch you do not manage"
        );
      }
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const existingUser = await User.findOne({
      organizationId: req.user.organizationId,
      email: normalizedEmail,
    });

    if (existingUser) {
      res.status(409);
      throw new Error(
        "A staff member with this email already exists"
      );
    }

    const branchValidation =
      await validateBranches(
        req.user.organizationId,
        branchIds
      );

    if (!branchValidation.valid) {
      res.status(400);
      throw new Error(
        branchValidation.message
      );
    }

    if (
      defaultBranchId &&
      !branchIds
        .map((id) => id.toString())
        .includes(defaultBranchId.toString())
    ) {
      res.status(400);
      throw new Error(
        "Default branch must be one of the assigned branches"
      );
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const staff = await User.create({
      organizationId:
        req.user.organizationId,

      branchIds,

      defaultBranchId,

      firstName: firstName.trim(),

      lastName:
        lastName?.trim() || undefined,

      email: normalizedEmail,

      phone: phone?.trim() || undefined,

      password: passwordHash,

      role,

      status: "active",
    });

    const createdStaff =
      await User.findById(staff._id)
        .select("-password -refreshTokenHash")
        .populate({
          path: "branchIds",
          select: "name code status",
        })
        .populate({
          path: "defaultBranchId",
          select: "name code status",
        });

    res.status(201).json({
      success: true,
      message: "Staff member created successfully",
      data: createdStaff,
    });
  }
);

/**
 * PUT /staff/:id
 */
export const updateStaff = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      res.status(400);
      throw new Error("Invalid staff ID");
    }

    const staff = await User.findOne({
      _id: id,
      organizationId: req.user.organizationId,
      role: {
        $in: STAFF_ROLES,
      },
    });

    if (!staff) {
      res.status(404);
      throw new Error("Staff member not found");
    }

    /**
     * Branch manager access restriction.
     */
    if (req.user.role === "branch_manager") {
      const managerBranches =
        getManagerBranchIds(req.user);

      const staffBranches =
        staff.branchIds.map((branchId) =>
          branchId.toString()
        );

      const canAccess =
        staffBranches.some((branchId) =>
          managerBranches.includes(branchId)
        );

      if (!canAccess) {
        res.status(403);
        throw new Error(
          "You do not have access to this staff member"
        );
      }
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      role,
      branchIds,
      defaultBranchId,
      status,
    } = req.body;

    /**
     * Role change
     */
    if (role !== undefined) {
      if (!STAFF_ROLES.includes(role)) {
        res.status(400);
        throw new Error(
          "Invalid staff role"
        );
      }

      if (!canManageRole(req.user, role)) {
        res.status(403);
        throw new Error(
          "You do not have permission to assign this role"
        );
      }

      staff.role = role;
    }

    /**
     * Branch changes
     */
    if (branchIds !== undefined) {
      const branchValidation =
        await validateBranches(
          req.user.organizationId,
          branchIds
        );

      if (!branchValidation.valid) {
        res.status(400);
        throw new Error(
          branchValidation.message
        );
      }

      if (req.user.role === "branch_manager") {
        const managerBranches =
          getManagerBranchIds(req.user);

        const outsideBranch =
          branchIds.some(
            (branchId) =>
              !managerBranches.includes(
                branchId.toString()
              )
          );

        if (outsideBranch) {
          res.status(403);
          throw new Error(
            "You cannot assign staff to a branch you do not manage"
          );
        }
      }

      staff.branchIds = branchIds;
    }

    if (defaultBranchId !== undefined) {
      if (defaultBranchId === null) {
        staff.defaultBranchId = null;
      } else {
        if (!validateObjectId(defaultBranchId)) {
          res.status(400);
          throw new Error(
            "Invalid default branch ID"
          );
        }

        const assignedBranches =
          branchIds !== undefined
            ? branchIds
            : staff.branchIds;

        const assigned =
          assignedBranches.some(
            (branchId) =>
              branchId.toString() ===
              defaultBranchId.toString()
          );

        if (!assigned) {
          res.status(400);
          throw new Error(
            "Default branch must be one of the assigned branches"
          );
        }

        staff.defaultBranchId =
          defaultBranchId;
      }
    }

    if (firstName !== undefined) {
      if (!firstName.trim()) {
        res.status(400);
        throw new Error(
          "First name cannot be empty"
        );
      }

      staff.firstName =
        firstName.trim();
    }

    if (lastName !== undefined) {
      staff.lastName =
        lastName?.trim() || undefined;
    }

    if (phone !== undefined) {
      staff.phone =
        phone?.trim() || undefined;
    }

    /**
     * Email change
     */
    if (email !== undefined) {
      const normalizedEmail =
        email.toLowerCase().trim();

      const emailOwner =
        await User.findOne({
          organizationId:
            req.user.organizationId,
          email: normalizedEmail,
          _id: { $ne: staff._id },
        });

      if (emailOwner) {
        res.status(409);
        throw new Error(
          "Another user already uses this email"
        );
      }

      staff.email = normalizedEmail;
    }

    /**
     * Status
     */
    if (status !== undefined) {
      if (
        !["active", "inactive", "suspended"].includes(
          status
        )
      ) {
        res.status(400);
        throw new Error(
          "Invalid status"
        );
      }

      staff.status = status;
    }

    await staff.save();

    const updatedStaff =
      await User.findById(staff._id)
        .select("-password -refreshTokenHash")
        .populate({
          path: "branchIds",
          select: "name code status",
        })
        .populate({
          path: "defaultBranchId",
          select: "name code status",
        });

    res.json({
      success: true,
      message: "Staff member updated successfully",
      data: updatedStaff,
    });
  }
);

/**
 * PATCH /staff/:id/status
 */
export const updateStaffStatus =
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!validateObjectId(id)) {
      res.status(400);
      throw new Error("Invalid staff ID");
    }

    if (
      !["active", "inactive", "suspended"].includes(
        status
      )
    ) {
      res.status(400);
      throw new Error(
        "Invalid status"
      );
    }

    const staff = await User.findOne({
      _id: id,
      organizationId: req.user.organizationId,
      role: {
        $in: STAFF_ROLES,
      },
    });

    if (!staff) {
      res.status(404);
      throw new Error("Staff member not found");
    }

    if (req.user.role === "branch_manager") {
      const managerBranches =
        getManagerBranchIds(req.user);

      const staffBranches =
        staff.branchIds.map((branchId) =>
          branchId.toString()
        );

      const allowed =
        staffBranches.some((branchId) =>
          managerBranches.includes(branchId)
        );

      if (!allowed) {
        res.status(403);
        throw new Error(
          "You do not have access to this staff member"
        );
      }
    }

    staff.status = status;

    await staff.save();

    res.json({
      success: true,
      message: `Staff member ${status === "active" ? "activated" : "deactivated"} successfully`,
      data: {
        id: staff._id,
        status: staff.status,
      },
    });
  });

/**
 * POST /staff/:id/reset-password
 */
export const resetStaffPassword =
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!validateObjectId(id)) {
      res.status(400);
      throw new Error("Invalid staff ID");
    }

    if (!password || password.length < 8) {
      res.status(400);
      throw new Error(
        "Password must be at least 8 characters"
      );
    }

    const staff = await User.findOne({
      _id: id,
      organizationId: req.user.organizationId,
      role: {
        $in: STAFF_ROLES,
      },
    }).select("+password");

    if (!staff) {
      res.status(404);
      throw new Error("Staff member not found");
    }

    if (req.user.role === "branch_manager") {
      const managerBranches =
        getManagerBranchIds(req.user);

      const staffBranches =
        staff.branchIds.map((branchId) =>
          branchId.toString()
        );

      const allowed =
        staffBranches.some((branchId) =>
          managerBranches.includes(branchId)
        );

      if (!allowed) {
        res.status(403);
        throw new Error(
          "You do not have access to this staff member"
        );
      }
    }

    staff.password = await bcrypt.hash(
      password,
      12
    );

    /**
     * Invalidate existing refresh token
     * so all existing sessions must log in again.
     */
    staff.refreshTokenHash = undefined;

    await staff.save();

    res.json({
      success: true,
      message:
        "Staff password reset successfully. Existing sessions have been invalidated.",
    });
  });