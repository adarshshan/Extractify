import { Queue } from "bullmq";
import { redisConnection } from "./connection";
import { PDF_EXTRACTION_JOB } from "../jobs/pdfExtraction.job";

// A queue is a collection of jobs.
// We are creating a queue named after our job type.
export const pdfExtractionQueue = new Queue(PDF_EXTRACTION_JOB, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry a failed job up to 3 times
    backoff: {
      type: "exponential",
      delay: 5000, // Start with a 5-second delay
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
    },
    removeOnFail: {
      count: 1000, // Keep the last 1000 failed jobs for debugging
    },
  },
});
