import path from "path";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);

const tempDir = path.join(process.cwd(), "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

/**
 * Gets the total number of pages in a PDF file using pdfinfo.
 * This is a fast operation that only reads the PDF metadata.
 */
export const getPdfPageCount = async (pdfPath: string): Promise<number> => {
  try {
    // The command returns metadata. We grep for the 'Pages' line.
    const command = `pdfinfo "${pdfPath}" | grep "Pages:"`;
    const { stdout } = await execAsync(command);
    const pagesMatch = stdout.match(/Pages:\s*(\d+)/);
    if (!pagesMatch || !pagesMatch[1]) {
      throw new Error("Could not parse page count from pdfinfo output.");
    }
    return parseInt(pagesMatch[1], 10);
  } catch (error) {
    console.error("Failed to get PDF info with pdfinfo:", error);
    throw new Error("Failed to get PDF page count.");
  }
};

/**
 * Converts a range of pages from a PDF into PNG images using pdftocairo.
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
  // Generate a unique prefix for the output files to avoid collisions.
  const outputPrefix = path.join(tempDir, `page-${Date.now()}`);

  // pdftocairo is used as it's modern and handles PNGs well.
  // The command syntax is: pdftocairo [options] <PDF-file> <output-prefix>
  // The output files will be named <output-prefix>-<page_number>.png
  const command = `pdftocairo -png -f ${startPage} -l ${endPage} "${pdfPath}" "${outputPrefix}"`;

  try {
    await execAsync(command);
  } catch (error) {
    console.error("PDF conversion with pdftocairo failed:", error);
    throw new Error(
      "PDF to image conversion failed. Ensure poppler-utils is installed.",
    );
  }

  // Find the generated files by looking for the prefix.
  const generatedFiles: string[] = [];
  const filesInTemp = fs.readdirSync(tempDir);
  const basePrefix = path.basename(outputPrefix);

  for (const file of filesInTemp) {
    if (file.startsWith(basePrefix) && file.endsWith(".png")) {
      generatedFiles.push(path.join(tempDir, file));
    }
  }

  if (generatedFiles.length === 0) {
    // This can happen if the process fails silently or there's a permission issue.
    throw new Error(
      `No images were generated for pages ${startPage}-${endPage}.`,
    );
  }

  return generatedFiles;
};

/**
 * Deletes an array of files.
 * @param files The array of file paths to delete.
 */
export const cleanupFiles = (files: string[]) => {
  files.forEach((file) => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
      } catch (error) {
        console.error(`Failed to delete file: ${file}`, error);
      }
    }
  });
};
