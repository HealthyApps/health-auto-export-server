export interface IngestResponse {
  metrics?: {
    success: boolean;
    message?: string;
    error?: string;
  };
  workouts?: {
    success: boolean;
    message?: string;
    error?: string;
  };
  medications?: {
    success: boolean;
    message?: string;
    error?: string;
  };
}
