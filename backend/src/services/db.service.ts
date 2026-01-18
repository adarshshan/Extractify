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

export const saveRecord = async (
  data: Partial<IRecord>,
): Promise<IRecord | null> => {
  console.log("pointer inside the saveRecord");
  try {
    console.log("data from mongodb save...");
    console.log(data);
    const record = new Record(data);
    return record.save();
  } catch (error) {
    console.log("The issue is here in the db part");
    console.log(error);
    return null;
  }
};

export const getRecordById = async (id: string): Promise<IRecord | null> => {
  return Record.findById(id).exec();
};

export const getAllRecords = async (): Promise<IRecord[]> => {
  return Record.find().sort({ createdAt: -1 }).exec();
};

export const updateRecord = async (
  id: string,
  data: Partial<IRecord>,
): Promise<IRecord | null> => {
  return Record.findByIdAndUpdate(id, data, { new: true }).exec();
};
