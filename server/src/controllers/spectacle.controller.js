import asyncHandler from "express-async-handler";
import mongoose from "mongoose";

import Spectacle from "../models/Spectacle.js";
import Patient from "../models/Patient.js";
import Branch from "../models/Branch.js";
import Consultation from "../models/Consultation.js";
import InventoryItem from "../models/InventoryItem.js";
import InventoryTransaction from "../models/InventoryTransaction.js";

/*
|--------------------------------------------------------------------------
| Roles
|--------------------------------------------------------------------------
|
| The application intentionally keeps the access model simple:
|
| 1. super_admin
| 2. organization_admin
| 3. operational users
|
| Operational users can work with the clinical / optical workflow.
|
*/

const OPERATIONAL_ROLES = [
  "branch_manager",
  "optometrist",
  "doctor",
  "receptionist",
  "sales_executive",
  "inventory_manager",
  "lab_technician",
];

const VIEW_ROLES = [
  "super_admin",
  "organization_admin",
  ...OPERATIONAL_ROLES,
  "cashier",
];

const CREATE_ROLES = [
  "super_admin",
  "organization_admin",
  "branch_manager",
  "optometrist",
  "doctor",
  "receptionist",
  "sales_executive",
];

const UPDATE_ROLES = [
  "super_admin",
  "organization_admin",
  "branch_manager",
  "optometrist",
  "doctor",
  "sales_executive",
  "inventory_manager",
  "lab_technician",
];

const STATUS_ROLES = [
  "super_admin",
  "organization_admin",
  "branch_manager",
  "optometrist",
  "doctor",
  "receptionist",
  "sales_executive",
  "inventory_manager",
  "lab_technician",
];

const ACTIVE_STATUSES = [
  "draft",
  "ordered",
  "not_ready",
  "ready",
  "notified",
];

const ALL_STATUSES = [
  ...ACTIVE_STATUSES,
  "collected",
  "cancelled",
];

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const isValidObjectId = (value) =>
  Boolean(value) && mongoose.Types.ObjectId.isValid(value);

const toObjectId = (value) =>
  isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : null;

const money = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.round(number * 100) / 100;
};

const cleanString = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
};

const getOrganizationId = (req) => {
  const id = req.user?.organizationId;

  if (!isValidObjectId(id)) {
    return null;
  }

  return id;
};

const requireRole = (req, allowedRoles) => {
  const role = req.user?.role;

  if (!allowedRoles.includes(role)) {
    const error = new Error(
      "You do not have permission to perform this action.",
    );

    error.statusCode = 403;

    throw error;
  }
};

/*
|--------------------------------------------------------------------------
| Branch access
|--------------------------------------------------------------------------
|
| super_admin:
|   Can work across organizations/branches only when the organization
|   is explicitly represented by req.user.organizationId.
|
| organization_admin:
|   Can access any active branch in their organization.
|
| operational users:
|   Must have an assigned branch.
|
| We never trust an arbitrary branchId from the browser.
|
*/

const getAccessibleBranch = async ({
  req,
  branchId,
  session = null,
}) => {
  const organizationId = getOrganizationId(req);

  if (!organizationId) {
    const error = new Error(
      "Authenticated user is not assigned to an organization.",
    );

    error.statusCode = 403;

    throw error;
  }

  const requestedBranchId = branchId
    ? toObjectId(branchId)
    : null;

  if (branchId && !requestedBranchId) {
    const error = new Error("Invalid branch ID.");

    error.statusCode = 400;

    throw error;
  }

  const role = req.user?.role;

  /*
   * Organization admins can work with any active branch.
   */
  if (
    role === "super_admin" ||
    role === "organization_admin"
  ) {
    const query = {
      organizationId,
      status: "active",
    };

    if (requestedBranchId) {
      query._id = requestedBranchId;
    }

    const branch = await Branch.findOne(query)
      .session(session)
      .select("_id organizationId name code status")
      .lean();

    if (!branch) {
      const error = new Error(
        "Active branch not found for this organization.",
      );

      error.statusCode = 404;

      throw error;
    }

    return branch;
  }

  /*
   * Operational users must have branch assignment.
   */
  const assignedBranches = Array.isArray(req.user?.branchIds)
    ? req.user.branchIds
        .filter(Boolean)
        .map((id) => id.toString())
    : [];

  if (!assignedBranches.length) {
    const error = new Error(
      "Your account is not assigned to an active branch.",
    );

    error.statusCode = 403;

    throw error;
  }

  let selectedBranchId = requestedBranchId;

  if (selectedBranchId) {
    if (!assignedBranches.includes(selectedBranchId.toString())) {
      const error = new Error(
        "You do not have access to the selected branch.",
      );

      error.statusCode = 403;

      throw error;
    }
  } else {
    selectedBranchId = toObjectId(assignedBranches[0]);
  }

  const branch = await Branch.findOne({
    _id: selectedBranchId,
    organizationId,
    status: "active",
  })
    .session(session)
    .select("_id organizationId name code status")
    .lean();

  if (!branch) {
    const error = new Error(
      "Your assigned branch is inactive or unavailable.",
    );

    error.statusCode = 403;

    throw error;
  }

  return branch;
};

/*
|--------------------------------------------------------------------------
| Patient access
|--------------------------------------------------------------------------
*/

const getAccessiblePatient = async ({
  req,
  patientId,
  session = null,
}) => {
  const organizationId = getOrganizationId(req);

  if (!isValidObjectId(patientId)) {
    const error = new Error("Invalid patient ID.");

    error.statusCode = 400;

    throw error;
  }

  const patient = await Patient.findOne({
    _id: patientId,
    organizationId,
    status: "active",
  })
    .session(session)
    .select(
      "_id patientNumber firstName middleName lastName phone status",
    )
    .lean();

  if (!patient) {
    const error = new Error("Patient not found.");

    error.statusCode = 404;

    throw error;
  }

  return patient;
};

/*
|--------------------------------------------------------------------------
| Consultation
|--------------------------------------------------------------------------
*/

const getLatestConsultation = async ({
  req,
  patientId,
  consultationId = null,
  session = null,
}) => {
  const organizationId = getOrganizationId(req);

  if (consultationId) {
    if (!isValidObjectId(consultationId)) {
      const error = new Error("Invalid consultation ID.");

      error.statusCode = 400;

      throw error;
    }

    const consultation = await Consultation.findOne({
      _id: consultationId,
      patientId,
      organizationId,
    })
      .session(session)
      .sort({
        consultationDate: -1,
        createdAt: -1,
      })
      .lean();

    if (!consultation) {
      const error = new Error(
        "Selected consultation was not found for this patient.",
      );

      error.statusCode = 404;

      throw error;
    }

    return consultation;
  }

  return Consultation.findOne({
    patientId,
    organizationId,
  })
    .session(session)
    .sort({
      consultationDate: -1,
      createdAt: -1,
    })
    .lean();
};

/*
|--------------------------------------------------------------------------
| Prescription
|--------------------------------------------------------------------------
|
| The clinical consultation remains the source of truth.
| We do not allow the browser to silently replace the clinical Rx.
|
*/

const getClinicalPrescription = (consultation) => {
  if (!consultation) {
    return {
      givenRx: {
        right: {},
        left: {},
      },
      pd: {
        right: "",
        left: "",
        total: "",
      },
    };
  }

  return {
    givenRx: consultation.givenRx || {
      right: {},
      left: {},
    },

    pd: consultation.pd || {
      right: "",
      left: "",
      total: "",
    },
  };
};

/*
|--------------------------------------------------------------------------
| Inventory
|--------------------------------------------------------------------------
*/

const getInventoryItem = async ({
  req,
  itemId,
  category,
  session = null,
}) => {
  if (!itemId) {
    return null;
  }

  if (!isValidObjectId(itemId)) {
    const error = new Error(
      `Invalid ${category} inventory item ID.`,
    );

    error.statusCode = 400;

    throw error;
  }

  const organizationId = getOrganizationId(req);

  const item = await InventoryItem.findOne({
    _id: itemId,
    organizationId,
    category,
    status: "active",
  })
    .session(session)
    .lean();

  if (!item) {
    const error = new Error(
      `Selected ${category} is no longer available.`,
    );

    error.statusCode = 400;

    throw error;
  }

  return item;
};

/*
|--------------------------------------------------------------------------
| Pricing
|--------------------------------------------------------------------------
|
| Inventory prices are authoritative.
| Browser supplied price values are ignored when an inventory item exists.
|
*/

const calculateTotals = ({
  framePrice = 0,
  lensPrice = 0,
  extras = [],
  discount = 0,
  gstRate = 0,
}) => {
  const safeFramePrice = money(framePrice);
  const safeLensPrice = money(lensPrice);

  const normalizedExtras = Array.isArray(extras)
    ? extras.map((extra) => ({
        ...extra,
        price: money(extra?.price),
      }))
    : [];

  const extrasTotal = normalizedExtras.reduce(
    (total, extra) => total + money(extra.price),
    0,
  );

  const safeDiscount = Math.max(0, money(discount));

  const subtotal = Math.max(
    0,
    money(
      safeFramePrice +
        safeLensPrice +
        extrasTotal -
        safeDiscount,
    ),
  );

  const safeGstRate = Math.max(0, money(gstRate));

  const gst = money(
    subtotal * (safeGstRate / 100),
  );

  const billTotal = money(subtotal + gst);

  return {
    framePrice: safeFramePrice,
    lensPrice: safeLensPrice,
    extras: normalizedExtras,
    extrasTotal,
    discount: safeDiscount,
    subtotal,
    gstRate: safeGstRate,
    gst,
    billTotal,
    total: subtotal,
  };
};

/*
|--------------------------------------------------------------------------
| Status workflow
|--------------------------------------------------------------------------
*/

const STATUS_TRANSITIONS = {
  draft: ["ordered", "cancelled"],

  ordered: [
    "not_ready",
    "cancelled",
  ],

  not_ready: [
    "ready",
    "cancelled",
  ],

  ready: [
    "notified",
    "collected",
  ],

  notified: [
    "collected",
  ],

  collected: [],

  cancelled: [],
};

const validateStatusTransition = (
  currentStatus,
  nextStatus,
) => {
  if (!ALL_STATUSES.includes(nextStatus)) {
    const error = new Error(
      `Invalid spectacle status: ${nextStatus}`,
    );

    error.statusCode = 400;

    throw error;
  }

  if (currentStatus === nextStatus) {
    return;
  }

  const allowed =
    STATUS_TRANSITIONS[currentStatus] || [];

  if (!allowed.includes(nextStatus)) {
    const error = new Error(
      `Invalid status transition: ${currentStatus} → ${nextStatus}.`,
    );

    error.statusCode = 400;

    throw error;
  }
};

/*
|--------------------------------------------------------------------------
| Job number
|--------------------------------------------------------------------------
*/

const generateJobNumber = async () => {
  let attempts = 0;

  while (attempts < 10) {
    attempts += 1;

    const jobNumber = `SP-${Date.now()
      .toString()
      .slice(-8)}${Math.floor(Math.random() * 10)}`;

    const exists = await Spectacle.exists({
      jobNumber,
    });

    if (!exists) {
      return jobNumber;
    }
  }

  throw new Error(
    "Unable to generate a unique spectacle job number.",
  );
};

/*
|--------------------------------------------------------------------------
| GET latest consultation
|--------------------------------------------------------------------------
*/

export const latestConsultation = asyncHandler(
  async (req, res) => {
    requireRole(req, VIEW_ROLES);

    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Authenticated user is not assigned to an organization.",
      });
    }

    const patient = await getAccessiblePatient({
      req,
      patientId: req.params.patientId,
    });

    /*
     * Make sure the patient is accessible through one of
     * the user's branches where branch restrictions apply.
     */
    await getAccessibleBranch({
      req,
      branchId: req.query.branchId,
    });

    const consultation =
      await Consultation.findOne({
        patientId: patient._id,
        organizationId,
      })
        .sort({
          consultationDate: -1,
          createdAt: -1,
        })
        .populate(
          "optometristId",
          "firstName lastName role",
        )
        .lean();

    return res.json({
      success: true,
      data: consultation,
    });
  },
);

/*
|--------------------------------------------------------------------------
| GET spectacle
|--------------------------------------------------------------------------
*/

export const getSpectacle = asyncHandler(
  async (req, res) => {
    requireRole(req, VIEW_ROLES);

    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Authenticated user is not assigned to an organization.",
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid spectacle job ID.",
      });
    }

    const spectacle = await Spectacle.findOne({
      _id: req.params.id,
      organizationId,
    })
      .populate(
        "patientId",
        "patientNumber firstName middleName lastName phone",
      )
      .populate(
        "branchId",
        "name code status",
      )
      .populate(
        "dispenserId",
        "firstName lastName role",
      )
      .populate(
        "prescriberId",
        "firstName lastName role",
      )
      .populate(
        "consultationId",
        "consultationDate consultationType givenRx pd",
      )
      .populate(
        "frameItemId",
        "code brand model description sellingPrice stock",
      )
      .populate(
        "lensItemId",
        "code brand model description supplier sellingPrice stock",
      )
      .lean();

    if (!spectacle) {
      return res.status(404).json({
        success: false,
        message: "Spectacle job not found.",
      });
    }

    /*
     * Branch-level authorization.
     */
    await getAccessibleBranch({
      req,
      branchId: spectacle.branchId?._id,
    });

    const extrasTotal = Array.isArray(
      spectacle.extras,
    )
      ? spectacle.extras.reduce(
          (total, extra) =>
            total + money(extra?.price),
          0,
        )
      : 0;

    const framePrice = money(
      spectacle.frame?.price,
    );

    const lensPrice = money(
      spectacle.lens?.price,
    );

    const discount = money(
      spectacle.discount,
    );

    const total = Math.max(
      0,
      money(
        framePrice +
          lensPrice +
          extrasTotal -
          discount,
      ),
    );

    return res.json({
      success: true,

      data: {
        ...spectacle,

        extrasTotal,

        total,

        /*
         * Backward-compatible aliases for the current UI.
         */
        pricing: {
          framePrice,
          lensPrice,
          extrasTotal,
          discount,
          subtotal: total,
          gst: money(spectacle.gst),
          billTotal: money(
            spectacle.billTotal ?? total,
          ),
        },
      },
    });
  },
);

/*
|--------------------------------------------------------------------------
| GET patient spectacles
|--------------------------------------------------------------------------
*/

export const getPatientSpectacles =
  asyncHandler(async (req, res) => {
    requireRole(req, VIEW_ROLES);

    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Authenticated user is not assigned to an organization.",
      });
    }

    const patient = await getAccessiblePatient({
      req,
      patientId: req.params.patientId,
    });

    const branch = await getAccessibleBranch({
      req,
      branchId: req.query.branchId,
    });

    const query = {
      patientId: patient._id,
      organizationId,
    };

    /*
     * Operational users only see their accessible branch.
     * Admin users can see all branches unless branchId is supplied.
     */
    if (
      req.user.role !== "super_admin" &&
      req.user.role !== "organization_admin"
    ) {
      query.branchId = branch._id;
    } else if (req.query.branchId) {
      query.branchId = branch._id;
    }

    const list = await Spectacle.find(query)
      .sort({
        createdAt: -1,
      })
      .limit(100)
      .populate(
        "branchId",
        "name code",
      )
      .populate(
        "dispenserId",
        "firstName lastName role",
      )
      .lean();

    return res.json({
      success: true,
      data: list,
    });
  });

/*
|--------------------------------------------------------------------------
| CREATE spectacle
|--------------------------------------------------------------------------
*/

export const createSpectacle =
  asyncHandler(async (req, res) => {
    requireRole(req, CREATE_ROLES);

    const organizationId = getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Authenticated user is not assigned to an organization.",
      });
    }

    const {
      patientId,
      branchId,
      consultationId,
      frameItemId,
      lensItemId,
      frame,
      lens,
      lenses,
      extras,
      discount,
      gstRate,
      jobDate,
      dueDate,
      specDueDate,
      labDueDate,
      notes,
      labInstructions,
      billing,
      use,
      jobType,
    } = req.body;

    /*
     * Validate patient.
     */
    const patient = await getAccessiblePatient({
      req,
      patientId,
    });

    /*
     * Validate branch.
     */
    const branch = await getAccessibleBranch({
      req,
      branchId,
    });

    /*
     * Get latest consultation.
     */
    const consultation =
      await getLatestConsultation({
        req,
        patientId: patient._id,
        consultationId,
      });

    /*
     * Inventory items are loaded from the database.
     */
    const frameItem =
      await getInventoryItem({
        req,
        itemId: frameItemId,
        category: "frame",
      });

    const lensItem =
      await getInventoryItem({
        req,
        itemId: lensItemId,
        category: "lens",
      });

    /*
     * Clinical prescription is authoritative.
     */
    const clinicalRx =
      getClinicalPrescription(
        consultation,
      );

    /*
     * Frame:
     * If inventory is selected, its values are authoritative.
     * Otherwise manual frame data can be retained for own-frame jobs.
     */
    const normalizedFrame = frameItem
      ? {
          code: cleanString(frameItem.code),

          description:
            cleanString(
              frameItem.description,
            ) ||
            [
              frameItem.brand,
              frameItem.model,
            ]
              .filter(Boolean)
              .join(" "),

          price: money(
            frameItem.sellingPrice,
          ),

          ownFrame: false,
        }
      : {
          code: cleanString(frame?.code),
          description: cleanString(
            frame?.description,
          ),
          price: money(frame?.price),
          ownFrame:
            frame?.ownFrame === true,
        };

    /*
     * Backward compatibility:
     *
     * Existing UI sends:
     *   lens
     *
     * New UI can send:
     *   lenses.right
     *   lenses.left
     *
     * The inventory item remains authoritative for pricing.
     */
    const normalizedLens = lensItem
      ? {
          code: cleanString(lensItem.code),

          description: cleanString(
            lensItem.description,
          ),

          supplier: cleanString(
            lensItem.supplier,
          ),

          price: money(
            lensItem.sellingPrice,
          ),
        }
      : {
          code: cleanString(lens?.code),
          description: cleanString(
            lens?.description,
          ),
          supplier: cleanString(
            lens?.supplier,
          ),
          price: money(lens?.price),
        };

    /*
     * Detailed two-eye lens information.
     */
    const normalizedLenses = {
      right:
        lenses?.right ||
        {
          ...normalizedLens,
        },

      left:
        lenses?.left ||
        {
          ...normalizedLens,
        },
    };

    /*
     * Sanitize extras.
     */
    const normalizedExtras = Array.isArray(
      extras,
    )
      ? extras
          .slice(0, 20)
          .map((extra) => ({
            description: cleanString(
              extra?.description,
            ),
            supplier: cleanString(
              extra?.supplier,
            ),
            price: money(extra?.price),
          }))
          .filter(
            (extra) =>
              extra.description ||
              extra.supplier ||
              extra.price > 0,
          )
      : [];

    /*
     * Server-side pricing.
     */
    const totals = calculateTotals({
      framePrice:
        normalizedFrame.price,
      lensPrice:
        normalizedLens.price,
      extras:
        normalizedExtras,
      discount,
      gstRate,
    });

    const jobNumber =
      await generateJobNumber();

    const spectacle = await Spectacle.create({
      organizationId,

      branchId: branch._id,

      patientId: patient._id,

      consultationId:
        consultation?._id || null,

      frameItemId:
        frameItem?._id || null,

      lensItemId:
        lensItem?._id || null,

      jobNumber,

      jobDate:
        normalizeDate(jobDate) ||
        new Date(),

      dueDate:
        normalizeDate(
          dueDate || specDueDate,
        ),

      specDueDate:
        normalizeDate(
          specDueDate,
        ) ||
        normalizeDate(dueDate),

      labDueDate:
        normalizeDate(labDueDate),

      jobType:
        cleanString(jobType) ||
        "New Spectacle",

      use:
        cleanString(use),

      /*
       * Clinical source of truth.
       */
      rx: clinicalRx.givenRx,

      pd: clinicalRx.pd,

      /*
       * Current compatibility structure.
       */
      frame: normalizedFrame,

      lens: normalizedLens,

      /*
       * New two-eye structure.
       */
      lenses: normalizedLenses,

      extras:
        totals.extras,

      extrasTotal:
        totals.extrasTotal,

      discount:
        totals.discount,

      total:
        totals.total,

      gst:
        totals.gst,

      gstRate:
        totals.gstRate,

      billTotal:
        totals.billTotal,

      labInstructions:
        labInstructions || {},

      billing:
        billing || {},

      notes:
        cleanString(notes),

      status: "draft",

      createdBy:
        req.user._id,
    });

    const populated =
      await Spectacle.findById(
        spectacle._id,
      )
        .populate(
          "patientId",
          "patientNumber firstName middleName lastName phone",
        )
        .populate(
          "branchId",
          "name code",
        )
        .populate(
          "consultationId",
          "consultationDate consultationType givenRx pd",
        )
        .lean();

    return res.status(201).json({
      success: true,

      message:
        "Spectacle job created successfully.",

      data: populated,
    });
  });

/*
|--------------------------------------------------------------------------
| UPDATE spectacle
|--------------------------------------------------------------------------
*/

export const updateSpectacle =
  asyncHandler(async (req, res) => {
    requireRole(req, UPDATE_ROLES);

    const organizationId =
      getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Authenticated user is not assigned to an organization.",
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid spectacle job ID.",
      });
    }

    const spectacle =
      await Spectacle.findOne({
        _id: req.params.id,
        organizationId,
      });

    if (!spectacle) {
      return res.status(404).json({
        success: false,
        message:
          "Spectacle job not found.",
      });
    }

    /*
     * Branch authorization.
     */
    await getAccessibleBranch({
      req,
      branchId: spectacle.branchId,
    });

    /*
     * Once a job is ordered, its inventory linkage should not
     * be casually changed.
     */
    const lockedStatuses = [
      "ordered",
      "not_ready",
      "ready",
      "notified",
      "collected",
    ];

    if (
      lockedStatuses.includes(
        spectacle.status,
      )
    ) {
      if (
        req.body.frameItemId !== undefined &&
        String(
          req.body.frameItemId || "",
        ) !==
          String(
            spectacle.frameItemId || "",
          )
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Frame cannot be changed after the spectacle job has been ordered.",
        });
      }

      if (
        req.body.lensItemId !== undefined &&
        String(
          req.body.lensItemId || "",
        ) !==
          String(
            spectacle.lensItemId || "",
          )
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Lens cannot be changed after the spectacle job has been ordered.",
        });
      }
    }

    /*
     * Status must be updated through the dedicated status endpoint.
     */
    if (
      req.body.status &&
      req.body.status !==
        spectacle.status
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Use the spectacle status endpoint to change job status.",
      });
    }

    /*
     * Never allow ownership/security fields to be modified
     * from the browser.
     */
    const blockedFields = [
      "organizationId",
      "branchId",
      "patientId",
      "consultationId",
      "createdBy",
      "jobNumber",
      "frameItemId",
      "lensItemId",
      "status",
      "createdAt",
      "updatedAt",
    ];

    const payload = {
      ...req.body,
    };

    blockedFields.forEach(
      (field) => {
        delete payload[field];
      },
    );

    /*
     * Re-load inventory prices when inventory references are present.
     */
    let frameItem = null;

    if (spectacle.frameItemId) {
      frameItem =
        await getInventoryItem({
          req,
          itemId:
            spectacle.frameItemId,
          category: "frame",
        });
    }

    let lensItem = null;

    if (spectacle.lensItemId) {
      lensItem =
        await getInventoryItem({
          req,
          itemId:
            spectacle.lensItemId,
          category: "lens",
        });
    }

    /*
     * If frame/lens data is changed while still in draft,
     * validate the new inventory references.
     */
    if (
      payload.frameItemId !==
      undefined
    ) {
      frameItem =
        await getInventoryItem({
          req,
          itemId:
            payload.frameItemId,
          category: "frame",
        });

      payload.frameItemId =
        frameItem?._id || null;
    }

    if (
      payload.lensItemId !==
      undefined
    ) {
      lensItem =
        await getInventoryItem({
          req,
          itemId:
            payload.lensItemId,
          category: "lens",
        });

      payload.lensItemId =
        lensItem?._id || null;
    }

    /*
     * Recalculate pricing from trusted inventory values.
     */
    const framePrice =
      frameItem?.sellingPrice ??
      spectacle.frame?.price ??
      payload.frame?.price ??
      0;

    const lensPrice =
      lensItem?.sellingPrice ??
      spectacle.lens?.price ??
      payload.lens?.price ??
      0;

    const extras =
      payload.extras !== undefined
        ? Array.isArray(
            payload.extras,
          )
          ? payload.extras
              .slice(0, 20)
              .map((extra) => ({
                description:
                  cleanString(
                    extra?.description,
                  ),
                supplier:
                  cleanString(
                    extra?.supplier,
                  ),
                price: money(
                  extra?.price,
                ),
              }))
          : []
        : spectacle.extras || [];

    const totals =
      calculateTotals({
        framePrice,
        lensPrice,
        extras,
        discount:
          payload.discount !==
          undefined
            ? payload.discount
            : spectacle.discount,
        gstRate:
          payload.gstRate !==
          undefined
            ? payload.gstRate
            : spectacle.gstRate,
      });

    payload.extras =
      totals.extras;

    payload.extrasTotal =
      totals.extrasTotal;

    payload.discount =
      totals.discount;

    payload.total =
      totals.total;

    payload.gst =
      totals.gst;

    payload.gstRate =
      totals.gstRate;

    payload.billTotal =
      totals.billTotal;

    /*
     * Keep inventory pricing synchronized.
     */
    if (frameItem) {
      payload.frame = {
        ...(payload.frame ||
          spectacle.frame?.toObject?.() ||
          spectacle.frame ||
          {}),

        code: frameItem.code,

        description:
          frameItem.description ||
          [
            frameItem.brand,
            frameItem.model,
          ]
            .filter(Boolean)
            .join(" "),

        price:
          money(
            frameItem.sellingPrice,
          ),

        ownFrame: false,
      };
    }

    if (lensItem) {
      payload.lens = {
        ...(payload.lens ||
          spectacle.lens?.toObject?.() ||
          spectacle.lens ||
          {}),

        code: lensItem.code,

        description:
          lensItem.description,

        supplier:
          lensItem.supplier,

        price:
          money(
            lensItem.sellingPrice,
          ),
      };
    }

    Object.assign(
      spectacle,
      payload,
    );

    spectacle.updatedBy =
      req.user._id;

    await spectacle.save();

    const updated =
      await Spectacle.findById(
        spectacle._id,
      )
        .populate(
          "patientId",
          "patientNumber firstName middleName lastName phone",
        )
        .populate(
          "branchId",
          "name code",
        )
        .populate(
          "consultationId",
          "consultationDate consultationType givenRx pd",
        )
        .lean();

    return res.json({
      success: true,
      message:
        "Spectacle job updated successfully.",
      data: updated,
    });
  });

/*
|--------------------------------------------------------------------------
| CHANGE STATUS
|--------------------------------------------------------------------------
|
| POST/PATCH this endpoint when the user performs a workflow action.
|
| draft
|   ↓
| ordered
|   ↓
| not_ready
|   ↓
| ready
|   ↓
| notified
|   ↓
| collected
|
| Cancellation is available before completion.
|
*/

export const updateSpectacleStatus =
  asyncHandler(async (req, res) => {
    requireRole(req, STATUS_ROLES);

    const organizationId =
      getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Authenticated user is not assigned to an organization.",
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid spectacle job ID.",
      });
    }

    const nextStatus =
      cleanString(req.body.status);

    if (!ALL_STATUSES.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid spectacle status.",
      });
    }

    const session =
      await mongoose.startSession();

    try {
      let updatedJob = null;

      await session.withTransaction(
        async () => {
          const spectacle =
            await Spectacle.findOne({
              _id: req.params.id,
              organizationId,
            }).session(session);

          if (!spectacle) {
            const error = new Error(
              "Spectacle job not found.",
            );

            error.statusCode = 404;

            throw error;
          }

          await getAccessibleBranch({
            req,
            branchId:
              spectacle.branchId,
            session,
          });

          const previousStatus =
            spectacle.status;

          validateStatusTransition(
            previousStatus,
            nextStatus,
          );

          /*
           * ORDERING
           *
           * Inventory is deducted only when moving:
           * draft → ordered
           */
          if (
            nextStatus ===
              "ordered" &&
            previousStatus !==
              "ordered"
          ) {
            const inventoryIds =
              [
                spectacle.frameItemId,
                spectacle.lensItemId,
              ].filter(Boolean);

            /*
             * Prevent the same inventory item from being
             * deducted twice if frame/lens reference the same item.
             */
            const uniqueInventoryIds = [
              ...new Set(
                inventoryIds.map(
                  (id) =>
                    id.toString(),
                ),
              ),
            ];

            for (const itemId of uniqueInventoryIds) {
              const item =
                await InventoryItem.findOne({
                  _id: itemId,
                  organizationId,
                  status: "active",
                }).session(
                  session,
                );

              if (!item) {
                const error =
                  new Error(
                    "Linked inventory item no longer exists.",
                  );

                error.statusCode = 400;

                throw error;
              }

              /*
               * Atomic stock protection.
               *
               * We update only if stock > 0.
               */
              const beforeStock =
                Number(item.stock || 0);

              if (beforeStock < 1) {
                const error =
                  new Error(
                    `Insufficient stock for ${item.code}.`,
                  );

                error.statusCode = 400;

                throw error;
              }

              const updatedItem =
                await InventoryItem.findOneAndUpdate(
                  {
                    _id: item._id,
                    organizationId,
                    status: "active",
                    stock: {
                      $gte: 1,
                    },
                  },
                  {
                    $inc: {
                      stock: -1,
                    },

                    $set: {
                      updatedBy:
                        req.user._id,
                    },
                  },
                  {
                    new: true,
                    session,
                  },
                );

              if (!updatedItem) {
                const error =
                  new Error(
                    `Unable to reserve stock for ${item.code}.`,
                  );

                error.statusCode = 409;

                throw error;
              }

              await InventoryTransaction.create(
                [
                  {
                    organizationId,

                    branchId:
                      spectacle.branchId,

                    itemId:
                      item._id,

                    spectacleId:
                      spectacle._id,

                    type: "sale",

                    quantity: -1,

                    beforeStock,

                    afterStock:
                      Number(
                        updatedItem.stock ||
                          0,
                      ),

                    reason:
                      "Spectacle job ordered",

                    reference:
                      spectacle.jobNumber,

                    createdBy:
                      req.user._id,
                  },
                ],
                {
                  session,
                },
              );
            }

            spectacle.lensOrderDate =
              new Date();
          }

          /*
           * READY
           */
          if (
            nextStatus ===
              "ready" &&
            previousStatus !==
              "ready"
          ) {
            spectacle.jobReadyAt =
              new Date();
          }

          /*
           * NOTIFIED
           */
          if (
            nextStatus ===
              "notified"
          ) {
            spectacle.lastNotifiedAt =
              new Date();

            spectacle.notificationCount =
              Number(
                spectacle.notificationCount ||
                  0,
              ) + 1;
          }

          /*
           * COLLECTED
           */
          if (
            nextStatus ===
              "collected"
          ) {
            spectacle.collectedAt =
              new Date();
          }

          /*
           * Cancellation timestamp can be represented
           * through the status itself. We don't introduce
           * another field unless the model supports it.
           */
          spectacle.status =
            nextStatus;

          spectacle.updatedBy =
            req.user._id;

          await spectacle.save({
            session,
          });

          updatedJob =
            await Spectacle.findById(
              spectacle._id,
            )
              .session(session)
              .populate(
                "patientId",
                "patientNumber firstName middleName lastName phone",
              )
              .populate(
                "branchId",
                "name code",
              )
              .lean();
        },
      );

      return res.json({
        success: true,

        message:
          `Spectacle job moved to ${nextStatus}.`,

        data: updatedJob,
      });
    } finally {
      await session.endSession();
    }
  });

/*
|--------------------------------------------------------------------------
| DISPENSING LIST
|--------------------------------------------------------------------------
|
| Production search:
|
| - Job number
| - Patient number
| - Patient name
| - Phone
| - Frame code
| - Lens code
|
*/

export const dispensingList =
  asyncHandler(async (req, res) => {
    requireRole(req, VIEW_ROLES);

    const organizationId =
      getOrganizationId(req);

    if (!organizationId) {
      return res.status(403).json({
        success: false,
        message:
          "Authenticated user is not assigned to an organization.",
      });
    }

    const {
      status,
      search = "",
      branchId,
      page = 1,
      limit = 50,
    } = req.query;

    const currentPage =
      Math.max(
        Number(page) || 1,
        1,
      );

    const pageLimit =
      Math.min(
        Math.max(
          Number(limit) || 50,
          1,
        ),
        250,
      );

    const skip =
      (currentPage - 1) *
      pageLimit;

    const branch =
      await getAccessibleBranch({
        req,
        branchId,
      });

    const query = {
      organizationId,
    };

    if (
      status &&
      ALL_STATUSES.includes(status)
    ) {
      query.status = status;
    }

    /*
     * Branch restrictions.
     */
    if (
      req.user.role !==
        "super_admin" &&
      req.user.role !==
        "organization_admin"
    ) {
      query.branchId =
        branch._id;
    } else if (branchId) {
      query.branchId =
        branch._id;
    }

    /*
     * Search is handled after population using patient
     * identifiers. For larger installations, this should
     * eventually become denormalized/search-indexed.
     */
    const normalizedSearch =
      cleanString(search);

    let list =
      await Spectacle.find(query)
        .sort({
          updatedAt: -1,
        })
        .skip(skip)
        .limit(pageLimit)
        .populate(
          "patientId",
          "patientNumber firstName middleName lastName phone",
        )
        .populate(
          "branchId",
          "name code",
        )
        .populate(
          "frameItemId",
          "code brand model description sellingPrice",
        )
        .populate(
          "lensItemId",
          "code brand model description supplier sellingPrice",
        )
        .lean();

    /*
     * Search after population.
     */
    if (normalizedSearch) {
      const searchText =
        normalizedSearch.toLowerCase();

      list = list.filter(
        (job) => {
          const patient =
            job.patientId || {};

          const patientName =
            [
              patient.firstName,
              patient.middleName,
              patient.lastName,
            ]
              .filter(Boolean)
              .join(" ");

          const frame =
            job.frame || {};

          const lens =
            job.lens || {};

          const frameItem =
            job.frameItemId || {};

          const lensItem =
            job.lensItemId || {};

          const haystack = [
            job.jobNumber,

            patient.patientNumber,

            patient.firstName,
            patient.middleName,
            patient.lastName,
            patientName,

            patient.phone,

            frame.code,
            frame.description,

            lens.code,
            lens.description,
            lens.supplier,

            frameItem.code,
            frameItem.brand,
            frameItem.model,

            lensItem.code,
            lensItem.brand,
            lensItem.model,
            lensItem.supplier,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return haystack.includes(
            searchText,
          );
        },
      );
    }

    return res.json({
      success: true,

      data: list,

      pagination: {
        page: currentPage,
        limit: pageLimit,
        count: list.length,
      },
    });
  });