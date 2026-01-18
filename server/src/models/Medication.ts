import mongoose, { Schema, Document } from 'mongoose';

export interface MedicationCoding {
  system: string;
  version: string;
  code: string;
}

export interface MedicationData {
  start: string;
  end: string;
  displayText: string;
  status: string;
  dosage: number;
  units: string;
  isArchived: boolean;
  codings: MedicationCoding[];
  scheduledDosage?: number;
  scheduledDate?: string;
}

export interface IMedication extends Document {
  start: Date;
  end: Date;
  displayText: string;
  status: string;
  dosage: number;
  units: string;
  isArchived: boolean;
  codings: MedicationCoding[];
  scheduledDosage?: number;
  scheduledDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CodingSchema = new Schema<MedicationCoding>(
  {
    system: { type: String, required: true },
    version: { type: String, required: false },
    code: { type: String, required: true },
  },
  { _id: false },
);

const MedicationSchema = new Schema<IMedication>(
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    displayText: { type: String, required: true },
    status: { type: String, required: true },
    dosage: { type: Number, required: true },
    units: { type: String, required: true },
    isArchived: { type: Boolean, required: true },
    codings: { type: [CodingSchema], required: true },
    scheduledDosage: { type: Number, required: false },
    scheduledDate: { type: Date, required: false },
  },
  { timestamps: true },
);

// Unique index on medication code + start time to prevent duplicate dose logs
MedicationSchema.index(
  { 'codings.code': 1, start: 1 },
  { unique: true },
);

export function mapMedicationData(data: MedicationData) {
  return {
    start: new Date(data.start),
    end: new Date(data.end),
    displayText: data.displayText,
    status: data.status,
    dosage: data.dosage,
    units: data.units,
    isArchived: data.isArchived,
    codings: data.codings,
    scheduledDosage: data.scheduledDosage,
    scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
  };
}

export const MedicationModel = mongoose.model<IMedication>(
  'Medication',
  MedicationSchema,
  'medications',
);
