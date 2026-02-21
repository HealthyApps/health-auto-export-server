import { Request, Response } from 'express';

import { WorkoutLogModel } from '../models/WorkoutLog';

export const createWorkoutLog = async (req: Request, res: Response) => {
  try {
    const { date, day_type, exercises } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }
    if (!day_type) {
      return res.status(400).json({ error: 'day_type is required' });
    }
    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ error: 'exercises array is required and must not be empty' });
    }

    const workoutLog = new WorkoutLogModel(req.body);
    const saved = await workoutLog.save();

    res.status(201).json({
      id: saved._id,
      date: saved.date,
      day_type: saved.day_type,
      created_at: saved.createdAt,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error creating workout log:', error);
    res.status(500).json({ error: 'Error creating workout log' });
  }
};

export const getWorkoutLogs = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date, day_type, limit } = req.query;

    const query: Record<string, unknown> = {};

    const endDate = end_date ? new Date(end_date as string) : new Date();
    const startDate = start_date
      ? new Date(start_date as string)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    query.date = { $gte: startDate, $lte: endDate };

    if (day_type) {
      query.day_type = day_type;
    }

    const maxResults = limit ? parseInt(limit as string, 10) : 50;

    const logs = await WorkoutLogModel.find(query)
      .sort({ date: -1 })
      .limit(maxResults)
      .lean();

    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching workout logs:', error);
    res.status(500).json({ error: 'Error fetching workout logs' });
  }
};

export const getWorkoutLogSummary = async (req: Request, res: Response) => {
  try {
    const { start_date, end_date } = req.query;

    const endDate = end_date ? new Date(end_date as string) : new Date();
    const startDate = start_date
      ? new Date(start_date as string)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const dateFilter = { date: { $gte: startDate, $lte: endDate } };

    const [sessionStats, exerciseHistory] = await Promise.all([
      WorkoutLogModel.aggregate([
        { $match: dateFilter },
        { $sort: { date: -1 } },
        {
          $group: {
            _id: null,
            total_sessions: { $sum: 1 },
            active_days: { $addToSet: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
            dates: { $push: { $dateToString: { format: '%Y-%m-%d', date: '$date' } } },
          },
        },
        {
          $project: {
            _id: 0,
            total_sessions: 1,
            active_days: { $size: '$active_days' },
            dates: 1,
          },
        },
      ]),
      WorkoutLogModel.aggregate([
        { $match: dateFilter },
        { $unwind: '$exercises' },
        { $unwind: '$exercises.sets' },
        {
          $group: {
            _id: {
              name: '$exercises.name',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            },
            max_weight: { $max: '$exercises.sets.weight' },
            total_volume: {
              $sum: { $multiply: ['$exercises.sets.weight', '$exercises.sets.reps'] },
            },
            total_reps: { $sum: '$exercises.sets.reps' },
          },
        },
        {
          $group: {
            _id: '$_id.name',
            history: {
              $push: {
                date: '$_id.date',
                max_weight: '$max_weight',
                total_volume: '$total_volume',
                total_reps: '$total_reps',
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            exercise: '$_id',
            history: { $sortArray: { input: '$history', sortBy: { date: -1 } } },
          },
        },
      ]),
    ]);

    const sessionsByType = await WorkoutLogModel.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$day_type', count: { $sum: 1 } } },
      { $project: { _id: 0, day_type: '$_id', count: 1 } },
    ]);

    const stats = sessionStats[0] || { total_sessions: 0, active_days: 0, dates: [] };

    // Calculate current streak
    let streak = 0;
    if (stats.dates && stats.dates.length > 0) {
      const uniqueDates = [...new Set<string>(stats.dates)].sort().reverse();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let checkDate = today;
      for (const dateStr of uniqueDates) {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        const diffDays = Math.round((checkDate.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays <= 1) {
          streak++;
          checkDate = d;
        } else {
          break;
        }
      }
    }

    res.status(200).json({
      total_sessions: stats.total_sessions,
      active_days: stats.active_days,
      current_streak: streak,
      sessions_by_type: sessionsByType,
      exercise_history: exerciseHistory,
    });
  } catch (error) {
    console.error('Error fetching workout log summary:', error);
    res.status(500).json({ error: 'Error fetching workout log summary' });
  }
};

export const updateWorkoutLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const updated = await WorkoutLogModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Workout log not found' });
    }

    res.status(200).json(updated);
  } catch (error) {
    if (error instanceof Error && error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error updating workout log:', error);
    res.status(500).json({ error: 'Error updating workout log' });
  }
};

export const deleteWorkoutLog = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await WorkoutLogModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Workout log not found' });
    }

    res.status(200).json({ deleted: true });
  } catch (error) {
    console.error('Error deleting workout log:', error);
    res.status(500).json({ error: 'Error deleting workout log' });
  }
};
