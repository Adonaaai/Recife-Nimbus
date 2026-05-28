import 'dotenv/config';
import { validateEnv } from './config/env.ts';
import { startTelegramBot } from './bot/telegramBot.ts';
import { monitorJob } from './cron/floodMonitoring.ts';

async function main() {
    try {
        // Validate environment variables before starting
        validateEnv();

        // Bot
        startTelegramBot();

        // Monitor
        await monitorJob();

    } catch (err) {
        console.error('Fatal error starting the application:', err);
        process.exit(1);
    };
};

main();