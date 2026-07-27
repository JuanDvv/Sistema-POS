-- Migración: pull incremental por cursor en vez de re-descargar la tabla completa cada ciclo.
--
-- Motivo: descargarTodo() (sync/syncService.js) hace un SELECT * paginado de cada tabla
-- sincronizada EN CADA CICLO (cada 1 min Operador / 5 min Administrador), sin importar si algo
-- cambió. Tablas append-only (movimientos_inventario, movimientos_reserva_inventario,
-- detalle_ventas, ventas) solo crecen, así que el costo de cada ciclo aumenta con el tiempo,
-- multiplicado por cada terminal. La solución es que cada terminal recuerde hasta dónde llegó
-- (`cursor`) y solo pida "lo nuevo desde ahí".
--
-- Por qué una columna nueva y no reusar updated_at como cursor: updated_at lo fija el RELOJ DE
-- CADA TERMINAL (lww_guard solo rechaza escrituras con updated_at <= al guardado, nunca reescribe
-- el valor con la hora del servidor -- ver la función más abajo, sin tocar). Usarlo como "tráeme
-- todo lo nuevo desde X" es inseguro si el reloj de alguna terminal está desfasado: una fila podría
-- perderse para siempre. sync_seq es una secuencia de Postgres (monotonía garantizada por el
-- servidor, inmune al reloj de cualquier terminal) -- el mecanismo estándar para replicación
-- incremental.
--
-- Nota de diseño: se agrega un trigger propio (assign_sync_seq) en vez de tocar lww_guard. Evita
-- tocar lww_guard, que ya tuvo un bug real en producción (ver sync/migrate_stock_delta_sync.sql,
-- punto 1). De paso, corrige una inconsistencia existente: detalle_pedidos no tenía trg_lww_guard
-- como sí lo tienen detalle_ventas/detalle_transferencias, así que dependía únicamente de comparar
-- updated_at sin bloqueo -- con assign_sync_seq corriendo parejo en las 18 tablas, esa tabla
-- también obtiene su cursor sin depender de si tiene o no guard de LWW.
--
-- CUIDADO -- por qué el backfill desactiva los triggers de usuario en vez de dejarlos activos:
-- lww_guard cancela CUALQUIER UPDATE cuyo updated_at no quede estrictamente más nuevo que el
-- guardado (new.updated_at <= old.updated_at -> return null, aborta la fila COMPLETA, incluyendo
-- lo que haya hecho un trigger anterior en la misma fila). El backfill de sync_seq no toca
-- updated_at, así que en las 17 tablas que sí tienen lww_guard, ese trigger cancelaba en silencio
-- el UPDATE entero -- confirmado en TEST el 2026-07-27: el backfill "corrió sin error" pero dejó
-- sync_seq NULL en todas las tablas con lww_guard (la única que sí quedó bien fue detalle_pedidos,
-- que no tiene ese trigger). Desactivar los triggers de usuario durante el backfill puntual evita
-- el choque sin tener que bump-ear updated_at de todo el catálogo (que resetearía el reloj LWW de
-- cada fila y forzaría una redescarga completa innecesaria en cada terminal).
--
-- Ejecutar este script completo en el SQL Editor de AMBOS proyectos de Supabase (el de datos, no
-- el de logs de auditoría), TEST primero -- ver verificación en sync/diagnostico_sync_seq.js antes
-- de correr esto en producción:
--   - PRUEBA:     https://supabase.com/dashboard/project/kfcaaiyzdmcdccmhqemf/sql/new
--   - PRODUCCIÓN: https://supabase.com/dashboard/project/mkbwfypxupebulwhijgw/sql/new
-- Es idempotente (CREATE SEQUENCE IF NOT EXISTS / CREATE OR REPLACE / ADD COLUMN IF NOT EXISTS /
-- DROP TRIGGER IF EXISTS): se puede correr más de una vez sin problema. El backfill de filas
-- existentes (UPDATE ... WHERE sync_seq IS NULL) tampoco repite trabajo en una segunda corrida.

-- 1) Secuencia compartida entre todas las tablas: el cursor de cada terminal por tabla queda
--    como un solo entero (el mayor sync_seq ya recibido), sin importar cuántas tablas sincronice.
CREATE SEQUENCE IF NOT EXISTS public.global_sync_seq;

-- 2) Trigger genérico: asigna el siguiente valor de la secuencia en cada INSERT o UPDATE real.
CREATE OR REPLACE FUNCTION public.assign_sync_seq()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    new.sync_seq := nextval('public.global_sync_seq');
    return new;
end;
$function$;

-- 3) Por cada tabla sincronizada: columna + índice + trigger + backfill de filas existentes.
--    Un DO block con loop evita repetir el mismo DDL 18 veces con riesgo de typos.
DO $$
DECLARE
    tabla text;
BEGIN
    FOREACH tabla IN ARRAY ARRAY[
        'ventas', 'detalle_ventas', 'gastos', 'productos', 'categorias', 'inventario_sucursal',
        'movimientos_inventario', 'movimientos_reserva_inventario', 'config_sucursal', 'usuarios',
        'transferencias', 'detalle_transferencias', 'clientes', 'abonos_credito', 'pedidos',
        'detalle_pedidos', 'abonos_pedido', 'solicitudes_venta'
    ]
    LOOP
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS sync_seq bigint', tabla);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (sync_seq)', 'idx_' || tabla || '_sync_seq', tabla);
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_sync_seq ON public.%I', tabla, tabla);
        EXECUTE format(
            'CREATE TRIGGER trg_%I_sync_seq BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION assign_sync_seq()',
            tabla, tabla
        );
        -- Backfill: nextval() se evalúa una vez POR FILA dentro de un UPDATE ... SET (es una
        -- función volatile), así que cada fila existente recibe un valor propio y creciente.
        -- Triggers de usuario desactivados durante el UPDATE -- ver nota arriba sobre por qué
        -- lww_guard cancelaría esta operación si quedaran activos (no toca updated_at). Se
        -- desactiva también assign_sync_seq (haría un segundo nextval() redundante por fila);
        -- el SET explícito de este UPDATE ya asigna el valor correcto sin necesitar el trigger.
        EXECUTE format('ALTER TABLE public.%I DISABLE TRIGGER USER', tabla);
        EXECUTE format('UPDATE public.%I SET sync_seq = nextval(''public.global_sync_seq'') WHERE sync_seq IS NULL', tabla);
        EXECUTE format('ALTER TABLE public.%I ENABLE TRIGGER USER', tabla);
    END LOOP;
END $$;
