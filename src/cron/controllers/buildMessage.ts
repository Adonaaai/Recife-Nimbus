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

export const buildCityChannelMessage = (
    cityName: string,
    zoneSummaries: { zoneName: string; severity: Severity; reasons: string[] }[]
): string => {
    const time = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Recife', hour: '2-digit', minute: '2-digit' });

    const lines = zoneSummaries.map(z => {
        const header = z.severity === 'RED' ? `${z.zoneName.toUpperCase()} ALERTA VERMELHO🔴 :` : `${z.zoneName.toUpperCase()} PRÉ-ALERTA🟡 :\n`;
        const reasonsLine = z.reasons.map(r => `• ${r}`).join('\n');
        return `${header}\n ${reasonsLine}`;
    });

    return `*ALERTAS — ${cityName.toUpperCase()}*\n\n${lines.join('\n\n')}\n\nAtualizado às ${time}`;
};