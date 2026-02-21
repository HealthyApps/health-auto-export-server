import mongoose, { Schema, Document, Types } from 'mongoose';

export type StackStatus = 'active' | 'scheduled' | 'expired' | 'inactive';

export interface IStackEntry {
  supplement_id: Types.ObjectId;
  dose_quantity: number;
}

export interface IDaySlots {
  morning: IStackEntry[];
  noon: IStackEntry[];
  night: IStackEntry[];
}

export interface ISupplementStack extends Document {
  name: string;
  status: StackStatus;
  startsAt: Date | null;
  durationWeeks: number | null;
  monday: IDaySlots;
  tuesday: IDaySlots;
  wednesday: IDaySlots;
  thursday: IDaySlots;
  friday: IDaySlots;
  saturday: IDaySlots;
  sunday: IDaySlots;
  createdAt: Date;
  updatedAt: Date;
}

const StackEntrySchema = new Schema<IStackEntry>(
  {
    supplement_id: { type: Schema.Types.ObjectId, ref: 'Supplement', required: true },
    dose_quantity: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const DaySlotsSchema = new Schema<IDaySlots>(
  {
    morning: { type: [StackEntrySchema], default: [] },
    noon: { type: [StackEntrySchema], default: [] },
    night: { type: [StackEntrySchema], default: [] },
  },
  { _id: false },
);

const emptyDay = { morning: [], noon: [], night: [] };

const SupplementStackSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['active', 'scheduled', 'expired', 'inactive'],
      required: true,
      default: 'active',
    },
    startsAt: { type: Date, default: null },
    durationWeeks: { type: Number, default: null, min: 1 },
    monday: { type: DaySlotsSchema, default: () => ({ ...emptyDay }) },
    tuesday: { type: DaySlotsSchema, default: () => ({ ...emptyDay }) },
    wednesday: { type: DaySlotsSchema, default: () => ({ ...emptyDay }) },
    thursday: { type: DaySlotsSchema, default: () => ({ ...emptyDay }) },
    friday: { type: DaySlotsSchema, default: () => ({ ...emptyDay }) },
    saturday: { type: DaySlotsSchema, default: () => ({ ...emptyDay }) },
    sunday: { type: DaySlotsSchema, default: () => ({ ...emptyDay }) },
  },
  {
    timestamps: true,
  },
);

SupplementStackSchema.index({ status: 1 });

export const SupplementStackModel = mongoose.model<ISupplementStack>('SupplementStack', SupplementStackSchema, 'supplement_stacks');
