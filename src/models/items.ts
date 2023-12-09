import sqlite3 from "sqlite3";
import Chat from "./chats";

class Item {
    static Migrate(db: sqlite3.Database) {
        db.run(`CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name STRING,
            box_size INTEGER,
        )`);
    }

    static find(): Item[] {
        return [];
    }

    static findOne(object: any): Item {
        return new Item();
    }

    static create(object: any): Item {
        return new Item();
    }

    constructor() {
    }
}

export default Item;