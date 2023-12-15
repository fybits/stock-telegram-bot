import sqlite3 from "sqlite3";

export type UnitsSchema = { [unitName: string]: number };

interface IAdminUser {
    id: number;
    chat_id: number;
}

class AdminUser {
    static db: sqlite3.Database;
    id: number;
    chat_id: number;

    static Migrate(db: sqlite3.Database) {
        AdminUser.db = db;
        return {
            table_name: 'admin_users',
            version: 1,
            sql: `
                CREATE TABLE IF NOT EXISTS admin_users (
                    id INTEGER PRIMARY KEY,
                    chat_id INTEGER UNIQUE
                );`
        }
    }

    static async getAll() {
        return new Promise<AdminUser[]>((resolve, reject) => {
            AdminUser.db.all<IAdminUser>(`SELECT * FROM admin_users WHERE 1 = 1;`, (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            })
        })
    }

    static findOne(object: any): AdminUser | null {
        return null//new Item();
    }

    static removeById(id: number): void {
        AdminUser.db.run(`DELETE FROM admin_users WHERE id = ${id};`)
    }

    static create(chat_id: number): AdminUser | null {
        AdminUser.db.run(`INSERT INTO admin_users (chat_id)
                     VALUES(${chat_id}) ON CONFLICT DO NOTHING;`)
        return null//new Item();
    }

    constructor(id: number, chat_id: number,) {
        this.id = id;
        this.chat_id = chat_id;
    }
}

export default AdminUser;