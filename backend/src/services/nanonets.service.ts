import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { config } from "../config";
import pLimit from "p-limit";

// Create a limiter that will execute at most 5 promises concurrently.
const limit = pLimit(5);

const NANO_API_URL = `https://app.nanonets.com/api/v2/OCR/Model/${config?.nanonets?.modelId}/LabelFile/`;

interface NanoNetsPrediction {
  label: string;
  ocr_text: string;
  confidence: number;
}

export interface NanoNetsResponse {
  result: [
    {
      prediction: NanoNetsPrediction[];
      raw_ocr_api_response: any;
    },
  ];
}

export const ocrImageWithNanoNets = async (
  imagePath: string,
): Promise<NanoNetsResponse> => {
  if (!config.nanonets.apiKey || !config.nanonets.modelId) {
    throw new Error("NanoNets API key or Model ID is not configured.");
  }

  // Each call to this function will now be queued by the limiter.
  return limit(async () => {
    const fileBuffer = fs.readFileSync(imagePath);
    const form = new FormData();
    form.append("file", fileBuffer, { filename: path.basename(imagePath) });

    console.log(`[NANO] Sending ${path.basename(imagePath)} to NanoNets.`);
    const response = await axios.post<NanoNetsResponse>(NANO_API_URL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Basic ${Buffer.from(
          `${config?.nanonets?.apiKey}:`,
        ).toString("base64")}`,
      },
    });

    return response?.data;
  });
};
