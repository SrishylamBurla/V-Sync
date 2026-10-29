import mongoose from "mongoose";
import dns from "node:dns";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  // Use the host resolver by default. Only override DNS when explicitly configured.
  // This runs after dotenv.config() in server.js, so values from .env are available.
  const configuredDnsServers = (process.env.MONGODB_DNS_SERVERS || "")
    .split(",")
    .map((server) => server.trim())
    .filter(Boolean);
  if (configuredDnsServers.length) dns.setServers(configuredDnsServers);

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is missing in environment variables"
    );
  }

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    isConnected = true;

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );

    console.log(
      `Database: ${connection.connection.name}`
    );
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message
    );

    throw error;
  }
};

export default connectDB;