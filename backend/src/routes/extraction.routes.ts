import { Router } from 'express';
import { handleExtraction, downloadReport } from '../controllers/extraction.controller';
import { upload } from '../utils/fileHandler';

const router = Router();

// POST /api/extract
// Handles the PDF upload and initiates the extraction process.
router.post('/extract', upload.single('file'), handleExtraction);

// GET /api/download/:reportId
// Allows downloading the generated Excel report.
router.get('/download/:reportId', downloadReport);


export default router;
