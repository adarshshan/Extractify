import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGO_URI,
  nanonets: {
    apiKey: process.env.NANONETS_API_KEY,
    modelId: process.env.NANONETS_MODEL_ID,
  },
};
