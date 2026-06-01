import { Telegraf } from 'telegraf';
import 'dotenv/config';
import { env } from '../config/env.ts';

const token = process.env.TELEGRAM_API_TOKEN;

if (!token) {
    throw new Error(
        "TELEGRAM_API_TOKEN environment variable is not set. " +
        "Please add it to your .env file. Get it from BotFather on Telegram."
    );
};

if (token.trim() === '') {
    throw new Error("TELEGRAM_API_TOKEN environment variable is empty.");
};

const bot = new Telegraf(token);


export { bot };