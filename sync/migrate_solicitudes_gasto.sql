-- Migración: tabla `solicitudes_gasto` para el módulo de Gastos de Fecha Anterior (con cola de
-- aprobación para Operadores), simétrico a `solicitudes_venta`.
--
-- Motivo: gastos.js solo podía registrar un gasto con la fecha/hora actual (registrar-gasto
-- siempre usaba new Date().toISOString()). No había forma de dejar constancia de un gasto de un
-- día anterior que se olvidó registrar en su momento -- a diferencia de ventas, que ya tenía ese
-- flujo completo (ventas-anteriores.html + solicitudes_venta). Esta tabla es la cola de
-- aprobación equivalente para gastos: un Operador que registra un gasto de fecha anterior deja
-- una solicitud pendiente hasta que un Administrador la aprueba (aplica de inmediato a caja e
-- inventario) o la rechaza; un Administrador que registra un gasto de fecha anterior lo aplica
-- directo, sin pasar por aquí (ver 'registrar-gasto-anterior' en ipc/registerGastosIpc.js).
--
-- A diferencia de solicitudes_venta, no tiene columna `tipo` ni `gasto_id`: solo cubre alta
-- ("nueva"). Editar o eliminar un gasto ya existente, sea del día que sea, no tiene restricción
-- de fecha ni de rol (ver 'editar-gasto'/'eliminar-gasto' en ipc/registerGastosIpc.js), así que
-- no necesita pasar por una cola de aprobación.
--
-- Sigue la misma convención LWW + soft delete + pull incremental (sync_seq) que el resto de
-- tablas sincronizadas (ver `solicitudes_venta`/`cierres_caja` en db/schema.js y sync/syncService.js).
--
-- Ejecutar este script completo en el SQL Editor de AMBOS proyectos de Supabase (el de datos, no
-- el de logs de auditoría), TEST primero:
--   - PRUEBA:     https://supabase.com/dashboard/project/kfcaaiyzdmcdccmhqemf/sql/new
--   - PRODUCCIÓN: https://supabase.com/dashboard/project/mkbwfypxupebulwhijgw/sql/new
-- Requiere que sync/migrate_incremental_pull.sql ya se haya corrido antes (usa la función
-- assign_sync_seq() creada por ese script) y que exista la función lww_guard() (creada en
-- sync/migrate_stock_delta_sync.sql). Es idempotente (CREATE TABLE IF NOT EXISTS / DROP...IF
-- EXISTS): se puede correr más de una vez sin problema.

CREATE TABLE IF NOT EXISTS public.solicitudes_gasto (
    id text PRIMARY KEY,
    sucursal_id text NOT NULL,
    fecha_gasto text NOT NULL,
    datos text,
    estado text NOT NULL DEFAULT 'pendiente',
    usuario_solicitante text NOT NULL,
    fecha_solicitud text NOT NULL,
    usuario_revisor text,
    fecha_revision text,
    motivo_rechazo text,
    sync_status text DEFAULT 'pending',
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    sync_seq bigint
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_gasto_estado ON public.solicitudes_gasto(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_gasto_sync_seq ON public.solicitudes_gasto(sync_seq);

ALTER TABLE public.solicitudes_gasto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a anon en solicitudes_gasto" ON public.solicitudes_gasto;
CREATE POLICY "Permitir todo a anon en solicitudes_gasto" ON public.solicitudes_gasto FOR ALL TO public USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_lww_guard ON public.solicitudes_gasto;
CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.solicitudes_gasto FOR EACH ROW EXECUTE FUNCTION lww_guard();

DROP TRIGGER IF EXISTS trg_solicitudes_gasto_sync_seq ON public.solicitudes_gasto;
CREATE TRIGGER trg_solicitudes_gasto_sync_seq BEFORE INSERT OR UPDATE ON public.solicitudes_gasto FOR EACH ROW EXECUTE FUNCTION assign_sync_seq();
