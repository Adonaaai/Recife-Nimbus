import { Router } from 'express';
import { getReports, createReport, updateReport, deleteReport} from '../controllers/reportControllers.ts';
import { validateData } from '../../middleware/validateData.ts';
import { userReportSchema } from '../../middleware/schemas/userReportSchema.ts';
import { upload } from '../../middleware/upload.ts';
    
const router = Router();

// Routes:
router.get('/', getReports);
router.post('/', upload.arrray('media', 4), validateData(userReportSchema), createReport);
router.put('/:id', upload.arrray('media', 4), validateData(userReportSchema), updateReport);
router.delete('/:id', deleteReport);

export default router;