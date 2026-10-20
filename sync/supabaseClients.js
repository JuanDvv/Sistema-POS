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

