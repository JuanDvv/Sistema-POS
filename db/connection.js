const { app } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { isProd } = require('../sync/supabaseClients');
const pkg = require('../package.json');

// Archivo de base de datos local v4 (soporta fotos). Un archivo distinto por entorno
// (TEST/PRODUCCIÓN) y aislado por nombre de paquete para que otros proyectos no lo compartan.
const isDelipostres = (pkg.name || '').toLowerCase() === 'pos-delipostresturbaco';
const baseName = isDelipostres ? 'pos_delipostres' : (pkg.name || 'pos_app').replace(/[^a-zA-Z0-9_-]/g, '_');
const dbFileName = isProd ? `${baseName}.db` : `${baseName}.test.db`;
const userDataDir = app ? app.getPath('userData') : path.join(process.cwd(), 'data');
const dbPath = path.join(userDataDir, dbFileName);
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
