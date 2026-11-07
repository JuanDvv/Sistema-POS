-- Migración: corrección de liberación de stock reservado (hold de Pedidos/Apartados)
-- y reconciliación de saldos en inventario_sucursal.
--
-- Motivo: aplicar_reserva_inventario evaluaba GREATEST(0, p_cantidad) en VALUES, lo que convertía
-- deltas negativos (entregas y cancelaciones) en 0 dentro de ON CONFLICT DO UPDATE (+ excluded.stock_reservado).
-- Con esto, el stock_reservado nunca se liberaba en Postgres y sobreescribía a los clientes locales en cada pull.

CREATE OR REPLACE FUNCTION public.aplicar_reserva_inventario(
    p_id text,
    p_producto_id text,
    p_sucursal_id text,
    p_tipo text,
    p_cantidad integer,
    p_referencia_id text,
    p_usuario text,
    p_fecha timestamptz
) RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $function$
declare
    v_insertado boolean;
begin
    insert into public.movimientos_reserva_inventario (id, producto_id, sucursal_id, tipo, cantidad, referencia_id, usuario, fecha, updated_at)
    values (p_id, p_producto_id, p_sucursal_id, p_tipo, p_cantidad, p_referencia_id, p_usuario, p_fecha, now())
    on conflict (id) do nothing;

    get diagnostics v_insertado = row_count;

    if v_insertado then
        insert into public.inventario_sucursal (producto_id, sucursal_id, stock_reservado, updated_at)
        values (p_producto_id, p_sucursal_id, GREATEST(0, p_cantidad), now())
        on conflict (producto_id, sucursal_id) do update
            set stock_reservado = GREATEST(0, COALESCE(public.inventario_sucursal.stock_reservado, 0) + p_cantidad),
                updated_at = now();
    end if;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.aplicar_reserva_inventario(text, text, text, text, integer, text, text, timestamptz) TO PUBLIC;

-- Reconciliación del stock_reservado histórico en inventario_sucursal:
-- Asigna el total real de unidades comprometidas exclusivamente para pedidos pendientes no eliminados.
UPDATE public.inventario_sucursal inv
SET stock_reservado = COALESCE((
    SELECT SUM(dp.cantidad)
    FROM public.detalle_pedidos dp
    JOIN public.pedidos p ON dp.pedido_id = p.id
    WHERE p.sucursal_id = inv.sucursal_id
      AND dp.producto_id = inv.producto_id
      AND p.estado = 'pendiente'
      AND p.deleted_at IS NULL
      AND dp.deleted_at IS NULL
), 0),
updated_at = now();

