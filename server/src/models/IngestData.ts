import { MetricData } from './Metric';
import { WorkoutData } from './Workout';
import { MedicationData } from './Medication';

export interface IngestData {
  data: {
    metrics?: MetricData[];
    workouts?: WorkoutData[];
    medications?: MedicationData[];
  };
}
