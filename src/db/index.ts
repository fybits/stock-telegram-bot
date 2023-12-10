import sqlite3 from "sqlite3";
import models from '../models';

const DB_PATH = process.env.DB_PATH;

const configureDB = () => {
    const db = new sqlite3.Database(DB_PATH || "/db/data.db", (error) => {
        if (error) throw error;
        console.log('Connected to the sqlite database.');
    })
    db.serialize(() => {
        models.forEach((model) => {
            model.Migrate(db);
        })
    });
    return db;
}
export default configureDB;