const mongoose = require('mongoose');
const { Schema } = mongoose;

const chatSchema = new Schema({
    chat_id: Number,
    step: Number,
});

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;