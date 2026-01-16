import mongoose from "mongoose";
import { config } from "../config";
import { Record, IRecord } from "../models/record.model";

export const connectToDB = async () => {
  try {
    if (!config.mongoUri) {
      throw new Error("MONGO_URI is not defined in the environment variables.");
    }
    await mongoose.connect(config?.mongoUri);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export const saveRecord = async (data: Partial<IRecord>): Promise<IRecord> => {
  console.log("data from mongodb save...");
  console.log(data);
  const record = new Record(data);
  return record.save();
};

export const getRecordById = async (id: string): Promise<IRecord | null> => {
  return Record.findById(id).exec();
};
