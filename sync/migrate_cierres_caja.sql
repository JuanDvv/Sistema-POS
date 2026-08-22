-- Migración: tabla `cierres_caja` para el módulo de Cuadre de Caja: cuadre por ventana de
-- tiempo -- cambios de turno, cierres parciales y cierre de día.
--
-- Motivo: arqueo.html/arqueo.js era solo una calculadora en vivo sin persistencia, que comparaba
-- el conteo físico contra el Reporte Diario COMPLETO (get-reporte-diario, día entero). Con el
-- horario rotativo de operadores (entrega de turno a mitad del día), cada cierre retira
-- físicamente el efectivo contado a caja fuerte -- el turno siguiente siempre arranca del fondo
-- base fijo, no se encadena el conteo del cierre anterior -- y cada operador responde solo por su
-- propia ventana de tiempo (ver services/cierreCajaService.js: fecha_desde = fecha_hasta del
-- último cierre de HOY de esa sucursal, o inicio del día si no hay ninguno).
--
-- Sigue la misma convención LWW + soft delete + pull incremental (sync_seq) que el resto de
-- tablas sincronizadas (ver `gastos`/`abonos_pedido` en db/schema.js y sync/syncService.js).
--
-- Ejecutar este script completo en el SQL Editor de AMBOS proyectos de Supabase (el de datos, no
-- el de logs de auditoría), TEST primero:
--   - PRUEBA:     https://supabase.com/dashboard/project/kfcaaiyzdmcdccmhqemf/sql/new
--   - PRODUCCIÓN: https://supabase.com/dashboard/project/mkbwfypxupebulwhijgw/sql/new
-- Requiere que sync/migrate_incremental_pull.sql ya se haya corrido antes (usa la función
-- assign_sync_seq() creada por ese script) y que exista la función lww_guard() (creada en
-- sync/migrate_stock_delta_sync.sql). Es idempotente (CREATE TABLE IF NOT EXISTS / DROP...IF
-- EXISTS): se puede correr más de una vez sin problema.

CREATE TABLE IF NOT EXISTS public.cierres_caja (
    id text PRIMARY KEY,
    sucursal_id text NOT NULL,
    usuario text,
    rol text,
    tipo text NOT NULL,
    nota text,
    fecha_desde timestamptz NOT NULL,
    fecha_hasta timestamptz NOT NULL,
    fondo_base numeric NOT NULL,
    efectivo_esperado numeric NOT NULL,
    efectivo_contado numeric NOT NULL,
    diferencia numeric NOT NULL,
    denominaciones jsonb,
    sync_status text DEFAULT 'pending',
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    sync_seq bigint
);

CREATE INDEX IF NOT EXISTS idx_cierres_caja_sucursal_fecha ON public.cierres_caja(sucursal_id, fecha_hasta);
CREATE INDEX IF NOT EXISTS idx_cierres_caja_sync_seq ON public.cierres_caja(sync_seq);

ALTER TABLE public.cierres_caja ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a anon en cierres_caja" ON public.cierres_caja;
CREATE POLICY "Permitir todo a anon en cierres_caja" ON public.cierres_caja FOR ALL TO public USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_lww_guard ON public.cierres_caja;
CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.cierres_caja FOR EACH ROW EXECUTE FUNCTION lww_guard();

DROP TRIGGER IF EXISTS trg_cierres_caja_sync_seq ON public.cierres_caja;
CREATE TRIGGER trg_cierres_caja_sync_seq BEFORE INSERT OR UPDATE ON public.cierres_caja FOR EACH ROW EXECUTE FUNCTION assign_sync_seq();
