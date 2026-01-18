import express from 'express';

import { getMedications } from '../controllers/medications';

const router = express.Router();

router.get('/', getMedications);

export default router;
