const { app } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { isProd } = require('../sync/supabaseClients');

// Archivo de base de datos local v4 (soporta fotos). Un archivo distinto por entorno
// (TEST/PRODUCCIÓN) para que nunca compartan datos locales, aunque sea la misma app instalada.
const dbFileName = isProd ? 'pos_delipostres.db' : 'pos_delipostres.test.db';
const dbPath = path.join(app.getPath('userData'), dbFileName);
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
