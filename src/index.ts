import 'dotenv/config';
import { validateEnv } from './config/env.ts';
import { startTelegramBot } from './bot/telegramBot.ts';
import { monitorJob, executeMonitoringCycle } from './cron/floodMonitoring.ts';
import http from 'http';

const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  if (req.url === '/healthz' || req.url === '/') {
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
        validateEnv();

        // 1. Inicia os listeners do Bot
        startTelegramBot();

        // 2. Registra o agendador automático em background (a cada 15min)
        await monitorJob();
        console.log('⏱️ [CRON] Monitoramento automático agendado com sucesso.');

        // 3. 🔥 EXECUÇÃO IMEDIATA: Roda agora mesmo para validar se está funcionando!
        console.log('⚡ [BOOT] Forçando execução imediata do primeiro ciclo...');
        await executeMonitoringCycle();

    } catch (err) {
        console.error('Fatal error starting the application:', err);
        process.exit(1);
    }
}

main();