import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    branchIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],

    defaultBranchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    refreshTokenHash: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: [
        "super_admin",
        "organization_admin",
        "branch_manager",
        "optometrist",
        "doctor",
        "sales_executive",
        "cashier",
        "inventory_manager",
        "lab_technician",
        "receptionist",
      ],
      default: "receptionist",
    },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.index(
  {
    organizationId: 1,
    email: 1,
  },
  {
    unique: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
