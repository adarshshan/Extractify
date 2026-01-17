import { Job, Worker } from "bullmq";
import { redisConnection } from "../queues/connection";
import { PDF_EXTRACTION_JOB, PdfExtractionJobData } from "../jobs/pdfExtraction.job";
import { getPdfPageCount, convertPdfToImages, cleanupFiles } from "../services/pdf.service";
import { ocrImageWithNanoNets } from "../services/nanonets.service";
import { saveRecord } from "../services/db.service";
import { generateExcelFile } from "../services/excel.service";
import { normalizeText } from "../utils/textNormalizer";
import { IRecord } from "../models/record.model";
import path from "path";

const BATCH_SIZE = 10; // Process 10 pages at a time. Configurable.
const CONFIDENCE_THRESHOLD = 0.8;

// The worker is defined with the job name and a processor function.
// The processor function is where the actual work is done.
const worker = new Worker(
  PDF_EXTRACTION_JOB,
  async (job: Job<PdfExtractionJobData>) => {
    const { pdfPath, originalFileName } = job.data;
    console.log(`[WORKER] Starting job ${job.id} for ${originalFileName}`);

    let totalPages = 0;
    try {
      totalPages = await getPdfPageCount(pdfPath);
      console.log(`[WORKER] PDF has ${totalPages} pages.`);
    } catch (error) {
      console.error(`[WORKER] Failed to get page count for ${pdfPath}`, error);
      throw error; // This will cause the job to fail.
    }

    const allTableCells: any[] = [];
    const allExtractedData = new Map<string, { value: any; confidence: number }>();

    // Process the PDF in batches
    for (let startPage = 1; startPage <= totalPages; startPage += BATCH_SIZE) {
      const endPage = Math.min(startPage + BATCH_SIZE - 1, totalPages);
      const progress = Math.round((startPage / totalPages) * 100);
      await job.updateProgress(progress);
      console.log(`[WORKER] Processing pages ${startPage} to ${endPage}. Progress: ${progress}%`);

      let imagePaths: string[] = [];
      try {
        // 1. Convert one batch of pages to images
        imagePaths = await convertPdfToImages(pdfPath, startPage, endPage);

        // 2. OCR each image in the batch (with concurrency limiting)
        const ocrPromises = imagePaths.map((imagePath) => ocrImageWithNanoNets(imagePath));
        const ocrResults = await Promise.all(ocrPromises);

        for (const ocrResult of ocrResults) {
          const predictions = ocrResult?.result?.[0]?.prediction || [];
          predictions.forEach((pred: any) => {
            if (pred.label === "table" && pred.cells?.length > 0) {
              pred.cells.forEach((cell: any) => {
                if (cell.text?.trim()) {
                  allTableCells.push({
                    row: cell.row,
                    col: cell.col,
                    text: cell.text.trim(),
                    label: cell.label || "",
                    confidence: pred?.confidence || cell?.score || 0,
                  });
                }
              });
            } else if (pred.confidence >= CONFIDENCE_THRESHOLD) {
              const existing = allExtractedData.get(pred.label);
              if (!existing || pred.confidence > existing.confidence) {
                allExtractedData.set(pred.label, {
                  value: normalizeText(pred.ocr_text),
                  confidence: pred.confidence,
                });
              }
            }
          });
        }
      } finally {
        // 3. Cleanup images for the current batch to save disk space
        if (imagePaths.length > 0) {
          cleanupFiles(imagePaths);
          console.log(`[WORKER] Cleaned up ${imagePaths.length} temporary images.`);
        }
      }
    }

    // 4. All batches are processed, now save the final record
    const recordToSave = {
      fileName: originalFileName,
      extractedData: Object.fromEntries(allExtractedData),
      extractedTable: { cells: allTableCells },
    };

    const savedRecord = await saveRecord(recordToSave as Partial<IRecord>);
    console.log(`[WORKER] Saved record ${savedRecord._id} to database.`);

    // 5. Generate the final Excel report
    const excelFileName = await generateExcelFile(savedRecord);
    console.log(`[WORKER] Generated Excel report: ${excelFileName}`);
    
    // 6. Cleanup the original PDF file
    cleanupFiles([pdfPath]);
    console.log(`[WORKER] Cleaned up original PDF file: ${pdfPath}`);


    // The return value of the job, which can be retrieved by the client
    return {
      reportId: excelFileName,
      recordId: savedRecord._id?.toString(),
    };
  },
  { connection: redisConnection, concurrency: 5 } // Process up to 5 jobs concurrently
);

worker.on("completed", (job, result) => {
  console.log(`[WORKER] Job ${job.id} completed successfully. Result:`, result);
});

worker.on("failed", (job, err) => {
  console.error(`[WORKER] Job ${job.id} failed with error:`, err.message);
});

export default worker;
