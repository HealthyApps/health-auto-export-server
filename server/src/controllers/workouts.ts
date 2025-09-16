import { Request, Response } from 'express';

import { IngestData } from '../models/IngestData';
import { IngestResponse } from '../models/IngestResponse';
import { RouteModel, WorkoutModel, mapWorkoutData, mapRoute } from '../models/Workout';
import { filterFields, parseDate } from '../utils';

export const getWorkouts = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, include, exclude } = req.query;

    const fromDate = parseDate(startDate as string);
    const toDate = parseDate(endDate as string);

    console.log(fromDate, toDate);

    let query = {};

    if (fromDate && toDate) {
      query = {
        start: {
          $gte: fromDate,
          $lte: toDate,
        },
      };
    }

    const workouts = await WorkoutModel.find(query)
      .sort({ start: -1 })
      .lean()
      .then((workouts) => {
        const mappedWorkouts = workouts.map((workout) => {
          const startDate = new Date(workout.start);
          const endDate = new Date(workout.end);

          const result = {
            id: workout.workoutId,
            workout_type: workout.name,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            duration_minutes: workout.duration / 60,
            calories_burned: workout.activeEnergyBurned?.qty || null,
          };

          return result;
        });

        return mappedWorkouts;
      });

    // Process include/exclude filters if provided
    let processedWorkouts = workouts;
    if (include || exclude) {
      processedWorkouts = workouts.map(workout => filterFields(workout, include, exclude));
    }

    console.log(`${workouts.length} workouts fetched`);
    res.status(200).json(processedWorkouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Error fetching workouts' });
  }
};

export const getWorkout = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { include, exclude } = req.query;

    console.log('Fetching workout details for ID:', id);
    const workoutMetadata = await WorkoutModel.findOne({ workoutId: id })
      .lean()
      .then((workout) => {
        if (!workout) {
          return null;
        }

        const heartRateData =
          workout.heartRateData?.map((hr) => ({
            type: 'Heart Rate',
            timestamp: new Date(hr.date).toISOString(),
            value: hr.Avg,
          })) || [];

        const heartRateRecovery =
          workout.heartRateRecovery?.map((hr) => ({
            type: 'Heart Rate Recovery',
            timestamp: new Date(hr.date).toISOString(),
            value: hr.Avg,
          })) || [];

        return { heartRateData, heartRateRecovery };
      });

    if (!workoutMetadata) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    const route = await RouteModel.findOne({ workoutId: id })
      .lean()
      .then((route) => {
        return route?.locations.map((x) => {
          return {
            latitude: x.latitude,
            longitude: x.longitude,
            time: new Date(x.timestamp).toISOString(),
          };
        });
      });

    let ret = { ...workoutMetadata, route: route || [] };

    // Process include/exclude filters if provided
    if (include || exclude) {
      ret = filterFields(ret, include, exclude);
    }

    console.log(`Workout ${id} fetched with ${route?.length ?? 0} locations`);
    res.status(200).json(ret);
  } catch (error) {
    console.error('Error fetching workout details:', error);
    res.status(500).json({ error: 'Error fetching workout details' });
  }
};

export const saveWorkouts = async (ingestData: IngestData): Promise<IngestResponse> => {
  try {
    const response: IngestResponse = {};
    const workouts = ingestData.data.workouts;

    if (!workouts || !workouts.length) {
      response.workouts = {
        success: true,
        message: 'No workout data provided',
      };
      return response;
    }

    const workoutOperations = workouts.map((workout) => {
      return {
        updateOne: {
          filter: { workoutId: workout.id },
          update: {
            $set: mapWorkoutData(workout),
          },
          upsert: true,
        },
      };
    });

    const routeOperations = workouts
      .filter((workout) => workout.route && workout.route.length > 0)
      .map(mapRoute)
      .map((route) => ({
        updateOne: {
          filter: { workoutId: route.workoutId },
          update: {
            $set: route,
          },
          upsert: true,
        },
      }));

    await Promise.all([
      WorkoutModel.bulkWrite(workoutOperations),
      routeOperations.length > 0 ? RouteModel.bulkWrite(routeOperations) : Promise.resolve(),
    ]);

    response.workouts = {
      success: true,
      message: `${workoutOperations.length} Workouts and ${routeOperations.length} Routes saved successfully`,
    };

    console.debug(`Processed ${workouts.length} workouts`);

    return response;
  } catch (error) {
    console.error('Error processing workouts:', error);

    const errorResponse: IngestResponse = {};
    errorResponse.workouts = {
      success: false,
      message: 'Workouts not saved',
      error: error instanceof Error ? error.message : 'An error occurred',
    };

    return errorResponse;
  }
};
