import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dns from "node:dns";
import dotenv from "dotenv";
import User from "../src/models/User.js"

dotenv.config();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB connected");

    const email = "superadmin@vsync.in";
    const password = "1234567890";

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log("A user with this email already exists.");

      if (existingUser.role === "super_admin") {
        console.log("This user is already a super admin.");
      } else {
        console.log(
          `Existing user has role: ${existingUser.role}. No changes made.`
        );
      }

      await mongoose.disconnect();
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const superAdmin = await User.create({
      organizationId: null,
      branchIds: [],
      defaultBranchId: null,

      firstName: "Platform",
      lastName: "Administrator",

      email,
      password: passwordHash,

      role: "super_admin",
      status: "active",
    });

    console.log("\n================================");
    console.log("SUPER ADMIN CREATED");
    console.log("================================");
    console.log(`Email:    ${superAdmin.email}`);
    console.log(`Password: ${password}`);
    console.log(`Role:     ${superAdmin.role}`);
    console.log("================================\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("Failed to create super admin:");
    console.error(error);
    process.exit(1);
  }
};

createSuperAdmin();