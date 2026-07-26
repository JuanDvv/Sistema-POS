-- Migración: sincronización de inventario por deltas (kardex) en vez de "foto" con LWW.
--
-- Motivo: inventario_sucursal.stock y .stock_reservado se sincronizaban como valor absoluto
-- con LWW por updated_at (ver syncInventarioSubir/Descargar en sync/syncService.js, versión
-- anterior a este cambio). Si dos terminales tocaban el mismo producto/sucursal casi al mismo
-- tiempo (ej. una venta en un equipo y un abastecimiento manual en otro; o crear y entregar un
-- pedido casi a la vez desde dos cajas), el que sincronizaba último pisaba por completo el
-- cambio del otro -- no los combinaba. movimientos_inventario y movimientos_reserva_inventario
-- ya registran el delta exacto de cada operación (kardex append-only), así que en vez de subir
-- una foto del contador, subimos el movimiento y dejamos que la nube lo sume de forma atómica:
-- conmutativo, sin importar el orden de llegada de cada terminal.
--
-- Ejecutar este script completo en el SQL Editor de AMBOS proyectos de Supabase
-- (el de datos, no el de logs de auditoría):
--   - PRUEBA:     https://supabase.com/dashboard/project/kfcaaiyzdmcdccmhqemf/sql/new
--   - PRODUCCIÓN: https://supabase.com/dashboard/project/mkbwfypxupebulwhijgw/sql/new
-- Es idempotente (CREATE OR REPLACE / DROP...IF EXISTS / CREATE...IF NOT EXISTS): se puede
-- correr más de una vez sin problema. Si ya corriste una versión anterior de este archivo (solo
-- con el fix de lww_guard + aplicar_movimiento_inventario), correr esta versión completa
-- únicamente agrega lo de stock_reservado -- no repite nada de forma destructiva.

-- 1) Fix del guard de LWW: al descartar un UPDATE desactualizado, el trigger devolvía `old`
--    en vez de `null`. En Postgres, un trigger BEFORE UPDATE que devuelve `old` dejaba pasar
--    la operación como "exitosa" (sin cambios), así que la fila SÍ volvía en el RETURNING del
--    upsert -- y upsertConLWW() (sync/syncService.js) nunca detectaba la derrota: `gano` daba
--    `true` aunque el dato se hubiera descartado, y la fila local quedaba marcada 'synced' por
--    error. Afecta a TODAS las tablas con este trigger (productos, clientes, gastos, ventas,
--    pedidos, etc.), no solo inventario.
CREATE OR REPLACE FUNCTION public.lww_guard()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    if new.updated_at <= old.updated_at then
        return null; -- cancela el UPDATE (no se aplica ni aparece en RETURNING)
    end if;
    return new;
end;
$function$;

-- 2) Función atómica para aplicar un movimiento de inventario: inserta el movimiento
--    (idempotente por id -- un reintento de red no vuelve a sumar) y, solo si el insert fue
--    real, aplica el delta sobre inventario_sucursal en la misma transacción.
DROP FUNCTION IF EXISTS public.aplicar_movimiento_inventario(text, text, text, text, integer, text, text, timestamptz);

CREATE OR REPLACE FUNCTION public.aplicar_movimiento_inventario(
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
    insert into public.movimientos_inventario (id, producto_id, sucursal_id, tipo, cantidad, referencia_id, usuario, fecha, updated_at)
    values (p_id, p_producto_id, p_sucursal_id, p_tipo, p_cantidad, p_referencia_id, p_usuario, p_fecha, now())
    on conflict (id) do nothing;

    get diagnostics v_insertado = row_count;

    if v_insertado then
        insert into public.inventario_sucursal (producto_id, sucursal_id, stock, updated_at)
        values (p_producto_id, p_sucursal_id, p_cantidad, now())
        on conflict (producto_id, sucursal_id) do update
            set stock = public.inventario_sucursal.stock + excluded.stock,
                updated_at = now();
    end if;
end;
$function$;

-- Permite invocar la función a través del cliente publishable/anon (mismo modelo de
-- permisos abierto que ya usan las policies "Permitir todo a anon" del resto de la app).
GRANT EXECUTE ON FUNCTION public.aplicar_movimiento_inventario(text, text, text, text, integer, text, text, timestamptz) TO anon, authenticated;

-- 3) Mismo arreglo para inventario_sucursal.stock_reservado (hold de Pedidos/Apartados): también
--    es un contador que varias terminales incrementan/decrementan de forma concurrente (crear,
--    editar, cancelar y entregar un pedido), así que tiene el mismo riesgo de "foto que se pisa"
--    que tenía `stock`. Se resuelve igual: kardex propio (movimientos_reserva_inventario) +
--    RPC atómico e idempotente.
CREATE TABLE IF NOT EXISTS public.movimientos_reserva_inventario (
    id text PRIMARY KEY,
    producto_id text NOT NULL,
    sucursal_id text NOT NULL,
    tipo text NOT NULL,
    cantidad integer NOT NULL,
    referencia_id text,
    usuario text,
    fecha timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

ALTER TABLE public.movimientos_reserva_inventario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir todo a anon en movimientos_reserva_inventario" ON public.movimientos_reserva_inventario;
CREATE POLICY "Permitir todo a anon en movimientos_reserva_inventario" ON public.movimientos_reserva_inventario FOR ALL TO public USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_lww_guard ON public.movimientos_reserva_inventario;
CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.movimientos_reserva_inventario FOR EACH ROW EXECUTE FUNCTION lww_guard();

DROP FUNCTION IF EXISTS public.aplicar_reserva_inventario(text, text, text, text, integer, text, text, timestamptz);

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
        values (p_producto_id, p_sucursal_id, p_cantidad, now())
        on conflict (producto_id, sucursal_id) do update
            set stock_reservado = public.inventario_sucursal.stock_reservado + excluded.stock_reservado,
                updated_at = now();
    end if;
end;
$function$;

GRANT EXECUTE ON FUNCTION public.aplicar_reserva_inventario(text, text, text, text, integer, text, text, timestamptz) TO anon, authenticated;
