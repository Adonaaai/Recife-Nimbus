# 🌩️ Recife Nimbus

**An automated, community-driven flood alert system for the Recife Metropolitan Region (RMR).**

Recife and its surrounding cities in the RMR (Jaboatão dos Guararapes, Camaragibe, São Lourenço da Mata, Moreno, Vitória de Santo Antão, Olinda, Paulista, Igarassu, and others) are built across and near to an vast mangrove ecosystem. During the rainy season, the combination of heavy precipitation and high ocean tides (above 2.0m) frequently overwhelms cities' drainage systems, causing severe urban flooding and displacing residents.

**Recife Nimbus** is a lightweight, hyper-local early warning system. It monitors weather and river sensor APIs across all RMR cities, cross-references them with specific zone coordinates, and automatically dispatches warnings to a public Telegram channel and subscribed users before the streets flood.

---

## ✨ Core Features

### ⚙️ The Automated Monitoring Engine
* **Smart Multi-City Polling:** Cron job evaluates 3-hour forecasts for heavy rain intersecting with high tides across all Recife Metropolitan Region cities.
* **Hyper-Local Checking:** Iterates through PostgreSQL database organized by City → Zone → Neighborhood hierarchy.
* **Real-Time Data Integration:** Monitors APAC (Agência Pernambucana de Águas e Clima) rain sensors and river basin APIs for real-time conditions.
* **Tide Integration:** Cross-references ocean tide predictions with oficial data precipitation.
* **Anti-Spam Broadcasting:** Uses rate-limiting queues to prevent Telegram bot API throttling.

### 📡 Telegram Channel Monitoring (Automated Broadcast)
* **Public Alert Channel:** Automatically broadcasts critical flood warnings to a dedicated public Telegram channel when risk thresholds are met.
* **Alert Severity Levels:** 
  - 🟨 **YELLOW** (Predictive): 3-hour forecast shows dangerous rain + high tide combination
  - 🔴 **RED** (Real-Time Critical): Real-time APAC data confirms flooding conditions now
* **Message Templates:** Location-aware alerts include neighborhood name, rain forecast (mm), tide height (m), and river status.

### 🌍 Multi-City RMR Support
The system supports all cities in the Recife Metropolitan Region:
- Recife (central monitoring hub)
- Jaboatão dos Guararapes
- Camaragibe
- São Lourenço da Mata
- Moreno
- Vitória de Santo Antão
- Olinda
- Paulista
- Igarassu
- Abreu e Lima,
- Araçoiaba,
- Goiana,
- Ipojuca,
- Itapissuma,
- Moreno
- *Additional RMR cities can be added via database seeding*

Each city contains configurable zones (Zona Norte, Zona Sul, etc.) and neighborhoods with precise monitoring coordinates.

---

## 🛠️ Tech Stack

* **Language:** [TypeScript](https://www.typescriptlang.org/) / Node.js
* **Database:** PostgreSQL (Recommended: [Supabase](https://supabase.com/))
* **ORM:** [Prisma](https://www.prisma.io/)
* **Job Scheduling:** [node-cron](https://github.com/kelektiv/node-cron)
* **Telegram:** [Telegraf](https://github.com/telegraf/telegraf) + [telegraf-inline-menu](https://github.com/EdJoPaTo/telegraf-inline-menu)
* **External APIs:**
  - [Open-Meteo](https://open-meteo.com/) - Weather & Marine Data (Free, No Auth)
  - [APAC (Agência Pernambucana de Águas e Clima)](https://www.apac.pe.gov.br/) - Real-Time Rain Sensors & River Levels

---

## 🗄️ Database Schema Overview

The database is managed via Prisma with a geographic hierarchy built for scalable multi-city support across the Recife Metropolitan Region.

### **Geographic Hierarchy**
```
City
├── Zone (coordinates, API sensor keys, coastal flag)
│   └── Neighborhood (the alert target unit)
├── AlertLog (per-zone alert history)
└── CityAlertLog (consolidated per-city channel alerts)
```

### **Core Models**

| Model | Purpose | Key Fields |
|---|---|---|
| **City** | RMR city container | `id`, `name` |
| **Zone** | Sub-region within a city | `name`, `latitude`, `longitude`, `isCoastal`, `rainSensorNames[]`, `riverBasins[]`, `cityId` |
| **Neighborhood** | Street-level alert target | `id`, `name`, `zoneId` |
| **User** | Telegram subscriber | `telegramChatId`, `name`, `neighborhoodId`, `isActive` |
| **AlertLog** | Per-zone alert audit trail | `zoneId`, `rainLevel`, `tideLevel`, `forecastRainMm`, `forecastTide`, `riverLevel`, `riverTendencia`, `severity`, `messageSent`, `triggeredAt` |
| **CityAlertLog** | Consolidated city-level channel alert | `cityId`, `alertedZones`, `hasRedAlert`, `severity`, `messageSent`, `triggeredAt` |

### **Data Relationships**
- **1 City : N Zones** — Each city is divided into monitoring zones
- **1 Zone : N Neighborhoods** — Each zone covers multiple neighborhoods
- **1 Neighborhood : N Users** — Multiple users can subscribe to the same neighborhood
- **1 Zone : N AlertLogs** — Full alert history per zone (with cooldown control)
- **1 City : N CityAlertLogs** — Consolidated channel alerts per city

### **Notable Zone Fields**
- `isCoastal` — when `true`, the zone receives real tide data from `tides2026.json`; inland zones always receive `tideHeight: 0` to avoid false compound flood alerts
- `rainSensorNames[]` — matched against APAC pluviometer `nome` field to filter sensors for this zone
- `riverBasins[]` — matched against APAC fluviometer `namebasin` field to filter river stations

---

## 📡 Alert Broadcast System

### How Alerts Flow

```
1. Cron Job Triggers (every 15 min)
   ↓
2. Fetch ALL sensor data once (shared across all zones)
   - APAC Pluviometers  → real-time rain (hora_1 mm/h)
   - APAC Fluviometers  → river levels + situacao + tendencia
   - DHN tides2026.json → interpolated tide height now + in 3h
   ↓
3. For each City → For each Zone:
   - Filter APAC sensors by zone.rainSensorNames and zone.riverBasins
   - Fetch Open-Meteo forecast for zone coordinates (next 3 hours)
   - If zone.isCoastal = false → tide forced to 0m (no tidal influence)
   ↓
4. Risk Calculator (calculateRisk):

   🚨 RED — any one of:
   - Real-time rain ≥ 30mm/h
   - River = "Alerta" or "Inundação"
   - Current tide ≥ 2.5m
   - Rain ≥ 15mm/h AND tide ≥ 2.0m        (compound — current)
   - Forecast ≥ 15mm AND tide ≥ 2.0m (3h)  (compound — predictive)

   🟡 YELLOW — any one of:
   - Real-time rain ≥ 15mm/h
   - River = "Pré-alerta"
   - Forecast rain ≥ 10mm (next 3h)
   - Forecast tide ≥ 2.5m (next 3h)
   - High tide ≥ 2.0m — context only, never triggers alone
   ↓
5. Zone Broadcast (if risk ≠ NONE and cooldown passed):
   - RED cooldown:    60 min
   - YELLOW cooldown: 180 min
   - DM sent to every isActive user subscribed to that zone
   - Alert saved to AlertLog
   ↓
6. City Channel Broadcast (RED zones only):
   - Consolidates all RED zones of the city into one message
   - Sends to TELEGRAM_CHANNEL_ID
   - City cooldown: 60 min
   - Saved to CityAlertLog
```

---

## 🔧 Architecture Details

### Cron Job (`src/cron/floodMonitoring.ts`)
- Runs on configurable schedule (default: every 15 minutes)
- Iterates through all zones across all cities
- Calls external APIs and calculates risk
- Broadcasts alerts to Telegram channel + individual users

### Controller Chain
1. **getForecastRainMm** - Open-Meteo API for predicted rainfall
2. **getCurrentTideHeight** - Real-time tide data
3. **getForecastTideHeight** - Tide forecast (3 hours)
4. **calculateRisk** - Combines inputs, determines alert severity
5. **buildMessage** - Formats alert text with emojis and details

---

## 🛡️ Monitoring & Observability

### AlertLog Table
Every alert broadcast is logged with:
- Zone ID & timestamp
- Real-time conditions (rain, tide, river status)
- Forecast data at time of alert
- Exact message sent (for audit trail)
- Severity level (YELLOW / RED)

### Telegram Channel
- General city-wide broadcast alert logs with severity RED

# View recent alerts
SELECT * FROM "AlertLog" ORDER BY "triggeredAt" DESC LIMIT 10;

# View user subscriptions
SELECT COUNT(*) as active_users FROM "User" WHERE "isActive" = true;

---


## 🧪 Development

### Project Structure
```
src/
├── index.ts                         # Entry point
├── lib/
│   ├── prisma.ts                    # Prisma client singleton
│   ├── bot.ts                       # Telegraf bot instance
│   ├── rateLimiter.ts               # Bot rate limiter
│   └── validators.ts                # Security validators
├── bot/
│   └── telegramBot.ts               # Bot command handlers & menus
├── config/
│   ├── env.ts                       # Environment variable helpers
│   ├── tides2026.json               # DHN tide table (Porto do Recife)
│   └── neighborhoods-official.json  # Neighborhoods reference data
├── cron/
│   ├── floodMonitoring.ts           # Main cron job (runs every 15 min)
│   ├── types/
│   │   └── types.ts                 # Interfaces, thresholds & constants
│   └── controllers/
│       ├── calculateRisk.ts         # Risk decision engine (pure function)
│       ├── buildMessage.ts          # Telegram message formatter
│       ├── getCurrentTideHeight.ts  # Interpolates tide height right now
│       ├── getForecastTideHeight.ts # Interpolates tide height in 3 hours
│       └── getForecastRainMm.ts     # Open-Meteo 3h rain forecast

prisma/
├── schema.prisma                    # Database models
├── seed.ts                          # Seeds RMR cities, zones & neighborhoods
└── migrations/                      # Auto-generated migration history
```
---

## 🤝 Contributing

Contributions welcome! Areas for enhancement:
- [ ] Machine learning for alert accuracy
- [ ] Mobile app (React Native)
- [ ] WhatsApp integration
- [ ] SMS alerts for critical warnings
- [ ] Historical flood pattern analysis
- [ ] Push notifications via PWA

### Pull Request Process
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push branch: `git push origin feature/amazing-feature`
5. Open Pull Request with description

---

## 📜 License

This project is licensed under the ISC License. See [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **APAC (Agência Pernambucana de Águas e Clima)** - Real-time hydrological data
- **Open-Meteo** - Free weather & marine APIs
- **Telegram Bot API** - Community alert delivery
- **Recife & RMR residents** - Inspiration and use case

---

## 📞 Contact & Support

For issues, questions, or suggestions:
- Open an [GitHub Issue](../../issues)
- Check existing [GitHub Discussions](../../discussions)

**Current Maintainers:** Adonai Artur dev

---

*Last Updated: 2026-06-03*  
*Status: Feature Complete - Production Ready (Cron monitoring optional)*
