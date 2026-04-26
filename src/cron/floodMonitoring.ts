import 'dotenv/config';
import cron from 'node-cron';
import axios from 'axios';
import { prisma } from '../lib/prisma.ts';
import { bot } from '../bot/telegramBot.ts'
import { getCurrentTideHeight } from './controllers/getCurrentTideHeight.ts' 
import { T, RainSensor, RiverSensor, ZoneRisk, Severity } from './types/types.ts';
import tideData from '../config/tides2026.json';

// main function
export const monitorJob = async () => {
  const currentTide = getCurrentTideHeight();

};
