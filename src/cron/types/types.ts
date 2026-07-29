// Thresholds
export const T = {
  // accumulated/prolonged totals
  PROLONGED_RAIN_3H_MM: 25,
  PROLONGED_RAIN_24H_MM: 50,

  // Rain intensity thresholds
  RAIN_RED_MM: 30,
  RAIN_YELLOW_MM: 15,
  FORECAST_MM: 10,

  // Tides metres.
  TIDE_HIGH_M: 2.0,
  TIDE_EXTREME_M: 2.7,

  // Compound rain and tide.
  COMPOUND_RAIN_MM: 15,
  COMPOUND_TIDE_M: 2.0,

  // forecast compound rain (updated from 2mm to a realistic value)
  FORECAST_COMPOUND_RAIN_MM: 15,

  // Cooldowns for no spamming.
  COOLDOWN_RED_MIN: 60,
  COOLDOWN_YELLOW_MIN: 180,

  // "as const" for never change in the runtime.
} as const;

// Rain sensors interface for predict APAC pluviometer API.
export interface RainSensor {
  attributes: {
    // The sensor name, e.g. "[CEMADEN] Areias"
    nome: string,

     // The river basin this sensor belongs to, e.g. "Capibaribe", "GL2"
    bacia: string,

    // City name, e.g. "Recife", "Jaboatão dos Guararapes"
    municipio: string

    // Rain in the LAST 1 HOUR in millimetres.
    hora_1: number;

    // Rain in the LAST 3 HOURS in millimetres (APAC field often called 'horas_3' or 'hora_3').
    // Mark optional to tolerate sensors that don't provide it.
    horas_3: number;
    hora_3: number;

    // Rain in the LAST 24 HOURS in millimetres (APAC field often called 'horas_24' or 'hora_24').
    horas_24: number;
    hora_24: number;

  }
};

// River sensors interface for predict APAC fluviometer API.
export interface RiverSensor {
  attributes: {
    namestation: string;
    namebasin: string;
    levelnow: number;
    situacao: string;
    tendencia: string;        // "S" | "D" | "M"
    alerta_tendencia: string; // "AS" | "AM" | "AD" | "PS" | ... | "MA"
    recent: string;           // "s" = recent, anything else = stale
  };
};

export type Severity = 'NONE' | 'YELLOW' | 'RED';

// This interface help us build the telegram message.
export interface ZoneRisk {
  severity: Severity;
  maxRainMm: number;
  prolongedRain3h: number;
  prolongedRain24h: number;
  riverSituacao: string | null; // null if doesn't exist river in this zone.
  riverTendencia: string | null
  tideHeight: number;
  forecastMm: number;
  forecastTide: number; // 3 next hours Tide height
  reasons: string[]; // Example: ["Chuva intensa: 35mm/h", "Maré alta: 2.3m"]
};

// typed dictionary
export const TREND_LABEL: Record<string, string> = {
  'S': '↑ subindo',
  'M': '→ estável',
  'D': '↓ descendo',
};

export const SEVERITY_ORDER = {
  "Normal": 0,
  "Pré-alerta": 1,
  'Alerta':     2,
  "Inundação": 3
};


