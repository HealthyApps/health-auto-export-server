import { Model } from 'mongoose';

import { MetricName } from './models/MetricName';

export type Granularity = 'daily' | 'hourly';

export enum AggregationMethod {
  SUM = 'SUM',
  MEAN = 'MEAN',
  NONE = 'NONE',
  HEART_RATE = 'HEART_RATE',
  BLOOD_PRESSURE = 'BLOOD_PRESSURE',
}

const METRIC_AGGREGATION: Partial<Record<MetricName, AggregationMethod>> = {
  // SUM metrics — activity, exercise, nutrition
  [MetricName.STEP_COUNT]: AggregationMethod.SUM,
  [MetricName.WALKING_RUNNING_DISTANCE]: AggregationMethod.SUM,
  [MetricName.FLIGHTS_CLIMBED]: AggregationMethod.SUM,
  [MetricName.ACTIVE_ENERGY]: AggregationMethod.SUM,
  [MetricName.APPLE_EXERCISE_TIME]: AggregationMethod.SUM,
  [MetricName.APPLE_STAND_TIME]: AggregationMethod.SUM,
  [MetricName.APPLE_STAND_HOUR]: AggregationMethod.SUM,
  [MetricName.PHYSICAL_EFFORT]: AggregationMethod.SUM,
  [MetricName.TIME_IN_DAYLIGHT]: AggregationMethod.SUM,
  [MetricName.RESTING_ENERGY]: AggregationMethod.SUM,
  [MetricName.HANDWASHING]: AggregationMethod.SUM,
  [MetricName.DIETARY_ENERGY]: AggregationMethod.SUM,
  [MetricName.DIETARY_WATER]: AggregationMethod.SUM,
  [MetricName.DIETARY_SUGAR]: AggregationMethod.SUM,
  [MetricName.DIETARY_CHOLESTEROL]: AggregationMethod.SUM,
  [MetricName.DIETARY_CARBOHYDRATES]: AggregationMethod.SUM,
  [MetricName.DIETARY_BIOTIN]: AggregationMethod.SUM,
  [MetricName.DIETARY_CAFFEINE]: AggregationMethod.SUM,
  [MetricName.DIETARY_CALCIUM]: AggregationMethod.SUM,
  [MetricName.DIETARY_CHLORIDE]: AggregationMethod.SUM,
  [MetricName.DIETARY_CHROMIUM]: AggregationMethod.SUM,
  [MetricName.DIETARY_COPPER]: AggregationMethod.SUM,
  [MetricName.DIETARY_FIBER]: AggregationMethod.SUM,
  [MetricName.DIETARY_FOLATE]: AggregationMethod.SUM,
  [MetricName.DIETARY_IODINE]: AggregationMethod.SUM,
  [MetricName.DIETARY_IRON]: AggregationMethod.SUM,
  [MetricName.DIETARY_MAGNESIUM]: AggregationMethod.SUM,
  [MetricName.DIETARY_MANGANESE]: AggregationMethod.SUM,
  [MetricName.DIETARY_MOLYBDENUM]: AggregationMethod.SUM,
  [MetricName.DIETARY_MONOSATURATED_FAT]: AggregationMethod.SUM,
  [MetricName.DIETARY_NIACIN]: AggregationMethod.SUM,
  [MetricName.DIETARY_PANTOTHENIC_ACID]: AggregationMethod.SUM,
  [MetricName.DIETARY_POLYUNSATURATED_FAT]: AggregationMethod.SUM,
  [MetricName.DIETARY_POTASSIUM]: AggregationMethod.SUM,
  [MetricName.DIETARY_PROTEIN]: AggregationMethod.SUM,
  [MetricName.DIETARY_RIBOFLAVIN]: AggregationMethod.SUM,
  [MetricName.DIETARY_SATURATED_FAT]: AggregationMethod.SUM,
  [MetricName.DIETARY_SELENIUM]: AggregationMethod.SUM,
  [MetricName.DIETARY_SODIUM]: AggregationMethod.SUM,
  [MetricName.DIETARY_THIAMIN]: AggregationMethod.SUM,
  [MetricName.DIETARY_TOTAL_FAT]: AggregationMethod.SUM,
  [MetricName.DIETARY_VITAMIN_A]: AggregationMethod.SUM,
  [MetricName.DIETARY_VITAMIN_B6]: AggregationMethod.SUM,
  [MetricName.DIETARY_VITAMIN_B12]: AggregationMethod.SUM,
  [MetricName.DIETARY_VITAMIN_C]: AggregationMethod.SUM,
  [MetricName.DIETARY_VITAMIN_D]: AggregationMethod.SUM,
  [MetricName.DIETARY_VITAMIN_E]: AggregationMethod.SUM,
  [MetricName.DIETARY_VITAMIN_K]: AggregationMethod.SUM,
  [MetricName.DIETARY_ZINC]: AggregationMethod.SUM,

  // MEAN metrics — rates, speeds, percentages
  [MetricName.RESTING_HEART_RATE]: AggregationMethod.MEAN,
  [MetricName.WALKING_SPEED]: AggregationMethod.MEAN,
  [MetricName.WALKING_STEP_LENGTH]: AggregationMethod.MEAN,
  [MetricName.WALKING_ASYMMETRY_PERCENTAGE]: AggregationMethod.MEAN,
  [MetricName.WALKING_DOUBLE_SUPPORT_PERCENTAGE]: AggregationMethod.MEAN,
  [MetricName.STAIR_SPEED_UP]: AggregationMethod.MEAN,
  [MetricName.STAIR_SPEED_DOWN]: AggregationMethod.MEAN,

  // NONE — return raw records
  [MetricName.BLOOD_GLUCOSE]: AggregationMethod.NONE,
  [MetricName.HEART_RATE_VARIABILITY]: AggregationMethod.NONE,
  [MetricName.BLOOD_OXYGEN_SATURATION]: AggregationMethod.NONE,
  [MetricName.SLEEP_ANALYSIS]: AggregationMethod.NONE,

  // Custom models
  [MetricName.HEART_RATE]: AggregationMethod.HEART_RATE,
  [MetricName.BLOOD_PRESSURE]: AggregationMethod.BLOOD_PRESSURE,
};

function getAggregationMethod(metric: MetricName): AggregationMethod {
  return METRIC_AGGREGATION[metric] ?? AggregationMethod.SUM;
}

function dateParts(granularity: Granularity) {
  const parts: Record<string, any> = {
    year: { $year: '$date' },
    month: { $month: '$date' },
    day: { $dayOfMonth: '$date' },
  };
  if (granularity === 'hourly') {
    parts.hour = { $hour: '$date' };
  }
  return parts;
}

function reconstructDate(granularity: Granularity) {
  const spec: Record<string, any> = {
    year: '$_id.year',
    month: '$_id.month',
    day: '$_id.day',
  };
  if (granularity === 'hourly') {
    spec.hour = '$_id.hour';
  }
  return { $dateFromParts: spec };
}

function buildMeanMetricPipeline(
  matchQuery: Record<string, any>,
  granularity: Granularity,
) {
  return [
    { $match: matchQuery },
    { $sort: { date: 1 as const } },
    {
      $group: {
        _id: dateParts(granularity),
        qty: { $avg: '$qty' },
        units: { $first: '$units' },
      },
    },
    {
      $project: {
        _id: 0,
        date: reconstructDate(granularity),
        qty: 1,
        units: 1,
      },
    },
    { $sort: { date: 1 as const } },
  ];
}

function periodKey(date: Date, granularity: Granularity): string {
  const d = new Date(date);
  const base = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
  if (granularity === 'hourly') {
    return `${base}-${d.getUTCHours()}`;
  }
  return base;
}

function periodDate(date: Date, granularity: Granularity): Date {
  const d = new Date(date);
  if (granularity === 'hourly') {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours()));
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// Minimum number of records in a period before outlier detection kicks in.
// With fewer records, all values are summed directly.
const OUTLIER_MIN_RECORDS = 5;

// A record with qty exceeding (median * OUTLIER_FACTOR) is treated as a
// bulk "catch-up" summary that overlaps with the minute-level data.
const OUTLIER_FACTOR = 10;

function sumWithoutBulkOutliers(values: number[]): number {
  const total = values.reduce((a, b) => a + b, 0);
  if (values.length < OUTLIER_MIN_RECORDS) return total;

  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  if (median === 0) return total;

  const threshold = median * OUTLIER_FACTOR;
  const filtered = values.filter((v) => v <= threshold);
  return filtered.length > 0 ? filtered.reduce((a, b) => a + b, 0) : total;
}

async function aggregateSumDeduped(
  model: Model<any>,
  matchQuery: Record<string, any>,
  granularity: Granularity,
): Promise<any[]> {
  // Step 1: Deduplicate by exact timestamp — take max qty per timestamp.
  // This eliminates duplicate records from different sources (e.g. Ultrahuman
  // ring creating a second record with an identical value at the same timestamp).
  const deduped: Array<{ _id: Date; qty: number; units: string }> = await model.aggregate([
    { $match: matchQuery },
    { $sort: { date: 1 as const } },
    {
      $group: {
        _id: '$date',
        qty: { $max: '$qty' },
        units: { $first: '$units' },
      },
    },
    { $sort: { _id: 1 as const } },
  ]);

  // Step 2: Group by period and remove bulk outliers before summing.
  // Apple Health can export both a cumulative "catch-up" record (large qty at
  // a single timestamp) AND minute-level records for the same time span.
  // Summing both inflates the total by ~2x.  The outlier filter removes the
  // catch-up record when sufficient minute-level data exists in the period.
  const groups = new Map<string, { date: Date; values: number[]; units: string }>();
  for (const rec of deduped) {
    const date = new Date(rec._id);
    const key = periodKey(date, granularity);
    let group = groups.get(key);
    if (!group) {
      group = { date: periodDate(date, granularity), values: [], units: rec.units };
      groups.set(key, group);
    }
    group.values.push(rec.qty);
  }

  const results: Array<{ date: Date; qty: number; units: string }> = [];
  for (const group of groups.values()) {
    results.push({
      date: group.date,
      qty: sumWithoutBulkOutliers(group.values),
      units: group.units,
    });
  }

  return results.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function buildHeartRatePipeline(
  matchQuery: Record<string, any>,
  granularity: Granularity,
) {
  return [
    { $match: matchQuery },
    { $sort: { date: 1 as const } },
    {
      $group: {
        _id: dateParts(granularity),
        Min: { $min: '$Min' },
        Avg: { $avg: '$Avg' },
        Max: { $max: '$Max' },
        units: { $first: '$units' },
      },
    },
    {
      $project: {
        _id: 0,
        date: reconstructDate(granularity),
        Min: 1,
        Avg: 1,
        Max: 1,
        units: 1,
      },
    },
    { $sort: { date: 1 as const } },
  ];
}

function buildBloodPressurePipeline(
  matchQuery: Record<string, any>,
  granularity: Granularity,
) {
  return [
    { $match: matchQuery },
    { $sort: { date: 1 as const } },
    {
      $group: {
        _id: dateParts(granularity),
        systolic: { $avg: '$systolic' },
        diastolic: { $avg: '$diastolic' },
        units: { $first: '$units' },
      },
    },
    {
      $project: {
        _id: 0,
        date: reconstructDate(granularity),
        systolic: 1,
        diastolic: 1,
        units: 1,
      },
    },
    { $sort: { date: 1 as const } },
  ];
}

export async function aggregateMetrics(
  model: Model<any>,
  metricName: MetricName,
  granularity: Granularity,
  matchQuery: Record<string, any>,
): Promise<any[]> {
  const method = getAggregationMethod(metricName);

  if (method === AggregationMethod.NONE) {
    return model.find(matchQuery).lean();
  }

  if (method === AggregationMethod.SUM) {
    return aggregateSumDeduped(model, matchQuery, granularity);
  }

  let pipeline;
  switch (method) {
    case AggregationMethod.HEART_RATE:
      pipeline = buildHeartRatePipeline(matchQuery, granularity);
      break;
    case AggregationMethod.BLOOD_PRESSURE:
      pipeline = buildBloodPressurePipeline(matchQuery, granularity);
      break;
    default:
      pipeline = buildMeanMetricPipeline(matchQuery, granularity);
  }

  return model.aggregate(pipeline);
}
