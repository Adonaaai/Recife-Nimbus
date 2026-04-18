import express from 'express';
import morgan from 'morgan'
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.ts';

const app = express();

app.use(cors());
app.use(morgan('tiny'));
app.use(express.json());

// Routes:

app.use(errorHandler);

export default app