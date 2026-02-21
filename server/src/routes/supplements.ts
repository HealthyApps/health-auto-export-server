import express from 'express';

import {
  createSupplement,
  getSupplements,
  getSupplement,
  updateSupplement,
  deleteSupplement,
} from '../controllers/supplements';
import { requireReadAuth, requireWriteAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', requireReadAuth, getSupplements);
router.get('/:id', requireReadAuth, getSupplement);
router.post('/', requireWriteAuth, createSupplement);
router.put('/:id', requireWriteAuth, updateSupplement);
router.delete('/:id', requireWriteAuth, deleteSupplement);

export default router;
