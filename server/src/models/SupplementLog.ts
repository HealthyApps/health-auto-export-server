import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISupplementLog extends Document {
  supplement_id: Types.ObjectId;
  inventory_id?: Types.ObjectId;
  dose_quantity: number;
  slot: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SLOTS = ['morning', 'noon', 'night', 'other'] as const;

const SupplementLogSchema = new Schema(
  {
    supplement_id: { type: Schema.Types.ObjectId, ref: 'Supplement', required: true },
    inventory_id: { type: Schema.Types.ObjectId, ref: 'SupplementInventory', required: false },
    dose_quantity: { type: Number, required: true, min: 0 },
    slot: { type: String, required: true, enum: SLOTS },
    timestamp: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  },
);

SupplementLogSchema.index({ timestamp: -1 });
SupplementLogSchema.index({ supplement_id: 1, timestamp: -1 });
SupplementLogSchema.index({ slot: 1, timestamp: -1 });

export const SupplementLogModel = mongoose.model<ISupplementLog>('SupplementLog', SupplementLogSchema, 'supplement_logs');
