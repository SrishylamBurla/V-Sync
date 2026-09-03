import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import Organization from "../models/Organization.js";
import Branch from "../models/Branch.js";
import User from "../models/User.js";

import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

const createSlug = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("organizationId")
    .populate("branchIds");

  res.json({
    success: true,
    data: {
      user,
    },
  });
});

export const registerOrganization = asyncHandler(async (req, res) => {
  const { organizationName, email, password, firstName, lastName, phone } =
    req.body;

  if (!organizationName || !email || !password || !firstName) {
    res.status(400);
    throw new Error("Required fields are missing");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({
    email: normalizedEmail,
  });

  if (existingUser) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const slug = createSlug(organizationName);

  let uniqueSlug = slug;
  let counter = 1;

  while (await Organization.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const organization = await Organization.create({
    name: organizationName,
    slug: uniqueSlug,
    email: normalizedEmail,
    phone,
  });

  const passwordHash = await bcrypt.hash(password, 12);

  const branch = await Branch.create({
    organizationId: organization._id,
    name: organizationName,
    code: "MAIN",
    email: normalizedEmail,
    phone,
  });

  const user = await User.create({
    organizationId: organization._id,
    branchIds: [branch._id],
    defaultBranchId: branch._id,
    firstName,
    lastName,
    email: normalizedEmail,
    phone,
    password: passwordHash,
    role: "organization_admin",
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  user.refreshTokenHash = refreshTokenHash;

  await user.save();

  res.status(201).json({
    success: true,
    message: "Organization created successfully",
    data: {
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
      },

      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },

      accessToken,
      refreshToken,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  }).select("+password");

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (user.status !== "active") {
    res.status(403);
    throw new Error("Your account is not active");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  user.lastLoginAt = new Date();

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken(user);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

  user.refreshTokenHash = refreshTokenHash;

  await user.save();

  res.json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        organizationId: user.organizationId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      redirect: "/dashboard",
      accessToken,
      refreshToken,
    },
  });
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401);
    throw new Error("Refresh token is required");
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    res.status(401);
    throw new Error("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.userId).select("+refreshTokenHash");

  if (!user || !user.refreshTokenHash) {
    res.status(401);
    throw new Error("Invalid refresh token");
  }

  const tokenMatches = await bcrypt.compare(
    refreshToken,
    user.refreshTokenHash,
  );

  if (!tokenMatches) {
    res.status(401);
    throw new Error("Invalid refresh token");
  }

  if (user.status !== "active") {
    res.status(403);
    throw new Error("User account is not active");
  }

  const newAccessToken = generateAccessToken(user);

  const newRefreshToken = generateRefreshToken(user);

  user.refreshTokenHash = await bcrypt.hash(newRefreshToken, 12);

  await user.save();

  res.json({
    success: true,
    message: "Token refreshed successfully",
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
});
