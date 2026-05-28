import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').url('DATABASE_URL must be a valid URL'),
  TELEGRAM_API_TOKEN: z.string().min(1, 'TELEGRAM_API_TOKEN is required'),
  TELEGRAM_ALERT_CHANNEL_ID: z.string().min(1, 'TELEGRAM_ALERT_CHANNEL_ID is required')
    .transform((val) => {
      const parsed = Number(val);
      if (isNaN(parsed)) {
        throw new Error('TELEGRAM_ALERT_CHANNEL_ID must be a valid number');
      }
      return parsed;
    }),
});

type EnvConfig = z.infer<typeof envSchema>;

let validatedEnv: EnvConfig | null = null;

export function validateEnv(): EnvConfig {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        const path = err.path.join('.');
        return `${path}: ${err.message}`;
      });
      
      console.error('❌ Environment validation failed:');
      missingVars.forEach((msg) => console.error(`   - ${msg}`));
      
      process.exit(1);
    }
    throw error;
  }
}

export function getEnv(): EnvConfig {
  if (!validatedEnv) {
    throw new Error('Environment not validated. Call validateEnv() first.');
  }
  return validatedEnv;
}

export const env = {
  getDatabaseUrl: () => getEnv().DATABASE_URL,
  getTelegramToken: () => getEnv().TELEGRAM_API_TOKEN,
  getTelegramChannelId: () => getEnv().TELEGRAM_ALERT_CHANNEL_ID,
};
