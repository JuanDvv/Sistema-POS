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
    url: 'https://mkbwfypxupebulwhijgw.supabase.co',
    key: 'sb_publishable_fVK6Qpm0tyP0eKu38XUEAw_Spq-ccEw'
};
const TEST_DATA = {
    url: 'https://kfcaaiyzdmcdccmhqemf.supabase.co',
    key: 'sb_publishable_aJj-iuP6UjR-IRDIWt3NWg_jJAEc8kG'
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
    url: 'https://jzeuyerwavkxczgiqgui.supabase.co',
    key: 'sb_publishable_yWRjMRpOmdx8x6tbDv_T4A_pLkdfGSF'
};
const TEST_LOGS = {
    url: 'https://hkjjqyqsmxupeeuelzny.supabase.co',
    key: 'sb_publishable_tit8PwB5hKUE5VlMBasOrw_DURbja_w'
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
