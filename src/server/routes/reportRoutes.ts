import { Router } from 'express';
import { getReports, createReport, updateReport, deleteReport} from '../controllers/reportsControllers.ts';
import { validateData } from '../../middleware/validateData.ts';
import { userReportSchema } from '../../middleware/schemas/userReportSchema.ts';
    
const router = Router();

// Routes:
router.get('/', getReports);
router.post('/', userReportSchema(userReportSchema), createReport);
router.put('/:id', userReportSchema(userReportSchema), updateReport);
router.delete('/:id', deleteReport);

export default router;