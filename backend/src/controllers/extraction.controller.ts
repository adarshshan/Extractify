import { Request, Response, NextFunction } from "express";
import path from "path";
import { addPdfExtractionJob } from "../services/queue.service";
import { pdfExtractionQueue } from "../queues/pdfExtraction.queue";

export const handleExtraction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) {
    return res.status(400).json({ message: "No PDF file uploaded." });
  }

  try {
    const job = await addPdfExtractionJob({
      pdfPath: req.file.path,
      originalFileName: req.file.originalname,
    });

    res.status(202).json({
      message: "PDF processing has been queued.",
      jobId: job.id,
    });
  } catch (error) {
    console.error("Failed to queue job:", error);
    next(error);
  }
};

/**
 * Gets the status of a job.
 * The client will poll this endpoint.
 */
export const getJobStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { jobId } = req.params;
  if (!jobId) {
    return res.status(400).json({ message: "Job ID is required." });
  }

  try {
    const job = await pdfExtractionQueue.getJob(jobId + "");

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnValue = job.returnvalue;
    const failedReason = job.failedReason;

    res.json({
      jobId: job.id,
      state,
      progress,
      returnValue,
      failedReason,
    });
  } catch (error) {
    console.error(`Failed to get status for job ${jobId}:`, error);
    next(error);
  }
};

export const downloadReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reportId } = req.params;
    const filePath = path.join(process.cwd(), "uploads", reportId + "");

    res.download(filePath, (err) => {
      if (err) {
        res.status(404).send({ message: "Report not found." });
      }
    });
  } catch (error) {
    next(error);
  }
};
