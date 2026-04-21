import { Router } from 'express';
import { getReports, createReport, updateReport, deleteReport} from '../controllers/reportsControllers.ts';

const router = Router();

// Routes:
router.get('/', getReports);
router.post('/', createReport);
router.put('/:id', updateReport);
router.delete('/:id', deleteReport);

export default router;