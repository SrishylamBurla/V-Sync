import asyncHandler from "express-async-handler";

import Branch from "../models/Branch.js";

export const createBranch = asyncHandler(
  async (req, res) => {
    const {
      name,
      code,
      phone,
      email,
      address,
      gstin,
    } = req.body;

    if (!name || !code) {
      res.status(400);
      throw new Error(
        "Branch name and code are required"
      );
    }

    const existingBranch = await Branch.findOne({
      organizationId: req.user.organizationId,
      code: code.toUpperCase().trim(),
    });

    if (existingBranch) {
      res.status(409);
      throw new Error(
        "A branch with this code already exists"
      );
    }

    const branch = await Branch.create({
      organizationId: req.user.organizationId,
      name: name.trim(),
      code: code.toUpperCase().trim(),
      phone,
      email,
      address,
      gstin,
    });

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch,
    });
  }
);

export const getBranches = asyncHandler(
  async (req, res) => {
    const branches = await Branch.find({
      organizationId: req.user.organizationId,
    }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: branches,
    });
  }
);

export const getBranch = asyncHandler(
  async (req, res) => {
    const branch = await Branch.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!branch) {
      res.status(404);
      throw new Error("Branch not found");
    }

    res.json({
      success: true,
      data: branch,
    });
  }
);

export const updateBranch = asyncHandler(
  async (req, res) => {
    const branch = await Branch.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId,
    });

    if (!branch) {
      res.status(404);
      throw new Error("Branch not found");
    }

    const allowedFields = [
      "name",
      "phone",
      "email",
      "address",
      "gstin",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        branch[field] = req.body[field];
      }
    });

    await branch.save();

    res.json({
      success: true,
      message: "Branch updated successfully",
      data: branch,
    });
  }
);