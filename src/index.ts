import 'dotenv/config';
import { validateEnv } from './config/env.ts';
import { startTelegramBot } from './bot/telegramBot.ts';
import { monitorJob } from './cron/floodMonitoring.ts';
import http from 'http';

const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Recife Nimbus engine monitoring active on port ${PORT}`);
});

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