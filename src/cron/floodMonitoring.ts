import 'dotenv/config';
import cron from 'node-cron';
import axios from 'axios';
import { prisma } from '../lib/prisma.ts';
import { bot } from '../bot/telegramBot.ts'
import { getCurrentTideHeight } from './controllers/getCurrentTideHeight.ts' 
import { T, RainSensor, RiverSensor, ZoneRisk, Severity, SEVERITY_ORDER } from './types/types.ts';
import tideData from '../config/tides2026.json';

// main function
export const monitorJob = async () => {

    const APAC_RIVER_URL = 'https://geoportal.apac.pe.gov.br/server/rest/services/SIRH/mon_nivel_rios_pe/MapServer/0/query?where=1%3D1&outFields=*&f=json';
    const APAC_RAIN_URL  = 'https://geoportal.apac.pe.gov.br/server/rest/services/met_monitoramento_chuvas_pe/MapServer/0/query?where=1%3D1&outFields=*&f=json';
    
    // Now in the Recife hour schedule.
    const time = new Date().toLocaleTimeString('pt-BR', {
        timeZone: 'America/Recife',
        hour:     '2-digit',
        minute:   '2-digit',
    });

    // Formating Reasons in a "list".
    const lines = reasons.map(r => `• ${r}`).join('\n');
 
    if (severity === 'RED') {
        return (
            `🚨 *ALERTA VERMELHO — ${zoneName.toUpperCase()}*\n\n` +
            `${lines}\n\n` +
            `⛔ Risco alto de alagamento\\! Evite ruas baixas\\.\n` +
            `_Atualizado às ${time}_`
        );
    }
 
    return (
        `🟡 *PRÉ\\-ALERTA — ${zoneName.toUpperCase()}*\n\n` +
        `${lines}\n\n` +
        `📡 Monitoramento ativo\\. Fique atento\\.\n` +
        `_Atualizado às ${time}_`
    );
    
    cron.schedule('*/15 * * * *', async () => {
        console.log(`\n[${new Date().toISOString()}] Running flood check...`);
        
        const rainRes = axios.get(APAC_RAIN_URL, {timeout: 8000});
        include: {
            neighborhood: {

            }
        }
        const riverRes = axios.get(APAC_RIVER_URL, {timeout: 8000});

        const rainSensors: RainSensor = rainRes.data.features ?? [];
        const riverSensors: RiverSensor = rainRes.data.features ?? [];

        const currentTideHeight = getCurrentTideHeight();
        const forecastTideHeight= getForecastTideHeight();

        // All zones with neighborhoods and it users
        const zones = await prisma.zone.findMany({
            include: {
                neighborhoods: {
                    include: { users: true}
                },
            },
        });

        // Loops for sort zone's rain and river data.
        for (const zone of zones) {
            // FILTER RAIN SENSORS FOR THIS ZONE

            // FILTER RIVER SENSORS FOR THIS ZONE

            // HIGHEST RAIN READING IN THIS ZONE (mm/h)

            // WORST RIVER STATUS IN THIS ZONE

            // TREND OF THE WORST RIVER STATION

            // RUN THE RISK CALCULATOR

            // BUILD THE TELEGRAM MESSAGE

            // SAVE ALERT TO DATABASE

        };
    });

};
