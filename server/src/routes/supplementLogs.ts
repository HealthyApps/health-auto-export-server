import express from 'express';

import { createLog, quickLog, getLogs, deleteLog } from '../controllers/supplementLogs';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', requireAuth, getLogs);
router.post('/', requireAuth, createLog);
router.post('/quick', requireAuth, quickLog);
router.delete('/:id', requireAuth, deleteLog);

export default router;
