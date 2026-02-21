import express from 'express';

import { getStack, getToday, updateStack } from '../controllers/supplementStack';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', requireAuth, getStack);
router.get('/today', requireAuth, getToday);
router.put('/', requireAuth, updateStack);

export default router;
