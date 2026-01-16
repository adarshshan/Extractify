import path from "path";
import fs from "fs";
import pdf from "pdf-poppler";

const tempDir = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export const convertPdfToImages = async (
  pdfPath: string
): Promise<string[]> => {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const prefix = `page-${Date.now()}`;

  try {
    await pdf.convert(pdfPath, {
      format: "png",
      out_dir: tempDir,
      out_prefix: prefix,
      page: null, // all pages
    });
  } catch (error) {
    console.error("PDF conversion failed:", error);
    throw new Error(
      "PDF to image conversion failed. Ensure Poppler is installed and added to PATH."
    );
  }

  const files = fs
    .readdirSync(tempDir)
    .filter((file) => file.startsWith(prefix) && file.endsWith(".png"))
    .map((file) => path.join(tempDir, file));

  if (files.length === 0) {
    throw new Error("No pages were generated from the PDF.");
  }

  return files;
};

export const cleanupFiles = (files: string[]) => {
  files.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
};
