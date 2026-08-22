-- Migración: tabla `sugeridos_pasteleria` para la sección "Sugeridos Semanales de Pastelería"
-- de Administración.
--
-- Motivo: el proveedor de pastelería entrega 3 veces por semana (martes/jueves/sábado) y para
-- cada día de entrega existe una cantidad "sugerida" pactada por producto y por sucursal -- el
-- proveedor completa el stock físico hasta ese valor en cada visita. No existía ningún lugar del
-- sistema donde administrar esas 3 cantidades por producto/sucursal (ver
-- services/pedidoSugeridoPasteleriaService.js, ipc/registerPedidoSugeridoIpc.js, y la sección
-- correspondiente en admin.html/admin.js). Solo Administrador puede editarlas.
--
-- Usa un id sintético (no una PK compuesta como inventario_sucursal) para poder sincronizarse con
-- el mecanismo genérico de upsert LWW (ON CONFLICT(id)), igual que la mayoría de tablas del
-- proyecto: a diferencia de inventario_sucursal (que necesita delta-sync porque varias terminales
-- incrementan/decrementan su stock de forma concurrente), aquí un Administrador simplemente
-- sobrescribe 3 números, así que una foto LWW plana es correcta y más simple.
--
-- Sigue la misma convención LWW + soft delete + pull incremental (sync_seq) que el resto de
-- tablas sincronizadas (ver `solicitudes_gasto`/`clientes` en db/schema.js y sync/syncService.js).
--
-- Ejecutar este script completo en el SQL Editor de AMBOS proyectos de Supabase (el de datos, no
-- el de logs de auditoría), TEST primero:
--   - PRUEBA:     https://supabase.com/dashboard/project/kfcaaiyzdmcdccmhqemf/sql/new
--   - PRODUCCIÓN: https://supabase.com/dashboard/project/mkbwfypxupebulwhijgw/sql/new
-- Requiere que sync/migrate_incremental_pull.sql ya se haya corrido antes (usa la función
-- assign_sync_seq() creada por ese script) y que exista la función lww_guard() (creada en
-- sync/migrate_stock_delta_sync.sql). Es idempotente (CREATE TABLE IF NOT EXISTS / DROP...IF
-- EXISTS): se puede correr más de una vez sin problema.

CREATE TABLE IF NOT EXISTS public.sugeridos_pasteleria (
    id text PRIMARY KEY,
    producto_id text NOT NULL,
    sucursal_id text NOT NULL,
    sugerido_martes integer NOT NULL DEFAULT 0,
    sugerido_jueves integer NOT NULL DEFAULT 0,
    sugerido_sabado integer NOT NULL DEFAULT 0,
    sync_status text DEFAULT 'pending',
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz,
    sync_seq bigint,
    UNIQUE (producto_id, sucursal_id)
);

CREATE INDEX IF NOT EXISTS idx_sugeridos_pasteleria_sucursal ON public.sugeridos_pasteleria(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_sugeridos_pasteleria_sync_seq ON public.sugeridos_pasteleria(sync_seq);

ALTER TABLE public.sugeridos_pasteleria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a anon en sugeridos_pasteleria" ON public.sugeridos_pasteleria;
CREATE POLICY "Permitir todo a anon en sugeridos_pasteleria" ON public.sugeridos_pasteleria FOR ALL TO public USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_lww_guard ON public.sugeridos_pasteleria;
CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.sugeridos_pasteleria FOR EACH ROW EXECUTE FUNCTION lww_guard();

DROP TRIGGER IF EXISTS trg_sugeridos_pasteleria_sync_seq ON public.sugeridos_pasteleria;
CREATE TRIGGER trg_sugeridos_pasteleria_sync_seq BEFORE INSERT OR UPDATE ON public.sugeridos_pasteleria FOR EACH ROW EXECUTE FUNCTION assign_sync_seq();
