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
import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.TELEGRAM_TOKEN!)

app.use(await bot.createWebhook({ domain: "stock-telegram-bot-production.up.railway.app", path: "/webhook" }));
// app.use(bodyParser.json());

// app.get('/', async (req, res) => {
//     const response = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/getMe`);
//     console.log(response.data);
//     res.send('Hello World!')
// })

// app.post('/webhook', async (req, res) => {
//     const { message } = req.body;
//     if (message) {
//         let chatStep = await Chat.findOne({ chat_id: message.chat.id });
//         if (!chatStep) {
//             chatStep = await Chat.create({ chat_id: message.chat.id, step: 0 });
//         }
//         console.log('##### STEP: ', message.chat.id, chatStep.step)
//         const items = await Item.find()
//         if (message.text === 'Отмена') {
//             chatStep.step = 0;
//             await chatStep.save();
//         }
//         let done = false;
//         // if (!done) done = await initStep(message, items, chatStep)
//         // if (!done) done = await selectingStep(message, items, chatStep)
//         // if (!done) done = await amountStep(message, items, chatStep)
//         // if (!done) done = await finalStep(message, items, chatStep)

//         if (message.text === 'Добавить') {

//         }
//     }
//     res.send('')
// })


bot.on("text", (ctx) => ctx.reply("Hello"))


app.listen(port, async () => {
    console.log(`Example app listening on port ${port}`)
    try {
        // const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setWebhook`, {
        //     url: "https://stock-telegram-bot-production.up.railway.app/webhook"
        // });
        // app.set('db', configureDB());
    } catch (error) {
        console.log(error)
    }
})