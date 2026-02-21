import express from 'express';

import { createLog, quickLog, getLogs, deleteLog } from '../controllers/supplementLogs';
import { requireReadAuth, requireWriteAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', requireReadAuth, getLogs);
router.post('/', requireWriteAuth, createLog);
router.post('/quick', requireWriteAuth, quickLog);
router.delete('/:id', requireWriteAuth, deleteLog);

export default router;
