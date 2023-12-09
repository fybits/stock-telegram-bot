// import axios from 'axios';
// import Chat from './models/chats';

// const selectPrompt = async (message, items) => {
//     const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
//         chat_id: message.chat.id,
//         text: 'Выберите одну из опций ниже',
//         reply_markup: {
//             keyboard: [
//                 items.map((item) => ({ text: item.name })),
//                 [{ text: 'Отмена' }]
//             ],
//         }
//     });
// }

// const packagePrompt = async (message) => {
//     const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
//         chat_id: message.chat.id,
//         text: 'Коробок или штук',
//         reply_markup: {
//             keyboard: [[
//                 { text: 'Коробки' },
//                 { text: 'Штуки' },
//             ], [{ text: 'Отмена' }]],
//         }
//     });
// }

// const amountPrompt = async (message) => {
//     const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
//         chat_id: message.chat.id,
//         text: 'Укажите число',
//     });
// }

// const invalidInput = async (message) => {
//     const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
//         chat_id: message.chat.id,
//         text: 'Неверный формат',
//     });
// }

// export const initStep = async (message, items, chatStep) => {
//     if (message.text === 'Перемещение' || chatStep.step === 0) {
//         try {
//             await selectPrompt(message, items)
//             await chatStep.updateOne({ $inc: { step: 1 } });
//             return true;
//         } catch (error) {
//             console.log(error.response.data)
//         }
//     }
//     return false;
// }

// export const selectingStep = async (message, items, chatStep) => {
//     if (chatStep.step === 1) {
//         const item = items.find({ name: message.text });
//         if (!item) {
//             await invalidInput(message);
//             await selectPrompt(message, items);
//             return false;
//         }
//         try {
//             await packagePrompt(message);
//             await chatStep.updateOne({ $inc: { step: 1 }, $set: { current_item: item } });
//             return true;
//         } catch (error) {
//             console.log(error.response.data)
//         }
//     }
//     return false;
// }

// function isNumeric(str: string) {
//     if (typeof str != "string") return false // we only process strings!  
//     return !isNaN(+str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
//         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
// }

// const currentTransferingPrompt = async (message, items) => {
//     const res2 = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
//         chat_id: message.chat.id,
//         text: `Итого\n${items.map((i) => `${i.item.name} - ${i.amount} шт`).join('\n')}`,
//         reply_markup: {
//             keyboard: [[
//                 { text: 'Добавить еще' },
//                 { text: 'Готово' },
//             ], [{ text: 'Отмена' }]],
//         }
//     });
// }

// export const amountStep = async (message, items, chatStep) => {
//     if (chatStep.step === 2) {
//         if (!['Коробки', 'Штуки'].includes(message.text)) {
//             await invalidInput(message);
//             await packagePrompt(message);
//             return false;
//         }
//         try {
//             await amountPrompt(message)
//             await chatStep.updateOne({ $inc: { step: 1 }, $set: { is_boxed: message.text === 'Коробки' } });
//             return true;
//         } catch (error) {
//             console.log(error.response.data)
//         }
//     }
//     return false;
// }

// export const finalStep = async (message, items, chatStep: Chat) => {
//     if (chatStep.step === 3) {
//         if (!isNumeric(message.text)) {
//             await invalidInput(message);
//             await packagePrompt(message);
//             return false;
//         }
//         try {
//             await chatStep.updateOne({ $inc: { step: 1 } });
//             chatStep.items.push({ item: chatStep.current_item, amount: chatStep.is_boxed ? +message.text * chatStep.current_item.box_size : +message.text })
//             await chatStep.save()
//             await currentTransferingPrompt(message, chatStep.items)
//             return true;
//         } catch (err) {
//             console.log(err)
//         }
//     }
//     return false;
// }