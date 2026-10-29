const { app } = require('electron');
const path = require('path');
const { AsyncLocalStorage } = require('async_hooks');
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
db.configure('busyTimeout', 5000);

const txStorage = new AsyncLocalStorage();
let activeTxId = null;
let txLockPromise = Promise.resolve();
let releaseActiveTx = null;
let nextTxId = 1;

const rawRun = (query, params) => new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const rawAll = (query, params) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

const rawGet = db.get.bind(db);
db.get = function (sql, ...rest) {
    const store = txStorage.getStore();
    const currentTxId = store ? store.txId : null;
    if (activeTxId !== null && currentTxId !== activeTxId) {
        txLockPromise.then(() => db.get(sql, ...rest));
        return db;
    }
    return rawGet(sql, ...rest);
};

async function acquireTxSlot() {
    while (activeTxId !== null) {
        await txLockPromise;
    }
    const txId = nextTxId++;
    activeTxId = txId;
    txLockPromise = new Promise((resolve) => {
        releaseActiveTx = () => {
            if (activeTxId === txId) {
                activeTxId = null;
                releaseActiveTx = null;
                resolve();
            }
        };
    });
    return txId;
}

function runQuery(query, params) {
    const normalized = String(query || '').trim().toUpperCase();
    let store = txStorage.getStore();

    if (/^BEGIN(\s+(IMMEDIATE|EXCLUSIVE|DEFERRED))?(\s+TRANSACTION)?\s*;?$/.test(normalized)) {
        const txStore = { txId: null };
        txStorage.enterWith(txStore);
        return (async () => {
            const txId = await acquireTxSlot();
            txStore.txId = txId;
            try {
                return await rawRun(query, params);
            } catch (err) {
                txStore.txId = null;
                if (releaseActiveTx) releaseActiveTx();
                throw err;
            }
        })();
    }

    const currentTxId = store ? store.txId : null;

    if (/^(COMMIT|END)(\s+TRANSACTION)?\s*;?$/.test(normalized) || /^ROLLBACK(\s+TRANSACTION)?\s*;?$/.test(normalized)) {
        return (async () => {
            if (activeTxId !== null && currentTxId === activeTxId) {
                try {
                    return await rawRun(query, params);
                } finally {
                    if (store) store.txId = null;
                    if (releaseActiveTx) releaseActiveTx();
                }
            }
            return { changes: 0 };
        })();
    }

    return (async () => {
        while (activeTxId !== null && currentTxId !== activeTxId) {
            await txLockPromise;
        }
        return rawRun(query, params);
    })();
}

async function allQuery(query, params) {
    const store = txStorage.getStore();
    const currentTxId = store ? store.txId : null;
    while (activeTxId !== null && currentTxId !== activeTxId) {
        await txLockPromise;
    }
    return rawAll(query, params);
}

module.exports = { db, dbPath, runQuery, allQuery };
