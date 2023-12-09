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
import { Scenes, Telegraf } from "telegraf";
import { message } from 'telegraf/filters'
import createTransferScene, { CustomContext } from "./scenes/transfer";

const bot = new Telegraf<CustomContext>(process.env.TELEGRAM_TOKEN!)
const stage = new Scenes.Stage([createTransferScene])



app.listen(port, async () => {
    console.log(`Example app listening on port ${port}`)
    try {
        // const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setWebhook`, {
        //     url: "https://stock-telegram-bot-production.up.railway.app/webhook"
        // });
        // app.set('db', configureDB());
        bot.use(stage.middleware());
        app.use(await bot.createWebhook({ domain: "stock-telegram-bot-production.up.railway.app", path: "/webhook" }));
        bot.hears("Перемещение", ctx => ctx.scene.enter('createTransferScene'));
        bot.on(message("text"), (ctx) => {
            console.log(ctx.chat.id,)
        })


    } catch (error) {
        console.log(error)
    }
})