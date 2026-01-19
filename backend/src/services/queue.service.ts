import { pdfExtractionQueue } from "../queues/pdfExtraction.queue";
import { PdfExtractionJobData } from "../jobs/pdfExtraction.job";

export const addPdfExtractionJob = async (data: PdfExtractionJobData) => {
  const job = await pdfExtractionQueue.add("process-pdf", data);
  return job;
};
