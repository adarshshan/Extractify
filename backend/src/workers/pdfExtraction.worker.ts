import { Job, Worker } from "bullmq";
import { redisConnection } from "../queues/connection";
import {
  PDF_EXTRACTION_JOB,
  PdfExtractionJobData,
} from "../jobs/pdfExtraction.job";
import {
  getPdfPageCount,
  convertPdfToImages,
  cleanupFiles,
} from "../services/pdf.service";
import { ocrImageWithNanoNets } from "../services/nanonets.service";
import { saveRecord, updateRecord } from "../services/db.service";
import { generateExcelFile } from "../services/excel.service";
import { normalizeText } from "../utils/textNormalizer";
import { translateText } from "../utils/translator"; // Import translator
import { IRecord } from "../models/record.model";

const BATCH_SIZE = 10; // Process 10 pages at a time. Configurable.

const worker = new Worker(
  PDF_EXTRACTION_JOB,
  async (job: Job<PdfExtractionJobData>) => {
    const { pdfPath, originalFileName } = job?.data;
    console.log(`[WORKER] Starting job ${job?.id} for ${originalFileName}`);

    let totalPages = 0;
    try {
      totalPages = await getPdfPageCount(pdfPath);
    } catch (error) {
      console.error(`[WORKER] Failed to get page count for ${pdfPath}`, error);
      throw error; // This will cause the job to fail.
    }

    const processedRows: any[] = [];

    // Process the PDF in batches
    for (let startPage = 1; startPage <= totalPages; startPage += BATCH_SIZE) {
      const endPage = Math.min(startPage + BATCH_SIZE - 1, totalPages);
      const progress = Math.round((startPage / totalPages) * 100);
      await job.updateProgress(progress);
      console.log(
        `[WORKER] Processing pages ${startPage} to ${endPage}. Progress: ${progress}%`,
      );

      let imagePaths: string[] = [];
      try {
        // Convert one batch of pages to images
        imagePaths = await convertPdfToImages(pdfPath, startPage, endPage);

        // OCR each image in the batch (with concurrency limiting)
        const ocrPromises = imagePaths.map((imagePath) =>
          ocrImageWithNanoNets(imagePath),
        );
        const ocrResults = await Promise.all(ocrPromises);

        for (const ocrResult of ocrResults) {
          const predictions = ocrResult?.result?.[0]?.prediction || [];

          let listPartNumber = "";
          let electionWardNumber = "";

          // Extract page-level data
          predictions.forEach((pred: any) => {
            if (pred?.label === "List_Part_Number") {
              listPartNumber = normalizeText(pred?.ocr_text) || "";
            }
            if (pred?.label === "Election_Ward_Number") {
              electionWardNumber = normalizeText(pred?.ocr_text) || "";
            }
          });

          const currentPageTableData = new Map<number, any>(); // Map to hold data for rows on the current page

          predictions.forEach((pred: any) => {
            if (pred?.type === "table" && pred?.cells?.length > 0) {
              pred?.cells.forEach((cell: any) => {
                if (normalizeText(cell?.text)) {
                  const row = cell?.row;
                  const label = cell?.label;
                  const text = normalizeText(cell?.text);

                  if (!currentPageTableData.has(row)) {
                    currentPageTableData.set(row, {});
                  }
                  currentPageTableData.get(row)[label] = text;
                }
              });
            }
          });

          // Process grouped rows into structured objects
          for (const rowData of currentPageTableData.values()) {
            const wardNo = electionWardNumber || listPartNumber || "";
            const fullName = rowData["Voter_Full_Name"] || "";
            const fatherSpouseName = rowData["relative_name"] || "";
            const gender = rowData["Gender"] || "";

            const translatedFullName = await translateText(fullName);
            const translatedFatherSpouseName =
              await translateText(fatherSpouseName);

            processedRows.push({
              "Sl No.": rowData["SL_No"] || "",
              "Ward No.": wardNo,
              "House Number": rowData["House_Number"] || "",
              "Full Name": fullName,
              "Full Name (En)": translatedFullName, // New translated field
              "Father/Spouse Name": fatherSpouseName,
              "Father/Spouse Name (En)": translatedFatherSpouseName, // New translated field
              Gender: gender,
              "Card Number": rowData["Voter_ID"] || "",
              "Detail Code": rowData["Detail_Code"] || "",
            });
          }
        }
      } catch (err) {
        console.log(err as Error);
      } finally {
        // Cleanup images for the current batch to save disk space
        if (imagePaths?.length > 0) {
          cleanupFiles(imagePaths);
          console.log(
            `[WORKER] Cleaned up ${imagePaths?.length} temporary images.`,
          );
        }
      }
    }

    // All batches are processed, now save the final record
    const recordToSave = {
      fileName: originalFileName,
      extractedData: processedRows, // Pass the structured rows here
    };

    const savedRecord = await saveRecord(recordToSave as Partial<IRecord>);
    console.log(`[WORKER] Saved record ${savedRecord?._id} to database.`);

    // Generate the final Excel report
    const excelFileName = await generateExcelFile(savedRecord);
    console.log(`[WORKER] Generated Excel report: ${excelFileName}`);

    // Update the record with the excel file name
    if (savedRecord) {
      await updateRecord(savedRecord._id.toString(), { excelFileName });
    }

    // Cleanup the original PDF file
    cleanupFiles([pdfPath]);
    console.log(`[WORKER] Cleaned up original PDF file: ${pdfPath}`);

    // The return value of the job, which can be retrieved by the client
    return {
      reportId: excelFileName,
      recordId: savedRecord?._id?.toString(),
    };
  },
  { connection: redisConnection, concurrency: 5 }, // Process up to 5 jobs concurrently
);

worker.on("completed", (job, result) => {
  console.log(
    `[WORKER] Job ${job?.id} completed successfully. Result:`,
    result,
  );
});

worker.on("failed", (job, err) => {
  console.error(`[WORKER] Job ${job?.id} failed with error:`, err.message);
});

export default worker;
