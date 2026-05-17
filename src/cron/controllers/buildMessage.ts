import { Severity } from '../types/types.ts';

export const buildMessage = (zoneName: string, severity: Severity, reasons: string[]): string => {
 
    const time = new Date().toLocaleTimeString('pt-BR', {
        timeZone: 'America/Recife',
        hour:     '2-digit',
        minute:   '2-digit',
    });
 
    const lines = reasons.map(r => `• ${r}`).join('\n');
 
    if (severity === 'RED') {
        return (
            `🚨 *ALERTA VERMELHO — ${zoneName.toUpperCase()}*\n\n` +
            `${lines}\n\n` +
            `⛔ Risco alto de alagamento\\! Evite ruas baixas\\.\n` +
            `_Atualizado às ${time}_`
        );
    };
 
    return (
        `🟡 *PRÉ\\-ALERTA — ${zoneName.toUpperCase()}*\n\n` +
        `${lines}\n\n` +
        `📡 Monitoramento ativo\\. Fique atento\\.\n` +
        `_Atualizado às ${time}_`
    );
};