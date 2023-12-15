import sqlite3 from "sqlite3";
import models from '../models';

const DB_PATH = process.env.DB_PATH;

type ReqCallBack = (err: any, rows: any) => void;

function promisify<T>(req: (cb: ReqCallBack) => {}) {
    return new Promise<T>((resolve, reject) => {
        req((err: any, rows: any) => {
            if (err) {
                reject(err);
            }
            resolve(rows);
        });
    })
}

const configureDB = () => {
    const db = new sqlite3.Database(DB_PATH || "/db/data.db", (error) => {
        if (error) throw error;
        console.log('Connected to the sqlite database.');
    })
    db.serialize(async () => {
        db.run(`CREATE TABLE IF NOT EXISTS table_versions (
            id INTEGER PRIMARY KEY,
            table_name STRING UNIQUE,
            version INTEGER
        );`);
        const tablesVersions = await promisify<{ table_name: string, version: number }[]>((cb) => db.all("SELECT * FROM table_versions", (cb)))

        models.forEach((model) => {
            const migration = model.Migrate(db);
            const tableVersion = tablesVersions.find((tv) => tv.table_name === migration.table_name);
            if (tableVersion && migration.version <= tableVersion.version) {
                console.log(`Migrating \`${migration.table_name}\`... is up to date`);
                return;
            }
            console.log(`Migrating ${migration.table_name} ${migration.version} ${tableVersion?.version}`);
            db.run(`DROP TABLE IF EXISTS ${migration.table_name};`, () => { console.log('Dropped old version') });
            db.run(migration.sql, () => console.log('Migrated new version'));
            db.run(`INSERT INTO table_versions(table_name, version) VALUES('${migration.table_name}', ${migration.version})
                    ON CONFLICT(table_name) DO UPDATE SET version=${migration.version};`)
        })
    });
    return db;
}
export default configureDB;