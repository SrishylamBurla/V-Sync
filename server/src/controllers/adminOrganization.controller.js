import asyncHandler from "express-async-handler";
import Organization from "../models/Organization.js";
import Branch from "../models/Branch.js";
import User from "../models/User.js";

const createSlug = (value) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

/**
 * GET /api/v1/admin/organizations
 */
export const getOrganizations = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = "",
    status,
  } = req.query;

  const pageNumber = Math.max(Number(page), 1);
  const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

  const filter = {};

  if (status && ["active", "suspended", "inactive"].includes(status)) {
    filter.status = status;
  }

  if (search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");

    filter.$or = [
      { name: searchRegex },
      { slug: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
  }

  const [organizations, total] = await Promise.all([
    Organization.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .lean(),

    Organization.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: organizations,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      pages: Math.ceil(total / limitNumber),
    },
  });
});

/**
 * GET /api/v1/admin/organizations/:id
 */
export const getOrganization = asyncHandler(async (req, res) => {
  const organization = await Organization.findById(req.params.id).lean();

  if (!organization) {
    res.status(404);
    throw new Error("Organization not found");
  }

  const [branches, staff] = await Promise.all([
    Branch.countDocuments({
      organizationId: organization._id,
      status: "active",
    }),

    User.countDocuments({
      organizationId: organization._id,
      status: "active",
    }),
  ]);

  res.json({
    success: true,
    data: {
      organization,
      statistics: {
        branches,
        staff,
      },
    },
  });
});

/**
 * POST /api/v1/admin/organizations
 */
export const createOrganization = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    country,
    currency,
    timezone,
  } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error("Organization name and email are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  let slug = createSlug(name);

  if (!slug) {
    res.status(400);
    throw new Error("Unable to generate organization slug");
  }

  let uniqueSlug = slug;
  let counter = 1;

  while (await Organization.findOne({ slug: uniqueSlug })) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  const organization = await Organization.create({
    name: name.trim(),
    slug: uniqueSlug,
    email: normalizedEmail,
    phone: phone?.trim(),
    country: country?.trim() || "India",
    currency: currency?.trim()?.toUpperCase() || "INR",
    timezone: timezone?.trim() || "Asia/Kolkata",
  });

  res.status(201).json({
    success: true,
    message: "Organization created successfully",
    data: organization,
  });
});

/**
 * PUT /api/v1/admin/organizations/:id
 */
export const updateOrganization = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    country,
    currency,
    timezone,
  } = req.body;

  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    res.status(404);
    throw new Error("Organization not found");
  }

  if (name !== undefined) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      res.status(400);
      throw new Error("Organization name cannot be empty");
    }

    organization.name = trimmedName;
  }

  if (email !== undefined) {
    const normalizedEmail = email.toLowerCase().trim();

    if (!normalizedEmail) {
      res.status(400);
      throw new Error("Organization email cannot be empty");
    }

    organization.email = normalizedEmail;
  }

  if (phone !== undefined) {
    organization.phone = phone.trim();
  }

  if (country !== undefined) {
    organization.country = country.trim();
  }

  if (currency !== undefined) {
    organization.currency = currency.trim().toUpperCase();
  }

  if (timezone !== undefined) {
    organization.timezone = timezone.trim();
  }

  await organization.save();

  res.json({
    success: true,
    message: "Organization updated successfully",
    data: organization,
  });
});

/**
 * PATCH /api/v1/admin/organizations/:id/status
 */
export const updateOrganizationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const allowedStatuses = [
    "active",
    "suspended",
    "inactive",
  ];

  if (!allowedStatuses.includes(status)) {
    res.status(400);
    throw new Error(
      "Status must be active, suspended, or inactive"
    );
  }

  const organization = await Organization.findById(req.params.id);

  if (!organization) {
    res.status(404);
    throw new Error("Organization not found");
  }

  organization.status = status;

  await organization.save();

  res.json({
    success: true,
    message: "Organization status updated successfully",
    data: {
      id: organization._id,
      status: organization.status,
    },
  });
});