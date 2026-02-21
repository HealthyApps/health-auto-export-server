import { Request, Response } from 'express';

import { SupplementModel } from '../models/Supplement';
import { SupplementLogModel } from '../models/SupplementLog';
import { SupplementInventoryModel } from '../models/SupplementInventory';

export const createLog = async (req: Request, res: Response) => {
  try {
    const { supplement_id, dose_quantity, slot, timestamp } = req.body;

    if (!supplement_id) {
      return res.status(400).json({ error: 'supplement_id is required' });
    }
    if (!dose_quantity) {
      return res.status(400).json({ error: 'dose_quantity is required' });
    }
    if (!slot) {
      return res.status(400).json({ error: 'slot is required' });
    }

    // Atomic FIFO decrement: find oldest active inventory with enough pills
    const inventory = await SupplementInventoryModel.findOneAndUpdate(
      { supplement_id, active: true, pills_remaining: { $gte: dose_quantity } },
      [
        { $set: { pills_remaining: { $subtract: ['$pills_remaining', dose_quantity] } } },
        { $set: { active: { $cond: { if: { $gt: [{ $subtract: ['$pills_remaining', dose_quantity] }, 0] }, then: true, else: false } } } },
      ],
      { sort: { purchase_date: 1 }, new: true },
    );

    const log = new SupplementLogModel({
      supplement_id,
      inventory_id: inventory?._id,
      dose_quantity,
      slot,
      timestamp: timestamp || new Date(),
    });
    const saved = await log.save();

    res.status(201).json({
      ...saved.toObject(),
      inventory_decremented: !!inventory,
      pills_remaining: inventory?.pills_remaining,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creating supplement log:', error);
    res.status(500).json({ error: 'Error creating supplement log' });
  }
};

export const quickLog = async (req: Request, res: Response) => {
  try {
    const { name, slot, dose_quantity, timestamp } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!slot) {
      return res.status(400).json({ error: 'slot is required' });
    }

    const supplement = await SupplementModel.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      active: true,
    });

    if (!supplement) {
      return res.status(404).json({ error: `Supplement "${name}" not found` });
    }

    const qty = dose_quantity || supplement.default_dose;

    // Atomic FIFO decrement
    const inventory = await SupplementInventoryModel.findOneAndUpdate(
      { supplement_id: supplement._id, active: true, pills_remaining: { $gte: qty } },
      [
        { $set: { pills_remaining: { $subtract: ['$pills_remaining', qty] } } },
        { $set: { active: { $cond: { if: { $gt: [{ $subtract: ['$pills_remaining', qty] }, 0] }, then: true, else: false } } } },
      ],
      { sort: { purchase_date: 1 }, new: true },
    );

    const log = new SupplementLogModel({
      supplement_id: supplement._id,
      inventory_id: inventory?._id,
      dose_quantity: qty,
      slot,
      timestamp: timestamp || new Date(),
    });
    const saved = await log.save();

    res.status(201).json({
      ...saved.toObject(),
      supplement_name: supplement.name,
      inventory_decremented: !!inventory,
      pills_remaining: inventory?.pills_remaining,
    });
  } catch (error) {
    console.error('Error quick-logging supplement:', error);
    res.status(500).json({ error: 'Error quick-logging supplement' });
  }
};

export const getLogs = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, supplement_id, slot, limit } = req.query;
    const query: Record<string, unknown> = {};

    const endDate = end_date ? new Date(end_date as string) : new Date();
    const startDate = start_date
      ? new Date(start_date as string)
      : new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    query.timestamp = { $gte: startDate, $lte: endDate };

    if (supplement_id) {
      query.supplement_id = supplement_id;
    }
    if (slot) {
      query.slot = slot;
    }

    const maxResults = limit ? parseInt(limit as string, 10) : 200;

    const logs = await SupplementLogModel.find(query)
      .populate('supplement_id', 'name dose_unit category')
      .sort({ timestamp: -1 })
      .limit(maxResults)
      .lean();

    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching supplement logs:', error);
    res.status(500).json({ error: 'Error fetching supplement logs' });
  }
};

export const deleteLog = async (req: Request, res: Response) => {
  try {
    const deleted = await SupplementLogModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Log entry not found' });
    }
    // Note: does NOT re-increment inventory (by design)
    res.status(200).json({ deleted: true });
  } catch (error) {
    console.error('Error deleting supplement log:', error);
    res.status(500).json({ error: 'Error deleting supplement log' });
  }
};
