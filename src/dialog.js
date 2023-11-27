const axios = require('axios').default;

const initStep = async (message, items, chatStep) => {
    if (message.text === 'Перемещение' || chatStep.step === 0) {
        try {
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
            const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
                chat_id: message.chat.id,
                text: 'Неверный формат',
            });
            initStep(message, items, chatStep);
            return;
        }
        try {
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
            await chatStep.updateOne({ $inc: { step: 1 } });
            return true;
        } catch (error) {
            console.log(error.response.data)
        }
    }
}


module.exports = {
    initStep,
    selectingStep
}