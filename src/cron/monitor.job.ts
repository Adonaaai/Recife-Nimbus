import { tideZones } from '../config.tideZones.ts';
import cron from 'node-cron';
import axios from 'axios';
import { getUpcomingTides, getUpcomingRains } from '../controllers/monitorControllers.ts'