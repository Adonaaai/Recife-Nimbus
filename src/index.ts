import 'dotenv/config';
import { startTelegramBot } from './bot/telegramBot.ts';
import { monitorJob } from './cron/floodMonitoring.ts';

async function main() {
    try {
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