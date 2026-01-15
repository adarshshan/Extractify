import { Schema, model, Document } from 'mongoose';

interface IExtractedField {
  value: string | number | Date;
  confidence: number;
}

export interface IRecord extends Document {
  fileName: string;
  extractedData: {
    invoiceNumber?: IExtractedField;
    invoiceDate?: IExtractedField;
    totalAmount?: IExtractedField;
    [key: string]: any; // Allow for other dynamic fields
  };
  createdAt: Date;
}

const ExtractedFieldSchema = new Schema({
  value: { type: Schema.Types.Mixed, required: true },
  confidence: { type: Number, required: true },
}, { _id: false });

const RecordSchema = new Schema<IRecord>({
  fileName: { type: String, required: true },
  extractedData: {
    type: Map,
    of: ExtractedFieldSchema,
  },
  createdAt: { type: Date, default: Date.now },
});

export const Record = model<IRecord>('Record', RecordSchema);
