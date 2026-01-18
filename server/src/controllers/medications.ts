import { Request, Response } from 'express';

import { IngestData } from '../models/IngestData';
import { IngestResponse } from '../models/IngestResponse';
import { MedicationModel, mapMedicationData, getMedicationId } from '../models/Medication';
import { filterFields, parseDate } from '../utils';

export const getMedications = async (req: Request, res: Response) => {
  try {
    const { from, to, include, exclude } = req.query;

    const fromDate = parseDate(from as string);
    const toDate = parseDate(to as string);

    let query = {};

    if (fromDate && toDate) {
      query = {
        start: {
          $gte: fromDate,
          $lte: toDate,
        },
      };
    }

    let medications = await MedicationModel.find(query)
      .sort({ start: -1 })
      .lean();

    if (include || exclude) {
      medications = medications.map((med) => filterFields(med, include, exclude));
    }

    console.log(`${medications.length} medications fetched`);
    res.status(200).json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({ error: 'Error fetching medications' });
  }
};

export const saveMedications = async (ingestData: IngestData): Promise<IngestResponse> => {
  try {
    const response: IngestResponse = {};
    const medications = ingestData.data.medications;

    if (!medications || !medications.length) {
      response.medications = {
        success: true,
        message: 'No medication data provided',
      };
      return response;
    }

    const medicationOperations = medications.map((medication) => ({
      updateOne: {
        filter: {
          medicationId: getMedicationId(medication),
          start: new Date(medication.start),
        },
        update: {
          $set: mapMedicationData(medication),
        },
        upsert: true,
      },
    }));

    await MedicationModel.bulkWrite(medicationOperations);

    response.medications = {
      success: true,
      message: `${medications.length} medications saved successfully`,
    };

    console.debug(`Processed ${medications.length} medications`);

    return response;
  } catch (error) {
    console.error('Error processing medications:', error);

    const errorResponse: IngestResponse = {};
    errorResponse.medications = {
      success: false,
      message: 'Medications not saved',
      error: error instanceof Error ? error.message : 'An error occurred',
    };

    return errorResponse;
  }
};
