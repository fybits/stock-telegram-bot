import express from "express"
const app = express()
import axios from "axios";
import bodyParser from "body-parser"
import dotenv from "dotenv"
dotenv.config();

const port = process.env.PORT;
import Item from './models/items';
import Chat from './models/chats';
// import { initStep, selectingStep, amountStep, finalStep } from './dialog';
import configureDB from "./db";
import { Scenes, Telegraf, session } from "telegraf";
import { message } from 'telegraf/filters'
import createTransferScene, { CustomContext } from "./scenes/transfer";

const bot = new Telegraf<CustomContext>(process.env.TELEGRAM_TOKEN!)
const stage = new Scenes.Stage<CustomContext>([createTransferScene])


const launchBot = async () => {
    // app.listen(port, async () => {
    console.log(`Example app listening on port ${port}`)
    try {
        // const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setWebhook`, {
        //     url: "https://stock-telegram-bot-production.up.railway.app/webhook"
        // });
        // app.set('db', configureDB());
        bot.use(session())
        bot.use(stage.middleware());
        bot.hears("Перемещение", ctx => ctx.scene.enter('createTransferScene'));
        bot.on(message("text"), (ctx) => {
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
            bot.launch({
                webhook: {
                    domain: "stock-telegram-bot-production.up.railway.app",
                    path: "/webhook",
                },
            });
            if (bot) {
                bot.telegram.getMe().then((res) => {
                    console.log(
                        `Bot started in webhook mode. Available at https://t.me/${res.username}`,
                    );
                });
            }
        }

        // app.use(await bot.createWebhook({ domain: "stock-telegram-bot-production.up.railway.app", path: "/webhook" }));


    } catch (error) {
        console.log(error)
    }
    // })
}

launchBot();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));