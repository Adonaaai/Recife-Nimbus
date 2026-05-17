# 🌩️ Recife Nimbus

![Status: Near Completion](https://img.shields.io/badge/Status-Near_Completion-blue?style=for-the-badge)
> 📡 **Project Status: Feature Complete - Final Integration Phase**
> Core functionality is complete. The system monitors weather and marine conditions across the Recife Metropolitan Region and broadcasts alerts via automated Telegram channel and community bot. Production deployment underway.

**An automated, community-driven flood alert system for the Recife Metropolitan Region (RMR).**

Recife and its surrounding cities in the RMR (Jaboatão dos Guararapes, Camaragibe, São Lourenço da Mata, Moreno, Vitória de Santo Antão, Olinda, Paulista, Igarassu, and others) are built across a vast mangrove ecosystem. During the rainy season, the combination of heavy precipitation and high ocean tides (above 2.0m) frequently overwhelms cities' drainage systems, causing severe urban flooding and displacing residents.

**Recife Nimbus** is a lightweight, hyper-local early warning system. It monitors weather and marine APIs across all RMR cities, cross-references them with specific zone and neighborhood coordinates, and automatically dispatches warnings to a public Telegram channel and subscribed users before the streets flood.

---

## ✨ Core Features

### ⚙️ The Automated Monitoring Engine
* **Smart Multi-City Polling:** Cron job evaluates 3-hour forecasts for heavy rain intersecting with high tides across all Recife Metropolitan Region cities.
* **Hyper-Local Checking:** Iterates through PostgreSQL database organized by City → Zone → Neighborhood hierarchy.
* **Real-Time Data Integration:** Monitors APAC (Agência Pernambucana de Águas e Clima) rain sensors and river basin APIs for real-time conditions.
* **Tide Integration:** Cross-references ocean tide predictions with precipitation forecasts.
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
  - [Telegram Bot API](https://core.telegram.org/bots/api) - Alert Delivery

---

## 🗄️ Database Schema Overview

The database is managed via Prisma with a geographic hierarchy for scalable multi-city support:

### **Geographic Hierarchy**
```
City
  ├── Zone (with monitoring coordinates & API keys)
  │   └── Neighborhood (the alert target unit)
  └── AlertLog (alert history per zone)
```

### **Core Models**

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **City** | RMR city container | `id`, `name` (e.g., "Recife", "Jaboatão dos Guararapes") |
| **Zone** | Sub-region within city | `id`, `name`, `latitude`, `longitude`, `rainSensorNames[]`, `riverBasins[]`, `cityId` |
| **Neighborhood** | Street-level alert target | `id`, `name`, `zoneId` |
| **User** | Telegram subscriber | `id`, `telegramChatId`, `name`, `neighborhoodId`, `isActive` |
| **AlertLog** | Alert audit trail | `id`, `zoneId`, `rainLevel`, `tideLevel`, `forecastRainMm`, `forecastTide`, `riverLevel`, `severity`, `messageSent`, `triggeredAt` |

### **Data Relationships**
- **1 City : N Zones** - Each city has multiple monitoring zones
- **1 Zone : N Neighborhoods** - Each zone covers multiple neighborhoods
- **1 Neighborhood : N Users** - Multiple users can subscribe to the same neighborhood
- **1 Zone : N AlertLogs** - Alert history per zone (no spam across cities)

---

## 📡 Alert Broadcast System

### How Alerts Flow

```
1. Cron Job Triggers (every 15 min)
   ↓
2. For each Zone:
   - Fetch Open-Meteo forecast (next 3 hours)
   - Fetch APAC real-time rain + river data
   - Fetch tide predictions
   ↓
3. Risk Assessment:
   - IF forecast_rain > 5mm AND tide > 1.8m → YELLOW alert
   - IF real_time_rain > 20mm AND tide > 2.0m → RED alert
   ↓
4. Broadcast:
   - Send formatted message to Telegram channel
   - Log to AlertLog table
   - Send to subscribed users
```

### Alert Message Example

```
🔴 ALERTA DE INUNDAÇÃO - RECIFE

📍 Zona Sul - Boa Viagem
⏰ 15:30 - Próximas 3 horas

🌧️ Chuva prevista: 12.5mm
🌊 Maré em alta: 1.95m
🏞️ Rio Capibaribe: ALERTA (subindo)

⚠️ RISCO CRÍTICO - Evite áreas baixas!
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
6. **Broadcast** - Sends to channel + users

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
- Public broadcast log of all YELLOW/RED alerts
- Community reports forwarded with 🚨
- Provides public transparency & disaster archive

### Health Checks
```bash
# View recent alerts
SELECT * FROM "AlertLog" ORDER BY "triggeredAt" DESC LIMIT 10;

# View user subscriptions
SELECT COUNT(*) as active_users FROM "User" WHERE "isActive" = true;

# View crowdsourced reports
SELECT * FROM "UserReport" ORDER BY "createdAt" DESC;
```

---


## 🧪 Development

### Project Structure
```
src/
  ├── index.ts                 # Entry point
  ├── lib/
  │   ├── prisma.ts           # Prisma client
  │   └── bot.ts              # Telegram bot setup
  ├── bot/
  │   └── telegramBot.ts       # Bot command handlers
  ├── cron/
  │   ├── floodMonitoring.ts   # Job scheduler
  │   ├── types/
  │   │   └── types.ts
  │   └── controllers/
  │       ├── getForecastRainMm.ts
  │       ├── getForecastTideHeight.ts
  │       ├── getCurrentTideHeight.ts
  │       ├── calculateRisk.ts
  │       └── buildMessage.ts
prisma/
  ├── schema.prisma            # Database models
  ├── seed.ts                  # Initialize RMR cities/zones
  └── migrations/
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

**Current Maintainers:** Team Recife Nimbus

---

*Last Updated: 2026-05-17*  
*Status: Feature Complete - Production Ready*
