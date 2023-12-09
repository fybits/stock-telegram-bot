import { Telegraf, Scenes, Markup, Middleware, Context } from 'telegraf';
import { message } from 'telegraf/filters';
import { Update } from 'telegraf/typings/core/types/typegram';

const options = ['Something', 'Otherthing', 'Third thing'];

interface SessionData extends Scenes.WizardSessionData {
    current_item: string;
    amount: number;
    is_boxed: boolean;
    items: { name: string, amount: number }[]
}

export type CustomContext = Scenes.WizardContext<SessionData>;

function isNumeric(str: string) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(+str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

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
            if (!options.includes(text)) {
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
                    ctx.reply("Выберите одну из опций ниже", Markup.keyboard([
                        options,
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
                    ctx.reply("Удаляю последний элемент.")
                    ctx.scene.session.items.pop();
                    await replyTotal(ctx);

                    return;
            }
        } catch (error) {
            console.log(error)
            ctx.reply('Упс... Произошла какая-то ошибка');
        }
    }),
);

createTransferScene.enter((ctx) => ctx.reply("Выберите одну из опций ниже", Markup.keyboard([
    options,
    [{ text: 'Отмена' }]
])));


export default createTransferScene;