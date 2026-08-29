const { app } = require('electron');
const { createClient } = require('@supabase/supabase-js');

const pkg = require('../package.json');

// SRP: construcción de los clientes de Supabase a partir de la configuración/entorno.

// =================================================================
// SELECCIÓN DE ENTORNO
// =================================================================
// 1. Si se define APP_ENV (ver scripts "dev:test" / "dev:prod" en package.json), manda esa variable.
// 2. Si no, se decide según `app.isPackaged`: false al correr sin empaquetar (npm start / npm run dev,
//    entorno de PRUEBA por defecto) y true al correr el ejecutable generado por `npm run build`
//    (entorno de PRODUCCIÓN). Así nunca hace falta tocar código a mano entre un entorno y otro.
const appEnv = (process.env.APP_ENV || '').toLowerCase();
const isProd = appEnv === 'production' || appEnv === 'prod'
    ? true
    : appEnv === 'test'
        ? false
        : (app ? app.isPackaged : false);
console.log(`[supabaseClients] Entorno activo: ${isProd ? 'PRODUCCIÓN' : 'PRUEBA'}`);

// Seguridad contra cruce de datos: solo usar las credenciales de Delipostres por defecto
// si este proyecto es exactamente Delipostres ('pos-delipostresturbaco').
// Cualquier otro proyecto derivado (como Tienda de Kary) debe definir sus propias variables de entorno
// o de lo contrario el sincronizador permanecerá inactivo sin tocar Delipostres.
const isDelipostres = (pkg.name || '').toLowerCase() === 'pos-delipostresturbaco';

// =================================================================
// CONFIGURACIÓN DE SUPABASE (PROYECTO PRINCIPAL DE DATOS)
// =================================================================
const PROD_DATA = {
    url: 'https://mkbwfypxupebulwhijgw.supabase.co',
    key: 'sb_publishable_fVK6Qpm0tyP0eKu38XUEAw_Spq-ccEw'
};
const TEST_DATA = {
    url: 'https://kfcaaiyzdmcdccmhqemf.supabase.co',
    key: 'sb_publishable_aJj-iuP6UjR-IRDIWt3NWg_jJAEc8kG'
};

const defaultDataUrl = isDelipostres ? (isProd ? PROD_DATA.url : TEST_DATA.url) : '';
const defaultDataKey = isDelipostres ? (isProd ? PROD_DATA.key : TEST_DATA.key) : '';

const supabaseUrl = process.env.SUPABASE_URL || defaultDataUrl;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || defaultDataKey;
const isSyncConfigured = Boolean(supabaseUrl && supabaseKey);

const supabase = isSyncConfigured
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    })
    : null;

// =================================================================
// CONFIGURACIÓN DE SUPABASE (SEGUNDO PROYECTO DE LOGS DE AUDITORÍA)
// =================================================================
const PROD_LOGS = {
    url: 'https://jzeuyerwavkxczgiqgui.supabase.co',
    key: 'sb_publishable_yWRjMRpOmdx8x6tbDv_T4A_pLkdfGSF'
};
const TEST_LOGS = {
    url: 'https://hkjjqyqsmxupeeuelzny.supabase.co',
    key: 'sb_publishable_tit8PwB5hKUE5VlMBasOrw_DURbja_w'
};

const defaultLogsUrl = isDelipostres ? (isProd ? PROD_LOGS.url : TEST_LOGS.url) : '';
const defaultLogsKey = isDelipostres ? (isProd ? PROD_LOGS.key : TEST_LOGS.key) : '';

const supabaseLogsUrl = process.env.SUPABASE_LOGS_URL || defaultLogsUrl;
const supabaseLogsKey = process.env.SUPABASE_LOGS_SERVICE_ROLE_KEY || process.env.SUPABASE_LOGS_ANON_KEY || defaultLogsKey;

const supabaseLogs = (supabaseLogsUrl && supabaseLogsKey)
    ? createClient(supabaseLogsUrl, supabaseLogsKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    })
    : null;

module.exports = { supabase, supabaseLogs, supabaseUrl, supabaseKey, isProd, isSyncConfigured };
