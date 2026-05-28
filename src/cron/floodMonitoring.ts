import "dotenv/config";
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

// == Cooldown Zone guard ===================================================
// Prevents alert spam by checking whether an alert of the same severity
// was already sent for this zone within the cooldown window.
// RED = 60 min cooldown | YELLOW = 180 min cooldown.

const wasRecentlySentZone = async (
    zoneId: number,
    severity: Severity,
): Promise<boolean> => {
    const minutes = severity === "RED" ? 60 : 180;

    // Calculating past time and formating it in a Date object.
    const since = new Date(Date.now() - minutes * 60_000); // Example: 180 * 60_000 = 10,800,000 milliseconds - now milliseconds

    const existing = await prisma.alertLog.findFirst({
        where: {
            zoneId,
            severity,

            triggeredAt: { gte: since }, // gte = greater than or equal (>=)
        },
    });

    return existing !== null;
};

// == Cooldown City guard ===================================================
// Prevents alert spam by checking whether an alert of the same city 
// was already sent within the cooldown window.
const wasRecentlySentCity = async (
    cityId: number
): Promise<boolean> => {
    const minutes = 60;

    const since = new Date(Date.now() - minutes * 60_000); // Example: 180 * 60_000 = 10,800,000 milliseconds - now milliseconds

    const existing = await prisma.cityAlertLog.findFirst({
        where: {
            cityId,
            triggeredAt: { gte: since }// gte = greater than or equal (>=)
        }
    });

    return existing !== null;
};

// Helper function to escape reserved MarkdownV2 characters
const escapeMd = (text: string): string => {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};

// Starts the real-time flood monitor. Runs a risk check every 15 minutes,
// broadcasts Telegram alerts per zone, and logs every alert to the database.
export const monitorJob = async () => {
    const APAC_RIVER_URL =
        "https://geoportal.apac.pe.gov.br/server/rest/services/SIRH/mon_nivel_rios_pe/MapServer/0/query?where=1%3D1&outFields=*&f=json";
    const APAC_RAIN_URL =
        "https://geoportal.apac.pe.gov.br/server/rest/services/met_monitoramento_chuvas_pe/MapServer/0/query?where=1%3D1&outFields=*&f=json";

    const cities = await prisma.city.findMany();
    // == Cron: every 15 minutes, America/Recife timezone ==================
    cron.schedule("*/1 * * * *",
        async () => {
            console.log(
                `\n[SYSTEM] ${new Date().toLocaleString()} - Starting flood monitoring cycle...`,
            );

            try {
                // == Fetch live sensor data from APAC ==========================
                // Both requests run in parallel to reduce total wait time.
                const [rainRes, riverRes] = await Promise.all([
                    axios.get(APAC_RAIN_URL, { timeout: 12000 }),
                    axios.get(APAC_RIVER_URL, { timeout: 12000 }),
                ]);

                const rainSensors: RainSensor[] = rainRes.data.features ?? [];
                const riverSensors: RiverSensor[] = riverRes.data.features ?? [];

                console.log(
                    `[APAC] Loaded ${rainSensors.length} rain sensors and ${riverSensors.length} river stations`,
                );

                // == Tide levels — read synchronously from disk (no await needed) ===
                let currentTideHeight = getCurrentTideHeight();
                let forecastTideHeight = getForecastTideHeight();

                // == general log alerts for channel ==========
                for (const city of cities) {
                    // We will collect zone summaries to build a city-level alert at the end.
                    let zoneSummaries: { zoneName: string; severity: Severity; reasons: string[] }[] = []

                    // == Load all zones with their neighborhoods and subscribed users ===
                    const zones = await prisma.zone.findMany({
                        where: { cityId: city.id },
                        include: {
                            neighborhoods: {
                                include: { users: true },
                            },
                        },
                    });

                    // == Per-zone risk evaluation and alert dispatch =====================
                    for (const zone of zones) {
                        
                        // If the zone isn't coastal, we ignore tide data by forcing it to 0.
                        const zoneIsCoastal = zone.isCoastal;
                        if (!zoneIsCoastal) {
                            currentTideHeight = 0;
                            forecastTideHeight = 0;
                        }

                        // FILTER RAIN SENSORS FOR THIS ZONE
                        // Keeps only sensors whose name matches the zone's watchlist
                        // and that are currently online (hora_1 === -1 means offline).
                        const zoneRainSensor: RainSensor[] = rainSensors.filter(
                            (sensor) => {
                                // looping rainSensorNames array
                                const nameMatch = zone.rainSensorNames.some(
                                    (dbName: string) => {
                                        const isOnline =
                                            sensor.attributes.hora_1 >= 0; // -1 = offline

                                        // If the sensor isn't online, we force .some() don't aprove it.
                                        if (!isOnline) {
                                            return false;
                                        }

                                        // Checking if the DB name(ex: "rainSensors": "[CEMADEN] Várzea")
                                        // match the API name     (ex: "nome": "[CEMADEN] Várzea").
                                        return dbName === sensor.attributes.nome;
                                    },
                                );

                                return nameMatch;
                            },
                        );

                        // FILTER RIVER SENSORS FOR THIS ZONE
                        // Keeps only sensors in the zone's river basins that have recent,
                        // non-stale readings (alerta_tendencia "MA" = no data for 24 h).
                        const zoneRiverSensors: RiverSensor[] = riverSensors.filter(
                            (sensor) => {
                                // looping riverBasins array
                                const nameMatch = zone.riverBasins.some(
                                    (dbName: string) => {
                                        // Checking if the DB name(ex: "riverSensors": "Capibaribe")
                                        // match the API name     (ex: "namebasin": "Capibaribe").
                                        return (
                                            dbName === sensor.attributes.namebasin
                                        );
                                    },
                                );

                                return (
                                    nameMatch &&
                                    sensor.attributes.alerta_tendencia !== "MA" && // exclude stale sensors
                                    sensor.attributes.recent === "s"
                                ); // must have a recent reading
                            },
                        );

                        // The higher value always will be the first([0]).
                        const maxRainMm =
                            zoneRainSensor.length > 0
                                ? Math.max(
                                    ...zoneRainSensor.map(
                                        (s) => s.attributes.hora_1,
                                    ),
                                )
                                : 0;

                        // == Worst river station in this zone =========================
                        // Uses SEVERITY_ORDER as a numeric score map to find the station
                        // with the most critical situacao (status) via reduce.
                        const worstRiverStation =
                            zoneRiverSensors.length > 0
                                ? zoneRiverSensors.reduce((worst, sensor) => {
                                    const currentScore =
                                        SEVERITY_ORDER[
                                        sensor.attributes
                                            .situacao as keyof typeof SEVERITY_ORDER
                                        ] ?? 0;
                                    const worstScore =
                                        SEVERITY_ORDER[
                                        worst.attributes
                                            .situacao as keyof typeof SEVERITY_ORDER
                                        ] ?? 0;
                                    return currentScore > worstScore
                                        ? sensor
                                        : worst;
                                })
                                : null;

                        const riverTendencia =
                            worstRiverStation?.attributes.tendencia ?? null; // "S"|"D"|"M" — rising/falling/stable

                        const riverSituacao =
                            worstRiverStation?.attributes.situacao ?? null; // "Normal"|"Pré-alerta"|"Alerta"|"Inundação"

                        // === Forecast rain mm in next 3 hours.========================
                        const forecastMm = await getForecastRainMm(
                            zone.latitude,
                            zone.longitude,
                        );

                        console.log(
                            `[Zone] ${zone.name} → ` +
                            `Rain: ${maxRainMm}mm | River: ${riverSituacao ?? "N/A"} | ` +
                            `Tide: ${currentTideHeight}m | Forecast: ${forecastMm}mm`,
                        );

                        // == RISK CALCULATOR ========================================
                        const risk = calculateRisk(
                            maxRainMm,
                            riverSituacao,
                            riverTendencia,
                            currentTideHeight,
                            forecastMm,
                            forecastTideHeight,
                        );

                        if (risk.severity === "NONE") {
                            console.log(`[ZONE] ${zone.name} - ✓ No risk detected`);
                            continue;
                        }

                        // == Cooldown check — skip if a recent alert was already sent ===
                        const supressed = await wasRecentlySentZone(
                            zone.id,
                            risk.severity,
                        );
                        if (supressed) {
                            console.log(
                                `[ZONE] ${zone.name} - ⏸ Suppressed by cooldown policy`,
                            );
                            continue;
                        }

                        // Formating strings to build the Telegram message.
                        const zoneNameEscaped: string = escapeMd(zone.name);
                        const riskSeverity: Severity = risk.severity;
                        const riskReasonsEscaped: string[] = risk.reasons.map((reason) => escapeMd(reason));

                        // Sending data to zone summary array, to build a city-level alert at the end of the loop.
                        zoneSummaries.push({ zoneName: zoneNameEscaped, severity: riskSeverity, reasons: riskReasonsEscaped });

                        // == Build and broadcast the Telegram alert ==================
                        const message = buildMessage(
                            zoneNameEscaped,
                            riskSeverity,
                            riskReasonsEscaped,
                        );

                        // Collect unique chatIds across all neighborhoods in this zone.
                        // Set deduplicates — user only gets one message even if in 2 neighborhoods.
                        const chatIds = new Set<string>();

                        for (const neighborhood of zone.neighborhoods) {
                            for (const user of neighborhood.users) {
                                if (user.isActive) {
                                    chatIds.add(user.telegramChatId);
                                }
                            }
                        }

                        let sent = 0;

                        for (const chatId of chatIds) {
                            try {
                                await bot.telegram.sendMessage(chatId, message, {
                                    parse_mode: "MarkdownV2",
                                });
                                sent++;
                            } catch (err) {
                                // Per-user catch: one blocked/inactive account never stops the broadcast.
                                if (err instanceof Error) {
                                    console.error(
                                        `[TELEGRAM] Error sending to user ${chatId}: ${err.message}`,
                                    );
                                } else {
                                    console.error(
                                        `[TELEGRAM] Error sending to user ${chatId}:`,
                                        err,
                                    );
                                }
                            }
                        }

                        // == Saving the alert to the database ==================
                        const alertLog = await prisma.alertLog.create({
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

                        console.log(
                            `[ZONE] ${zone.name} - 🚨 Alert [${risk.severity}] broadcasted to ${sent} user(s) | log #${alertLog.id}`,
                        );

                    }; // end for zone
                    const supressed = await wasRecentlySentCity(city.id);

                    if (supressed) {
                        console.log(
                            `[CITY] ${city.name} - ⏸ Channel alert suppressed by cooldown policy`,
                        );
                        continue;
                    };

                    const redZones = zoneSummaries.filter(z => z.severity === 'RED');

                    // If this condition is false, it means we going to send a general alert for the channel.
                    if (redZones.length === 0 || supressed) {
                        console.log(
                            `[CITY] ${city.name} - No channel alert needed (no RED zones detected)`,
                        );
                        continue;
                    };

                    const channelId: number = Number(process.env.TELEGRAM_ALERT_CHANNEL_ID);
                    const channelMessage = buildCityChannelMessage(city.name, zoneSummaries);

                    try {
                        await bot.telegram.sendMessage(channelId, channelMessage, {
                            parse_mode: "MarkdownV2",
                        })

                    } catch (err) {
                        console.error(`[TELEGRAM] Failed to send city alert to channel ${channelId}:`, err);
                        continue;
                    };

                    await prisma.cityAlertLog.create({
                        data: {
                            cityId: city.id,
                            alertedZones: JSON.stringify(zoneSummaries),
                            hasRedAlert: true,
                            severity: 'RED',
                            messageSent: channelMessage,
                        }
                    });

                }; //end for city
            } catch (err) {
                console.error("[ERROR] Critical failure during flood monitoring cycle:", err);
            }
        },
        { timezone: "America/Recife" },
    );
};
