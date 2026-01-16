import { Schema, model, Document, Types } from "mongoose";

interface IExtractedField {
  value: string | number | Date | null;
  confidence: number;
}

interface ITableCell {
  row: number; // row index (usually starts from 1)
  col: number; // column index (usually starts from 1)
  text: string; // the extracted text
  label: string; // field name / column name e.g. "Voter_ID", "Age"
  confidence?: number; // per-cell or per-prediction confidence
  verification_status?: string; // from NanoNets e.g. "correctly_predicted"
}

interface IExtractedTable {
  cells: ITableCell[];
  rowCount?: number; // optional - max row number
  columnCount?: number; // optional - max col number or number of unique labels
  page?: number; // if multi-page PDF → which page this table came from
}

export interface IRecord extends Document {
  _id: Types.ObjectId; // Mongoose auto-generates this
  fileName: string;
  extractedData?: Map<string, IExtractedField>; // ← legacy / form-like fields (optional now)
  extractedTable?: IExtractedTable; // ← main tabular data (voter list, etc.)
  rawOcrResult?: any; // optional – for debugging only (can be large)
  createdAt?: Date;
  updatedAt?: Date;
}

const ExtractedFieldSchema = new Schema(
  {
    value: { type: Schema.Types.Mixed, required: true },
    confidence: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const TableCellSchema = new Schema(
  {
    row: { type: Number, required: true, min: 1 },
    col: { type: Number, required: true, min: 1 },
    text: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    confidence: { type: Number, min: 0, max: 1, default: 0 },
    verification_status: { type: String, default: "" },
  },
  { _id: false }
);

const ExtractedTableSchema = new Schema(
  {
    cells: { type: [TableCellSchema], required: true, default: [] },
    rowCount: { type: Number, min: 0 },
    columnCount: { type: Number, min: 0 },
    page: { type: Number, min: 0 },
  },
  { _id: false }
);

const RecordSchema = new Schema<IRecord>(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },

    extractedData: {
      type: Map,
      of: ExtractedFieldSchema,
      default: () => new Map(),
    },

    extractedTable: {
      type: ExtractedTableSchema,
      default: null,
    },

    // Optional: store raw response from NanoNets (useful during development / debugging)
    rawOcrResult: {
      type: Schema.Types.Mixed,
      default: null,
      select: false, // exclude from queries by default (large field)
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // auto manages createdAt + updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Optional: virtual for convenience (max row)
RecordSchema.virtual("tableRowCount").get(function (this: IRecord) {
  if (!this.extractedTable?.cells?.length) return 0;
  return Math.max(...this.extractedTable.cells.map((c) => c.row));
});

export const Record = model<IRecord>("Record", RecordSchema);
