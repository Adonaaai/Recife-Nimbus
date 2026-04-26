import cron from 'node-cron';
import axios from 'axios';
import { prisma } from '../lib/prisma.ts';
import { bot } from '../bot/telegramBot.ts'
// Used to read 'tides2026.json'.
import * as fs from 'fs';
// Help us build file paths.
import * as path from 'path';

// Thresholds
const T = {
    // Rains millimetres.
    RAIN_RED_MM: 30,
    RAIN_YELLOW_MM: 15,

    // Tides metres.
    TIDE_HIGH_M: 2.0,
    TIDE_EXTREME_M: 2.5,

    // Compound rain and tide.
    COMPOUND_RAIN_MM: 15,
    COMPOUND_TIDE_M: 2.0,

    // Cooldowns for no spamming.
    COOLDOWN_RED_MIN: 60,
    COOLDOWN_YELLOW_MIN: 180

  // "as const" for never change in the runtime.
} as const;

// Rain sensors interface for predict APAC pluviometer API.
interface RainSensor {

};

// River sensors interface for predict APAC fluviometer API.
interface RiverSensor {

};

export const monitorJob = async () => {


};
