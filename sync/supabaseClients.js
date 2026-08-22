const { app } = require('electron');
const { createClient } = require('@supabase/supabase-js');

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
        : app.isPackaged;
console.log(`[supabaseClients] Entorno activo: ${isProd ? 'PRODUCCIÓN' : 'PRUEBA'}`);

// =================================================================
// CONFIGURACIÓN DE SUPABASE (PROYECTO PRINCIPAL DE DATOS)
// =================================================================
const PROD_DATA = {
    url: 'https://TU_PROYECTO.supabase.co',
    key: 'TU_KEY_PUBLICA'
};
const TEST_DATA = {
    url: 'https://TU_PROYECTO_TEST.supabase.co',
    key: 'TU_KEY_PUBLICA_TEST'
};
const supabaseUrl = process.env.SUPABASE_URL || (isProd ? PROD_DATA.url : TEST_DATA.url);
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || (isProd ? PROD_DATA.key : TEST_DATA.key);
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

// =================================================================
// CONFIGURACIÓN DE SUPABASE (SEGUNDO PROYECTO DE LOGS DE AUDITORÍA)
// =================================================================
const PROD_LOGS = {
    url: 'https://TU_PROYECTO_LOGS.supabase.co',
    key: 'TU_KEY_PUBLICA_LOGS'
};
const TEST_LOGS = {
    url: 'https://TU_PROYECTO_LOGS_TEST.supabase.co',
    key: 'TU_KEY_PUBLICA_LOGS_TEST'
};
const supabaseLogsUrl = process.env.SUPABASE_LOGS_URL || (isProd ? PROD_LOGS.url : TEST_LOGS.url);
const supabaseLogsKey = process.env.SUPABASE_LOGS_SERVICE_ROLE_KEY || process.env.SUPABASE_LOGS_ANON_KEY || (isProd ? PROD_LOGS.key : TEST_LOGS.key);
const supabaseLogs = createClient(supabaseLogsUrl, supabaseLogsKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

module.exports = { supabase, supabaseLogs, supabaseUrl, supabaseKey, isProd };
