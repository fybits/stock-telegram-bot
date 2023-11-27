const express = require('express')
const app = express()
const axios = require('axios').default;
const bodyParser = require('body-parser')
require('dotenv').config()
const port = process.env.PORT;
const mongoose = require('mongoose');
const Item = require('./src/models/items');
const Chat = require('./src/models/chats');
const { initStep, selectingStep, amountStep } = require('./src/dialog');

const mongoURI = process.env.MONGO_PRIVATE_URL;

app.use(bodyParser.json());

app.get('/', async (req, res) => {
    const response = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/getMe`);
    console.log(response.data);
    res.send('Hello World!')
})

app.post('/webhook', async (req, res) => {
    const { message } = req.body;
    if (message) {
        let chatStep = await Chat.findOne({ chat_id: message.chat.id });
        if (!chatStep) {
            chatStep = await Chat.create({ chat_id: message.chat.id, step: 0 });
        }
        console.log('##### STEP: ', message.chat.id, chatStep.step)
        const items = (await Item.find()).map((item) => ({ text: item.name }));
        if (message.text === 'Отмена') {
            chatStep.step = 0;
            await chatStep.save();
        }
        let done = false;
        if (!done) done = await initStep(message, items, chatStep)
        if (!done) done = await selectingStep(message, items, chatStep)
        if (!done) done = await amountStep(message, items, chatStep)

        if (message.text === 'Добавить') {

        }
    }
    res.send('')
})

app.listen(port, async () => {
    console.log(`Example app listening on port ${port}`)
    try {
        const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setWebhook`, {
            url: "https://stock-telegram-bot-production.up.railway.app/webhook"
        });
        await mongoose.connect(mongoURI);
    } catch (error) {
        console.log(error.toJSON())
    }
})