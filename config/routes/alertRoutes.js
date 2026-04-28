import express from 'express';
import { triggerAlert } from '../../src/api/v1/controllers/alertController.js';

import { registrarActividad } from '../../middlewares/logger.js';
import { validateAlert } from '../../middlewares/validateAlert.js';

const router = express.Router();

router.post('/trigger-alert', registrarActividad, validateAlert, triggerAlert);

export default router;