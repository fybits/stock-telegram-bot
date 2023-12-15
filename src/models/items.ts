import sqlite3 from "sqlite3";

export type UnitsSchema = { [unitName: string]: number };

interface IItem {
    id: number;
    name: string;
    unit_name: string;
    schema: string;
}

class Item {
    static db: sqlite3.Database;
    id: number;
    name: string;
    unit_name: string;
    schema: UnitsSchema;
    static Migrate(db: sqlite3.Database) {
        Item.db = db;
        return {
            table_name: 'items',
            version: 2,
            sql: `
                CREATE TABLE IF NOT EXISTS items (
                    id INTEGER PRIMARY KEY,
                    name STRING,
                    unit_name STRING,
                    schema STRING
                );`
        }
    }

    static async getAll() {
        return new Promise<Item[]>((resolve, reject) => {
            Item.db.all<IItem>(`SELECT * FROM items WHERE 1 = 1;`, (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows.map(({ schema, ...rest }) => {
                    const parsedSchema: UnitsSchema = JSON.parse(schema);
                    return { schema: parsedSchema, ...rest };
                }));
            })
        })
    }

    static findOne(object: any): Item | null {
        return null//new Item();
    }

    static removeById(id: number): void {
        Item.db.run(`DELETE FROM items WHERE id = ${id};`)
    }

    static create(name: string, unit_name: string, schema: UnitsSchema): Item | null {
        Item.db.run(`INSERT INTO items (name, unit_name, schema)
                     VALUES('${name}', '${unit_name}', '${JSON.stringify(schema)}')`)
        return null//new Item();
    }

    constructor(id: number, name: string, unit_name: string, schema: UnitsSchema) {
        this.id = id;
        this.name = name;
        this.unit_name = unit_name;
        this.schema = schema;
    }
}

export default Item;