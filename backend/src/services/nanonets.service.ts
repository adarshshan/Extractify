import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import { config } from '../config';

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

export const ocrImageWithNanoNets = async (imagePath: string): Promise<NanoNetsResponse> => {
  if (!config.nanonets.apiKey || !config.nanonets.modelId) {
    throw new Error('NanoNets API key or Model ID is not configured.');
  }

  const form = new FormData();
  form.append('file', fs.createReadStream(imagePath));

  const response = await axios.post<NanoNetsResponse>(NANO_API_URL, form, {
    headers: {
      ...form.getHeaders(),
      'Authorization': `Basic ${Buffer.from(`${config.nanonets.apiKey}:`).toString('base64')}`,
    },
    // The following is needed to prevent axios from trying to parse a multipart response as JSON
    transformResponse: [(data) => data],
  });
  
  // The response is a string, so we need to parse it as JSON
  return JSON.parse(response.data);
};
