const express = require('express')
const app = express()
const axios = require('axios').default;
require('dotenv').config()
const port = process.env.PORT;

app.get('/', async (req, res) => {
    const response = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/getMe`);
    console.log(res.data);
    res.send('Hello World!')
})

app.post('/webhook', (req, res) => {
    console.log(req.body);
    res.send('Hello World!')
})

app.listen(port, async () => {
    console.log(`Example app listening on port ${port}`)
    try {
        const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/setWebhook`, {
            url: "https://stock-telegram-bot-production.up.railway.app/webhook"
        });
        console.log(res2.data)
    } catch (error) {
        console.log(error)
    }
})