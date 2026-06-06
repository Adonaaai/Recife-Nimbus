import "dotenv/config";
import { escapeMd, validateTimezone, sanitizeJsonString, getErrorMessage } from '../lib/validators';
import { RainSensor, RiverSensor, Severity, SEVERITY_ORDER } from "./types/types.ts";
import { getForecastTideHeight } from "./controllers/getForecastTideHeight.ts";
import { getCurrentTideHeight } from "./controllers/getCurrentTideHeight.ts";
import { calculateRisk } from "./controllers/calculateRisk.ts";
import { getForecastRainMm } from "./controllers/getForecastRainMm.ts";
import { bot } from "../lib/bot.ts";
import { prisma } from "../lib/prisma.ts";
import { buildMessage, buildCityChannelMessage } from "./controllers/buildMessage";
import cron from "node-cron";
import axios from "axios";

const timezoneValidate = validateTimezone("America/Recife");
const timezone = timezoneValidate ? "America/Recife" : "UTC";

// Cooldown Guards
const wasRecentlySentZone = async (zoneId: number, severity: Severity): Promise<boolean> => {
    const minutes = severity === "RED" ? 60 : 180;
    const since = new Date(Date.now() - minutes * 60_000);
    const existing = await prisma.alertLog.findFirst({
        where: { zoneId, severity, triggeredAt: { gte: since } },
    });
    return existing !== null;
};

const wasRecentlySentCity = async (cityId: number): Promise<boolean> => {
    const minutes = 60;
    const since = new Date(Date.now() - minutes * 60_000);
    const existing = await prisma.cityAlertLog.findFirst({
        where: { cityId, triggeredAt: { gte: since } }
    });
    return existing !== null;
};

// 🌟 MOTOR ISOLADO: Pode ser invocado a qualquer momento (Boot ou Cron)
export const executeMonitoringCycle = async () => {
    console.log(`\n[SYSTEM] ${new Date().toLocaleString()} - Iniciando ciclo de varredura de telemetria...`);

    const APAC_RIVER_URL = "https://geoportal.apac.pe.gov.br/server/rest/services/SIRH/mon_nivel_rios_pe/MapServer/0/query?where=1%3D1&outFields=*&f=json";
    const APAC_RAIN_URL = "https://geoportal.apac.pe.gov.br/server/rest/services/met_monitoramento_chuvas_pe/MapServer/0/query?where=1%3D1&outFields=*&f=json";

    try {
        const cities = await prisma.city.findMany();

        // Headers adicionados para evitar bloqueios de segurança/timeout da APAC
        const httpOptions = { 
            timeout: 15000,
            headers: {
                'User-Agent': 'RecifeNimbusMonitor/1.0 (Contact: adonai@nimbus.local)'
            }
        };

        const [rainRes, riverRes] = await Promise.all([
            axios.get(APAC_RAIN_URL, httpOptions),
            axios.get(APAC_RIVER_URL, httpOptions),
        ]);

        const rainSensors: RainSensor[] = rainRes.data.features ?? [];
        const riverSensors: RiverSensor[] = riverRes.data.features ?? [];

        console.log(`[APAC] Carregados ${rainSensors.length} sensores de chuva e ${riverSensors.length} estações de rios.`);

        let currentTideHeight = getCurrentTideHeight();
        let forecastTideHeight = getForecastTideHeight();

        for (const city of cities) {
            let zoneSummaries: { zoneName: string; severity: Severity; reasons: string[] }[] = [];

            const zones = await prisma.zone.findMany({
                where: { cityId: city.id },
                include: {
                    neighborhoods: {
                        include: { users: true },
                    },
                },
            });

            for (const zone of zones) {
                let localCurrentTide = zone.isCoastal ? currentTideHeight : 0;
                let localForecastTide = zone.isCoastal ? forecastTideHeight : 0;

                const zoneRainSensor: RainSensor[] = rainSensors.filter((sensor) => {
                    return zone.rainSensorNames.some((dbName: string) => {
                        const isOnline = sensor.attributes.hora_1 >= 0;
                        return isOnline && dbName === sensor.attributes.nome;
                    });
                });

                const zoneRiverSensors: RiverSensor[] = riverSensors.filter((sensor) => {
                    return zone.riverBasins.some((dbName: string) => {
                        return dbName === sensor.attributes.namebasin &&
                               sensor.attributes.alerta_tendencia !== "MA" &&
                               sensor.attributes.recent === "s";
                    });
                });

                const maxRainMm = zoneRainSensor.length > 0
                    ? Math.max(...zoneRainSensor.map((s) => s.attributes.hora_1))
                    : 0;

                const worstRiverStation = zoneRiverSensors.length > 0
                    ? zoneRiverSensors.reduce((worst, sensor) => {
                        const currentScore = SEVERITY_ORDER[sensor.attributes.situacao as keyof typeof SEVERITY_ORDER] ?? 0;
                        const worstScore = SEVERITY_ORDER[worst.attributes.situacao as keyof typeof SEVERITY_ORDER] ?? 0;
                        return currentScore > worstScore ? sensor : worst;
                    })
                    : null;

                const riverTendencia = worstRiverStation?.attributes.tendencia ?? null;
                const riverSituacao = worstRiverStation?.attributes.situacao ?? null;

                const forecastMm = await getForecastRainMm(zone.latitude, zone.longitude);

                console.log(`   📡 [${zone.name}] Chuva: ${maxRainMm}mm | Rio: ${riverSituacao ?? "Normal"} | Maré: ${localCurrentTide}m`);

                const risk = calculateRisk(
                    maxRainMm,
                    riverSituacao,
                    riverTendencia,
                    localCurrentTide,
                    forecastMm,
                    localForecastTide
                );

                if (risk.severity === "NONE") continue;

                const supressed = await wasRecentlySentZone(zone.id, risk.severity);
                if (supressed) {
                    console.log(`   ⏸ [${zone.name}] Alerta de risco omitido pelo cooldown.`);
                    continue;
                }

                const zoneNameEscaped = escapeMd(zone.name);
                const riskSeverity = risk.severity;
                const riskReasonsEscaped = risk.reasons.map((reason) => escapeMd(reason));

                zoneSummaries.push({ zoneName: zoneNameEscaped, severity: riskSeverity, reasons: riskReasonsEscaped });

                const message = buildMessage(zoneNameEscaped, riskSeverity, riskReasonsEscaped);
                const chatIds = new Set<string>();

                for (const neighborhood of zone.neighborhoods) {
                    for (const user of neighborhood.users) {
                        if (user.isActive) chatIds.add(user.telegramChatId);
                    }
                }

                let sent = 0;
                for (const chatId of chatIds) {
                    try {
                        await bot.telegram.sendMessage(chatId, message, { parse_mode: "MarkdownV2" });
                        sent++;
                    } catch (err) {
                        console.error(`[TELEGRAM] Falha ao enviar para o chat ${chatId}: ${getErrorMessage(err)}`);
                    }
                }

                await prisma.alertLog.create({
                    data: {
                        zoneId: zone.id,
                        severity: risk.severity,
                        rainLevel: risk.maxRainMm,
                        tideLevel: risk.tideHeight,
                        forecastRainMm: risk.forecastMm,
                        forecastTide: risk.forecastTide,
                        riverLevel: risk.riverSituacao,
                        riverTendencia: risk.riverTendencia,
                        messageSent: message,
                    },
                });

                console.log(`   🚨 [${zone.name}] Alerta [${risk.severity}] enviado para ${sent} usuários.`);
            }

            // Tratamento do Canal Geral da Cidade
            const citySupressed = await wasRecentlySentCity(city.id);
            const redZones = zoneSummaries.filter(z => z.severity === 'RED');

            if (redZones.length === 0 || citySupressed) {
                continue;
            }

            const channelIdStr = `${process.env.TELEGRAM_CHANNEL_ID}`;
            if (!channelIdStr || channelIdStr.trim() === "") continue;

            const channelMessage = buildCityChannelMessage(city.name, zoneSummaries);

            try {
                await bot.telegram.sendMessage(Number(channelIdStr), channelMessage, { parse_mode: "MarkdownV2" });
                await prisma.cityAlertLog.create({
                    data: {
                        cityId: city.id,
                        alertedZones: sanitizeJsonString(zoneSummaries),
                        hasRedAlert: true,
                        severity: 'RED',
                        messageSent: channelMessage,
                    }
                });
                console.log(`📢 [CANAL] Alerta geral consolidado emitido para ${city.name}.`);
            } catch (err) {
                console.error(`[TELEGRAM CHANNEL] Erro no envio geral: ${getErrorMessage(err)}`);
            }
        }
    } catch (err) {
        console.error("[ERROR] Falha crítica no ciclo de monitoramento:", getErrorMessage(err));
    }
};

// == Mantém o Agendador Cron Clássico Ativo ==
export const monitorJob = async () => {
    cron.schedule("*/30 * * * *", async () => {
        await executeMonitoringCycle();
    }, { timezone });
};
