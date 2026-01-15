import { Request, Response, NextFunction } from 'express';
import { convertPdfToImages, cleanupFiles } from '../services/pdf.service';
import { ocrImageWithNanoNets } from '../services/nanonets.service';
import { saveRecord, getRecordById } from '../services/db.service';
import { generateExcelFile } from '../services/excel.service';
import { normalizeText } from '../utils/textNormalizer';
import { IRecord } from '../models/record.model';
import path from 'path';

const CONFIDENCE_THRESHOLD = 0.8;

export const handleExtraction = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No PDF file uploaded.' });
  }

  const pdfPath = req.file.path;
  let imagePaths: string[] = [];

  try {
    // 1. Convert PDF to images
    imagePaths = await convertPdfToImages(pdfPath);

    const allExtractedData = new Map<string, { value: any; confidence: number }>();

    // 2. OCR each image
    for (const imagePath of imagePaths) {
      const ocrResult = await ocrImageWithNanoNets(imagePath);
      const predictions = ocrResult.result[0]?.prediction || [];

      predictions.forEach(pred => {
        // 3. Filter by confidence and normalize
        if (pred.confidence >= CONFIDENCE_THRESHOLD) {
          const existing = allExtractedData.get(pred.label);
          // Overwrite if new confidence is higher
          if (!existing || pred.confidence > existing.confidence) {
            allExtractedData.set(pred.label, {
              value: normalizeText(pred.ocr_text),
              confidence: pred.confidence,
            });
          }
        }
      });
    }

    // 4. Save to MongoDB
    const recordToSave = {
      fileName: req.file.originalname,
      extractedData: Object.fromEntries(allExtractedData),
    };

    const savedRecord = await saveRecord(recordToSave as Partial<IRecord>);

    // 5. Generate Excel
    const excelFileName = await generateExcelFile(savedRecord);

    // 6. Respond with the report ID (which is the excel file name for simplicity)
    res.status(200).json({
      message: 'Extraction successful!',
      reportId: excelFileName,
    });
  } catch (error) {
    next(error);
  } finally {
    // 7. Cleanup temp files
    cleanupFiles([pdfPath, ...imagePaths]);
  }
};

export const downloadReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reportId } = req.params;
      // In a real app, you'd validate this ID and check for user permissions
      const filePath = path.join(process.cwd(), 'uploads', reportId);
      
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
