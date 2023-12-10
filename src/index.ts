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
import Item from "./models/items";
import { isNumeric } from "./utls";

const bot = new Telegraf<CustomContext>(process.env.TELEGRAM_TOKEN!)
const stage = new Scenes.Stage<CustomContext>([createTransferScene])


const launchBot = async () => {
    console.log(`Example app listening on port ${port}`)
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
            ctx.reply(`Список всех позиций\n<code>${items.map((i) => `${i.id}. ${i.name.padEnd(maxLength + 1)} - ${i.box_size}шт. в коробке`).join('\n')}</code>`, {
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
        bot.command("add", async (ctx) => {
            if (ctx.args.length !== 2) {
                ctx.reply("/add <Название> <Количество в коробке>")
                return;
            }
            if (!isNumeric(ctx.args[1])) {
                ctx.reply(`/add <Название> <Количество в коробке>\n
                        Количество должно быть целым числом`);
                return
            }
            await Item.create(ctx.args[0], +ctx.args[1]);
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