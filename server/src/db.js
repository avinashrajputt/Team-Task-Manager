import mongoose from "mongoose";

export async function connectDb(mongoUrl) {
  if (!mongoUrl) {
    throw new Error("MONGO_URL is required");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUrl);
  return mongoose.connection;
}
