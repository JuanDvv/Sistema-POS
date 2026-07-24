const { createClient } = require('@supabase/supabase-js');

// SRP: construcción de los clientes de Supabase a partir de la configuración/entorno.

// =================================================================
// CONFIGURACIÓN DE SUPABASE (PROYECTO PRINCIPAL DE DATOS)
// =================================================================
const supabaseUrl = process.env.SUPABASE_URL || 'https://mkbwfypxupebulwhijgw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_fVK6Qpm0tyP0eKu38XUEAw_Spq-ccEw';
const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

// =================================================================
// CONFIGURACIÓN DE SUPABASE (SEGUNDO PROYECTO DE LOGS DE AUDITORÍA)
// =================================================================
// REEMPLAZA CON LA URL Y KEY DE TU SEGUNDO PROYECTO EN SUPABASE
const supabaseLogsUrl = process.env.SUPABASE_LOGS_URL || 'https://jzeuyerwavkxczgiqgui.supabase.co'; // Fallback al mismo hasta cambiar
const supabaseLogsKey = process.env.SUPABASE_LOGS_SERVICE_ROLE_KEY || process.env.SUPABASE_LOGS_ANON_KEY || 'sb_publishable_yWRjMRpOmdx8x6tbDv_T4A_pLkdfGSF';
const supabaseLogs = createClient(supabaseLogsUrl, supabaseLogsKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false
    }
});

module.exports = { supabase, supabaseLogs, supabaseUrl, supabaseKey };
