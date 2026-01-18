import { connectToDB } from "../services/db.service";
import "./pdfExtraction.worker";

const startWorker = async () => {
  // First, connect to the database
  await connectToDB();

  // The worker is started by the import above.
  // This log now correctly indicates that the process is ready.
  console.log("Worker process started. Listening for jobs...");
};

startWorker();