import mongoose from "mongoose";

const eyeRxSchema = new mongoose.Schema(
  {
    sphere: { type: String, trim: true, default: "" },
    cylinder: { type: String, trim: true, default: "" },
    axis: { type: String, trim: true, default: "" },
    add: { type: String, trim: true, default: "" },
    inter: { type: String, trim: true, default: "" },
    prism: { type: String, trim: true, default: "" },
    base: { type: String, trim: true, default: "" },
    va: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const eyeLensSchema = new mongoose.Schema(
  {
    lensCode: {
      type: String,
      trim: true,
      default: "",
    },

    lensDescription: {
      type: String,
      trim: true,
      default: "",
    },

    lensSize: {
      type: String,
      trim: true,
      default: "",
    },

    segmentSize: {
      type: String,
      trim: true,
      default: "",
    },

    segmentHeight: {
      type: String,
      trim: true,
      default: "",
    },

    ocHeight: {
      type: String,
      trim: true,
      default: "",
    },

    horizontalDecentration: {
      type: String,
      trim: true,
      default: "",
    },

    verticalDecentration: {
      type: String,
      trim: true,
      default: "",
    },

    baseCurve: {
      type: String,
      trim: true,
      default: "",
    },

    supplier: {
      type: String,
      trim: true,
      default: "",
    },

    supplierOrderDate: {
      type: Date,
      default: null,
    },

    price: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false },
);

const frameSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    size: {
      type: String,
      trim: true,
      default: "",
    },

    depth: {
      type: String,
      trim: true,
      default: "",
    },

    ed: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      trim: true,
      default: "",
    },

    other: {
      type: String,
      trim: true,
      default: "",
    },

    fitting: {
      type: String,
      trim: true,
      default: "",
    },

    price: {
      type: Number,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      min: 0,
      default: 0,
    },

    toReorder: {
      type: Number,
      min: 0,
      default: 0,
    },

    ownFrame: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const extraSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    price: {
      type: Number,
      min: 0,
      default: 0,
    },

    labRequired: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
);

const spectacleSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },

    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },

    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consultation",
      default: null,
      index: true,
    },

    frameItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      default: null,
      index: true,
    },

    lensItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      default: null,
      index: true,
    },

    jobNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },

    jobDate: {
      type: Date,
      default: Date.now,
    },

    specDueDate: {
      type: Date,
      default: null,
    },

    labDueDate: {
      type: Date,
      default: null,
    },

    jobType: {
      type: String,
      trim: true,
      default: "Spectacle",
    },

    dispenserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    prescribedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    rxDate: {
      type: Date,
      default: null,
    },

    use: {
      type: [String],
      enum: [
        "distance",
        "near",
        "intermediate",
        "bifocal",
        "trifocal",
        "multifocal",
      ],
      default: [],
    },

    rx: {
      right: {
        type: eyeRxSchema,
        default: () => ({}),
      },

      left: {
        type: eyeRxSchema,
        default: () => ({}),
      },

      note: {
        type: String,
        trim: true,
        default: "",
      },
    },

    pd: {
      right: {
        type: String,
        trim: true,
        default: "",
      },

      left: {
        type: String,
        trim: true,
        default: "",
      },

      total: {
        type: String,
        trim: true,
        default: "",
      },
    },

    frame: {
      type: frameSchema,
      default: () => ({}),
    },

    lenses: {
      right: {
        type: eyeLensSchema,
        default: () => ({}),
      },

      left: {
        type: eyeLensSchema,
        default: () => ({}),
      },
    },

    // Legacy compatibility.
    // New UI should use lenses.right / lenses.left.
    lens: {
      code: {
        type: String,
        trim: true,
        default: "",
      },

      description: {
        type: String,
        trim: true,
        default: "",
      },

      supplier: {
        type: String,
        trim: true,
        default: "",
      },

      price: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    extras: {
      type: [extraSchema],
      default: [],
    },

    lab: {
      instructions: {
        type: String,
        trim: true,
        default: "",
      },

      toApply: {
        type: [String],
        default: [],
      },

      toFit: {
        type: Boolean,
        default: false,
      },
    },

    pricing: {
      framePrice: {
        type: Number,
        min: 0,
        default: 0,
      },

      lensPrice: {
        type: Number,
        min: 0,
        default: 0,
      },

      extrasTotal: {
        type: Number,
        min: 0,
        default: 0,
      },

      frameDiscount: {
        type: Number,
        min: 0,
        default: 0,
      },

      lensDiscount: {
        type: Number,
        min: 0,
        default: 0,
      },

      overallDiscount: {
        type: Number,
        min: 0,
        default: 0,
      },

      discountReason: {
        type: String,
        trim: true,
        default: "",
      },

      subtotal: {
        type: Number,
        min: 0,
        default: 0,
      },

      total: {
        type: Number,
        min: 0,
        default: 0,
      },

      gstRate: {
        type: Number,
        min: 0,
        default: 0,
      },

      gstAmount: {
        type: Number,
        min: 0,
        default: 0,
      },

      billTotal: {
        type: Number,
        min: 0,
        default: 0,
      },
    },

    // Legacy compatibility totals.
    extrasTotal: {
      type: Number,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      min: 0,
      default: 0,
    },

    total: {
      type: Number,
      min: 0,
      default: 0,
    },

    gst: {
      type: Number,
      min: 0,
      default: 0,
    },

    billTotal: {
      type: Number,
      min: 0,
      default: 0,
    },

    billingNo: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,

      enum: [
        "draft",
        "ordered",
        "not_ready",
        "ready",
        "notified",
        "collected",
        "cancelled",
      ],

      default: "draft",
      index: true,
    },

    lensOrderedAt: {
      type: Date,
      default: null,
    },

    // Legacy alias.
    lensOrderDate: {
      type: Date,
      default: null,
    },

    jobReadyAt: {
      type: Date,
      default: null,
    },

    lastNotifiedAt: {
      type: Date,
      default: null,
    },

    notificationCount: {
      type: Number,
      min: 0,
      default: 0,
    },

    collectedAt: {
      type: Date,
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

spectacleSchema.index({
  organizationId: 1,
  branchId: 1,
  patientId: 1,
  jobDate: -1,
});

spectacleSchema.index({
  organizationId: 1,
  status: 1,
  jobDate: -1,
});

export default mongoose.model(
  "Spectacle",
  spectacleSchema,
);