import { pdfExtractionQueue } from "../queues/pdfExtraction.queue";
import { PdfExtractionJobData } from "../jobs/pdfExtraction.job";

/**
 * Adds a new PDF extraction job to the queue.
 * @param data - The data required for the job.
 * @returns The created job instance.
 */
export const addPdfExtractionJob = async (data: PdfExtractionJobData) => {
  const job = await pdfExtractionQueue.add("process-pdf", data);
  return job;
};
