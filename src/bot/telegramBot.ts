import 'dotenv/config';
import { Context } from 'telegraf';
import { MenuTemplate, MenuMiddleware, createBackMainMenuButtons } from 'telegraf-inline-menu';
import { prisma } from '../lib/prisma';
import { bot } from '../lib/bot';
import { commandLimiter } from '../lib/rateLimiter';
import { getErrorMessage } from '../lib/validators';

export interface BotContext extends Context {
    match?: RegExpExecArray | undefined;
};

type NeighborhoodChoice = { id: number; name: string };
type ZoneChoice = { id: number; name: string };
type CityChoice = { id: number; name: string };

// --- 1. START COMMAND ---
bot.start(async (ctx) => {
    const userId = ctx.from?.id;

    if (!commandLimiter.isAllowed(String(userId))) {
        const resetTime = commandLimiter.getResetTime(String(userId));
        await ctx.reply(`⏳ Você atingiu o limite de comandos. Tente novamente em ${resetTime} segundos.`);
        return;
    };

    botStartCommand(ctx);
});

// Bot Start
const botStartCommand = async (ctx: Context) => {
    try {
        const chatId = String(ctx.from?.id);
        const name = ctx.from?.first_name || 'Cidadão';

        // Updated: Subscriber -> User | telegramId -> telegramChatId
        await prisma.user.upsert({
            where: { telegramChatId: chatId },
            update: { name: name },
            create: {
                telegramChatId: chatId,
                name: name,
            }
        });

        await ctx.reply(`Olá, ${name}! 🌊\n\nBem-vindo ao Recife-Nimbus. Eu vou te avisar em tempo real se houver risco de alagamento no seu bairro.\n\n Acesse Também o grupo da nossa comunidade: https://t.me/+F4VjD4FdeTxjN2Mx\nPara compartilhamentos das ruas em tempo real durante as chuvas\n\nEntre no nosso canal de alertas oficiais: https://t.me/+GzmJKR2chEs1ZTlh\nPara ficar por dentro dos avisos oficiais da APAC e outros orgãos da RMR\n\nUse /configurar para escolher sua localização.`);

    } catch (err) {
        const errorMsg = getErrorMessage(err);
        console.error("[BOT] Error in bot.start:", errorMsg);
        
        // Sending a Error message to the user.
        try {
            await ctx.reply("❌ Ocorreu um erro ao iniciar o bot. Por favor, tente novamente mais tarde.");

        } catch (replyErr) {
            const replyErrorMsg = getErrorMessage(replyErr);
            console.error("[BOT] Failed to send error reply:", replyErrorMsg);
        }
    }
};



// --- 2. NEIGHBORHOOD MENU (Third Level) ---
const neighborhoodMenu = new MenuTemplate<BotContext>(async (ctx) => {
    const zoneId = parseInt(ctx.match![2]);
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    return `📍 Bairros em ${zone?.name}:\nEscolha onde você deseja monitorar:`;
});

neighborhoodMenu.select('n', 
    async (ctx) => {
        const zoneId = parseInt(ctx.match![2]);
        const neighborhoods = await prisma.neighborhood.findMany({
            where: { zoneId: zoneId },
            orderBy: { name: 'asc' }
        });

        const choices: Record<string, string> = {};
        neighborhoods.forEach((n: NeighborhoodChoice) => choices[n.id.toString()] = n.name);
        return choices;
    },
    {
        columns: 2,

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

            if (!commandLimiter.isAllowed(chatId)) {
                await ctx.answerCbQuery('⏱️ Muitos cliques. Por favor, aguarde.');
                return false;
            };

            const neighborhoodId = parseInt(key);

            try {
                // Activate and desactivate neighborhood monitoring
                // by menu clickes.
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
                        data: { neighborhoodId: null } // Removes the link from the database
                    });
                    
                    await ctx.answerCbQuery(`❌ Monitoramento desativado`);
                };

            } catch (err) {
                const errorMsg = getErrorMessage(err);
                console.error("[BOT] Error in neighborhoodMenu set:", errorMsg);
                await ctx.answerCbQuery("❌ Ocorreu um erro. Tente novamente.");
            };

            return true;
        }
    }
);

neighborhoodMenu.manualRow(createBackMainMenuButtons('⬅️ Voltar para Regiões', ''));

// --- 3. ZONE MENU (Second Level) ---
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
        zones.forEach((z: ZoneChoice) => {
            // Strips the name "Recife - Norte (RPA 2)" to display only "Norte (RPA 2)"
            choices[z.id.toString()] = z.name.split(' - ')[1] || z.name;
        });
        return choices;
    },
    neighborhoodMenu,
    { columns: 1 }
);

zoneMenu.manualRow(createBackMainMenuButtons('⬅️ Voltar para Cidades', ''));

// --- 4. MAIN MENU: CITIES (First Level) ---
const cityMenu = new MenuTemplate<BotContext>('🌍 Configuração de Alertas\nSelecione a sua cidade:');

cityMenu.chooseIntoSubmenu('c',
    async () => {
        const cities = await prisma.city.findMany({ orderBy: { name: 'asc' } });
        const choices: Record<string, string> = {};
        cities.forEach((c: CityChoice) => choices[c.id.toString()] = `📍 ${c.name}`);
        return choices;
    }, 
    zoneMenu, 
    {
        columns: 2,
        maxRows: 15
    }
);

// --- 5. MIDDLEWARE AND INITIALIZATION ---
const menuMiddleware = new MenuMiddleware<BotContext>('/', cityMenu);
bot.use(menuMiddleware.middleware());

bot.command('ajuda', (ctx) => {
    const userId = ctx.from?.id;

    if (!commandLimiter.isAllowed(String(userId))) {
        const resetTime = commandLimiter.getResetTime(String(userId));
        ctx.reply(`⏳ Você atingiu o limite de comandos. Tente novamente em ${resetTime} segundos.`);
        return;
    };
    ctx.reply('📌 Comandos disponíveis:\n\n/start - Iniciar o bot e registrar seu chat\n/configurar - Escolher o seu bairro para ser monitorado\n/ajuda - Mostrar esta mensagem de ajuda');
})

// Command handler for /configurar to trigger the menu, with rate limiting.
bot.command('configurar', (ctx) => {
    const userId = ctx.from?.id;

    if (!commandLimiter.isAllowed(String(userId))) {
        const resetTime = commandLimiter.getResetTime(String(userId));
        ctx.reply(`⏳ Você atingiu o limite de comandos. Tente novamente em ${resetTime} segundos.`);
        return;
    }

    menuMiddleware.replyToContext(ctx);
    console.log(`[BOT] User:${userId} accessed the bot configuration menu.`);
});

export const startTelegramBot = () => {
    bot.launch();
    console.log('[BOT] Recife Nimbus Bot está online!');
};

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
