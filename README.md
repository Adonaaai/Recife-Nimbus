# Recife Nimbus

**An automated flood alert telegram bot for the Recife Metropolitan Region (RMR).**

Recife and its surrounding cities are built across a vast mangrove ecosystem. During the rainy season, the combination of heavy precipitation and high ocean tides (above 2.0m) frequently overwhelms drainage systems, causing severe urban flooding. **Recife Nimbus** monitors weather, local rain sensors and local river sensor APIs across all RMR cities, cross-references them with zone coordinates, and dispatches warnings to a public Telegram channel and subscribed users before the streets flood.

## Links & Community

| Platform | Link | Description |
|---|---|---|
| ![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=flat&logo=telegram&logoColor=white) | [Recife Nimbus \| Alertas Oficiais](https://t.me/+GzmJKR2chEs1ZTlh) | Public city-wide RED alerts |
| ![Bot](https://img.shields.io/badge/Telegram_Bot-2CA5E0?style=flat&logo=telegram&logoColor=white) | [@Recife\_Nimbus\_BOT](https://web.telegram.org/k/#@Recife_Nimbus_BOT) | Personal zone alerts via DM |
| ![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=flat&logo=instagram&logoColor=white) | [@recifenimbus](https://www.instagram.com/recifenimbus/) | Community updates and news |

---

## Hosting

| Service | Provider | Plan |
|---|---|---|
| Bot & Cron Engine | [Render](https://render.com) | Free tier |
| PostgreSQL Database | [Supabase](https://supabase.com) | Free tier |

## Features

### Automated Monitoring Engine
- **Multi-City Polling:** Evaluates 3-hour rain forecasts intersecting with tide levels across all RMR cities every 15 minutes.
- **Hyper-Local Evaluation:** Iterates through a PostgreSQL hierarchy of City → Zone → Neighborhood.
- **Real-Time Data Integration:** Monitors APAC (Agência Pernambucana de Águas e Clima) rain sensors and river basin stations.
- **Tide Cross-Reference:** Interpolates DHN tide table data for coastal zones; inland zones receive zero tidal weight.
- **Anti-Spam Cooldowns:** Zone alerts: RED = 60 min, YELLOW = 180 min. City channel alerts: 60 min.

### Telegram Alert Broadcasts
- **Public Channel:** Broadcasts consolidated RED alerts to a dedicated public Telegram channel per city.
- **Direct Messages:** Sends zone-level alerts directly to subscribed users via DM.
- **Severity Levels:**
  - **YELLOW** (Predictive): Forecast indicates dangerous rain or tide conditions within 3 hours.
  - **RED** (Real-Time Critical): APAC sensors confirm active flooding conditions.

### Multi-City RMR Coverage
The system supports the full Recife Metropolitan Region:

| City | City |
|---|---|
| Recife | Olinda |
| Jaboatão dos Guararapes | Paulista |
| Camaragibe | Igarassu |
| São Lourenço da Mata | Abreu e Lima |
| Moreno | Araçoiaba |
| Goiana | Ipojuca |
| Itapissuma | Ilha de Itamaracá |
| Cabo de Santo Agostinho | — |

Additional cities can be added via database seeding without code changes.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript / Node.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Job Scheduling | node-cron |
| Hosting | Render (bot sistem) + Supabase (DB) |
| Tide Data | DHN tides2026.json (Porto do Recife) |
| Telegram | Telegraf + telegraf-inline-menu |
| Rain Forecast | Open-Meteo API (free, no auth) |
| Real-Time Sensors | APAC ArcGIS API |

---

## Database Schema

The database uses a geographic hierarchy designed for scalable multi-city support.

### Geographic Hierarchy

```
City
├── Zone
│   └── Neighborhood
├── AlertLog (per-zone alert history)
└── CityAlertLog (consolidated per-city channel alerts)
```

### Core Models

| Model | Purpose | Key Fields |
|---|---|---|
| **City** | RMR city container | `id`, `name` |
| **Zone** | Sub-region within a city | `name`, `latitude`, `longitude`, `isCoastal`, `rainSensorNames[]`, `riverBasins[]`, `cityId` |
| **Neighborhood** | Street-level alert target | `id`, `name`, `zoneId` |
| **User** | Telegram subscriber | `telegramChatId`, `name`, `neighborhoodId`, `isActive` |
| **AlertLog** | Per-zone alert audit trail | `zoneId`, `rainLevel`, `tideLevel`, `forecastRainMm`, `forecastTide`, `riverLevel`, `riverTendencia`, `severity`, `messageSent`, `triggeredAt` |
| **CityAlertLog** | Consolidated city-level channel alert | `cityId`, `alertedZones`, `hasRedAlert`, `severity`, `messageSent`, `triggeredAt` |

### Data Relationships

- **1 City : N Zones** — Each city is divided into monitoring zones
- **1 Zone : N Neighborhoods** — Each zone covers multiple neighborhoods
- **1 Neighborhood : N Users** — Multiple users can subscribe to the same neighborhood
- **1 Zone : N AlertLogs** — Full alert history per zone with cooldown enforcement
- **1 City : N CityAlertLogs** — Consolidated channel alerts per city

### Notable Zone Fields

- `isCoastal` — when `true`, the zone receives interpolated tide data from `tides2026.json`; inland zones receive `tideHeight: 0` to prevent false compound flood alerts
- `rainSensorNames[]` — matched against APAC pluviometer `nome` field to filter sensors per zone
- `riverBasins[]` — matched against APAC fluviometer `namebasin` field to filter river stations per zone

---

## Alert System

### How Alerts Flow

```
1. Cron job triggers (every 15 minutes)
   |
2. Fetch all sensor data once (shared across zones)
   - APAC Pluviometers   real-time rain (hora_1 mm/h)
   - APAC Fluviometers   river levels + situacao + tendencia
   - DHN tides2026.json  interpolated tide height now and in 3 hours
   |
3. For each City, for each Zone:
   - Filter APAC sensors by zone.rainSensorNames and zone.riverBasins
   - Fetch Open-Meteo forecast for zone coordinates (next 3 hours)
   - If zone.isCoastal = false, tide is forced to 0m
   |
4. Risk calculator (calculateRisk):

   RED — any one condition triggers:
   - Real-time rain >= 30mm/h
   - River status = "Alerta" or "Inundacao"
   - Current tide >= 2.7m
   - Rain >= 15mm/h AND tide >= 2.0m         (compound, current)
   - Forecast >= 15mm AND tide >= 2.0m (3h)  (compound, predictive)

   YELLOW — any one condition triggers:
   - Real-time rain >= 15mm/h
   - River status = "Pre-alerta"
   - Forecast rain >= 10mm (next 3h)
   - Forecast tide >= 2.5m (next 3h)
   - High tide >= 2.0m  (context only, never triggers alone)
   |
5. Zone broadcast (if severity != NONE and cooldown has passed):
   - RED cooldown:    60 minutes
   - YELLOW cooldown: 180 minutes
   - Direct message sent to every active user subscribed to the zone
   - Alert saved to AlertLog
   |
6. City channel broadcast (RED zones only):
   - Consolidates all RED zones of the city into one message
   - Sent to TELEGRAM_CHANNEL_ID
   - City cooldown: 60 minutes
   - Saved to CityAlertLog
```

### Compound Rule

The most important rule in the system. In Recife, high tide physically blocks the river mouths, preventing drainage from reaching the ocean. As a result, 15mm/h of rain combined with a 2.0m tide causes the same flooding as 40mm/h on a low-tide day. This rule applies both to current conditions and to the 3-hour forecast.

---

## Architecture

### Project Structure

```
src/
├── index.ts                          Entry point
├── lib/
│   ├── prisma.ts                     Prisma client singleton
│   ├── bot.ts                        Telegraf bot instance
│   ├── rateLimiter.ts                Bot rate limiter
│   └── validators.ts                 Input sanitization and security helpers
├── bot/
│   └── telegramBot.ts                Bot command handlers and inline menus
├── config/
│   ├── env.ts                        Environment variable helpers
│   ├── tides2026.json                DHN tide table (Porto do Recife)
│   └── neighborhoods-official.json  Neighborhoods reference data
└── cron/
    ├── floodMonitoring.ts            Main cron job (runs every 15 minutes)
    ├── types/
    │   └── types.ts                  Interfaces, thresholds and constants
    └── controllers/
        ├── calculateRisk.ts          Risk decision engine (pure function)
        ├── buildMessage.ts           Telegram message formatter
        ├── getCurrentTideHeight.ts   Interpolates current tide height
        ├── getForecastTideHeight.ts  Interpolates tide height in 3 hours
        └── getForecastRainMm.ts      Open-Meteo 3-hour rain forecast

prisma/
├── schema.prisma                     Database models
├── seed.ts                           Seeds RMR cities, zones and neighborhoods
└── migrations/                       Auto-generated migration history
```

### Controller Chain

| Order | Controller | Responsibility |
|---|---|---|
| 1 | `getForecastRainMm` | Calls Open-Meteo for predicted rainfall per zone |
| 2 | `getCurrentTideHeight` | Interpolates current tide from DHN JSON |
| 3 | `getForecastTideHeight` | Interpolates tide height 3 hours from now |
| 4 | `calculateRisk` | Combines all inputs, returns severity and reasons |
| 5 | `buildMessage` | Formats the Telegram alert string |

---

## Observability

### AlertLog Table

Every alert is logged with zone ID, timestamp, real-time conditions at the moment of dispatch (rain, tide, river status, forecast values), the exact message text sent, and severity level. This provides a full audit trail for post-event analysis.

```sql
-- View recent alerts
SELECT * FROM "AlertLog" ORDER BY "triggeredAt" DESC LIMIT 10;

-- View active subscribers
SELECT COUNT(*) AS active_users FROM "User" WHERE "isActive" = true;
```

### CityAlertLog Table

Tracks consolidated city-level RED alerts sent to the public channel, including which zones triggered and whether any zone reached RED severity.

---

## Development

### Prerequisites

- Node.js 18+
- PostgreSQL (local via Docker or hosted via Supabase)
- Telegram bot token (via BotFather)
- Telegram channel ID

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/recife_nimbus
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHANNEL_ID=your_channel_id
```

### Setup

```bash
git clone https://github.com/Adonaaai/Recife-Nimbus
cd Recife-Nimbus
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

---

## Contributing

Contributions are welcome. Potential areas for enhancement:

- [ ] Historical flood pattern analysis
- [ ] PWA push notifications
- [ ] WhatsApp integration
- [ ] SMS fallback for critical alerts
- [ ] Predictive ML model for alert accuracy

### Pull Request Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push the branch: `git push origin feature/your-feature`
5. Open a pull request with a clear description of the change

---

## Acknowledgments

- **APAC (Agência Pernambucana de Águas e Clima)** — Real-time hydrological sensor data
- **DHN (Diretoria de Hidrografia e Navegação)** — Official tide table for Porto do Recife
- **Open-Meteo** — Free, open-source weather forecast API
- **Telegram Bot API** — Alert delivery infrastructure

---

## License

ISC License. See [LICENSE](LICENSE) for details.

---

**Maintainer:** Adonai Artur  
**Last updated:** June 2026
