import ExcelJS from "exceljs";
import path from "path";

const outputDir = path.join(process.cwd(), "uploads");

const COLUMN_ORDER = [
  "Sl No.",
  "Ward No.",
  "House Number",
  "Full Name",
  "Father/Spouse Name",
  "Gender",
  "Card Number",
  "Detail Code",
] as const;

export const generateExcelFile = async (record: any): Promise<string> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Voter List Extractor";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Voter List", {
    properties: { defaultColWidth: 18, defaultRowHeight: 20 },
    pageSetup: { paperSize: 9, orientation: "landscape" }, // A4 landscape
  });

  // 1. Add header row
  const headerRow = worksheet.addRow(COLUMN_ORDER);
  headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E88E5" },
  };
  headerRow.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  headerRow.height = 30;

  // 2. Set column widths
  worksheet.columns = COLUMN_ORDER.map((header) => ({
    header,
    key: header, // Use header as key for direct mapping
    width: header.includes("Name") || header.includes("Number") ? 35 : 18, // wider for names and numbers
  }));

  // 3. Add data rows directly
  const extractedRows = record.extractedData || [];

  if (extractedRows.length === 0) {
    worksheet.addRow(["No data extracted"]).font = {
      italic: true,
      color: { argb: "FF888888" },
    };
  } else {
    extractedRows.forEach((rowData: any, index: number) => {
      const rowValues = COLUMN_ORDER.map((header) => rowData[header] || "");
      const dataRow = worksheet.addRow(rowValues);

      // Optional: light zebra striping
      if (index % 2 === 0) {
        dataRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F9FF" },
        };
      }

      dataRow.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      dataRow.height = 24;
    });
  }

  // 4. Add title / metadata at top
  worksheet.spliceRows(1, 0, [`Voter List – ${record?.fileName}`]);
  worksheet.getRow(1).font = { bold: true, size: 14 };
  worksheet.getRow(1).height = 35;
  worksheet.mergeCells(`A1:${String.fromCharCode(64 + COLUMN_ORDER.length)}1`); // Merge based on actual column count

  // Freeze header rows
  worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];

  // 5. Save file
  const excelFileName = `voterlist-${record?._id.toString()}-${Date.now()}.xlsx`;
  const outputPath = path.join(outputDir, excelFileName);

  await workbook.xlsx.writeFile(outputPath);

  return excelFileName;
};
