import { Request, Response } from 'express';

import { SupplementModel } from '../models/Supplement';

export const createSupplement = async (req: Request, res: Response) => {
  try {
    const { name, default_dose, dose_unit, category } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (default_dose === undefined) {
      return res.status(400).json({ error: 'default_dose is required' });
    }
    if (!dose_unit) {
      return res.status(400).json({ error: 'dose_unit is required' });
    }
    if (!category) {
      return res.status(400).json({ error: 'category is required' });
    }

    const supplement = new SupplementModel(req.body);
    const saved = await supplement.save();

    res.status(201).json(saved);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Error && (error as any).code === 11000) {
      return res.status(409).json({ error: 'A supplement with that name already exists' });
    }
    console.error('Error creating supplement:', error);
    res.status(500).json({ error: 'Error creating supplement' });
  }
};

export const getSupplements = async (req: Request, res: Response) => {
  try {
    const { active, category } = req.query;
    const query: Record<string, unknown> = {};

    if (active !== undefined) {
      query.active = active === 'true';
    }
    if (category) {
      query.category = category;
    }

    const supplements = await SupplementModel.find(query).sort({ name: 1 }).lean();
    res.status(200).json(supplements);
  } catch (error) {
    console.error('Error fetching supplements:', error);
    res.status(500).json({ error: 'Error fetching supplements' });
  }
};

export const getSupplement = async (req: Request, res: Response) => {
  try {
    const supplement = await SupplementModel.findById(req.params.id).lean();
    if (!supplement) {
      return res.status(404).json({ error: 'Supplement not found' });
    }
    res.status(200).json(supplement);
  } catch (error) {
    console.error('Error fetching supplement:', error);
    res.status(500).json({ error: 'Error fetching supplement' });
  }
};

export const updateSupplement = async (req: Request, res: Response) => {
  try {
    const updated = await SupplementModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Supplement not found' });
    }
    res.status(200).json(updated);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof Error && (error as any).code === 11000) {
      return res.status(409).json({ error: 'A supplement with that name already exists' });
    }
    console.error('Error updating supplement:', error);
    res.status(500).json({ error: 'Error updating supplement' });
  }
};

export const deleteSupplement = async (req: Request, res: Response) => {
  try {
    const updated = await SupplementModel.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true },
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Supplement not found' });
    }
    res.status(200).json(updated);
  } catch (error) {
    console.error('Error deactivating supplement:', error);
    res.status(500).json({ error: 'Error deactivating supplement' });
  }
};
