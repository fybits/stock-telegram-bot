const mongoose = require('mongoose');
const Item = require('./items');
const { Schema } = mongoose;

const chatSchema = new Schema({
    chat_id: Number,
    step: Number,
    items: [{ item: Item.schema, amount: Number }],
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;