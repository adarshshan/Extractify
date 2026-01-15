import ExcelJS from 'exceljs';
import path from 'path';
import { IRecord } from '../models/record.model';

const outputDir = path.join(process.cwd(), 'uploads');

export const generateExcelFile = async (record: IRecord): Promise<string> => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ExtractionApp';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Extracted Data');

  // Define columns
  const columns = [
    { header: 'Field', key: 'field', width: 20 },
    { header: 'Value', key: 'value', width: 40 },
    { header: 'Confidence', key: 'confidence', width: 15 },
  ];
  worksheet.columns = columns;

  // Add rows from the record's extractedData
  const { extractedData } = record;
  
  for (const [field, data] of Object.entries(extractedData)) {
    worksheet.addRow({
        field: field,
        value: data.value,
        confidence: data.confidence.toFixed(4)
    });
  }

  // Style the header
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFDDDDDD' }
  };


  // Save the file
  const excelFileName = `report-${record.id}.xlsx`;
  const outputPath = path.join(outputDir, excelFileName);

  await workbook.xlsx.writeFile(outputPath);

  return excelFileName;
};
