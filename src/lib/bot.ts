import { Telegraf } from 'telegraf';
import 'dotenv/config';

const token = process.env.TELEGRAM_API_TOKEN;

if (!token) {
    throw new Error('Token does not exist. ');
};

const bot = new Telegraf(token);

export { bot };