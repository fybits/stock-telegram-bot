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
            await selectPrompt(message, items)
            await chatStep.updateOne({ $inc: { step: 1 } });
            return true;
        } catch (error) {
            console.log(error.response.data)
        }
    }
}

const selectingStep = async (message, items, chatStep) => {
    if (chatStep.step === 1) {
        const item = items.find((item) => item.text === message.text);
        if (!item) {
            await invalidInput(message);
            await selectPrompt(message, items);
            return;
        }
        try {
            await packagePrompt(message);
            await chatStep.updateOne({ $inc: { step: 1 }, $set: { current_item: item } });
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

const currentTransferingPrompt = async (message, items) => {
    const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: message.chat.id,
        text: `Итого\n ${items.map((i) => `${i.item.name} - ${i.amount} шт`).join('\n')}`,
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
            await invalidInput(message);
            await packagePrompt(message);
            return;
        }
        try {
            await amountPrompt(message, items)
            await chatStep.updateOne({ $inc: { step: 1 }, $set: { is_boxed: message.text === 'Коробки' } });
            return true;
        } catch (error) {
            console.log(error.response.data)
        }
    }
}

const finalStep = async (message, items, chatStep) => {
    if (chatStep.step === 2) {
        if (!isNumeric(message.text)) {
            await invalidInput(message);
            await packagePrompt(message);
            return;
        }
        try {
            await chatStep.updateOne({ $inc: { step: 1 } });
            chatStep.items.push({ item: chatStep.current_item, amount: +message.text * chatStep.current_item.box_size })
            await chatStep.save()
            await currentTransferingPrompt(message, chatStep.items)
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
    finalStep,
}