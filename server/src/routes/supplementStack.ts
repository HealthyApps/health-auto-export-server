import express from 'express';

import { getStack, getToday, updateStack } from '../controllers/supplementStack';
import { requireReadAuth, requireWriteAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', requireReadAuth, getStack);
router.get('/today', requireReadAuth, getToday);
router.put('/', requireWriteAuth, updateStack);

export default router;
