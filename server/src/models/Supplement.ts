import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplement extends Document {
  name: string;
  default_dose: number;
  dose_unit: string;
  category: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DOSE_UNITS = ['mg', 'mcg', 'g', 'iu', 'capsule', 'tablet', 'ml', 'drop', 'scoop'] as const;
const CATEGORIES = ['vitamin', 'mineral', 'amino_acid', 'herb', 'probiotic', 'omega', 'other'] as const;

const SupplementSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    default_dose: { type: Number, required: true, min: 0 },
    dose_unit: { type: String, required: true, enum: DOSE_UNITS },
    category: { type: String, required: true, enum: CATEGORIES },
    active: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
  },
);

SupplementSchema.index({ active: 1, name: 1 });

export const SupplementModel = mongoose.model<ISupplement>('Supplement', SupplementSchema, 'supplements');
