import { connectToDB } from "../services/db.service";
import "./pdfExtraction.worker";

const startWorker = async () => {
  await connectToDB(); //connecting the db initially

  console.log("Worker process started. Listening for jobs...");
};

startWorker();
