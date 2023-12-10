import sqlite3 from "sqlite3";

class Item {
    static db: sqlite3.Database;
    id: number;
    name: string;
    box_size: number;

    static Migrate(db: sqlite3.Database) {
        Item.db = db;
        db.run(`CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY,
            name STRING,
            box_size INTEGER
        );`);
    }

    static async getAll(): Promise<Item[]> {
        const data = await new Promise((resolve, reject) => {
            Item.db.all(`SELECT * FROM items WHERE 1 = 1;`, (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            })
        })
        return data as Promise<Item[]>;
    }

    static findOne(object: any): Item | null {
        return null//new Item();
    }

    static removeById(id: number): void {
        Item.db.run(`DELETE FROM items WHERE id = ${id};`)
    }

    static create(name: string, box_size: number): Item | null {
        Item.db.run(`INSERT INTO items (name, box_size)
                     VALUES('${name}', ${box_size})`)
        return null//new Item();
    }

    constructor(id: number, name: string, box_size: number) {
        this.id = id;
        this.name = name;
        this.box_size = box_size;
    }
}

export default Item;