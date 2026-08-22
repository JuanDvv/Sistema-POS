-- Migración: búsqueda de "Detalles" en el log de auditoría insensible a tildes y al orden de
-- las palabras, igual que la búsqueda del catálogo de productos (ver filtrarYRenderizarCatalogo
-- en ventas.js: cada palabra del término buscado debe aparecer en el texto, sin importar
-- mayúsculas/tildes/orden).
--
-- Motivo: ipc/registerAuditoriaIpc.js filtraba `detalles` con un solo `.ilike('%texto%')` contra
-- Supabase (PostgREST) -- insensible a mayúsculas pero NO a tildes, y exige el texto completo como
-- una sola subcadena literal (si el usuario escribe las palabras en otro orden que como quedaron
-- guardadas, no encuentra nada). PostgREST no permite aplicar unaccent() sobre una columna al
-- vuelo desde un filtro .ilike()/.or() -- se necesita una función RPC que arme la consulta en SQL.
--
-- Ejecutar este script completo en el SQL Editor del proyecto de Supabase de LOGS DE AUDITORÍA
-- (no el de datos), TEST primero:
--   - PRUEBA:      https://supabase.com/dashboard/project/hkjjqyqsmxupeeuelzny/sql/new
--   - PRODUCCIÓN:  https://supabase.com/dashboard/project/jzeuyerwavkxczgiqgui/sql/new
-- Es idempotente (CREATE EXTENSION IF NOT EXISTS / CREATE OR REPLACE / DROP FUNCTION IF EXISTS):
-- se puede correr más de una vez sin problema.

-- 1) Extensión unaccent (contrib de Postgres, disponible en Supabase): quita tildes/diacríticos
--    para poder comparar "jose" contra "José".
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 2) Función de búsqueda: reemplaza el filtrado que hacía registerAuditoriaIpc.js a mano con
--    .eq()/.ilike()/.or() encadenados. Devuelve las filas ya paginadas (LIMIT/OFFSET) más el total
--    de filas que matchean (vía count(*) OVER(), ventana que se calcula una sola vez y se repite en
--    cada fila) para no necesitar una segunda consulta de conteo.
--    p_detalles_terminos: cada palabra del texto buscado, ya separada por espacios y en minúsculas
--    en el cliente (ver normalizeStr en admin-audit-logs.js) -- todas deben aparecer en `detalles`
--    (AND), en cualquier orden, ignorando tildes.
--    p_producto_ids: IDs de producto cuyo nombre coincidió con la búsqueda (resuelto en el cliente
--    contra el catálogo local), porque en la BD el texto sigue guardando "Producto ID: <id>" en vez
--    del nombre. Si `detalles` no matchea por palabras pero el registro referencia a uno de esos
--    productos, igual se incluye.
DROP FUNCTION IF EXISTS public.buscar_auditoria(text, text, text, text[], text[], timestamptz, timestamptz, int, int);

CREATE OR REPLACE FUNCTION public.buscar_auditoria(
    p_usuario text DEFAULT NULL,
    p_sucursal_id text DEFAULT NULL,
    p_accion text DEFAULT NULL,
    p_detalles_terminos text[] DEFAULT NULL,
    p_producto_ids text[] DEFAULT NULL,
    p_fecha_desde timestamptz DEFAULT NULL,
    p_fecha_hasta timestamptz DEFAULT NULL,
    p_limite int DEFAULT 50,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    fecha timestamptz,
    usuario text,
    rol text,
    sucursal_id text,
    accion text,
    detalles text,
    total bigint
)
LANGUAGE sql
STABLE
AS $function$
    SELECT a.fecha, a.usuario, a.rol, a.sucursal_id, a.accion, a.detalles,
           count(*) OVER() AS total
    FROM public.auditoria a
    WHERE (p_usuario IS NULL OR a.usuario = p_usuario)
      AND (p_sucursal_id IS NULL OR a.sucursal_id = p_sucursal_id)
      AND (p_accion IS NULL OR a.accion = p_accion)
      AND (p_fecha_desde IS NULL OR a.fecha >= p_fecha_desde)
      AND (p_fecha_hasta IS NULL OR a.fecha <= p_fecha_hasta)
      AND (
          p_detalles_terminos IS NULL
          OR (
              NOT EXISTS (
                  SELECT 1 FROM unnest(p_detalles_terminos) AS termino
                  WHERE unaccent(lower(coalesce(a.detalles, ''))) NOT LIKE '%' || unaccent(lower(termino)) || '%'
              )
          )
          OR (
              p_producto_ids IS NOT NULL
              AND EXISTS (
                  SELECT 1 FROM unnest(p_producto_ids) AS pid
                  WHERE a.detalles LIKE '%Producto ID: ' || pid || '%'
              )
          )
      )
    ORDER BY a.fecha DESC
    LIMIT p_limite OFFSET p_offset;
$function$;

GRANT EXECUTE ON FUNCTION public.buscar_auditoria(text, text, text, text[], text[], timestamptz, timestamptz, int, int) TO anon, authenticated;
