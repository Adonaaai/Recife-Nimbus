import express from 'express';
import morgan from 'morgan'
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.ts';
import reportRoutes from './routes/reportRoutes.ts';
import neighborhoodRoutes from './routes/neighborhoodRoutes.ts';

const app = express();

app.use(cors());
app.use(morgan('tiny'));
app.use(express.json());

// Routes:
app.use('/api/reports/', reportRoutes);
app.use('/api/neighborhoods/', neighborhoodRoutes);

app.use(errorHandler);

export default app