import express from 'express';

import {
  createWorkoutLog,
  getWorkoutLogs,
  getWorkoutLogSummary,
  updateWorkoutLog,
  deleteWorkoutLog,
} from '../controllers/workoutLog';
import { requireReadAuth, requireWriteAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', requireReadAuth, getWorkoutLogs);
router.get('/summary', requireReadAuth, getWorkoutLogSummary);
router.post('/', requireWriteAuth, createWorkoutLog);
router.put('/:id', requireWriteAuth, updateWorkoutLog);
router.delete('/:id', requireWriteAuth, deleteWorkoutLog);

export default router;
