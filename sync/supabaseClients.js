const { app } = require('electron');
const { createClient } = require('@supabase/supabase-js');

const pkg = require('../package.json');

// SRP: construcción de los clientes de Supabase a partir de la configuración/entorno.

// =================================================================
// SELECCIÓN DE ENTORNO
// =================================================================
const appEnv = (process.env.APP_ENV || '').toLowerCase();
const isProd = appEnv === 'production' || appEnv === 'prod'
    ? true
    : appEnv === 'test'
        ? false
        : (app ? app.isPackaged : false);
console.log(`[supabaseClients] Entorno activo: ${isProd ? 'PRODUCCIÓN' : 'PRUEBA'}`);

// =================================================================
// CONFIGURACIÓN DE SUPABASE (PROYECTO PRINCIPAL DE DATOS)
// =================================================================
const PROD_DATA = {
    url: '',
    key: ''
};
const TEST_DATA = {
    url: '',
    key: ''
};
const rawUrl = process.env.SUPABASE_URL || (isProd ? PROD_DATA.url : TEST_DATA.url);
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || (isProd ? PROD_DATA.key : TEST_DATA.key);

const isSyncConfigured = Boolean(rawUrl && rawKey && !rawUrl.includes('TU_PROYECTO') && !rawKey.includes('TU_KEY'));
const supabaseUrl = isSyncConfigured ? rawUrl : '';
const supabaseKey = isSyncConfigured ? rawKey : '';

const supabase = isSyncConfigured ? createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
}) : null;

// =================================================================
// CONFIGURACIÓN DE SUPABASE (SEGUNDO PROYECTO DE LOGS DE AUDITORÍA)
// =================================================================
const PROD_LOGS = {
    url: '',
    key: ''
};
const TEST_LOGS = {
    url: '',
    key: ''
};
const rawLogsUrl = process.env.SUPABASE_LOGS_URL || (isProd ? PROD_LOGS.url : TEST_LOGS.url);
const rawLogsKey = process.env.SUPABASE_LOGS_SERVICE_ROLE_KEY || process.env.SUPABASE_LOGS_ANON_KEY || (isProd ? PROD_LOGS.key : TEST_LOGS.key);

const isLogsConfigured = Boolean(rawLogsUrl && rawLogsKey && !rawLogsUrl.includes('TU_PROYECTO') && !rawLogsKey.includes('TU_KEY'));
const supabaseLogsUrl = isLogsConfigured ? rawLogsUrl : '';
const supabaseLogsKey = isLogsConfigured ? rawLogsKey : '';

const supabaseLogs = isLogsConfigured ? createClient(supabaseLogsUrl, supabaseLogsKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
}) : null;

module.exports = { supabase, supabaseLogs, supabaseUrl, supabaseKey, isProd, isSyncConfigured };
