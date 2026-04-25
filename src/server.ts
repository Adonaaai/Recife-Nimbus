import express from 'express';
import morgan from 'morgan'
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.ts';
import reportRoutes from './routes/reportRoutes.ts';
import neighborhoodRoutes from './routes/neighborhoodRoutes.ts';
import alertLogRoutes from './routes/alertLogRoutes.ts';

const app = express();

app.use(cors());
app.use(morgan('tiny'));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes:
app.use('/api/reports/', reportRoutes);
app.use('/api/neighborhoods/', neighborhoodRoutes);
app.use('/api/alertlogs', alertLogRoutes)

app.use(errorHandler);

export default app