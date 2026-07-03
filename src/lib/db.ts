import mongoose from "mongoose";

import { seedDatabase } from "./seed";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fixora";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (m) => {
      console.log("Connected to MongoDB database (Mongoose)");
      try {
        await seedDatabase();
      } catch (err) {
        console.error("Database seeding exception:", err);
      }
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
