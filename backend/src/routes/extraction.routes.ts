import { Router } from "express";
import {
  handleExtraction,
  downloadReport,
  getJobStatus,
  getRecords,
} from "../controllers/extraction.controller";
import { upload } from "../utils/fileHandler";

const router = Router();

// GET /api/records
router.get("/records", getRecords); //retrives previous records

// POST /api/extract
router.post("/extract", upload.single("file"), handleExtraction); //uploads and process the pdf

// GET /api/status/:jobId
router.get("/status/:jobId", getJobStatus); //polling api - to get status

// GET /api/download/:reportId
router.get("/download/:reportId", downloadReport); //To download the generated Excel reports

export default router;
