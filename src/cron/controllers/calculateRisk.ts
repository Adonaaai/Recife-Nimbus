import { ZoneRisk, T, TREND_LABEL } from "../types/types.ts";

// === calculateRisk return examples ===========================================================================================

//                 maxRainMm  riverSituacao  riverTendencia  tideHeight  forecastMm  forecastTide
//    calculateRisk(35,       'Normal',      null,           1.5,        5,          1.8) → RED    (chuva intensa)
//    calculateRisk(0,        'Normal',      null,           1.0,        0,          1.0) → NONE   (tudo normal)
//    calculateRisk(16,       'Normal',      null,           2.2,        0,          1.5) → RED    (composto atual)
//    calculateRisk(5,        'Normal',      null,           1.0,        16,         2.2) → RED    (composto previsto)
//    calculateRisk(0,        'Normal',      null,           1.0,        12,         1.0) → YELLOW (previsão de chuva)
//    calculateRisk(0,        'Normal',      null,           1.0,        5,          2.6) → YELLOW (maré extrema prevista)
//    calculateRisk(0,        'Pré-alerta',  'S',            1.0,        0,          1.0) → YELLOW (rio em observação ↑ subindo)
//    calculateRisk(0,        'Alerta',      'D',            1.0,        0,          1.0) → RED    (rio em alerta ↓ descendo)

// =============================================================================================================================

export const calculateRisk = (
    maxRainMm: number,
    prolongedRain3h: number,
    prolongedRain24h: number,
    riverSituacao: string | null,
    riverTendencia: string | null,
    tideHeight: number,
    forecastMm: number,
    forecastTide: number,
): ZoneRisk => {

    const reasons: string[] = [];

    const trendLabel = TREND_LABEL[riverTendencia ?? ''] ?? '';

    // ==== Red conditions: =====================================================
    const rainAlerted = maxRainMm >= T.RAIN_RED_MM;
    
    // APAC rivers alerted
    const riverAlerted =
        riverSituacao === 'Alerta' ||
        riverSituacao === 'Inundação';

    const tideAlerted = tideHeight >= T.TIDE_EXTREME_M;

    // Thriggered if we already have high rains and tides.
    const currentCompoundAlerted = 
        maxRainMm >= T.COMPOUND_RAIN_MM &&
        tideHeight >= T.COMPOUND_TIDE_M;
    
    // Thriggered only when we foresee high rains and tides in next 3 hours.
    const forecastCompoundAlerted =
        forecastMm >= T.FORECAST_COMPOUND_RAIN_MM &&
        forecastTide >= T.COMPOUND_TIDE_M;

    const prolonged24hAlerted = prolongedRain24h >= T.PROLONGED_RAIN_24H_MM;
    // ========================================================================

    if (rainAlerted) reasons.push(`Chuva intensa: ${maxRainMm}mm/h`);

    if (riverAlerted) {
        // Using .trim() to drop final spaces if trendLabel === "".
        reasons.push(`Rio em ${riverSituacao} ${trendLabel}`.trim());
    };

    if (tideAlerted) reasons.push(`Maré Extrema: ${tideHeight}m`);
    if (currentCompoundAlerted) reasons.push(`Risco de Alagamentos: ${maxRainMm}mm/h e maré ${tideHeight}m`);
    if (forecastCompoundAlerted) reasons.push(`Risco de Alagamentos ${forecastMm}mm/h e maré ${forecastTide}m  Previstos para as proximas 3 horas`);
    if (prolonged24hAlerted) reasons.push(`Chuva acumulada 24h: ${prolongedRain24h}mm`);

    // Checking if any of the conditions is thriggered.
    if (rainAlerted || riverAlerted || tideAlerted || currentCompoundAlerted || forecastCompoundAlerted || prolonged24hAlerted) {
        return {
            severity: 'RED',
            maxRainMm,
            prolongedRain3h,
            prolongedRain24h,
            riverSituacao,
            riverTendencia,
            tideHeight,
            forecastMm,
            forecastTide,
            reasons,
        };
    };

    // ==== Yellow conditions: =====================================================
    const modRain = 
        maxRainMm >= T.RAIN_YELLOW_MM;
  
    const prolonged3hYellow =
        prolongedRain3h >= T.PROLONGED_RAIN_3H_MM;

    // River is being watched — not dangerous yet but heading there.
    const riverYellow =
        riverSituacao === 'Pré-alerta';

    const highForecast =
        forecastMm >= T.FORECAST_MM;
  
    // ≥2.0m — drainage weakening, adds context to the other triggers.
    const highTide = 
        tideHeight >= T.TIDE_HIGH_M;

    // Extreme Tide in next 3 hours.
    const extremeForecastTide = 
        forecastTide >= T.TIDE_EXTREME_M; 

    // ========================================================================

    if (modRain) reasons.push(`Chuva moderada: ${maxRainMm}mm/h`);
    if (prolonged3hYellow) reasons.push(`Chuva acumulada 3h: ${prolongedRain3h}mm`);

    if (riverYellow) {
        // Using .trim() to drop final spaces if trendLabel === "".
        reasons.push(`Rio em Pré-alerta ${trendLabel}`.trim());
    };

    if (highForecast) reasons.push(`Previsão: ${forecastMm}mm nas próximas 3h`);
    if (highTide)     reasons.push(`Maré alta: ${tideHeight}m`);
    if (extremeForecastTide) reasons.push(`Maré Extrema nas proximas 3 horas: ${forecastTide}m`);

    if (modRain || prolonged3hYellow || riverYellow || highForecast || extremeForecastTide) {
        return {
            severity: 'YELLOW',
            maxRainMm,
            prolongedRain3h,
            prolongedRain24h,
            riverSituacao,
            riverTendencia,
            tideHeight,
            forecastMm,
            forecastTide,
            reasons
        }
    };

    // If anything is thriggered we return the data back with severity "NONE".
    return {
        severity: 'NONE',
        maxRainMm,
        prolongedRain3h,
        prolongedRain24h,
        riverSituacao,
        riverTendencia,
        tideHeight,
        forecastMm,
        forecastTide,
        reasons: []
    }
};
