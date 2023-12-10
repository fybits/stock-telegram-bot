import sqlite3 from 'sqlite3';
import { Telegraf, Scenes, Markup, Middleware, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { Update } from 'telegraf/typings/core/types/typegram';
import { isNumeric } from '../utls';
import Item from '../models/items';

interface SessionData extends Scenes.WizardSessionData {
    current_item: string;
    amount: number;
    is_boxed: boolean;
    items: { name: string, amount: number }[];
}

export type CustomContext = Scenes.WizardContext<SessionData> & {
    db?: sqlite3.Database;
};

const replyTotal = async (ctx: CustomContext) => {
    const items = ctx.scene.session.items;
    let maxLength = Math.max(...items.map(({ name }) => name.length));
    ctx.reply(`Итого\n<code>${items.map((i) => `${i.name.padEnd(maxLength + 1)} - ${i.amount} шт`).join('\n')}</code>`, {
        parse_mode: 'HTML',
        ...Markup.keyboard([[
            { text: 'Добавить еще' },
            { text: 'Готово' },
        ], [{ text: 'Отмена' }]]
        )
    });
}

const createTransferScene = new Scenes.WizardScene<CustomContext>('createTransferScene',
    Telegraf.on(message('text'), async (ctx) => {
        try {
            const msg = ctx.message;
            const { text } = msg;
            const items = await Item.getAll();
            if (!items.find((i) => i.name === text)) {
                return ctx.reply('Неверное значение. Попробуй еще раз:)');
            }
            ctx.reply("Хорошо. Выбери коробках или в штуках", Markup.keyboard([[
                { text: 'Коробки' },
                { text: 'Штуки' },
            ], [{ text: 'Отмена' }]]));
            ctx.scene.session.current_item = text;
            ctx.wizard.next()
        } catch (error) {
            console.log(error)
            ctx.reply('Упс... Произошла какая-то ошибка');
        }
    }),
    Telegraf.on(message('text'), async (ctx) => {
        try {
            const msg = ctx.message;
            const { text } = msg;
            if (!['Коробки', 'Штуки'].includes(text)) {
                return ctx.reply('Неверное значение. Попробуй еще раз:)');
            }
            const is_boxed = text === 'Коробки';
            ctx.reply(`Хорошо. Укажи сколько ${is_boxed ? 'коробок' : 'штук'} переносится.`, { reply_markup: { remove_keyboard: true } });
            ctx.scene.session.is_boxed = is_boxed;
            ctx.wizard.next()
        } catch (error) {
            console.log(error)
            ctx.reply('Упс... Произошла какая-то ошибка');
        }
    }),
    Telegraf.on(message('text'), async (ctx) => {
        try {
            const msg = ctx.message;
            const { text } = msg;
            if (!isNumeric(text)) {
                return ctx.reply('Неверное значение. Попробуй еще раз:)');
            }

            ctx.scene.session.amount = +text;
            const items = ctx.scene.session.items || [];
            items.push({ name: ctx.scene.session.current_item, amount: ctx.scene.session.is_boxed ? +text * 12 : +text })
            ctx.scene.session.items = items;
            await replyTotal(ctx)
            ctx.wizard.next();
        } catch (error) {
            console.log(error)
            ctx.reply('Упс... Произошла какая-то ошибка');
        }
    }),
    Telegraf.on(message('text'), async (ctx) => {
        try {
            const msg = ctx.message;
            const { text } = msg;
            switch (text) {
                case 'Добавить еще':
                    const items = await Item.getAll();
                    ctx.reply("Выберите одну из опций ниже", Markup.keyboard([
                        items.map((i) => ({ text: i.name })),
                        [{ text: 'Отмена' }]
                    ]))
                    ctx.wizard.selectStep(0);
                    return;
                case 'Готово':
                    ctx.reply("Окей, отправляю.", Markup.keyboard([[
                        { text: 'Перемещение' },
                    ]]
                    ));
                    ctx.scene.leave();
                    return;
                case 'Отмена':
                    ctx.scene.session.items.pop();
                    if (ctx.scene.session.items.length === 0) {
                        ctx.reply('Список пуст.', Markup.keyboard([[
                            { text: 'Перемещение' },
                        ]]));
                        ctx.scene.leave();
                        return;
                    }
                    ctx.reply("Удаляю последний элемент.")
                    await replyTotal(ctx);

                    return;
            }
        } catch (error) {
            console.log(error)
            ctx.reply('Упс... Произошла какая-то ошибка');
        }
    }),
);

createTransferScene.enter(async (ctx) => {
    const items = await Item.getAll();
    ctx.reply("Выберите одну из опций ниже", Markup.keyboard([
        items.map((i) => ({ text: i.name })),
        [{ text: 'Отмена' }]
    ]))
});

createTransferScene.hears('Отмена', (ctx) => ctx.scene.leave());


export default createTransferScene;