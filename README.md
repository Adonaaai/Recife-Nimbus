# 🌩️ Recife Nimbus

![Status: Work in Progress](https://img.shields.io/badge/Status-Work_in_Progress-orange?style=for-the-badge)
> ⚠️ **Project Status: In Active Development (WIP)**
> This project is currently being built. The database schema is defined, and the automated weather fetching is being implemented, but the Telegram bot is not yet live for public use. Expect frequent code changes!

> **An automated, community-driven flood alert system for the Recife Metropolitan Region.**

Recife and its surrounding cities (like Camaragibe and Jaboatão) are built across a vast mangrove ecosystem. During the rainy season, the combination of heavy precipitation and high ocean tides (above 2.0m) frequently overwhelms the city's drainage, causing severe urban flooding and displacing residents.

**Recife Nimbus** is a lightweight, hyper-local early warning system. It monitors weather and marine APIs, cross-references them with specific neighborhood coordinates, and automatically dispatches warnings to a public Telegram channel before the streets flood. 

---
## ✨ Core Features

### ⚙️ The Automated Engine
* **Smart Polling:** A cron job evaluates the short-term forecast (next 3 hours) for heavy rain intersecting with high tides.
* **Hyper-Local Checking:** Iterates through a seeded PostgreSQL database of local neighborhoods and their coordinates.
* **Anti-Spam Broadcasting:** Pushes automated warnings to Telegram using rate-limiting queues to prevent bot bans.

### 📱 The Community Bot (Telegram)
* `/status [neighborhood]` - Instantly fetches the current rain prediction and tide level for a specific area.
* `/report [description]` - Allows residents to crowdsource flood data (e.g., *"Av. Caxangá is flooded"*), which is saved to the database and forwarded to the public channel with a 🚨 alert.

---

## 🛠️ Tech Stack

* **Language:** [TypeScript](https://www.typescriptlang.org/) / Node.js
* **Database:** PostgreSQL (Hosted on [Supabase](https://supabase.com/))
* **ORM:** [Prisma](https://www.prisma.io/)
* **APIs:** * [Open-Meteo](https://open-meteo.com/) (Free Weather & Marine Data)
  * [Telegram Bot API](https://core.telegram.org/bots/api)

---

## 🗄️ Database Schema Overview

The database is managed via Prisma and consists of three main models:
1. `Neighborhood`: Stores the coordinates (lat/lon) of areas to monitor.
2. `AlertLog`: Keeps an audit trail of every automated alert sent out.
3. `UserReport`: Stores crowdsourced flood pins reported by the community.

---

## 🚀 Getting Started

Follow these steps to run Recife Nimbus locally.

### Prerequisites
* Node.js (v18 or higher)
* A free [Supabase](https://supabase.com/) account (or local PostgreSQL database)
* A Telegram Bot Token (from [BotFather](https://t.me/botfather))
