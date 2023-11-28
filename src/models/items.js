const mongoose = require('mongoose');
const { Schema } = mongoose;

const itemSchema = new Schema({
    name: String,
    box_size: Number,
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;