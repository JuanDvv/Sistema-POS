const { app } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Archivo de base de datos local v4 (soporta fotos)
const dbPath = path.join(app.getPath('userData'), 'pos_local_v4.db');
const db = new sqlite3.Database(dbPath);

const runQuery = (query, params) => new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const allQuery = (query, params) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

module.exports = { db, dbPath, runQuery, allQuery };
