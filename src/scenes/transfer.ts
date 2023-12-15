import sqlite3 from 'sqlite3';
import { Telegraf, Scenes, Markup, Middleware, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { Update } from 'telegraf/typings/core/types/typegram';
import { isNumeric } from '../utls';
import Item, { UnitsSchema } from '../models/items';
import AdminUser from '../models/admin_users';

interface SessionData extends Scenes.WizardSessionData {
    current_item: Item;
    amount: number;
    unit: number;
    items: { name: string, amount: number, unit_name: string }[];
}

export type CustomContext = Scenes.WizardContext<SessionData> & {
    db?: sqlite3.Database;
};

const replyTotal = async (ctx: CustomContext) => {
    const items = ctx.scene.session.items;
    let maxLength = Math.max(...items.map(({ name }) => name.length));
    ctx.reply(`Итого\n<code>${items.map((i) => `${i.name.padEnd(maxLength + 1)} - ${i.amount} ${i.unit_name}`).join('\n')}</code>`, {
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
            const item = items.find((i) => i.name === text);
            if (!item) {
                return ctx.reply('Неверное значение. Попробуй еще раз:)');
            }
            const btns = Object.keys(item.schema).map((unitName) => ({ text: unitName }));
            ctx.reply("Хорошо. Выбери единицу измерения", Markup.keyboard([[
                { text: item.unit_name },
                ...btns,
            ], [{ text: 'Отмена' }]]));
            ctx.scene.session.current_item = item;
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
            const item = ctx.scene.session.current_item;
            const options = Object.entries(item.schema);
            options.push([item.unit_name, 1]);
            const unit = options.find(([unitName, amount]) => text === unitName);
            if (!unit) {
                return ctx.reply('Неверное значение. Попробуй еще раз:)');
            }
            ctx.reply(`Хорошо. Укажи сколько ${text} переносится.`, { reply_markup: { force_reply: true } });
            ctx.scene.session.unit = unit[1];
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
            const { current_item, unit } = ctx.scene.session;
            ctx.scene.session.amount = +text;
            const items = ctx.scene.session.items || [];
            items.push({ name: current_item.name, amount: +text * unit, unit_name: current_item.unit_name })
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
                    const listItems = ctx.scene.session.items;
                    let maxLength = Math.max(...listItems.map(({ name }) => name.length));
                    const admins = await AdminUser.getAll();
                    admins.forEach((({ chat_id }) => {
                        ctx.telegram.sendMessage(chat_id, `Новое перемещение\n<code>${listItems.map((i) => `<b>${i.name.padEnd(maxLength + 1)}</b> - ${i.amount} ${i.unit_name}`).join('\n')}</code>`, {
                            parse_mode: 'HTML',
                        });
                    }))
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