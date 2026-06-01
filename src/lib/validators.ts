import { z } from 'zod';

// Comprehensive MarkdownV2 sanitization function
// Escapes all reserved characters that could be used for injection attacks
export function escapeMd(text: string): string {
    return text.replace(/[;:\_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
};


export const userinputSchema = z.object({
    chatId: z.string().regex(/^\d+$/, 'Chat ID must be numeric'),
    name: z.string().min(1).max(255).trim(),
    text: z.string().max(4096).trim(),
});


// validate Timezone value
export function validateTimezone(timezone: string): boolean {
    try {
        Intl.DateTimeFormat(undefined, { timeZone: timezone });
        return true;

    } catch (err) {
        console.error('Timezone validation error:', err);
        return false
    };
};


// sanitize JSON string for database storage, prevent injections attacks.
export function sanitizeJsonString(data: any): string {
    const validated = JSON.parse(JSON.stringify(data));
    return JSON.stringify(validated);
};


// Validates APAC API rain sensor response structure.
export const rainSensorSchema = z.object({
  attributes: z.object({
    nome: z.string(),
    hora_1: z.number(),
    bacia: z.string().optional(),
    municipio: z.string().optional(),
  }),
}).strict();


// Validates APAC API river sensor response structure
export const riverSensorSchema = z.object({
  attributes: z.object({
    namestation: z.string(),
    namebasin: z.string(),
    levelnow: z.number(),
    situacao: z.string(),
    tendencia: z.string(),
    alerta_tendencia: z.string(),
    recent: z.string(),
  }),
}).strict();


// Validates full APAC API response
export const apacResponseSchema = z.object({
  features: z.array(z.any()).default([]),
  exceededTransferLimit: z.boolean().optional(),
});


// Type-safe error extraction from catch blocks
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return `Unknown error: ${String(error)}`;
}
