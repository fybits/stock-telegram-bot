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
            ctx.reply(`Хорошо. Укажи сколько ${is_boxed ? 'коробок' : 'штук'} переносится.`);
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
            ctx.scene.session.items.push({ name: ctx.scene.session.current_item, amount: ctx.scene.session.is_boxed ? +text * 12 : +text })
            ctx.reply(`Итого\n${ctx.scene.session.items.map((i) => `${i.name} - ${i.amount} шт`).join('\n')}`, Markup.keyboard([[
                { text: 'Добавить еще' },
                { text: 'Готово' },
            ], [{ text: 'Отмена' }]]
            ));
            ctx.wizard.selectStep(0);
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