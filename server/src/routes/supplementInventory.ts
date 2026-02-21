import express from 'express';

import {
  createInventory,
  getInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
} from '../controllers/supplementInventory';
import { requireAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', requireAuth, getInventory);
router.get('/:id', requireAuth, getInventoryById);
router.post('/', requireAuth, createInventory);
router.put('/:id', requireAuth, updateInventory);
router.delete('/:id', requireAuth, deleteInventory);

export default router;
