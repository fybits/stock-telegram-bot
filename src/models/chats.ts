import sqlite3 from "sqlite3";

import Item from './items';

class Chat {
    public step: number = 0;

    static Migrate(db: sqlite3.Database) {
        db.run(`CREATE TABLE IF NOT EXISTS chats (
            chat_id INTEGER PRIMARY KEY,
            step INTEGER,
            current_item_id NUMBER,
            is_boxed NUMBER,
        )`);
    }

    static findOne(object: any): Chat {
        return new Chat();
    }

    static create(object: any): Chat {
        return new Chat();
    }

    public async save() {

    }

    constructor() {
    }
}

// const chatSchema = new Schema({
//     chat_id: Number,
//     step: Number,
//     items: [{ item: Item.schema, amount: Number }],
//     current_item: Item.schema,
//     is_boxed: Boolean,
// });

export default Chat;