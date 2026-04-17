import 'dotenv/config';
import { Context, Markup } from 'telegraf';
import { MenuTemplate, MenuMiddleware, createBackMainMenuButtons } from 'telegraf-inline-menu';
import { prisma } from '../lib/prisma.ts';
import { bot } from '../lib/bot.ts';

export interface BotContext extends Context {
    match?: RegExpExecArray | undefined;
}

bot.start(async (ctx) => {
    try {
        const telegramId = String(ctx.from?.id);
        const firstName = ctx.from?.first_name || 'Cidadão'; 

        await prisma.subscriber.upsert({
            where: {telegramId: telegramId},
            update: {isActive: true},
            create: {
                telegramId: telegramId,
                firstName: firstName
            }
        });

        ctx.reply(`Olá, ${firstName}! Bem-vindo ao Recife-Nimbus...`);

    } catch (err) {
        console.error(err);
    }
});

const neighborhoodMenu = new MenuTemplate<BotContext>('Selecione os bairros para receber alertas:');

neighborhoodMenu.select('Neighborhood', 
    async (ctx) => {
        const cityId = parseInt(ctx.match![1]);

        const city = await prisma.city.findUnique({ 
            where: {id: cityId},
            include: {
                neighborhoods: { where: {isActive: true} }
            }
        });

        const choices: Record<string, string> = {};

        city?.neighborhoods.forEach(neighborhood => 
            choices[String(neighborhood.id)] = neighborhood.name
        );

        return choices;
    },

    {
        columns: 2, 
        maxRows: 5,

        isSet: async (ctx, key) => {
            const telegramId = String(ctx.from?.id);
            
            const subscriber = await prisma.subscriber.findUnique({
                where: {telegramId: telegramId},
                include: {
                    neighborhoods: true
                }
            }); 
            
            return subscriber?.neighborhoods.some(neighborhood => String(neighborhood.id) === key) || false;
        },
        
        set: async (ctx, key, newState) => {
            const telegramId = String(ctx.from?.id);
            const neighborhoodId = parseInt(key);

            if (newState) {
                await prisma.subscriber.update({
                    where: { telegramId: telegramId},
                    data: {
                        neighborhoods: { connect: {id: neighborhoodId}}
                    }
                });
            } else {
                await prisma.subscriber.update({
                    where: { telegramId: telegramId},
                    data: {
                        neighborhoods: { disconnect: {id: neighborhoodId}}
                    }
                });
            }

            return true;
        }
    } 
);

neighborhoodMenu.manualRow(createBackMainMenuButtons('⬅️ Voltar', ''));

const cityMenu = new MenuTemplate<BotContext>('Selecione a sua Cidade:'); 

cityMenu.chooseIntoSubmenu('City',
    async () => {
        const cities = await prisma.city.findMany({
            where: { neighborhoods: { some: { isActive: true } } }
        });
        
        const choices: Record<string, string> = {};
        cities.forEach(c => {
            choices[c.id.toString()] = `📍 ${c.name}`;
        });
        return choices;
    }, 
    neighborhoodMenu, 
    { columns: 2 }
);

const menuMiddleware = new MenuMiddleware<BotContext>('/', cityMenu);

bot.use(menuMiddleware.middleware());

bot.command('CadastrarBairro', async (ctx) => {
    await menuMiddleware.replyToContext(ctx);
});

export const startTelegramBot = () => {
    bot.launch();
    console.log('Recife Nimbus bot is currently online!');
};

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));