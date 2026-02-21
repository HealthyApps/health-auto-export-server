import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISupplementInventory extends Document {
  supplement_id: Types.ObjectId;
  brand?: string;
  quantity_purchased: number;
  pills_remaining: number;
  unit_cost: number;
  purchase_date: Date;
  expiration_date?: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplementInventorySchema = new Schema(
  {
    supplement_id: { type: Schema.Types.ObjectId, ref: 'Supplement', required: true },
    brand: { type: String, trim: true },
    quantity_purchased: { type: Number, required: true, min: 1 },
    pills_remaining: { type: Number, required: true, min: 0 },
    unit_cost: { type: Number, required: true, min: 0 },
    purchase_date: { type: Date, required: true },
    expiration_date: { type: Date, required: false },
    active: { type: Boolean, required: true, default: true },
  },
  {
    timestamps: true,
  },
);

SupplementInventorySchema.index({ supplement_id: 1, active: 1, purchase_date: 1 });
SupplementInventorySchema.index({ active: 1, pills_remaining: 1 });

export const SupplementInventoryModel = mongoose.model<ISupplementInventory>('SupplementInventory', SupplementInventorySchema, 'supplement_inventory');
