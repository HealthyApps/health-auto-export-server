import mongoose, { Schema, Document } from 'mongoose';

export interface IWorkoutLogExerciseSet {
  set_number: number;
  reps: number;
  weight: number;
  weight_unit: string;
  rpe?: number;
  notes?: string;
}

export interface IWorkoutLogExercise {
  name: string;
  category: string;
  sets: IWorkoutLogExerciseSet[];
  notes?: string;
}

export interface IWorkoutLog extends Document {
  date: Date;
  day_type: string;
  exercises: IWorkoutLogExercise[];
  energy_level?: number;
  soreness_level?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DAY_TYPES = ['push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'cardio', 'rest', 'other'] as const;
const CATEGORIES = ['compound', 'isolation', 'bodyweight', 'cardio', 'stretching', 'other'] as const;

const ExerciseSetSchema = new Schema<IWorkoutLogExerciseSet>(
  {
    set_number: { type: Number, required: true, min: 1 },
    reps: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 0 },
    weight_unit: { type: String, required: true },
    rpe: { type: Number, required: false, min: 1, max: 10 },
    notes: { type: String, required: false },
  },
  { _id: false },
);

const ExerciseSchema = new Schema<IWorkoutLogExercise>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true, enum: CATEGORIES },
    sets: { type: [ExerciseSetSchema], required: true },
    notes: { type: String, required: false },
  },
  { _id: false },
);

const WorkoutLogSchema = new Schema(
  {
    date: { type: Date, required: true },
    day_type: { type: String, required: true, enum: DAY_TYPES },
    exercises: { type: [ExerciseSchema], required: true },
    energy_level: { type: Number, required: false, min: 1, max: 10 },
    soreness_level: { type: Number, required: false, min: 1, max: 10 },
    notes: { type: String, required: false },
  },
  {
    timestamps: true,
  },
);

WorkoutLogSchema.index({ date: -1 });
WorkoutLogSchema.index({ day_type: 1, date: -1 });
WorkoutLogSchema.index({ 'exercises.name': 1, date: -1 });

export const WorkoutLogModel = mongoose.model<IWorkoutLog>('WorkoutLog', WorkoutLogSchema, 'workout_logs');
