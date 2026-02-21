import express from 'express';

import {
  createInventory,
  getInventory,
  getInventoryById,
  updateInventory,
  deleteInventory,
} from '../controllers/supplementInventory';
import { requireReadAuth, requireWriteAuth } from '../middleware/auth';

const router = express.Router();

router.get('/', requireReadAuth, getInventory);
router.get('/:id', requireReadAuth, getInventoryById);
router.post('/', requireWriteAuth, createInventory);
router.put('/:id', requireWriteAuth, updateInventory);
router.delete('/:id', requireWriteAuth, deleteInventory);

export default router;
