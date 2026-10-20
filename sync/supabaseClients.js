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
// CLIENTE UNIFICADO DE POSTGRESQL 17 (DOCKER / SERVIDOR LOCAL)
// =================================================================
const { remoteDbClient } = require('./remoteDbClient');
const { obtenerConfigServidor } = require('../services/serverConfigService');

const serverConfig = obtenerConfigServidor();
const supabaseUrl = `postgresql://${serverConfig.host}:${serverConfig.port}/${serverConfig.database}`;
const supabaseKey = serverConfig.user || 'postgres';
const isSyncConfigured = Boolean(serverConfig.host && serverConfig.database);

// Ambos clientes convergen en la misma base de datos unificada de PostgreSQL 17
const supabase = remoteDbClient;
const supabaseLogs = remoteDbClient;

module.exports = { supabase, supabaseLogs, supabaseUrl, supabaseKey, isProd, isSyncConfigured };
