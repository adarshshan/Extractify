import ExcelJS from "exceljs";
import path from "path";

const outputDir = path.join(process.cwd(), "uploads");

const COLUMN_ORDER = [
  "Age",
  "Date",
  "Gender",
  "House_Number",
  "Voter's_Full_Name",
  "Serial_No.",
  "Relative's_Name",
  "Voter_ID",
] as const;

type ColumnLabel = (typeof COLUMN_ORDER)[number];

export const generateExcelFile = async (record: any): Promise<string> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Voter List Extractor";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Voter List", {
    properties: { defaultColWidth: 18, defaultRowHeight: 20 },
    pageSetup: { paperSize: 9, orientation: "landscape" }, // A4 landscape
  });

  // ── 1. Add header row ────────────────────────────────────────
  const headerRow = worksheet.addRow(COLUMN_ORDER);
  headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E88E5" }, // nice blue
  };
  headerRow.alignment = {
    horizontal: "center",
    vertical: "middle",
    wrapText: true,
  };
  headerRow.height = 30;

  // ── 2. Set column widths ─────────────────────────────────────
  worksheet.columns = COLUMN_ORDER.map((header, index) => ({
    header,
    key: `col${index + 1}`,
    width: header.includes("Name") ? 35 : 18, // wider for names
  }));

  // ── 3. Group cells by row ────────────────────────────────────
  const cells = record.extractedTable?.cells || [];

  if (cells.length === 0) {
    worksheet.addRow(["No data extracted"]).font = {
      italic: true,
      color: { argb: "FF888888" },
    };
    // still generate file so user gets something
  } else {
    const rowsMap = new Map<number, Map<number, string>>();

    cells.forEach((cell: any) => {
      if (!rowsMap.has(cell.row)) {
        rowsMap.set(cell.row, new Map());
      }
      rowsMap.get(cell.row)!.set(cell.col, cell.text?.trim() || "");
    });

    // Find highest row number (safety fallback if virtual is not used)
    const maxRow = Math.max(...rowsMap.keys(), 0);

    // ── 4. Add data rows in order ──────────────────────────────
    for (let rowNum = 1; rowNum <= maxRow; rowNum++) {
      const rowCells = rowsMap.get(rowNum) || new Map<number, string>();

      const rowValues = COLUMN_ORDER.map((label, idx) => {
        // Option A: Assume column index matches label order (most stable for your case)
        const expectedCol = idx + 1;
        return rowCells.get(expectedCol) || "";

        // Option B: Match by label (more flexible if columns ever reorder)
        // for (const [col, text] of rowCells.entries()) {
        //   if (/* match label somehow */) return text;
        // }
        // return "";
      });

      const dataRow = worksheet.addRow(rowValues);

      // Optional: light zebra striping
      if (rowNum % 2 === 0) {
        dataRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF5F9FF" }, // very light blue
        };
      }

      dataRow.alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };
      dataRow.height = 24;
    }
  }

  // ── 5. Add title / metadata at top (optional) ────────────────
  worksheet.spliceRows(1, 0, [`Voter List – ${record.fileName}`]);
  worksheet.getRow(1).font = { bold: true, size: 14 };
  worksheet.getRow(1).height = 35;
  worksheet.mergeCells("A1:H1");

  // Freeze header rows
  worksheet.views = [{ state: "frozen", xSplit: 0, ySplit: 2 }];

  // ── 6. Save file ─────────────────────────────────────────────
  const excelFileName = `voterlist-${record._id.toString()}-${Date.now()}.xlsx`;
  const outputPath = path.join(outputDir, excelFileName);

  await workbook.xlsx.writeFile(outputPath);

  return excelFileName;
};
