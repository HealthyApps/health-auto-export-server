import { Request, Response } from 'express';

import { SupplementStackModel } from '../models/SupplementStack';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export const getAllStacks = async (req: Request, res: Response) => {
  try {
    const stacks = await SupplementStackModel.find({})
      .select('name active createdAt updatedAt')
      .sort({ active: -1, name: 1 })
      .lean();

    res.status(200).json(stacks);
  } catch (error) {
    console.error('Error fetching all stacks:', error);
    res.status(500).json({ error: 'Error fetching supplement stacks' });
  }
};

export const deleteStack = async (req: Request, res: Response) => {
  try {
    const stack = await SupplementStackModel.findById(req.params.id);
    if (!stack) {
      return res.status(404).json({ error: 'Stack not found' });
    }
    if (stack.active) {
      return res.status(400).json({ error: 'Cannot delete the active stack' });
    }
    await SupplementStackModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ deleted: true });
  } catch (error) {
    console.error('Error deleting stack:', error);
    res.status(500).json({ error: 'Error deleting supplement stack' });
  }
};

export const getStack = async (req: Request, res: Response) => {
  try {
    const stack = await SupplementStackModel.findOne({ active: true })
      .populate('monday.morning.supplement_id monday.noon.supplement_id monday.night.supplement_id', 'name dose_unit category')
      .populate('tuesday.morning.supplement_id tuesday.noon.supplement_id tuesday.night.supplement_id', 'name dose_unit category')
      .populate('wednesday.morning.supplement_id wednesday.noon.supplement_id wednesday.night.supplement_id', 'name dose_unit category')
      .populate('thursday.morning.supplement_id thursday.noon.supplement_id thursday.night.supplement_id', 'name dose_unit category')
      .populate('friday.morning.supplement_id friday.noon.supplement_id friday.night.supplement_id', 'name dose_unit category')
      .populate('saturday.morning.supplement_id saturday.noon.supplement_id saturday.night.supplement_id', 'name dose_unit category')
      .populate('sunday.morning.supplement_id sunday.noon.supplement_id sunday.night.supplement_id', 'name dose_unit category')
      .lean();

    if (!stack) {
      return res.status(404).json({ error: 'No active stack found' });
    }

    res.status(200).json(stack);
  } catch (error) {
    console.error('Error fetching stack:', error);
    res.status(500).json({ error: 'Error fetching supplement stack' });
  }
};

export const getToday = async (req: Request, res: Response) => {
  try {
    const tz = (req.query.tz as string) || Intl.DateTimeFormat().resolvedOptions().timeZone;

    let now: Date;
    try {
      const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' });
      now = new Date();
      var dayName = formatter.format(now).toLowerCase() as typeof DAYS[number];
    } catch {
      now = new Date();
      dayName = DAYS[now.getDay()];
    }

    const stack = await SupplementStackModel.findOne({ active: true }).lean();
    if (!stack) {
      return res.status(404).json({ error: 'No active stack found' });
    }

    const todaySlots = (stack as any)[dayName];
    if (!todaySlots) {
      return res.status(200).json({ day: dayName, morning: [], noon: [], night: [] });
    }

    // Populate supplement names
    const SupplementModel = (await import('../models/Supplement')).SupplementModel;
    const allIds = [
      ...todaySlots.morning.map((e: any) => e.supplement_id),
      ...todaySlots.noon.map((e: any) => e.supplement_id),
      ...todaySlots.night.map((e: any) => e.supplement_id),
    ];

    const supplements = await SupplementModel.find({ _id: { $in: allIds } })
      .select('name dose_unit category')
      .lean();

    const supplementMap = new Map(supplements.map((s) => [s._id.toString(), s]));

    const enrich = (entries: any[]) =>
      entries.map((e: any) => ({
        ...e,
        supplement: supplementMap.get(e.supplement_id.toString()) || null,
      }));

    res.status(200).json({
      day: dayName,
      morning: enrich(todaySlots.morning),
      noon: enrich(todaySlots.noon),
      night: enrich(todaySlots.night),
    });
  } catch (error) {
    console.error('Error fetching today stack:', error);
    res.status(500).json({ error: 'Error fetching today stack' });
  }
};

export const updateStack = async (req: Request, res: Response) => {
  try {
    const { name, monday, tuesday, wednesday, thursday, friday, saturday, sunday } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    // Deactivate any existing active stacks
    await SupplementStackModel.updateMany({ active: true }, { active: false });

    const stack = await SupplementStackModel.findOneAndUpdate(
      { name },
      {
        name,
        active: true,
        monday: monday || { morning: [], noon: [], night: [] },
        tuesday: tuesday || { morning: [], noon: [], night: [] },
        wednesday: wednesday || { morning: [], noon: [], night: [] },
        thursday: thursday || { morning: [], noon: [], night: [] },
        friday: friday || { morning: [], noon: [], night: [] },
        saturday: saturday || { morning: [], noon: [], night: [] },
        sunday: sunday || { morning: [], noon: [], night: [] },
      },
      { upsert: true, new: true, runValidators: true },
    );

    res.status(200).json(stack);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error updating stack:', error);
    res.status(500).json({ error: 'Error updating supplement stack' });
  }
};
