import { Request, Response } from 'express';

import { SupplementInventoryModel } from '../models/SupplementInventory';

export const createInventory = async (req: Request, res: Response) => {
  try {
    const { supplement_id, quantity_purchased, unit_cost, purchase_date } = req.body;

    if (!supplement_id) {
      return res.status(400).json({ error: 'supplement_id is required' });
    }
    if (!quantity_purchased) {
      return res.status(400).json({ error: 'quantity_purchased is required' });
    }
    if (unit_cost === undefined) {
      return res.status(400).json({ error: 'unit_cost is required' });
    }
    if (!purchase_date) {
      return res.status(400).json({ error: 'purchase_date is required' });
    }

    const inventory = new SupplementInventoryModel({
      ...req.body,
      pills_remaining: quantity_purchased,
    });
    const saved = await inventory.save();

    res.status(201).json(saved);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creating inventory:', error);
    res.status(500).json({ error: 'Error creating inventory record' });
  }
};

export const getInventory = async (req: Request, res: Response) => {
  try {
    const { supplement_id, active, low_stock } = req.query;
    const query: Record<string, unknown> = {};

    if (supplement_id) {
      query.supplement_id = supplement_id;
    }
    if (active !== undefined) {
      query.active = active === 'true';
    }
    if (low_stock === 'true') {
      query.active = true;
      query.pills_remaining = { $gt: 0, $lte: 10 };
    }

    const inventory = await SupplementInventoryModel.find(query)
      .populate('supplement_id', 'name default_dose dose_unit category')
      .sort({ purchase_date: -1 })
      .lean();

    res.status(200).json(inventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Error fetching inventory' });
  }
};

export const getInventoryById = async (req: Request, res: Response) => {
  try {
    const record = await SupplementInventoryModel.findById(req.params.id)
      .populate('supplement_id', 'name default_dose dose_unit category')
      .lean();

    if (!record) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }
    res.status(200).json(record);
  } catch (error) {
    console.error('Error fetching inventory record:', error);
    res.status(500).json({ error: 'Error fetching inventory record' });
  }
};

export const updateInventory = async (req: Request, res: Response) => {
  try {
    const updated = await SupplementInventoryModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }
    res.status(200).json(updated);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error updating inventory:', error);
    res.status(500).json({ error: 'Error updating inventory record' });
  }
};

export const deleteInventory = async (req: Request, res: Response) => {
  try {
    const deleted = await SupplementInventoryModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }
    res.status(200).json({ deleted: true });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    res.status(500).json({ error: 'Error deleting inventory record' });
  }
};
