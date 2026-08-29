-- =========================================================================
-- MIGRACIÓN: PURGA DE ABONOS ELIMINADOS CON MÁS DE 1 MES DE REGISTRO
-- =========================================================================
-- Motivo: Los abonos cancelados o eliminados (deleted_at IS NOT NULL)
-- se eliminan definitivamente tras 1 mes (30 días) desde su fecha de registro.
--
-- Ejecutar en Supabase Dashboard > SQL Editor:

DELETE FROM public.abonos_credito
WHERE deleted_at IS NOT NULL
  AND fecha::timestamptz < NOW() - INTERVAL '30 days';

DELETE FROM public.abonos_pedido
WHERE deleted_at IS NOT NULL
  AND fecha::timestamptz < NOW() - INTERVAL '30 days';

-- Función invocable para purgas periódicas
CREATE OR REPLACE FUNCTION public.purgar_abonos_eliminados_antiguos(p_dias integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_creditos bigint;
    v_pedidos bigint;
    v_corte timestamptz := now() - (p_dias || ' days')::interval;
BEGIN
    DELETE FROM public.abonos_credito
    WHERE deleted_at IS NOT NULL AND fecha::timestamptz < v_corte;
    GET DIAGNOSTICS v_creditos = ROW_COUNT;

    DELETE FROM public.abonos_pedido
    WHERE deleted_at IS NOT NULL AND fecha::timestamptz < v_corte;
    GET DIAGNOSTICS v_pedidos = ROW_COUNT;

    RETURN jsonb_build_object(
        'creditos_eliminados', v_creditos,
        'pedidos_eliminados', v_pedidos
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.purgar_abonos_eliminados_antiguos(integer) TO anon, authenticated;

