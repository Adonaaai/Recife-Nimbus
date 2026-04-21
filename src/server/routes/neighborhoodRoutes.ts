import { Router } from 'express';
import { getNeighborhoods } from '../controllers/neighborhoodControllers.ts';

const router = Router();

// Routes:
router.get('/', getNeighborhoods);

export default router;