import { fromPath } from 'pdf2pic';
import path from 'path';
import fs from 'fs';

const tempDir = path.join(process.cwd(), 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export const convertPdfToImages = async (pdfPath: string): Promise<string[]> => {
  const options = {
    density: 100,
    savePath: tempDir,
    saveFilename: `page-${Date.now()}`,
    format: 'png',
    width: 768,
    height: 1024,
  };

  const convert = fromPath(pdfPath, options);
  const pages = await convert.bulk(-1, true);

  if (!pages || pages.length === 0) {
    throw new Error('PDF to image conversion failed to produce any pages.');
  }

  // The output from pdf2pic can be of a different type, so we ensure it's an array of objects with a 'path' property
  const imagePaths = (pages as any[]).map(page => page.path);

  return imagePaths;
};

export const cleanupFiles = (files: string[]) => {
  files.forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
};
