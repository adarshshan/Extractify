import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { config } from "../config";

const NANO_API_URL = `https://app.nanonets.com/api/v2/OCR/Model/${config.nanonets.modelId}/LabelFile/`;

interface NanoNetsPrediction {
  label: string;
  ocr_text: string;
  confidence: number;
}

export interface NanoNetsResponse {
  result: [
    {
      prediction: NanoNetsPrediction[];
    }
  ];
}

export const ocrImageWithNanoNets = async (
  imagePath: string
): Promise<NanoNetsResponse> => {
  if (!config.nanonets.apiKey || !config.nanonets.modelId) {
    throw new Error("NanoNets API key or Model ID is not configured.");
  }

  // Read the file into a buffer to avoid streaming issues
  const fileBuffer = fs.readFileSync(imagePath);

  const form = new FormData();
  // Append the buffer, providing a filename for the form-data
  form.append("file", fileBuffer, { filename: path.basename(imagePath) });

  const response = await axios.post<NanoNetsResponse>(NANO_API_URL, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Basic ${Buffer.from(
        `${config.nanonets.apiKey}:`
      ).toString("base64")}`,
    },
  });

  return response.data;
};
