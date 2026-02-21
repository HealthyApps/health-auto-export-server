import express from 'express';

import {
  createSupplement,
  getSupplements,
  getSupplement,
  updateSupplement,
  deleteSupplement,
} from '../controllers/supplements';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', requireAuth, getSupplements);
router.get('/:id', requireAuth, getSupplement);
router.post('/', requireAuth, createSupplement);
router.put('/:id', requireAuth, updateSupplement);
router.delete('/:id', requireAuth, deleteSupplement);

export default router;
