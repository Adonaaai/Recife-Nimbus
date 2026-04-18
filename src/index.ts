import 'dotenv/config';
import { startTelegramBot } from './bot/telegramBot.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { monitorJob } from './cron/monitorJob.ts'

import 'dotenv/config';
import app from './server.ts';

const port = parseInt(process.env.PORT || '3000');

async function main() {
    try {
        // Server
        app.listen(port, () => {
            console.log(`Currently API running on htpp://localhost:${port}`);
        });

        // Bot
        startTelegramBot();

        // Monitor
        monitorJob();

    } catch (err) {
        console.error('Fatal error starting the application:', err);
        process.exit(1);
    };
};

main();