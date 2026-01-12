import mongoose, { Schema, Document } from 'mongoose';

interface IQuantityMetric {
  qty: number;
  date: Date;
  units: string;
  source: string;
}

interface IMeasurement {
  qty: number;
  units: string;
  date: Date;
  source: string;
}

interface IHeartRate extends IMeasurement {
  Min: number;
  Avg: number;
  Max: number;
  date: Date;
  units: string;
  source: string;
}

interface ILocation {
  latitude: number;
  longitude: number;
  course: number;
  courseAccuracy: number;
  speed: number;
  speedAccuracy: number;
  altitude: number;
  verticalAccuracy: number;
  horizontalAccuracy: number;
  timestamp: Date;
}

interface IRoute {
  workoutId: string;
  locations: ILocation[];
}

export interface WorkoutData {
  id: string;
  name: string;
  start: Date;
  end: Date;
  duration: number;
  // --- Optional fields ---
  distance?: IMeasurement;
  activeEnergyBurned?: IMeasurement;
  activeEnergy?: IQuantityMetric;
  heartRateData?: IHeartRate[];
  heartRateRecovery?: IHeartRate[];
  stepCount?: IQuantityMetric[];
  temperature?: IMeasurement;
  humidity?: IMeasurement;
  intensity?: IMeasurement;
  route?: ILocation[];
}

interface IWorkout extends Document, Omit<WorkoutData, 'id' | 'route'> {
  workoutId: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuantityMetricSchema = new Schema<IQuantityMetric>(
  {
    qty: { type: Number, required: true, min: 0 },
    units: { type: String, required: true },
    date: { type: Date, required: true },
    source: { type: String, required: true },
  },
  { _id: false },
);

const HeartRateSchema = new Schema<IHeartRate>(
  {
    Min: { type: Number, required: true, min: 0 },
    Avg: { type: Number, required: true, min: 0 },
    Max: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    units: { type: String, required: true },
    source: { type: String, required: true },
  },
  { _id: false },
);

const WorkoutSchema = new Schema(
  {
    workoutId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    // --- Optional fields ---
    activeEnergyBurned: {
      type: QuantityMetricSchema,
      required: true,
    },
    distance: {
      type: QuantityMetricSchema,
      required: false,
      min: 0,
    },
    activeEnergy: {
      type: QuantityMetricSchema,
      required: false,
    },
    heartRateData: {
      type: [HeartRateSchema],
      required: false,
    },
    heartRateRecovery: {
      type: [HeartRateSchema],
      required: false,
    },
    stepCount: {
      type: [QuantityMetricSchema],
      required: false,
    },
    temperature: {
      type: QuantityMetricSchema,
      required: false,
    },
    humidity: {
      type: QuantityMetricSchema,
      required: false,
    },
    intensity: {
      type: QuantityMetricSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

const locationSchema = new Schema<ILocation>(
  {
    // Required fields
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    // Optional fields
    course: { type: Number, required: false },
    courseAccuracy: { type: Number, required: false },
    speed: { type: Number, required: false },
    speedAccuracy: { type: Number, required: false },
    altitude: { type: Number, required: false },
    verticalAccuracy: { type: Number, required: false },
    horizontalAccuracy: { type: Number, required: false },
  },
  { _id: false },
);

const routeSchema = new Schema<IRoute>(
  {
    workoutId: { type: String, required: true },
    locations: {
      type: [locationSchema],
      required: true,
      validate: {
        validator: function (array: ILocation[]) {
          return array.length > 0;
        },
        message: 'Locations array must contain at least one point',
      },
    },
  },
  { timestamps: true },
);

export function mapWorkoutData(data: WorkoutData) {
  const { id, ...rest } = data;

  rest.start = new Date(rest.start);
  rest.end = new Date(rest.end);

  return {
    workoutId: id,
    ...rest,
  };
}

export function mapRoute(data: WorkoutData) {
  return {
    workoutId: data.id,
    locations: data.route?.map((loc) => ({
      ...loc,
      timestamp: new Date(loc.timestamp),
    })),
  };
}

// Safely create or retrieve models to avoid "Cannot overwrite model" error
export const WorkoutModel = mongoose.models.Workout || 
  mongoose.model<IWorkout>('Workout', WorkoutSchema, 'workouts');

export const RouteModel = mongoose.models.Route || 
  mongoose.model<IRoute>('Route', routeSchema, 'workout_routes');
