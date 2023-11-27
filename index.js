const express = require('express')
const app = express()
const axios = require('axios').default;
var bodyParser = require('body-parser')
require('dotenv').config()
const port = process.env.PORT;
const { MongoClient } = require('mongodb');

const mongoURI = process.env.MONGO_PRIVATE_URL;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

app.use(bodyParser.json());

app.get('/', async (req, res) => {
    const response = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/getMe`);
    console.log(response.data);
    res.send('Hello World!')
})

app.post('/webhook', async (req, res) => {
    const { message } = req.body;
    console.log(req.body);
    const database = client.db('test');
    const items = database.collection('items');
    if (message.text === 'Перемещение') {
        try {
            const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: message.chat.id,
                text: 'Please choose from one of the options below',
                reply_markup: {
                    keyboard: [
                        (await items.find().toArray()).map((doc) => ({ text: doc.name }))
                    ],
                }
            });
        } catch (error) {
            console.log(error.response.data)
        }
    }
    res.send('Hello World!')
})

app.listen(port, async () => {
    console.log(`Example app listening on port ${port}`)
    try {
        const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setWebhook`, {
            url: "https://stock-telegram-bot-production.up.railway.app/webhook"
        });
        await client.connect();
        console.log(res2.data)
    } catch (error) {
        console.log(error.toJSON())
    }
})