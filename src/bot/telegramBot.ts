import 'dotenv/config';
import { Context } from 'telegraf';
import { MenuTemplate, MenuMiddleware, createBackMainMenuButtons } from 'telegraf-inline-menu';
import { prisma } from '../lib/prisma'; // Certifique-core que o caminho está correto
import { bot } from '../lib/bot';

export interface BotContext extends Context {
    match?: RegExpExecArray | undefined;
}

// --- 1. COMANDO START ---
bot.start(async (ctx) => {
    try {
        const chatId = String(ctx.from?.id);
        const name = ctx.from?.first_name || 'Cidadão';

        // Atualizado: Subscriber -> User | telegramId -> telegramChatId
        await prisma.user.upsert({
            where: { telegramChatId: chatId },
            update: { name: name },
            create: {
                telegramChatId: chatId,
                name: name,
            }
        });

        await ctx.reply(`Olá, ${name}! 🌊\n\nBem-vindo ao Recife-Nimbus. Eu vou te avisar em tempo real se houver risco de alagamento no seu bairro.\n\nUse /configurar para escolher sua localização.`);

    } catch (err) {
        console.error("Erro no bot.start:", err);
    }
});

// --- 2. MENU DE BAIRROS (Terceiro Nível) ---
const neighborhoodMenu = new MenuTemplate<BotContext>(async (ctx) => {
    const zoneId = parseInt(ctx.match![1]);
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    return `📍 Bairros em ${zone?.name}:\nEscolha onde você deseja monitorar:`;
});

neighborhoodMenu.select('n', 
    async (ctx) => {
        const zoneId = parseInt(ctx.match![1]);
        const neighborhoods = await prisma.neighborhood.findMany({
            where: { zoneId: zoneId },
            orderBy: { name: 'asc' }
        });

        const choices: Record<string, string> = {};
        neighborhoods.forEach(n => choices[n.id.toString()] = n.name);
        return choices;
    },
    {
        columns: 2,
        // No novo schema, o usuário tem apenas 1 bairro (radio button)
        isSet: async (ctx, key) => {
            const chatId = String(ctx.from?.id);
            const user = await prisma.user.findUnique({
                where: { telegramChatId: chatId },
                select: { neighborhoodId: true }
            });
            return user?.neighborhoodId === parseInt(key);
        },
        set: async (ctx, key, newState) => {
            const chatId = String(ctx.from?.id);
            const neighborhoodId = parseInt(key);

            if (newState) {
                await prisma.user.update({
                    where: { telegramChatId: chatId },
                    data: { neighborhoodId: neighborhoodId }
                });
                
                const n = await prisma.neighborhood.findUnique({ where: { id: neighborhoodId } });
                await ctx.answerCbQuery(`✅ Bairro definido: ${n?.name}`);
                
            } else {
                await prisma.user.update({
                    where: { telegramChatId: chatId },
                    data: { neighborhoodId: null } // Remove o vínculo no banco
                });
                
                await ctx.answerCbQuery(`❌ Monitoramento desativado`);
            };

            return true;
        }
    }
);

neighborhoodMenu.manualRow(createBackMainMenuButtons('⬅️ Voltar para Regiões', ''));

// --- 3. MENU DE ZONAS (Segundo Nível) ---
const zoneMenu = new MenuTemplate<BotContext>(async (ctx) => {
    const cityId = parseInt(ctx.match![1]);
    const city = await prisma.city.findUnique({ where: { id: cityId } });
    return `🏙️ ${city?.name}\nSelecione a Região Administrativa (RPA):`;
});

zoneMenu.chooseIntoSubmenu('z', 
    async (ctx) => {
        const cityId = parseInt(ctx.match![1]);
        const zones = await prisma.zone.findMany({
            where: { cityId: cityId },
            orderBy: { name: 'asc' }
        });

        const choices: Record<string, string> = {};
        zones.forEach(z => {
            // Limpa o nome "Recife - Norte (RPA 2)" para mostrar apenas "Norte (RPA 2)"
            choices[z.id.toString()] = z.name.split(' - ')[1] || z.name;
        });
        return choices;
    },
    neighborhoodMenu,
    { columns: 1 }
);

zoneMenu.manualRow(createBackMainMenuButtons('⬅️ Voltar para Cidades', ''));

// --- 4. MENU PRINCIPAL: CIDADES (Primeiro Nível) ---
const cityMenu = new MenuTemplate<BotContext>('🌍 Configuração de Alertas\nSelecione a sua cidade:');

cityMenu.chooseIntoSubmenu('c',
    async () => {
        const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });
        const choices: Record<string, string> = {};
        cities.forEach(c => choices[c.id.toString()] = `📍 ${c.name}`);
        return choices;
    }, 
    zoneMenu, 
    { columns: 1 }
);

// --- 5. MIDDLEWARE E INICIALIZAÇÃO ---
const menuMiddleware = new MenuMiddleware<BotContext>('/', cityMenu);
bot.use(menuMiddleware.middleware());

// Atalhos de comandos
bot.command('configurar', (ctx) => menuMiddleware.replyToContext(ctx));
bot.command('CadastrarBairro', (ctx) => menuMiddleware.replyToContext(ctx)); // Mantendo compatibilidade com seu código anterior

export const startTelegramBot = () => {
    bot.launch();
    console.log('🚀 Recife Nimbus Bot está online!');
};

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));