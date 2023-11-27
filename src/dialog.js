const axios = require('axios').default;

const selectPrompt = async (message, items) => {
    const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: message.chat.id,
        text: 'Выберите одну из опций ниже',
        reply_markup: {
            keyboard: [
                items,
                [{ text: 'Отмена' }]
            ],
        }
    });
}

const packagePrompt = async (message) => {
    const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: message.chat.id,
        text: 'Коробок или штук',
        reply_markup: {
            keyboard: [[
                { text: 'Коробки' },
                { text: 'Штуки' },
            ], [{ text: 'Отмена' }]],
        }
    });
}

const amountPrompt = async (message) => {
    const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: message.chat.id,
        text: 'Укажите число',
    });
}

const invalidInput = async (message) => {
    const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: message.chat.id,
        text: 'Неверный формат',
    });
}

const initStep = async (message, items, chatStep) => {
    if (message.text === 'Перемещение' || chatStep.step === 0) {
        try {
            selectPrompt(message, items)
            await chatStep.updateOne({ $inc: { step: 1 } });
            return true;
        } catch (error) {
            console.log(error.response.data)
        }
    }
}

const selectingStep = async (message, items, chatStep) => {
    if (chatStep.step === 1) {
        if (!items.find((item) => item.text === message.text)) {
            invalidInput(message);
            selectPrompt(message, items);
            return;
        }
        try {
            packagePrompt(message);
            await chatStep.updateOne({ $inc: { step: 1 } });
            return true;
        } catch (error) {
            console.log(error.response.data)
        }
    }
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

const currentTransferingPrompt = async (message) => {
    const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: message.chat.id,
        text: 'Итого',
        reply_markup: {
            keyboard: [[
                { text: 'Добавить еще' },
                { text: 'Готово' },
            ], [{ text: 'Отмена' }]],
        }
    });
}

const amountStep = async (message, items, chatStep) => {
    if (chatStep.step === 2) {
        if (!['Коробки', 'Штуки'].includes(message.text)) {
            invalidInput(message);
            packagePrompt(message);
            return;
        }
        try {
            amountPrompt(message, items)
            await chatStep.updateOne({ $inc: { step: 1 } });
            return true;
        } catch (error) {
            console.log(error.response.data)
        }
    }
}

const finalStep = async (message, items, chatStep) => {
    if (chatStep.step === 2) {
        if (!isNumeric(message.text)) {
            invalidInput(message);
            packagePrompt(message);
            return;
        }
        try {
            currentTransferingPrompt(message, items)
            await chatStep.updateOne({ $inc: { step: 1 } });
            return true;
        } catch (error) {
            console.log(error.response.data)
        }
    }
}


module.exports = {
    initStep,
    selectingStep,
    amountStep,
}