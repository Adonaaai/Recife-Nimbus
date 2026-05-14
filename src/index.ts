import 'dotenv/config';
import { startTelegramBot } from './bot/telegramBot.ts';

async function main() {
    try {
        // Monitor
        //monitorJob();

        // Bot
        startTelegramBot();

    } catch (err) {
        console.error('Fatal error starting the application:', err);
        process.exit(1);
    };
};

main();