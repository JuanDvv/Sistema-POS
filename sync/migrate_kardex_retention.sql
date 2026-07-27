-- Migración: poda con checkpoint para el kardex (movimientos_inventario /
-- movimientos_reserva_inventario) en la nube.
--
-- Motivo: estas dos tablas son append-only y no tienen ningún mecanismo de retención (a
-- diferencia de `auditoria`, que ya poda a 90 días -- ver syncColaAuditoria en
-- sync/syncService.js). Con el pull incremental por sync_seq (sync/migrate_incremental_pull.sql)
-- ya en producción, borrar filas viejas en la nube es seguro para el sync: una fila podada
-- simplemente deja de aparecer en la próxima descarga (WHERE sync_seq > cursor), no hace falta
-- coordinar nada con las terminales. Y el stock actual (inventario_sucursal.stock/
-- stock_reservado) es un contador que se actualiza de forma incremental en cada
-- aplicar_movimiento_inventario/aplicar_reserva_inventario/aplicar_correccion_stock -- nunca se
-- recalcula sumando el kardex -- así que podar historial viejo NO afecta el stock vigente.
--
-- El problema que sí resuelve esta migración: sync/diagnostico_stock_vs_kardex.js reconcilia
-- stock actual contra SUM(cantidad) de TODO movimientos_inventario. Sin más, podar rompería esa
-- reconciliación -- iba a mostrar diferencias que no son errores reales, solo historial borrado
-- (mismo síntoma que el kardex incompleto que ese script ya documenta para stock cargado antes de
-- que existiera el kardex). Por eso `podar_kardex` no solo borra: antes de borrar, ACUMULA en
-- `kardex_checkpoints` la suma de lo que está a punto de podar, por producto_id/sucursal_id. La
-- reconciliación entonces queda como checkpoint + suma del kardex restante == stock actual, para
-- siempre, sin importar cuántas veces se haya podado. sync/diagnostico_stock_vs_kardex.js se
-- actualiza en este mismo cambio para sumar el checkpoint.
--
-- Checkpoint + delete van en una sola función SECURITY DEFINER (una sola transacción): o se
-- acumula el checkpoint Y se borra, o ninguna de las dos -- nunca queda una fila borrada sin su
-- aporte ya sumado al checkpoint.
--
-- Ejecutar este script completo en el SQL Editor de AMBOS proyectos de Supabase (el de datos, no
-- el de logs de auditoría), TEST primero:
--   - PRUEBA:     https://supabase.com/dashboard/project/kfcaaiyzdmcdccmhqemf/sql/new
--   - PRODUCCIÓN: https://supabase.com/dashboard/project/mkbwfypxupebulwhijgw/sql/new
-- Requiere que sync/migrate_stock_delta_sync.sql ya se haya corrido antes (usa las mismas tablas
-- movimientos_inventario / movimientos_reserva_inventario). Es idempotente (CREATE...IF NOT
-- EXISTS / CREATE OR REPLACE / DROP...IF EXISTS): se puede correr más de una vez sin problema.

-- 1) Índice por fecha en ambas tablas -- la poda filtra y borra por `fecha`, y hoy solo existen
--    índices por producto/sucursal y por referencia_id.
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_fecha ON public.movimientos_inventario(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_reserva_inventario_fecha ON public.movimientos_reserva_inventario(fecha);

-- 2) Checkpoint acumulado por tabla/producto/sucursal: lo que ya se podó, para que la
--    reconciliación pueda seguir sumando "checkpoint + kardex restante" en vez de depender de
--    tener todo el historial en la tabla.
CREATE TABLE IF NOT EXISTS public.kardex_checkpoints (
    tabla text NOT NULL,
    producto_id text NOT NULL,
    sucursal_id text NOT NULL,
    suma_podada bigint NOT NULL DEFAULT 0,
    fecha_corte timestamptz NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (tabla, producto_id, sucursal_id)
);

ALTER TABLE public.kardex_checkpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a anon en kardex_checkpoints" ON public.kardex_checkpoints;
CREATE POLICY "Permitir todo a anon en kardex_checkpoints" ON public.kardex_checkpoints FOR ALL TO public USING (true) WITH CHECK (true);

-- 3) Función de poda: acumula el checkpoint de lo que va a borrar y borra, en una sola
--    transacción. p_tabla restringido a un allowlist explícito -- la función es invocable por
--    cualquiera con la anon key (mismo modelo abierto que el resto de las RPC de este proyecto),
--    así que no debe poder apuntar a una tabla arbitraria vía SQL dinámico.
DROP FUNCTION IF EXISTS public.podar_kardex(text, timestamptz);

CREATE OR REPLACE FUNCTION public.podar_kardex(p_tabla text, p_fecha_corte timestamptz)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_borrados bigint;
BEGIN
    IF p_tabla NOT IN ('movimientos_inventario', 'movimientos_reserva_inventario') THEN
        RAISE EXCEPTION 'podar_kardex: tabla no permitida: %', p_tabla;
    END IF;

    EXECUTE format(
        $f$
        INSERT INTO public.kardex_checkpoints (tabla, producto_id, sucursal_id, suma_podada, fecha_corte, updated_at)
        SELECT %L, producto_id, sucursal_id, SUM(cantidad), $1, now()
        FROM public.%I
        WHERE fecha < $1
        GROUP BY producto_id, sucursal_id
        ON CONFLICT (tabla, producto_id, sucursal_id) DO UPDATE SET
            suma_podada = public.kardex_checkpoints.suma_podada + excluded.suma_podada,
            fecha_corte = excluded.fecha_corte,
            updated_at = now()
        $f$,
        p_tabla, p_tabla
    ) USING p_fecha_corte;

    EXECUTE format('DELETE FROM public.%I WHERE fecha < $1', p_tabla) USING p_fecha_corte;
    GET DIAGNOSTICS v_borrados = ROW_COUNT;

    RETURN v_borrados;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.podar_kardex(text, timestamptz) TO anon, authenticated;
