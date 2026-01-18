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
  medicationId: string; // Computed: prefers RxNorm code, then sorted codings, then displayText
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
    medicationId: { type: String, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    displayText: { type: String, required: true },
    status: { type: String, required: true },
    dosage: { type: Number, required: true },
    units: { type: String, required: true },
    isArchived: { type: Boolean, required: true },
    codings: { type: [CodingSchema], required: false },
    scheduledDosage: { type: Number, required: false },
    scheduledDate: { type: Date, required: false },
  },
  { timestamps: true },
);

// Unique index on medicationId + start time to prevent duplicate dose logs
MedicationSchema.index(
  { medicationId: 1, start: 1 },
  { unique: true },
);

const RXNORM_SYSTEM = 'http://www.nlm.nih.gov/research/umls/rxnorm';

// Returns the medication identifier, preferring RxNorm code for stability
// when multiple coding systems are present (order may vary between syncs)
export function getMedicationId(data: MedicationData): string {
  if (!data.codings?.length) {
    return data.displayText;
  }

  // Prefer RxNorm coding for consistent identification
  const rxnorm = data.codings.find((c) => c.system === RXNORM_SYSTEM);
  if (rxnorm) {
    return rxnorm.code;
  }

  // Fall back to first coding, sorted by system for stability
  const sorted = [...data.codings].sort((a, b) => a.system.localeCompare(b.system));
  return sorted[0].code;
}

export function mapMedicationData(data: MedicationData) {
  return {
    medicationId: getMedicationId(data),
    start: new Date(data.start),
    end: new Date(data.end),
    displayText: data.displayText,
    status: data.status,
    dosage: data.dosage,
    units: data.units,
    isArchived: data.isArchived,
    codings: data.codings || [],
    scheduledDosage: data.scheduledDosage,
    scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
  };
}

export const MedicationModel = mongoose.model<IMedication>(
  'Medication',
  MedicationSchema,
  'medications',
);
