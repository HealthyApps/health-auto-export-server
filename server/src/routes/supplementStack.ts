import express from 'express';

import { getAllStacks, getStack, getToday, updateStack, deleteStack } from '../controllers/supplementStack';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/all', requireAuth, getAllStacks);
router.get('/', requireAuth, getStack);
router.get('/today', requireAuth, getToday);
router.put('/', requireAuth, updateStack);
router.delete('/:id', requireAuth, deleteStack);

export default router;
