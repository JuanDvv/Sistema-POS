CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE IF NOT EXISTS public.errores_sistema (
    id text PRIMARY KEY,
    fecha text NOT NULL,
    usuario text NOT NULL,
    rol text NOT NULL,
    sucursal_id text NOT NULL,
    modulo text NOT NULL,
    intento_usuario text NOT NULL,
    mensaje_amigable text NOT NULL,
    error_tecnico text NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_errores_sistema_fecha ON public.errores_sistema (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_errores_sistema_sucursal ON public.errores_sistema (sucursal_id);
CREATE INDEX IF NOT EXISTS idx_errores_sistema_modulo ON public.errores_sistema (modulo);

DROP FUNCTION IF EXISTS public.buscar_errores_sistema(text, text, text, text[], text, text, int, int);

CREATE OR REPLACE FUNCTION public.buscar_errores_sistema(
    p_usuario text DEFAULT NULL,
    p_sucursal_id text DEFAULT NULL,
    p_modulo text DEFAULT NULL,
    p_terminos text[] DEFAULT NULL,
    p_fecha_desde text DEFAULT NULL,
    p_fecha_hasta text DEFAULT NULL,
    p_limite int DEFAULT 50,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    id text,
    fecha text,
    usuario text,
    rol text,
    sucursal_id text,
    modulo text,
    intento_usuario text,
    mensaje_amigable text,
    error_tecnico text,
    total bigint
)
LANGUAGE sql
STABLE
AS $function$
    SELECT e.id, e.fecha, e.usuario, e.rol, e.sucursal_id, e.modulo,
           e.intento_usuario, e.mensaje_amigable, e.error_tecnico,
           count(*) OVER() AS total
    FROM public.errores_sistema e
    WHERE (p_usuario IS NULL OR e.usuario = p_usuario)
      AND (p_sucursal_id IS NULL OR e.sucursal_id = p_sucursal_id)
      AND (p_modulo IS NULL OR e.modulo = p_modulo)
      AND (p_fecha_desde IS NULL OR e.fecha >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR e.fecha <= p_fecha_hasta)
      AND (
          p_terminos IS NULL
          OR NOT EXISTS (
              SELECT 1 FROM unnest(p_terminos) AS termino
              WHERE unaccent(lower(
                  coalesce(e.intento_usuario, '') || ' ' ||
                  coalesce(e.mensaje_amigable, '') || ' ' ||
                  coalesce(e.error_tecnico, '') || ' ' ||
                  coalesce(e.modulo, '')
              )) NOT LIKE '%' || unaccent(lower(termino)) || '%'
          )
      )
    ORDER BY e.fecha DESC
    LIMIT p_limite OFFSET p_offset;
$function$;


