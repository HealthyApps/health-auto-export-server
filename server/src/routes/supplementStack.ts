import express from 'express';

import { getAllStacks, getStack, getStackById, getToday, updateStack, deleteStack } from '../controllers/supplementStack';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/all', requireAuth, getAllStacks);
router.get('/today', requireAuth, getToday);
router.get('/:id', requireAuth, getStackById);
router.get('/', requireAuth, getStack);
router.put('/', requireAuth, updateStack);
router.delete('/:id', requireAuth, deleteStack);

export default router;
