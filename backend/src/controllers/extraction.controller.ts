import { Request, Response, NextFunction } from "express";
import { convertPdfToImages, cleanupFiles } from "../services/pdf.service";
import { ocrImageWithNanoNets } from "../services/nanonets.service";
import { saveRecord, getRecordById } from "../services/db.service";
import { generateExcelFile } from "../services/excel.service";
import { normalizeText } from "../utils/textNormalizer";
import { IRecord } from "../models/record.model";
import path from "path";

const CONFIDENCE_THRESHOLD = 0.8;

export const handleExtraction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({ message: "No PDF file uploaded." });
  }

  const pdfPath = req.file.path;
  let imagePaths: string[] = [];

  try {
    // 1. Convert PDF to images
    imagePaths = await convertPdfToImages(pdfPath);

    // We'll collect both: legacy key-value style + proper table cells
    const allExtractedData = new Map<
      string,
      { value: any; confidence: number }
    >();

    // ── New: Collect table structure ───────────────────────────────
    interface TableCell {
      row: number;
      col: number;
      text: string;
      label: string;
      confidence?: number; // we'll try to use prediction confidence
      verification_status?: string;
    }

    const tableCells: TableCell[] = [];

    // 2. OCR each image
    for (const imagePath of imagePaths) {
      const ocrResult = await ocrImageWithNanoNets(imagePath);
      const predictions = ocrResult?.result?.[0]?.prediction || [];

      console.log("Predictions for", imagePath);
      console.log(JSON.stringify(predictions, null, 2));

      predictions.forEach((pred: any) => {
        // A. Legacy key-value extraction (if you still want it)
        if (
          pred?.confidence >= CONFIDENCE_THRESHOLD &&
          pred?.label !== "table"
        ) {
          const existing = allExtractedData.get(pred.label);
          if (!existing || pred.confidence > existing.confidence) {
            allExtractedData.set(pred.label, {
              value: normalizeText(pred.ocr_text),
              confidence: pred.confidence,
            });
          }
        }

        // B. Table extraction ── when we find a "table" prediction
        if (pred?.label === "table" && pred?.cells?.length > 0) {
          pred.cells.forEach((cell: any) => {
            if (cell.text?.trim()) {
              tableCells.push({
                row: cell.row,
                col: cell.col,
                text: cell.text.trim(),
                label: cell.label || "",
                confidence: pred?.confidence || cell?.score || 0,
                verification_status: cell?.verification_status,
              });
            }
          });
        }
        console.log("..................tableCells...........");
        console.log(tableCells);
      });
    }

    // 3. Prepare data to save
    const recordToSave = {
      fileName: req.file.originalname,
      extractedData: allExtractedData, // optional – legacy
      extractedTable: {
        cells: tableCells,
        // You could also add: rowsCount, columnsCount, page, etc. if useful
      },
      // Optional: keep raw predictions if you want debugging power
      // rawPredictions: predictions (but can be huge – maybe only in dev)
    };

    // 4. Save to MongoDB
    const savedRecord = await saveRecord(recordToSave as Partial<IRecord>);

    console.log("savedRecord");
    console.log(savedRecord);

    // 5. Generate Excel (now using table structure)
    const excelFileName = await generateExcelFile(savedRecord);

    console.log("Generated Excel:", excelFileName);

    // 6. Response
    res.status(200).json({
      message: "Extraction successful!",
      reportId: excelFileName,
      recordId: savedRecord._id?.toString(), // optional but useful
      tableRowsCount:
        tableCells.length > 0 ? Math.max(...tableCells.map((c) => c.row)) : 0,
    });
  } catch (error) {
    console.error("Extraction error:", error);
    next(error);
  } finally {
    // 7. Cleanup
    cleanupFiles([pdfPath, ...imagePaths]);
  }
};

export const downloadReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reportId } = req.params;
    // In a real app, you'd validate this ID and check for user permissions
    const filePath = path.join(process.cwd(), "uploads", reportId + "");

    res.download(filePath, (err) => {
      if (err) {
        // Handle error, but don't expose file system details
        res.status(404).send({ message: "Report not found." });
      }
    });
  } catch (error) {
    next(error);
  }
};
