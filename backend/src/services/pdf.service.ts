import path from "path";
import fs from "fs";
import pdf from "pdf-poppler";

const tempDir = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Gets the total number of pages in a PDF file.
 * This is a fast operation that only reads the PDF metadata.
 */
export const getPdfPageCount = async (pdfPath: string): Promise<number> => {
  try {
    const info = await pdf.info(pdfPath);
    const pages = info.pages;
    if (pages === null) {
      throw new Error("Could not determine number of pages.");
    }
    return pages;
  } catch (error) {
    console.error("Failed to get PDF info:", error);
    throw new Error("Failed to get PDF page count.");
  }
};

/**
 * Converts a range of pages from a PDF into images.
 * @param pdfPath The path to the PDF file.
 * @param startPage The first page to convert (1-based).
 * @param endPage The last page to convert (inclusive).
 * @returns A promise that resolves to an array of paths to the generated images.
 */
export const convertPdfToImages = async (
  pdfPath: string,
  startPage: number,
  endPage: number,
): Promise<string[]> => {
  const prefix = `page-${Date.now()}`;
  const options = {
    format: "png",
    out_dir: tempDir,
    out_prefix: prefix,
    // Use the -f and -l flags to specify the page range
    f: startPage,
    l: endPage,
  };

  try {
    // pdf-poppler's 'convert' function was changed to 'pdfToImg' in some versions.
    // We will use 'convert' as it is in the original code, but this is a common source of error.
    await pdf.convert(pdfPath, options);
  } catch (error) {
    console.error("PDF conversion failed:", error);
    throw new Error(
      "PDF to image conversion failed. Ensure Poppler is installed and compatible.",
    );
  }

  // Generate the expected filenames based on the prefix and page range
  const generatedFiles: string[] = [];
  for (let i = startPage; i <= endPage; i++) {
    // The filename format depends on the number of total pages (e.g., page-01, page-1)
    // This is a simplification. A more robust solution would read the directory
    // and match the prefix, but this is faster if the naming is predictable.
    const paddedPage = i.toString(); // pdf-poppler might pad with zeros, e.g., '01', '02'
    const filePath = path.join(tempDir, `${prefix}-${paddedPage}.png`);

    // We check if the file exists because readdirSync is slow and this is more direct.
    // This part can be tricky as poppler's output format can vary.
    if (fs.existsSync(filePath)) {
      generatedFiles.push(filePath);
    }
  }

  // Fallback to reading the directory if direct matching fails
  if (generatedFiles.length !== endPage - startPage + 1) {
    const files = fs
      .readdirSync(tempDir)
      .filter((file) => file.startsWith(prefix) && file.endsWith(".png"))
      .map((file) => path.join(tempDir, file));

    if (files.length === 0) {
      // It's possible poppler is still working. We could add a small delay and retry.
      // For now, we'll throw.
      throw new Error(
        `No images were generated for pages ${startPage}-${endPage}.`,
      );
    }
    return files;
  }

  return generatedFiles;
};

export const cleanupFiles = (files: string[]) => {
  files.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  });
};
