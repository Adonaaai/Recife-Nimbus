import { Telegraf } from 'telegraf';
import 'dotenv/config';
import { env } from '../config/env.ts';

const token = env.getTelegramToken();

const bot = new Telegraf(token);

export { bot };