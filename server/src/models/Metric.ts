import mongoose, { Schema, Document } from 'mongoose';

import { MetricName } from './MetricName';

export interface MetricData {
  name: string;
  units: string;
  data: Metric[];
}

export interface BaseMetric {
  qty: number;
  units: string;
  date: Date;
  source: string;
  metadata?: Record<string, string>;
}

export interface BloodPressureMetric {
  systolic: number;
  diastolic: number;
  units: string;
  date: Date;
  source: string;
  metadata?: Record<string, string>;
}

export interface HeartRateMetric {
  Min: number;
  Avg: number;
  Max: number;
  units: string;
  date: Date;
  source: string;
  metadata?: Record<string, string>;
}

export interface SleepMetric {
  date: Date;
  inBedStart: Date;
  inBedEnd: Date;
  sleepStart: Date;
  sleepEnd: Date;
  core: number;
  rem: number;
  deep: number;
  awake: number;
  inBed: number;
  units: string;
  source: string;
  metadata?: Record<string, string>;
}

export const mapMetric = (
  metric: MetricData,
): (Metric | BloodPressureMetric | SleepMetric | HeartRateMetric)[] => {
  switch (metric.name) {
    case MetricName.BLOOD_PRESSURE:
      const bpData = metric.data as BloodPressureMetric[];
      return bpData.map((measurement) => ({
        systolic: measurement.systolic,
        diastolic: measurement.diastolic,
        units: metric.units,
        date: new Date(measurement.date),
        source: measurement.source,
        metadata: measurement.metadata,
      }));
    case MetricName.HEART_RATE:
      const hrData = metric.data as HeartRateMetric[];
      return hrData.map((measurement) => ({
        Min: measurement.Min,
        Avg: measurement.Avg,
        Max: measurement.Max,
        units: metric.units,
        date: new Date(measurement.date),
        source: measurement.source,
        metadata: measurement.metadata,
      }));
    case MetricName.SLEEP_ANALYSIS:
      const sleepData = metric.data as SleepMetric[];
      return sleepData.map((measurement) => ({
        date: new Date(measurement.date),
        inBedStart: new Date(measurement.inBedStart),
        inBedEnd: new Date(measurement.inBedEnd),
        sleepStart: new Date(measurement.sleepStart),
        sleepEnd: new Date(measurement.sleepEnd),
        core: measurement.core,
        rem: measurement.rem,
        deep: measurement.deep,
        awake: measurement.awake,
        inBed: measurement.inBed,
        units: metric.units,
        source: measurement.source,
        metadata: measurement.metadata,
      }));
    default:
      const baseData = metric.data as BaseMetric[];
      return baseData.map((measurement) => ({
        qty: measurement.qty,
        units: metric.units,
        date: new Date(measurement.date),
        source: measurement.source,
        metadata: measurement.metadata,
      }));
  }
};

export type Metric = BaseMetric | BloodPressureMetric | SleepMetric | HeartRateMetric;

// Separate interfaces for documents
interface IMetric extends BaseMetric, Document {}
interface IBloodPressureMetric extends BloodPressureMetric, Document {}
interface IHeartRateMetric extends HeartRateMetric, Document {}
interface ISleepMetric extends SleepMetric, Document {}

// Base Metric Schema
const BaseMetricSchema: Schema = new Schema({
  qty: { type: Number, required: true },
  units: { type: String, required: true },
  date: { type: Date, required: true },
  source: { type: String, required: true },
  metadata: { type: Object, required: false },
});

BaseMetricSchema.index({ date: 1, source: 1 }, { unique: true });

// Blood Pressure Schema
const BloodPressureSchema: Schema = new Schema({
  systolic: { type: Number, required: true },
  diastolic: { type: Number, required: true },
  units: { type: String, required: true },
  date: { type: Date, required: true },
  source: { type: String, required: true },
  metadata: { type: Object, required: false },
});

BloodPressureSchema.index({ date: 1, source: 1 }, { unique: true });

// Heart Rate Schema
const HeartRateSchema: Schema = new Schema({
  Min: { type: Number, required: true },
  Avg: { type: Number, required: true },
  Max: { type: Number, required: true },
  units: { type: String, required: true },
  date: { type: Date, required: true },
  source: { type: String, required: true },
  metadata: { type: Object, required: false },
});

HeartRateSchema.index({ date: 1, source: 1 }, { unique: true });

// Sleep Schema
const SleepSchema: Schema = new Schema({
  date: { type: Date, required: true },
  inBedStart: { type: Date, required: true },
  inBedEnd: { type: Date, required: true },
  sleepStart: { type: Date, required: true },
  sleepEnd: { type: Date, required: true },
  core: { type: Number, required: true },
  rem: { type: Number, required: true },
  deep: { type: Number, required: true },
  awake: { type: Number, required: true },
  inBed: { type: Number, required: true },
  units: { type: String, required: true },
  source: { type: String, required: true },
  metadata: { type: Object, required: false },
});

SleepSchema.index({ date: 1, source: 1 }, { unique: true });

export const createMetricModel = (name: MetricName) => {
  const modelName = String(name);
  return mongoose.models[modelName] || mongoose.model<IMetric>(modelName, BaseMetricSchema, modelName);
};

// Safely create or retrieve models to avoid "Cannot overwrite model" error
export const BloodPressureModel = mongoose.models.BloodPressure || 
  mongoose.model<IBloodPressureMetric>(
    'BloodPressure',
    BloodPressureSchema,
    'blood_pressure',
  );

export const HeartRateModel = mongoose.models.HeartRate ||
  mongoose.model<IHeartRateMetric>(
    'HeartRate',
    HeartRateSchema,
    'heart_rate',
  );

export const SleepModel = mongoose.models.SleepAnalysis ||
  mongoose.model<ISleepMetric>(
    'SleepAnalysis',
    SleepSchema,
    'sleep_analysis',
  );
