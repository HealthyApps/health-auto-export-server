import { Request, Response } from 'express';

import { Granularity, aggregateMetrics } from '../aggregation';
import { IngestData } from '../models/IngestData';
import { IngestResponse } from '../models/IngestResponse';
import {
  BaseMetric,
  BloodPressureMetric,
  BloodPressureModel,
  HeartRateMetric,
  HeartRateModel,
  Metric,
  SleepMetric,
  SleepModel,
  mapMetric,
  createMetricModel,
} from '../models/Metric';
import { MetricName } from '../models/MetricName';
import { filterFields, parseDate } from '../utils';

export const getMetrics = async (req: Request, res: Response) => {
  try {
    const { from, to, include, exclude, granularity } = req.query;
    const selectedMetric = req.params.selected_metric as MetricName;

    if (!selectedMetric) {
      throw new Error('No metric selected');
    }

    if (granularity && granularity !== 'daily' && granularity !== 'hourly') {
      res.status(400).json({ error: 'Invalid granularity. Must be "daily" or "hourly".' });
      return;
    }

    const fromDate = parseDate(from as string);
    const toDate = parseDate(to as string);

    let query: Record<string, any> = {};

    if (fromDate && toDate) {
      query = {
        date: {
          $gte: fromDate,
          $lte: toDate,
        },
      };
    }

    let metrics;

    if (granularity) {
      const g = granularity as Granularity;
      switch (selectedMetric) {
        case MetricName.BLOOD_PRESSURE:
          metrics = await aggregateMetrics(BloodPressureModel, selectedMetric, g, query);
          break;
        case MetricName.HEART_RATE:
          metrics = await aggregateMetrics(HeartRateModel, selectedMetric, g, query);
          break;
        case MetricName.SLEEP_ANALYSIS:
          metrics = await aggregateMetrics(SleepModel, selectedMetric, g, query);
          break;
        default:
          metrics = await aggregateMetrics(createMetricModel(selectedMetric), selectedMetric, g, query);
      }
    } else {
      switch (selectedMetric) {
        case MetricName.BLOOD_PRESSURE:
          metrics = await BloodPressureModel.find(query).lean();
          break;
        case MetricName.HEART_RATE:
          metrics = await HeartRateModel.find(query).lean();
          break;
        case MetricName.SLEEP_ANALYSIS:
          metrics = await SleepModel.find(query).lean();
          break;
        default:
          metrics = await createMetricModel(selectedMetric).find(query).lean();
      }
    }

    // Process include/exclude filters if provided
    if (include || exclude) {
      metrics = metrics.map((metric: any) => filterFields(metric, include, exclude));
    }

    console.log(metrics);
    res.json(metrics);
  } catch (error) {
    console.error('Error getting metrics:', error);
    res.json({ error: error instanceof Error ? error.message : 'Error getting metrics' });
  }
};

export const saveMetrics = async (ingestData: IngestData): Promise<IngestResponse> => {
  try {
    const response: IngestResponse = {};
    const metricsData = ingestData.data.metrics;

    if (!metricsData || metricsData.length === 0) {
      response.metrics = {
        success: true,
        error: 'No metrics data provided',
      };
      return response;
    }

    // Group metrics by type and map the data
    const metricsByType = metricsData.reduce(
      (acc, metric) => {
        const mappedMetrics = mapMetric(metric);
        const key = metric.name;
        acc[key] = acc[key] || [];
        acc[key].push(...mappedMetrics);
        return acc;
      },
      {} as {
        [key: string]: Metric[];
      },
    );

    const saveOperations = Object.entries(metricsByType).map(([key, metrics]) => {
      switch (key as MetricName) {
        case MetricName.BLOOD_PRESSURE:
          const bpMetrics = metrics as BloodPressureMetric[];
          return BloodPressureModel.bulkWrite(
            bpMetrics.map((metric) => ({
              updateOne: {
                filter: { source: metric.source, date: metric.date },
                update: { $set: metric },
                upsert: true,
              },
            })),
          );
        case MetricName.HEART_RATE:
          const hrMetrics = metrics as HeartRateMetric[];
          return HeartRateModel.bulkWrite(
            hrMetrics.map((metric) => ({
              updateOne: {
                filter: { source: metric.source, date: metric.date },
                update: { $set: metric },
                upsert: true,
              },
            })),
          );
        case MetricName.SLEEP_ANALYSIS:
          const sleepMetrics = metrics as SleepMetric[];
          return SleepModel.bulkWrite(
            sleepMetrics.map((metric) => ({
              updateOne: {
                filter: { source: metric.source, date: metric.date },
                update: { $set: metric },
                upsert: true,
              },
            })),
          );
        default:
          const baseMetrics = metrics as BaseMetric[];
          const model = createMetricModel(key as MetricName);
          return model.bulkWrite(
            baseMetrics.map((metric) => ({
              updateOne: {
                filter: { source: metric.source, date: metric.date },
                update: { $set: metric },
                upsert: true,
              },
            })),
          );
      }
    });

    await Promise.all(saveOperations);

    response.metrics = {
      success: true,
      message: `${metricsData.length} metrics saved successfully`,
    };

    return response;
  } catch (error) {
    console.error('Error saving metrics:', error);

    const errorResponse: IngestResponse = {};
    errorResponse.metrics = {
      success: false,
      error: error instanceof Error ? error.message : 'Error saving metrics',
    };

    return errorResponse;
  }
};
