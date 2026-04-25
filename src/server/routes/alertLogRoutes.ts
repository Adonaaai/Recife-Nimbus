import { Router } from 'express';
import { getAlertLogs, createAlertLog, updateAlertLog, deleteAlertLog} from '../controllers/alertLogControllers.ts';
import { validateData } from '../../middleware/validateData.ts';
import { alertLogSchema } from '../../middleware/schemas/alertLogSchema.ts';

const router = Router();

// Routes:
router.get('/', getReports);
router.post('/', validateData(alertLogSchema), createReport);
router.put('/:id', validateData(alertLogSchema), updateReport);
router.delete('/:id', deleteReport);

export default router;