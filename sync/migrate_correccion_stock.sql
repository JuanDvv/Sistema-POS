-- Migración: corrección atómica de stock por valor absoluto (arregla la doble corrección
-- concurrente en "Editar Producto").
--
-- Motivo: aplicar_movimiento_inventario (ver sync/migrate_stock_delta_sync.sql) suma cada
-- movimiento como delta conmutativo -- correcto para ventas/abastecimientos/traslados/pedidos,
-- que son eventos genuinamente aditivos. Pero "Editar Producto" registra una CORRECCIÓN MANUAL
-- ABSOLUTA ("el stock real es X"), y el delta que sube cada terminal se calculaba contra su
-- copia LOCAL del stock, que puede estar desactualizada frente a otra terminal. Si dos terminales
-- corrigen el mismo producto casi al mismo tiempo al mismo valor real (ej. tras un conteo físico),
-- cada una computa su propio delta contra la misma base local stale, y ambos deltas se suman en
-- vez de converger -- caso real confirmado en producción: dos terminales corrigieron a lo que
-- ambas creían era el valor correcto y el stock quedó un punto por debajo de lo esperado.
--
-- Solución: aplicar_correccion_stock recibe el valor OBJETIVO (no un delta) y calcula
-- delta_real = objetivo - stock_actual_en_servidor en el momento de aplicar, bajo lock de fila
-- (FOR UPDATE), así que corrección repetida al mismo valor real da delta_real=0 (no-op) en vez
-- de restar de nuevo.
--
-- Ejecutar este script completo en el SQL Editor de AMBOS proyectos de Supabase (el de datos,
-- no el de logs de auditoría), TEST primero:
--   - PRUEBA:     https://supabase.com/dashboard/project/kfcaaiyzdmcdccmhqemf/sql/new
--   - PRODUCCIÓN: https://supabase.com/dashboard/project/mkbwfypxupebulwhijgw/sql/new
-- Es idempotente (DROP...IF EXISTS / CREATE OR REPLACE): se puede correr más de una vez sin
-- problema. Requiere que sync/migrate_stock_delta_sync.sql ya se haya corrido antes (usa la
-- misma tabla movimientos_inventario).

DROP FUNCTION IF EXISTS public.aplicar_correccion_stock(text, text, text, integer, text, text, timestamptz);

CREATE OR REPLACE FUNCTION public.aplicar_correccion_stock(
    p_id text,
    p_producto_id text,
    p_sucursal_id text,
    p_stock_objetivo integer,
    p_referencia_id text,
    p_usuario text,
    p_fecha timestamptz
) RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $function$
declare
    v_stock_actual integer;
    v_delta_real integer;
    v_insertado boolean;
begin
    -- Idempotencia: un reintento de red del mismo movimiento (mismo id) no debe recalcular nada,
    -- solo devolver el delta que ya quedó aplicado la primera vez.
    select cantidad into v_delta_real from public.movimientos_inventario where id = p_id;
    if found then
        return v_delta_real;
    end if;

    -- Lock de fila: serializa correcciones concurrentes del mismo producto/sucursal, para que la
    -- segunda vea el stock ya actualizado por la primera antes de calcular su propio delta.
    select stock into v_stock_actual from public.inventario_sucursal
        where producto_id = p_producto_id and sucursal_id = p_sucursal_id
        for update;
    v_stock_actual := coalesce(v_stock_actual, 0);
    v_delta_real := p_stock_objetivo - v_stock_actual;

    insert into public.movimientos_inventario (id, producto_id, sucursal_id, tipo, cantidad, referencia_id, usuario, fecha, updated_at)
    values (p_id, p_producto_id, p_sucursal_id, 'AJUSTE_EDICION_PRODUCTO', v_delta_real, p_referencia_id, p_usuario, p_fecha, now())
    on conflict (id) do nothing;
    get diagnostics v_insertado = row_count;

    if not v_insertado then
        -- Carrera exacta con otra llamada concurrente del mismo id: devolver lo que esa ya aplicó,
        -- sin volver a tocar inventario_sucursal.
        select cantidad into v_delta_real from public.movimientos_inventario where id = p_id;
        return v_delta_real;
    end if;

    if v_delta_real <> 0 then
        insert into public.inventario_sucursal (producto_id, sucursal_id, stock, updated_at)
        values (p_producto_id, p_sucursal_id, p_stock_objetivo, now())
        on conflict (producto_id, sucursal_id) do update
            set stock = excluded.stock,
                updated_at = now();
    end if;

    return v_delta_real;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.aplicar_correccion_stock(text, text, text, integer, text, text, timestamptz) TO anon, authenticated;
