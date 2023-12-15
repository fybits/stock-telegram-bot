import dotenv from "dotenv"
dotenv.config();
import express, { Express } from "express";
const port = process.env.PORT;
import configureDB from "./db";
let app: Express | null = null;;
if (process.env.ENV_TYPE !== 'DEVELOPMENT') {
    app = express();
}

import { Markup, MiddlewareFn, Scenes, Telegraf, session } from "telegraf";
import { message } from 'telegraf/filters'
import createTransferScene, { CustomContext } from "./scenes/transfer";
import Item, { UnitsSchema } from "./models/items";
import { isNumeric } from "./utls";
import AdminUser from "./models/admin_users";

const bot = new Telegraf<CustomContext>(process.env.TELEGRAM_TOKEN!)
const stage = new Scenes.Stage<CustomContext>([createTransferScene])


const launchBot = async () => {
    try {
        const db = configureDB();
        const dbMiddleware = (): MiddlewareFn<CustomContext> => {
            return (ctx, next) => {
                ctx.db = db;
                return next()
            }
        }
        bot.use(dbMiddleware());
        bot.use(session())
        bot.use(stage.middleware());
        bot.hears("Перемещение", (ctx) => ctx.scene.enter('createTransferScene'));
        bot.start(async (ctx) => ctx.reply("Введите \"_Перемещение_\" чтобы начать перемещение", Markup.keyboard([[{ text: 'Перемещение' }]])));
        bot.command("move", (ctx) => ctx.scene.enter('createTransferScene'));
        bot.command("all", async (ctx) => {
            const items = await Item.getAll();
            let maxLength = Math.max(...items.map(({ name }) => name.length));
            ctx.reply(`Список всех позиций\n<code>${items.map((i) => `${i.id}. ${i.name.padEnd(maxLength + 1)} - ${i.unit_name} ${JSON.stringify(i.schema)}`).join('\n')}</code>`, {
                parse_mode: 'HTML'
            });
        });
        bot.command("del", async (ctx) => {
            if (ctx.args.length !== 1 || !isNumeric(ctx.args[0])) {
                ctx.reply("/del <Номер>");
            }
            await Item.removeById(+ctx.args[0]);
            ctx.reply(`Удалено`);
        });
        bot.command("subscribe", async (ctx) => {
            AdminUser.create(ctx.chat.id);
            ctx.reply("Пользователь добавлен");
        });

        bot.command("add", async (ctx) => {
            if (ctx.args.length < 2) {
                // add Какао Грамм 36 Пачка 12 Коробка
                ctx.reply("/add <Название> <Название единицы> [схема]")
                return;
            }
            const [name, atomUnitName, ...schemaArgs] = ctx.args;
            const schema: UnitsSchema = {}
            if (schemaArgs.length % 2 !== 0) {
                ctx.reply("Неверная схема! пример\n/add Какао Грамм 400 Пачка 12 Коробка")
                return;
            }
            let totalUnits = 1;
            for (let i = 0; i < schemaArgs.length; i += 2) {
                if (!isNumeric(schemaArgs[i])) {
                    ctx.reply("Неверная схема! пример\n/add Какао Грамм 400 Пачка 12 Коробка")
                    return;
                }
                const amount = +schemaArgs[i];
                const unitName = schemaArgs[i + 1];
                totalUnits *= amount;
                schema[unitName] = totalUnits;
            }

            await Item.create(name, atomUnitName, schema);
            ctx.reply(`Позиция добавлена!`);
        })
        bot.on(message("text"), (ctx) => {
            ctx.reply("Введите \"Перемещение\" чтобы начать перемещение", Markup.keyboard([[{ text: 'Перемещение' }]]));
            console.log(ctx.chat.id,)
        })
        if (process.env.ENV_TYPE === "DEVELOPMENT") {
            bot.launch();
            if (bot) {
                bot.telegram.getMe().then((res) => {
                    console.log(
                        `Bot started in polling mode. Available at https://t.me/${res.username}`,
                    );
                });
            }
        } else {
            if (app) {
                app.listen(port, async () => {
                    app!.use(await bot.createWebhook({ domain: "stock-telegram-bot-production.up.railway.app", path: "/webhook" }));
                });
            }
            // bot.launch({
            //     webhook: {
            //         domain: "stock-telegram-bot-production.up.railway.app",
            //         path: "/webhook",
            //     },
            // });
            if (bot) {
                bot.telegram.getMe().then((res) => {
                    console.log(
                        `Bot started in webhook mode. Available at https://t.me/${res.username}`,
                    );
                });
            }
        }

    } catch (error) {
        console.log(error)
    }
}

launchBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));