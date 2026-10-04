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

const USE_VALUES = [
  "distance",
  "near",
  "intermediate",
  "bifocal",
  "trifocal",
  "multifocal",
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

const STATUS_TRANSITIONS = {
  draft: ["ordered", "cancelled"],
  ordered: ["not_ready", "cancelled"],
  not_ready: ["ready", "cancelled"],
  ready: ["notified", "collected"],
  notified: ["collected"],
  collected: [],
  cancelled: [],
};

/*
|--------------------------------------------------------------------------
| Generic helpers
|--------------------------------------------------------------------------
*/

const isValidObjectId = (value) =>
  Boolean(value) &&
  mongoose.Types.ObjectId.isValid(value);

const toObjectId = (value) =>
  isValidObjectId(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

const money = (value) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.round(number * 100) / 100;
};

const cleanString = (value) =>
  typeof value === "string"
    ? value.trim()
    : "";

const normalizeDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const getOrganizationId = (req) => {
  const id = req.user?.organizationId;

  return isValidObjectId(id)
    ? id
    : null;
};

const requireRole = (
  req,
  allowedRoles,
) => {
  if (
    allowedRoles.includes(
      req.user?.role,
    )
  ) {
    return;
  }

  const error = new Error(
    "You do not have permission to perform this action.",
  );

  error.statusCode = 403;
  throw error;
};

const getId = (value) => {
  if (!value) return null;

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return isValidObjectId(value)
      ? toObjectId(value)
      : null;
  }

  const id =
    value._id ||
    value.id;

  return isValidObjectId(id)
    ? toObjectId(id)
    : null;
};

const normalizeUse = (use) => {
  const values = Array.isArray(use)
    ? use
    : cleanString(use)
      ? [use]
      : [];

  return [
    ...new Set(
      values
        .map(cleanString)
        .filter((value) =>
          USE_VALUES.includes(value),
        ),
    ),
  ];
};

const normalizeToApply = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        cleanString(item),
      )
      .filter(Boolean);
  }

  return cleanString(value)
    ? cleanString(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
};

const normalizeExtras = (extras) => {
  if (!Array.isArray(extras)) {
    return [];
  }

  return extras
    .slice(0, 50)
    .map((extra) => ({
      name: cleanString(
        extra?.name,
      ),

      description: cleanString(
        extra?.description,
      ),

      price: money(
        extra?.price,
      ),

      labRequired:
        extra?.labRequired === true,
    }))
    .filter(
      (extra) =>
        extra.name ||
        extra.description ||
        extra.price > 0 ||
        extra.labRequired,
    );
};

const normalizeEyeRx = (value) => {
  const source =
    value &&
    typeof value === "object"
      ? value
      : {};

  return {
    sphere: cleanString(
      source.sphere,
    ),
    cylinder: cleanString(
      source.cylinder,
    ),
    axis: cleanString(
      source.axis,
    ),
    add: cleanString(
      source.add,
    ),
    inter: cleanString(
      source.inter,
    ),
    prism: cleanString(
      source.prism,
    ),
    base: cleanString(
      source.base,
    ),
    va: cleanString(
      source.va,
    ),
  };
};

const normalizeRx = (
  rx,
  fallback = {},
) => {
  const source =
    rx &&
    typeof rx === "object"
      ? rx
      : {};

  const fallbackRx =
    fallback &&
    typeof fallback === "object"
      ? fallback
      : {};

  return {
    right: normalizeEyeRx(
      source.right ||
        fallbackRx.right ||
        {},
    ),

    left: normalizeEyeRx(
      source.left ||
        fallbackRx.left ||
        {},
    ),

    note: cleanString(
      source.note ??
        fallbackRx.note,
    ),
  };
};

const normalizePd = (
  pd,
  fallback = {},
) => {
  const source =
    pd &&
    typeof pd === "object"
      ? pd
      : {};

  const fallbackPd =
    fallback &&
    typeof fallback === "object"
      ? fallback
      : {};

  return {
    right: cleanString(
      source.right ??
        fallbackPd.right,
    ),

    left: cleanString(
      source.left ??
        fallbackPd.left,
    ),

    total: cleanString(
      source.total ??
        fallbackPd.total,
    ),
  };
};

const normalizeFrame = (
  frame,
  fallback = {},
) => {
  const source =
    frame &&
    typeof frame === "object"
      ? frame
      : {};

  const fallbackFrame =
    fallback &&
    typeof fallback === "object"
      ? fallback
      : {};

  return {
    code: cleanString(
      source.code ??
        fallbackFrame.code,
    ),

    description: cleanString(
      source.description ??
        fallbackFrame.description,
    ),

    size: cleanString(
      source.size ??
        fallbackFrame.size,
    ),

    depth: cleanString(
      source.depth ??
        fallbackFrame.depth,
    ),

    ed: cleanString(
      source.ed ??
        fallbackFrame.ed,
    ),

    type: cleanString(
      source.type ??
        fallbackFrame.type,
    ),

    ssi: cleanString(
      source.ssi ??
        fallbackFrame.ssi,
    ),

    other: cleanString(
      source.other ??
        fallbackFrame.other,
    ),

    fitting: cleanString(
      source.fitting ??
        fallbackFrame.fitting,
    ),

    price: money(
      source.price ??
        fallbackFrame.price,
    ),

    discount: money(
      source.discount ??
        fallbackFrame.discount,
    ),

    toReorder: money(
      source.toReorder ??
        fallbackFrame.toReorder,
    ),

    ownFrame:
      source.ownFrame ??
      fallbackFrame.ownFrame ??
      false,
  };
};

const normalizeLensEye = (
  value,
  fallback = {},
) => {
  const source =
    value &&
    typeof value === "object"
      ? value
      : {};

  const fallbackLens =
    fallback &&
    typeof fallback === "object"
      ? fallback
      : {};

  return {
    lensCode: cleanString(
      source.lensCode ??
        fallbackLens.lensCode ??
        fallbackLens.code,
    ),

    lensDescription: cleanString(
      source.lensDescription ??
        fallbackLens.lensDescription ??
        fallbackLens.description,
    ),

    lensSize: cleanString(
      source.lensSize ??
        fallbackLens.lensSize,
    ),

    segmentSize: cleanString(
      source.segmentSize ??
        fallbackLens.segmentSize,
    ),

    segmentHeight: cleanString(
      source.segmentHeight ??
        fallbackLens.segmentHeight,
    ),

    ocHeight: cleanString(
      source.ocHeight ??
        fallbackLens.ocHeight,
    ),

    horizontalDecentration:
      cleanString(
        source.horizontalDecentration ??
          fallbackLens.horizontalDecentration,
      ),

    verticalDecentration:
      cleanString(
        source.verticalDecentration ??
          fallbackLens.verticalDecentration,
      ),

    baseCurve: cleanString(
      source.baseCurve ??
        fallbackLens.baseCurve,
    ),

    supplier: cleanString(
      source.supplier ??
        fallbackLens.supplier,
    ),

    supplierOrderDate:
      source.supplierOrderDate
        ? normalizeDate(
            source.supplierOrderDate,
          )
        : fallbackLens.supplierOrderDate ||
          null,

    tint: cleanString(
      source.tint ??
        fallbackLens.tint,
    ),

    price: money(
      source.price ??
        fallbackLens.price,
    ),
  };
};

const normalizeLenses = (
  lenses,
  legacyLens = {},
) => {
  const source =
    lenses &&
    typeof lenses === "object"
      ? lenses
      : {};

  const legacy =
    legacyLens &&
    typeof legacyLens === "object"
      ? legacyLens
      : {};

  const right = normalizeLensEye(
    source.right,
    legacy,
  );

  const left = normalizeLensEye(
    source.left,
    legacy,
  );

  return {
    right,
    left,
  };
};

const normalizeLegacyLens = (
  lens,
  fallback = {},
) => {
  const source =
    lens &&
    typeof lens === "object"
      ? lens
      : {};

  const fallbackLens =
    fallback &&
    typeof fallback === "object"
      ? fallback
      : {};

  return {
    code: cleanString(
      source.code ??
        fallbackLens.code ??
        fallbackLens.lensCode,
    ),

    description: cleanString(
      source.description ??
        fallbackLens.description ??
        fallbackLens.lensDescription,
    ),

    supplier: cleanString(
      source.supplier ??
        fallbackLens.supplier,
    ),

    price: money(
      source.price ??
        fallbackLens.price,
    ),
  };
};

const normalizeLab = (
  lab,
  legacy = {},
) => {
  const source =
    lab &&
    typeof lab === "object"
      ? lab
      : {};

  const legacySource =
    legacy &&
    typeof legacy === "object"
      ? legacy
      : {};

  return {
    instructions: cleanString(
      source.instructions ??
        legacySource.instructions,
    ),

    toApply: normalizeToApply(
      source.toApply ??
        legacySource.toApply,
    ),

    toFit:
      source.toFit === true ||
      legacySource.toFit === true,
  };
};

/*
|--------------------------------------------------------------------------
| Pricing
|--------------------------------------------------------------------------
|
| The server is authoritative for totals.
| Inventory item selling prices remain authoritative whenever a linked
| frame/lens inventory item exists.
|--------------------------------------------------------------------------
*/

const calculateTotals = ({
  framePrice = 0,
  lensPrice = 0,
  extras = [],
  discount = 0,
  gstRate = 0,
}) => {
  const safeFramePrice =
    money(framePrice);

  const safeLensPrice =
    money(lensPrice);

  const normalizedExtras =
    normalizeExtras(extras);

  const extrasTotal =
    normalizedExtras.reduce(
      (sum, extra) =>
        money(
          sum +
            money(
              extra.price,
            ),
        ),
      0,
    );

  const safeDiscount = Math.max(
    0,
    money(discount),
  );

  const subtotal = Math.max(
    0,
    money(
      safeFramePrice +
        safeLensPrice +
        extrasTotal,
    ),
  );

  const total = Math.max(
    0,
    money(
      subtotal -
        safeDiscount,
    ),
  );

  const safeGstRate = Math.max(
    0,
    money(gstRate),
  );

  const gstAmount = money(
    total *
      (safeGstRate / 100),
  );

  return {
    framePrice:
      safeFramePrice,

    lensPrice:
      safeLensPrice,

    extras:
      normalizedExtras,

    extrasTotal,

    frameDiscount: 0,

    lensDiscount: 0,

    overallDiscount:
      safeDiscount,

    discount:
      safeDiscount,

    subtotal,

    total,

    gstRate:
      safeGstRate,

    gstAmount,

    gst:
      gstAmount,

    billTotal:
      money(
        total +
          gstAmount,
      ),
  };
};

const buildPricing = ({
  existing = {},
  totals,
  frameDiscount,
  lensDiscount,
  discountReason,
}) => ({
  ...(existing || {}),

  framePrice:
    totals.framePrice,

  lensPrice:
    totals.lensPrice,

  extrasTotal:
    totals.extrasTotal,

  frameDiscount:
    money(
      frameDiscount ??
        existing?.frameDiscount,
    ),

  lensDiscount:
    money(
      lensDiscount ??
        existing?.lensDiscount,
    ),

  overallDiscount:
    totals.overallDiscount,

  discountReason:
    cleanString(
      discountReason ??
        existing?.discountReason,
    ),

  subtotal:
    totals.subtotal,

  total:
    totals.total,

  gstRate:
    totals.gstRate,

  gstAmount:
    totals.gstAmount,

  billTotal:
    totals.billTotal,
});

/*
|--------------------------------------------------------------------------
| Branch access
|--------------------------------------------------------------------------
*/

const getAccessibleBranch = async ({
  req,
  branchId,
  session = null,
}) => {
  const organizationId =
    getOrganizationId(req);

  if (!organizationId) {
    const error = new Error(
      "Authenticated user is not assigned to an organization.",
    );

    error.statusCode = 403;
    throw error;
  }

  const requestedBranchId =
    branchId
      ? getId(branchId)
      : null;

  if (
    branchId &&
    !requestedBranchId
  ) {
    const error = new Error(
      "Invalid branch ID.",
    );

    error.statusCode = 400;
    throw error;
  }

  const role =
    req.user?.role;

  if (
    role === "super_admin" ||
    role === "organization_admin"
  ) {
    const query = {
      organizationId,
      status: "active",
    };

    if (requestedBranchId) {
      query._id =
        requestedBranchId;
    }

    const branch =
      await Branch.findOne(query)
        .session(session)
        .select(
          "_id organizationId name code status",
        )
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

  const assignedBranches =
    Array.isArray(
      req.user?.branchIds,
    )
      ? req.user.branchIds
          .filter(Boolean)
          .map((value) =>
            value.toString(),
          )
      : [];

  const defaultBranchId =
    getId(
      req.user?.defaultBranchId,
    );

  let selectedBranchId =
    requestedBranchId ||
    defaultBranchId;

  if (selectedBranchId) {
    const selectedId =
      selectedBranchId.toString();

    const assigned =
      assignedBranches.includes(
        selectedId,
      );

    const isDefault =
      defaultBranchId?.toString() ===
      selectedId;

    if (!assigned && !isDefault) {
      const error = new Error(
        "You do not have access to the selected branch.",
      );

      error.statusCode = 403;
      throw error;
    }
  } else if (
    assignedBranches.length
  ) {
    selectedBranchId =
      toObjectId(
        assignedBranches[0],
      );
  } else {
    const error = new Error(
      "No active branch is assigned to this account. Please assign a branch to the staff member before creating a job.",
    );

    error.statusCode = 403;
    throw error;
  }

  const branch =
    await Branch.findOne({
      _id: selectedBranchId,
      organizationId,
      status: "active",
    })
      .session(session)
      .select(
        "_id organizationId name code status",
      )
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

const getAccessiblePatient =
  async ({
    req,
    patientId,
    session = null,
  }) => {
    const organizationId =
      getOrganizationId(req);

    if (
      !isValidObjectId(
        patientId,
      )
    ) {
      const error = new Error(
        "Invalid patient ID.",
      );

      error.statusCode = 400;
      throw error;
    }

    const patient =
      await Patient.findOne({
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
      const error = new Error(
        "Patient not found.",
      );

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

const getLatestConsultation =
  async ({
    req,
    patientId,
    consultationId = null,
    session = null,
  }) => {
    const organizationId =
      getOrganizationId(req);

    if (consultationId) {
      if (
        !isValidObjectId(
          consultationId,
        )
      ) {
        const error =
          new Error(
            "Invalid consultation ID.",
          );

        error.statusCode = 400;
        throw error;
      }

      const consultation =
        await Consultation.findOne({
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
        const error =
          new Error(
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

const getClinicalPrescription =
  (consultation) => ({
    givenRx: normalizeRx(
      consultation?.givenRx,
    ),

    pd: normalizePd(
      consultation?.pd,
    ),
  });

/*
|--------------------------------------------------------------------------
| Inventory
|--------------------------------------------------------------------------
*/

const getInventoryItem =
  async ({
    req,
    itemId,
    category,
    session = null,
  }) => {
    if (!itemId) {
      return null;
    }

    if (
      !isValidObjectId(
        itemId,
      )
    ) {
      const error =
        new Error(
          `Invalid ${category} inventory item ID.`,
        );

      error.statusCode = 400;
      throw error;
    }

    const organizationId =
      getOrganizationId(req);

    const item =
      await InventoryItem.findOne({
        _id: itemId,
        organizationId,
        category,
        status: "active",
      })
        .session(session)
        .lean();

    if (!item) {
      const error =
        new Error(
          `Selected ${category} is no longer available.`,
        );

      error.statusCode = 400;
      throw error;
    }

    return item;
  };

/*
|--------------------------------------------------------------------------
| Job number
|--------------------------------------------------------------------------
*/

const generateJobNumber =
  async () => {
    for (
      let attempt = 0;
      attempt < 15;
      attempt += 1
    ) {
      const jobNumber =
        `SP-${Date.now()
          .toString()
          .slice(-8)}${Math.floor(
          Math.random() * 10,
        )}`;

      const exists =
        await Spectacle.exists({
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

export const latestConsultation =
  asyncHandler(
    async (req, res) => {
      requireRole(
        req,
        VIEW_ROLES,
      );

      const organizationId =
        getOrganizationId(req);

      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message:
            "Authenticated user is not assigned to an organization.",
        });
      }

      const patient =
        await getAccessiblePatient({
          req,
          patientId:
            req.params.patientId,
        });

      await getAccessibleBranch({
        req,
        branchId:
          req.query.branchId,
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
        data:
          consultation,
      });
    },
  );

/*
|--------------------------------------------------------------------------
| GET spectacle
|--------------------------------------------------------------------------
*/

export const getSpectacle =
  asyncHandler(
    async (req, res) => {
      requireRole(
        req,
        VIEW_ROLES,
      );

      const organizationId =
        getOrganizationId(req);

      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message:
            "Authenticated user is not assigned to an organization.",
        });
      }

      if (
        !isValidObjectId(
          req.params.id,
        )
      ) {
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
            "prescribedById",
            "firstName lastName role",
          )
          .populate(
            "readyBy",
            "firstName lastName role",
          )
          .populate(
            "collectedBy",
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
          message:
            "Spectacle job not found.",
        });
      }

      await getAccessibleBranch({
        req,
        branchId:
          spectacle.branchId?._id ||
          spectacle.branchId,
      });

      /*
       * Compatibility aliases:
       * Existing pages may still read root totals or legacy lens fields.
       */
      const framePrice =
        money(
          spectacle.pricing
            ?.framePrice ??
            spectacle.frame
              ?.price,
        );

      const detailLensPrice =
        money(
          spectacle.pricing
            ?.lensPrice,
        );

      const legacyLensPrice =
        money(
          spectacle.lens?.price,
        );

      const rightLensPrice =
        money(
          spectacle.lenses
            ?.right?.price,
        );

      const leftLensPrice =
        money(
          spectacle.lenses
            ?.left?.price,
        );

      const lensPrice =
        detailLensPrice ||
        legacyLensPrice ||
        money(
          rightLensPrice +
            leftLensPrice,
        );

      const extrasTotal =
        money(
          spectacle.pricing
            ?.extrasTotal ??
            spectacle.extrasTotal ??
            (
              Array.isArray(
                spectacle.extras,
              )
                ? spectacle.extras.reduce(
                    (sum, extra) =>
                      sum +
                      money(
                        extra?.price,
                      ),
                    0,
                  )
                : 0
            ),
        );

      const discount =
        money(
          spectacle.pricing
            ?.overallDiscount ??
            spectacle.discount,
        );

      const subtotal =
        money(
          spectacle.pricing
            ?.subtotal ??
            (
              framePrice +
              lensPrice +
              extrasTotal
            ),
        );

      const total =
        money(
          spectacle.pricing
            ?.total ??
            spectacle.total ??
            Math.max(
              0,
              subtotal -
                discount,
            ),
        );

      const gstRate =
        money(
          spectacle.pricing
            ?.gstRate ??
            0,
        );

      const gstAmount =
        money(
          spectacle.pricing
            ?.gstAmount ??
            spectacle.gst ??
            (
              total *
              (gstRate / 100)
            ),
        );

      const billTotal =
        money(
          spectacle.pricing
            ?.billTotal ??
            spectacle.billTotal ??
            (
              total +
              gstAmount
            ),
        );

      return res.json({
        success: true,

        data: {
          ...spectacle,

          extrasTotal,
          discount,
          total,
          gst: gstAmount,
          billTotal,

          // UI-friendly aliases.
          dueDate:
            spectacle.specDueDate,
          specDue:
            spectacle.specDueDate,
          jobReadyAt:
            spectacle.jobReadyAt,
          readyDate:
            spectacle.jobReadyAt,
          collectedDate:
            spectacle.collectedAt,

          electronicOrder:
            spectacle.electronicOrder ||
            spectacle.eOrder ||
            "",

          notification:
            spectacle.notification ||
            (
              spectacle.sms &&
              spectacle.email
                ? "sms_email"
                : spectacle.sms
                  ? "sms"
                  : spectacle.email
                    ? "email"
                    : "none"
            ),

          pricing: {
            ...(spectacle.pricing ||
              {}),

            framePrice,
            lensPrice,
            extrasTotal,
            frameDiscount:
              money(
                spectacle.pricing
                  ?.frameDiscount ??
                spectacle.frame
                  ?.discount,
              ),
            lensDiscount:
              money(
                spectacle.pricing
                  ?.lensDiscount,
              ),
            overallDiscount:
              discount,
            discountReason:
              spectacle.pricing
                ?.discountReason ||
              "",
            subtotal,
            total,
            gstRate,
            gstAmount,
            billTotal,
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
  asyncHandler(
    async (req, res) => {
      requireRole(
        req,
        VIEW_ROLES,
      );

      const organizationId =
        getOrganizationId(req);

      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message:
            "Authenticated user is not assigned to an organization.",
        });
      }

      const patient =
        await getAccessiblePatient({
          req,
          patientId:
            req.params.patientId,
        });

      const branch =
        await getAccessibleBranch({
          req,
          branchId:
            req.query.branchId,
        });

      const query = {
        patientId:
          patient._id,
        organizationId,
      };

      if (
        req.user.role !==
          "super_admin" &&
        req.user.role !==
          "organization_admin"
      ) {
        query.branchId =
          branch._id;
      } else if (
        req.query.branchId
      ) {
        query.branchId =
          branch._id;
      }

      const list =
        await Spectacle.find(query)
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
          .populate(
            "prescribedById",
            "firstName lastName role",
          )
          .lean();

      return res.json({
        success: true,
        data: list,
      });
    },
  );

/*
|--------------------------------------------------------------------------
| CREATE spectacle
|--------------------------------------------------------------------------
*/

export const createSpectacle =
  asyncHandler(
    async (req, res) => {
      requireRole(
        req,
        CREATE_ROLES,
      );

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
        pricing,
        jobDate,
        dueDate,
        specDueDate,
        labDueDate,
        rxDate,
        notes,
        lab,
        labInstructions,
        billingNo,
        notification,
        smsEmail,
        sms,
        email,
        electronicOrder,
        eOrder,
        use,
        jobType,
        dispenserId,
        prescribedById,
      } = req.body;

      const patient =
        await getAccessiblePatient({
          req,
          patientId,
        });

      const branch =
        await getAccessibleBranch({
          req,
          branchId,
        });

      const consultation =
        await getLatestConsultation({
          req,
          patientId:
            patient._id,
          consultationId,
        });

      const frameItem =
        await getInventoryItem({
          req,
          itemId:
            frameItemId,
          category: "frame",
        });

      const lensItem =
        await getInventoryItem({
          req,
          itemId:
            lensItemId,
          category: "lens",
        });

      /*
       * CREATE:
       * The selected consultation provides the initial clinical Rx.
       */
      const clinical =
        getClinicalPrescription(
          consultation,
        );

      const normalizedFrame =
        frameItem
          ? normalizeFrame({
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
                frameItem.sellingPrice,
              ownFrame:
                false,
            })
          : normalizeFrame(
              frame,
            );

      const normalizedLegacyLens =
        lensItem
          ? normalizeLegacyLens({
              code:
                lensItem.code,
              description:
                lensItem.description,
              supplier:
                lensItem.supplier,
              price:
                lensItem.sellingPrice,
            })
          : normalizeLegacyLens(
              lens,
            );

      const normalizedLenses =
        normalizeLenses(
          lenses,
          normalizedLegacyLens,
        );

      /*
       * Inventory lens price is authoritative when linked.
       *
       * Without an inventory item, the detailed eye prices are summed.
       * With an inventory item, its sellingPrice represents the job lens
       * price and prevents a right/left double count.
       */
      const detailedLensPrice =
        money(
          normalizedLenses
            .right.price,
        ) +
        money(
          normalizedLenses
            .left.price,
        );

      const initialLensPrice =
        lensItem
          ? money(
              lensItem.sellingPrice,
            )
          : money(
              pricing?.lensPrice ??
                detailedLensPrice ??
                normalizedLegacyLens.price,
            );

      const normalizedExtras =
        normalizeExtras(
          extras,
        );

      const overallDiscount =
        money(
          pricing
            ?.overallDiscount ??
            discount ??
            0,
        );

      const initialGstRate =
        money(
          pricing?.gstRate ??
            gstRate ??
            0,
        );

      const totals =
        calculateTotals({
          framePrice:
            normalizedFrame.price,
          lensPrice:
            initialLensPrice,
          extras:
            normalizedExtras,
          discount:
            overallDiscount,
          gstRate:
            initialGstRate,
        });

      const jobNumber =
        await generateJobNumber();

      const normalizedLab =
        normalizeLab(
          lab,
          typeof labInstructions ===
            "object"
            ? labInstructions
            : {
                instructions:
                  labInstructions,
              },
        );

      const normalizedNotification =
        cleanString(
          notification ||
            (
              sms && email
                ? "sms_email"
                : sms
                  ? "sms"
                  : email
                    ? "email"
                    : ""
            ),
        ) || "none";

      const spectacle =
        await Spectacle.create({
          organizationId,

          branchId:
            branch._id,

          patientId:
            patient._id,

          consultationId:
            consultation?._id ||
            null,

          frameItemId:
            frameItem?._id ||
            null,

          lensItemId:
            lensItem?._id ||
            null,

          jobNumber,

          jobDate:
            normalizeDate(
              jobDate,
            ) ||
            new Date(),

          specDueDate:
            normalizeDate(
              specDueDate ||
                dueDate,
            ),

          labDueDate:
            normalizeDate(
              labDueDate,
            ),

          jobType:
            cleanString(
              jobType,
            ) ||
            "Spectacle",

          dispenserId:
            getId(
              dispenserId,
            ),

          prescribedById:
            getId(
              prescribedById,
            ) ||
            consultation
              ?.optometristId ||
            null,

          rxDate:
            normalizeDate(
              rxDate,
            ),

          use:
            normalizeUse(
              use,
            ),

          rx:
            clinical.givenRx,

          pd:
            clinical.pd,

          frame:
            normalizedFrame,

          lens:
            normalizedLegacyLens,

          lenses:
            normalizedLenses,

          extras:
            totals.extras,

          lab:
            normalizedLab,

          pricing:
            buildPricing({
              totals,
              frameDiscount:
                pricing?.frameDiscount,
              lensDiscount:
                pricing?.lensDiscount,
              discountReason:
                pricing?.discountReason,
            }),

          // Legacy compatibility totals.
          extrasTotal:
            totals.extrasTotal,
          discount:
            totals.discount,
          total:
            totals.total,
          gst:
            totals.gstAmount,
          billTotal:
            totals.billTotal,

          billingNo:
            cleanString(
              billingNo,
            ),

          notification:
            normalizedNotification,

          smsEmail:
            cleanString(
              smsEmail,
            ),

          sms:
            sms === true ||
            normalizedNotification ===
              "sms" ||
            normalizedNotification ===
              "sms_email",

          email:
            email === true ||
            normalizedNotification ===
              "email" ||
            normalizedNotification ===
              "sms_email",

          electronicOrder:
            cleanString(
              electronicOrder ||
                eOrder,
            ),

          eOrder:
            cleanString(
              eOrder ||
                electronicOrder,
            ),

          notes:
            cleanString(
              notes,
            ),

          status:
            "draft",

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
            "dispenserId",
            "firstName lastName role",
          )
          .populate(
            "prescribedById",
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

      return res.status(201).json({
        success: true,

        message:
          "Spectacle job created successfully.",

        data:
          populated,
      });
    },
  );

/*
|--------------------------------------------------------------------------
| UPDATE spectacle
|--------------------------------------------------------------------------
|
| General job edits use PUT /spectacles/:id.
|
| Status is intentionally excluded. Use:
| PATCH /spectacles/:id/status
|
| Security/ownership fields and inventory links are protected.
|--------------------------------------------------------------------------
*/

export const updateSpectacle =
  asyncHandler(
    async (req, res) => {
      requireRole(
        req,
        UPDATE_ROLES,
      );

      const organizationId =
        getOrganizationId(req);

      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message:
            "Authenticated user is not assigned to an organization.",
        });
      }

      if (
        !isValidObjectId(
          req.params.id,
        )
      ) {
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

      await getAccessibleBranch({
        req,
        branchId:
          spectacle.branchId,
      });

      /*
       * Status changes must go through the dedicated status endpoint.
       */
      if (
        req.body.status !==
        undefined
      ) {
        if (
          req.body.status !==
          spectacle.status
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Use the spectacle status endpoint to change job status.",
          });
        }
      }

      const lockedInventory =
        [
          "ordered",
          "not_ready",
          "ready",
          "notified",
          "collected",
        ].includes(
          spectacle.status,
        );

      /*
       * Inventory item changes are permitted only while the job is draft.
       */
      const requestedFrameItemId =
        req.body.frameItemId !==
        undefined
          ? req.body.frameItemId
          : undefined;

      const requestedLensItemId =
        req.body.lensItemId !==
        undefined
          ? req.body.lensItemId
          : undefined;

      if (lockedInventory) {
        if (
          requestedFrameItemId !==
          undefined
        ) {
          const incoming =
            requestedFrameItemId
              ? String(
                  requestedFrameItemId,
                )
              : "";

          const current =
            spectacle.frameItemId
              ? String(
                  spectacle.frameItemId,
                )
              : "";

          if (
            incoming !==
            current
          ) {
            return res.status(409).json({
              success: false,
              message:
                "Frame cannot be changed after the spectacle job has been ordered.",
            });
          }
        }

        if (
          requestedLensItemId !==
          undefined
        ) {
          const incoming =
            requestedLensItemId
              ? String(
                  requestedLensItemId,
                )
              : "";

          const current =
            spectacle.lensItemId
              ? String(
                  spectacle.lensItemId,
                )
              : "";

          if (
            incoming !==
            current
          ) {
            return res.status(409).json({
              success: false,
              message:
                "Lens cannot be changed after the spectacle job has been ordered.",
            });
          }
        }
      }

      let frameItem = null;
      let lensItem = null;

      if (
        requestedFrameItemId !==
        undefined
      ) {
        frameItem =
          await getInventoryItem({
            req,
            itemId:
              requestedFrameItemId,
            category:
              "frame",
          });
      } else if (
        spectacle.frameItemId
      ) {
        frameItem =
          await getInventoryItem({
            req,
            itemId:
              spectacle.frameItemId,
            category:
              "frame",
          });
      }

      if (
        requestedLensItemId !==
        undefined
      ) {
        lensItem =
          await getInventoryItem({
            req,
            itemId:
              requestedLensItemId,
            category:
              "lens",
          });
      } else if (
        spectacle.lensItemId
      ) {
        lensItem =
          await getInventoryItem({
            req,
            itemId:
              spectacle.lensItemId,
            category:
              "lens",
          });
      }

      /*
       * Start with current values.
       */
      let nextFrame =
        normalizeFrame(
          spectacle.frame
            ?.toObject?.() ||
            spectacle.frame ||
            {},
        );

      let nextLenses =
        normalizeLenses(
          spectacle.lenses,
          spectacle.lens,
        );

      let nextLegacyLens =
        normalizeLegacyLens(
          spectacle.lens,
        );

      let nextExtras =
        normalizeExtras(
          spectacle.extras,
        );

      let nextRx =
        normalizeRx(
          spectacle.rx,
        );

      let nextPd =
        normalizePd(
          spectacle.pd,
        );

      let nextLab =
        normalizeLab(
          spectacle.lab,
        );

      let nextPricing =
        {
          ...(spectacle.pricing
            ?.toObject?.() ||
            spectacle.pricing ||
            {}),
        };

      /*
       * Editable canonical fields.
       */
      const editableJobDate =
        req.body.jobDate !==
        undefined
          ? normalizeDate(
              req.body.jobDate,
            )
          : spectacle.jobDate;

      const editableSpecDueDate =
        req.body.specDueDate !==
          undefined ||
        req.body.dueDate !==
          undefined
          ? normalizeDate(
              req.body.specDueDate ??
                req.body.dueDate,
            )
          : spectacle.specDueDate;

      const editableLabDueDate =
        req.body.labDueDate !==
        undefined
          ? normalizeDate(
              req.body.labDueDate,
            )
          : spectacle.labDueDate;

      const editableRxDate =
        req.body.rxDate !==
        undefined
          ? normalizeDate(
              req.body.rxDate,
            )
          : spectacle.rxDate;

      if (
        req.body.frame !==
        undefined
      ) {
        nextFrame =
          normalizeFrame(
            req.body.frame,
            nextFrame,
          );
      }

      if (
        req.body.lenses !==
        undefined
      ) {
        nextLenses =
          normalizeLenses(
            req.body.lenses,
            req.body.lens ||
              nextLegacyLens,
          );
      }

      if (
        req.body.lens !==
        undefined
      ) {
        nextLegacyLens =
          normalizeLegacyLens(
            req.body.lens,
            nextLegacyLens,
          );
      }

      /*
       * Keep legacy lens data synchronized from the right/left detail when
       * a detailed lens edit is provided.
       */
      if (
        req.body.lenses !==
        undefined &&
        req.body.lens ===
          undefined
      ) {
        const preferredLens =
          nextLenses.right;

        nextLegacyLens =
          normalizeLegacyLens(
            {
              code:
                preferredLens.lensCode,
              description:
                preferredLens.lensDescription,
              supplier:
                preferredLens.supplier,
              price:
                preferredLens.price,
            },
            nextLegacyLens,
          );
      }

      if (
        req.body.extras !==
        undefined
      ) {
        nextExtras =
          normalizeExtras(
            req.body.extras,
          );
      }

      if (
        req.body.rx !==
        undefined
      ) {
        /*
         * Spectacle Rx may be edited at the dispensing/job level after
         * creation. The consultation itself remains unchanged.
         */
        nextRx =
          normalizeRx(
            req.body.rx,
            nextRx,
          );
      }

      if (
        req.body.pd !==
        undefined
      ) {
        nextPd =
          normalizePd(
            req.body.pd,
            nextPd,
          );
      }

      if (
        req.body.lab !==
        undefined
      ) {
        nextLab =
          normalizeLab(
            req.body.lab,
            nextLab,
          );
      }

      /*
       * Legacy form aliases for lab fields.
       */
      if (
        req.body.labInstructions !==
        undefined
      ) {
        nextLab.instructions =
          typeof req.body.labInstructions ===
            "object"
            ? cleanString(
                req.body
                  .labInstructions
                  ?.instructions,
              )
            : cleanString(
                req.body
                  .labInstructions,
              );
      }

      if (
        req.body.toApply !==
        undefined
      ) {
        nextLab.toApply =
          normalizeToApply(
            req.body.toApply,
          );
      }

      if (
        req.body.toFit !==
        undefined
      ) {
        nextLab.toFit =
          req.body.toFit === true;
      }

      /*
       * Pricing input.
       */
      const incomingPricing =
        req.body.pricing &&
        typeof req.body.pricing ===
          "object"
          ? req.body.pricing
          : {};

      const discount =
        req.body.discount !==
        undefined
          ? money(
              req.body.discount,
            )
          : money(
              incomingPricing
                .overallDiscount ??
                nextPricing
                  .overallDiscount ??
                spectacle.discount,
            );

      const gstRate =
        incomingPricing.gstRate !==
          undefined
          ? money(
              incomingPricing.gstRate,
            )
          : req.body.gstRate !==
              undefined
            ? money(
                req.body.gstRate,
              )
            : money(
                nextPricing.gstRate,
              );

      /*
       * Inventory pricing is authoritative if the item exists.
       * Otherwise use the editable frame/lens values.
       */
      if (frameItem) {
        nextFrame =
          normalizeFrame({
            ...nextFrame,
            code:
              frameItem.code,
            description:
              frameItem.description ||
              [
                frameItem.brand,
                frameItem.model,
              ]
                .filter(Boolean)
                .join(" "),
            price:
              frameItem.sellingPrice,
            ownFrame:
              false,
          });
      }

      if (lensItem) {
        nextLegacyLens =
          normalizeLegacyLens({
            ...nextLegacyLens,
            code:
              lensItem.code,
            description:
              lensItem.description,
            supplier:
              lensItem.supplier,
            price:
              lensItem.sellingPrice,
          });

        /*
         * Do not overwrite detailed optical measurements, but keep the
         * common inventory identity and price synchronized on both eyes
         * when detailed lens structure has no explicit eye pricing.
         */
        const detailedPrice =
          money(
            nextLenses.right.price,
          ) +
          money(
            nextLenses.left.price,
          );

        const canonicalLensPrice =
          money(
            lensItem.sellingPrice,
          );

        if (
          detailedPrice === 0 ||
          req.body.lensItemId !==
            undefined
        ) {
          nextLenses = {
            right: {
              ...nextLenses.right,
              lensCode:
                nextLenses.right
                  .lensCode ||
                lensItem.code,
              lensDescription:
                nextLenses.right
                  .lensDescription ||
                lensItem.description ||
                "",
              supplier:
                nextLenses.right
                  .supplier ||
                lensItem.supplier ||
                "",
            },
            left: {
              ...nextLenses.left,
              lensCode:
                nextLenses.left
                  .lensCode ||
                lensItem.code,
              lensDescription:
                nextLenses.left
                  .lensDescription ||
                lensItem.description ||
                "",
              supplier:
                nextLenses.left
                  .supplier ||
                lensItem.supplier ||
                "",
            },
          };

          /*
           * The job-level pricing uses the inventory item price once,
           * not twice for OD + OS.
           */
        }
      }

      const lensDetailPrice =
        money(
          nextLenses.right.price,
        ) +
        money(
          nextLenses.left.price,
        );

      let nextLensPrice =
        req.body.lenses !==
          undefined ||
        req.body.lens !==
          undefined ||
        incomingPricing
          .lensPrice !==
          undefined
          ? lensDetailPrice
          : money(
              spectacle
                .pricing
                ?.lensPrice ??
              spectacle.lens
                ?.price ??
              lensDetailPrice,
            );

      if (lensItem) {
        nextLensPrice =
          money(
            lensItem.sellingPrice,
          );
      }

      /*
       * Frame inventory price is authoritative.
       */
      const nextFramePrice =
        frameItem
          ? money(
              frameItem.sellingPrice,
            )
          : money(
              nextFrame.price,
            );

      const totals =
        calculateTotals({
          framePrice:
            nextFramePrice,
          lensPrice:
            nextLensPrice,
          extras:
            nextExtras,
          discount,
          gstRate,
        });

      const nextFrameDiscount =
        req.body.frame
          ?.discount !==
          undefined
          ? money(
              req.body.frame
                .discount,
            )
          : money(
              incomingPricing
                .frameDiscount ??
                nextPricing
                  .frameDiscount,
            );

      const nextLensDiscount =
        money(
          incomingPricing
            .lensDiscount ??
            nextPricing
              .lensDiscount,
        );

      const nextDiscountReason =
        cleanString(
          incomingPricing
            .discountReason ??
            nextPricing
              .discountReason,
        );

      nextPricing =
        buildPricing({
          existing:
            nextPricing,
          totals,
          frameDiscount:
            nextFrameDiscount,
          lensDiscount:
            nextLensDiscount,
          discountReason:
            nextDiscountReason,
        });

      /*
       * Build a controlled update.
       */
      const update = {
        jobDate:
          editableJobDate,

        specDueDate:
          editableSpecDueDate,

        labDueDate:
          editableLabDueDate,

        rxDate:
          editableRxDate,

        jobType:
          req.body.jobType !==
          undefined
            ? cleanString(
                req.body.jobType,
              )
            : spectacle.jobType,

        use:
          req.body.use !==
          undefined
            ? normalizeUse(
                req.body.use,
              )
            : spectacle.use,

        dispenserId:
          req.body.dispenserId !==
          undefined
            ? getId(
                req.body.dispenserId,
              )
            : spectacle.dispenserId,

        prescribedById:
          req.body.prescribedById !==
          undefined
            ? getId(
                req.body
                  .prescribedById,
              )
            : spectacle
                .prescribedById,

        rx: nextRx,

        pd: nextPd,

        frame: nextFrame,

        lenses: nextLenses,

        lens: nextLegacyLens,

        extras: totals.extras,

        lab: nextLab,

        pricing: nextPricing,

        // Legacy totals.
        extrasTotal:
          totals.extrasTotal,
        discount:
          totals.discount,
        total:
          totals.total,
        gst:
          totals.gstAmount,
        billTotal:
          totals.billTotal,

        billingNo:
          req.body.billingNo !==
          undefined
            ? cleanString(
                req.body.billingNo,
              )
            : spectacle
                .billingNo,

        notification:
          req.body.notification !==
          undefined
            ? cleanString(
                req.body
                  .notification,
              ) || "none"
            : spectacle
                .notification,

        smsEmail:
          req.body.smsEmail !==
          undefined
            ? cleanString(
                req.body.smsEmail,
              )
            : spectacle
                .smsEmail,

        sms:
          req.body.sms !==
          undefined
            ? req.body.sms === true
            : spectacle.sms,

        email:
          req.body.email !==
          undefined
            ? req.body.email ===
              true
            : spectacle.email,

        electronicOrder:
          req.body.electronicOrder !==
          undefined
            ? cleanString(
                req.body
                  .electronicOrder,
              )
            : req.body.eOrder !==
                undefined
              ? cleanString(
                  req.body.eOrder,
                )
              : spectacle
                  .electronicOrder,

        eOrder:
          req.body.eOrder !==
          undefined
            ? cleanString(
                req.body.eOrder,
              )
            : req.body
                .electronicOrder !==
                undefined
              ? cleanString(
                  req.body
                    .electronicOrder,
                )
              : spectacle
                  .eOrder,

        notes:
          req.body.notes !==
          undefined
            ? cleanString(
                req.body.notes,
              )
            : spectacle.notes,

        updatedBy:
          req.user._id,
      };

      /*
       * Inventory references can only be modified when still draft.
       */
      if (
        !lockedInventory
      ) {
        if (
          requestedFrameItemId !==
          undefined
        ) {
          update.frameItemId =
            frameItem?._id ||
            null;
        }

        if (
          requestedLensItemId !==
          undefined
        ) {
          update.lensItemId =
            lensItem?._id ||
            null;
        }
      }

      Object.assign(
        spectacle,
        update,
      );

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
            "dispenserId",
            "firstName lastName role",
          )
          .populate(
            "prescribedById",
            "firstName lastName role",
          )
          .populate(
            "readyBy",
            "firstName lastName role",
          )
          .populate(
            "collectedBy",
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

      return res.json({
        success: true,

        message:
          "Spectacle job updated successfully.",

        data: updated,
      });
    },
  );

/*
|--------------------------------------------------------------------------
| UPDATE spectacle status
|--------------------------------------------------------------------------
|
| Dedicated endpoint:
|
| PATCH /spectacles/:id/status
|
| Status transitions:
|
| draft
|   → ordered / cancelled
|
| ordered
|   → not_ready / cancelled
|
| not_ready
|   → ready / cancelled
|
| ready
|   → notified / collected
|
| notified
|   → collected
|
| Once collected/cancelled, no further status transition is allowed.
|--------------------------------------------------------------------------
*/

export const updateSpectacleStatus =
  asyncHandler(
    async (req, res) => {
      requireRole(
        req,
        STATUS_ROLES,
      );

      const organizationId =
        getOrganizationId(req);

      if (!organizationId) {
        return res.status(403).json({
          success: false,
          message:
            "Authenticated user is not assigned to an organization.",
        });
      }

      if (
        !isValidObjectId(
          req.params.id,
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid spectacle job ID.",
        });
      }

      const nextStatus =
        cleanString(
          req.body.status,
        );

      if (
        !ALL_STATUSES.includes(
          nextStatus,
        )
      ) {
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
                _id:
                  req.params.id,
                organizationId,
              }).session(
                session,
              );

            if (!spectacle) {
              const error =
                new Error(
                  "Spectacle job not found.",
                );

              error.statusCode =
                404;
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

            /*
             * Same-status click is harmless.
             */
            if (
              previousStatus !==
              nextStatus
            ) {
              const allowed =
                STATUS_TRANSITIONS[
                  previousStatus
                ] || [];

              if (
                !allowed.includes(
                  nextStatus,
                )
              ) {
                const error =
                  new Error(
                    `Invalid status transition: ${previousStatus} → ${nextStatus}.`,
                  );

                error.statusCode =
                  400;
                throw error;
              }
            }

            /*
             * DRAFT → ORDERED
             *
             * Reserve/deduct linked frame and lens stock exactly once.
             */
            if (
              previousStatus ===
                "draft" &&
              nextStatus ===
                "ordered"
            ) {
              const linkedItems =
                [
                  spectacle.frameItemId,
                  spectacle.lensItemId,
                ].filter(Boolean);

              const uniqueItemIds =
                [
                  ...new Set(
                    linkedItems.map(
                      (value) =>
                        value.toString(),
                    ),
                  ),
                ];

              for (
                const itemId of uniqueItemIds
              ) {
                const item =
                  await InventoryItem.findOne({
                    _id:
                      itemId,
                    organizationId,
                    status:
                      "active",
                  }).session(
                    session,
                  );

                if (!item) {
                  const error =
                    new Error(
                      "Linked inventory item is no longer available.",
                    );

                  error.statusCode =
                    400;
                  throw error;
                }

                const beforeStock =
                  Number(
                    item.stock || 0,
                  );

                if (
                  beforeStock <
                  1
                ) {
                  const error =
                    new Error(
                      `Insufficient stock for ${item.code}.`,
                    );

                  error.statusCode =
                    400;
                  throw error;
                }

                const updatedItem =
                  await InventoryItem.findOneAndUpdate(
                    {
                      _id:
                        item._id,
                      organizationId,
                      status:
                        "active",
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
                          req.user
                            ._id,
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

                  error.statusCode =
                    409;
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

                      type:
                        "sale",

                      quantity:
                        -1,

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
                        req.user
                          ._id,
                    },
                  ],
                  {
                    session,
                  },
                );
              }

              const now =
                new Date();

              spectacle.lensOrderedAt =
                now;

              spectacle.lensOrderDate =
                now;
            }

            if (
              nextStatus ===
                "ready" &&
              previousStatus !==
                "ready"
            ) {
              spectacle.jobReadyAt =
                new Date();

              spectacle.readyBy =
                req.user._id;
            }

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

            if (
              nextStatus ===
                "collected"
            ) {
              spectacle.collectedAt =
                new Date();

              spectacle.collectedBy =
                req.user._id;
            }

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
                .populate(
                  "dispenserId",
                  "firstName lastName role",
                )
                .populate(
                  "prescribedById",
                  "firstName lastName role",
                )
                .populate(
                  "readyBy",
                  "firstName lastName role",
                )
                .populate(
                  "collectedBy",
                  "firstName lastName role",
                )
                .lean();
          },
        );

        return res.json({
          success: true,

          message:
            `Spectacle job moved to ${nextStatus}.`,

          data:
            updatedJob,
        });
      } finally {
        await session.endSession();
      }
    },
  );

/*
|--------------------------------------------------------------------------
| DISPENSING LIST
|--------------------------------------------------------------------------
*/

export const dispensingList =
  asyncHandler(
    async (req, res) => {
      requireRole(
        req,
        VIEW_ROLES,
      );

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
        (
          currentPage -
          1
        ) *
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
        ALL_STATUSES.includes(
          status,
        )
      ) {
        query.status =
          status;
      }

      if (
        req.user.role !==
          "super_admin" &&
        req.user.role !==
          "organization_admin"
      ) {
        query.branchId =
          branch._id;
      } else if (
        branchId
      ) {
        query.branchId =
          branch._id;
      }

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
            "dispenserId",
            "firstName lastName role",
          )
          .populate(
            "prescribedById",
            "firstName lastName role",
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

      if (normalizedSearch) {
        const searchText =
          normalizedSearch.toLowerCase();

        list = list.filter(
          (job) => {
            const patient =
              job.patientId || {};

            const patientFullName =
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

            const rightLens =
              job.lenses
                ?.right || {};

            const leftLens =
              job.lenses?.left ||
              {};

            const haystack = [
              job.jobNumber,

              patient.patientNumber,
              patient.firstName,
              patient.middleName,
              patient.lastName,
              patientFullName,
              patient.phone,

              frame.code,
              frame.description,

              lens.code,
              lens.description,
              lens.supplier,

              rightLens.lensCode,
              rightLens.lensDescription,
              leftLens.lensCode,
              leftLens.lensDescription,

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

        data:
          list,

        pagination: {
          page:
            currentPage,
          limit:
            pageLimit,
          count:
            list.length,
        },
      });
    },
  );
