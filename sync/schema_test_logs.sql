-- =========================================================================
-- ESQUEMA COMPLETO PARA EL PROYECTO SUPABASE DE TEST (LOGS DE AUDITORÍA)
-- Proyecto destino: hkjjqyqsmxupeeuelzny (test)
-- Generado a partir del esquema REAL de producción (jzeuyerwavkxczgiqgui)
-- el 2026-07-26 vía Supabase Management API (introspección de catálogo).
-- Ejecutar UNA VEZ, completo, en: Supabase Dashboard (proyecto TEST) > SQL Editor.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE EXTENSION IF NOT EXISTS "supabase_vault";

CREATE TABLE public.auditoria (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha timestamp with time zone DEFAULT timezone('utc'::text, now()),
  usuario text NOT NULL,
  rol text NOT NULL,
  sucursal_id text NOT NULL,
  accion text NOT NULL,
  detalles text
);

ALTER TABLE public.auditoria ADD CONSTRAINT auditoria_pkey PRIMARY KEY (id);

CREATE INDEX idx_auditoria_fecha ON public.auditoria USING btree (fecha);

CREATE OR REPLACE FUNCTION public.limpiar_auditoria_antigua()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM public.auditoria WHERE fecha < NOW() - INTERVAL '60 days';
END;
$function$
;

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_select_auditoria ON public.auditoria FOR SELECT TO anon USING (true);

CREATE POLICY "Permitir insercion a anonimos en auditoria" ON public.auditoria FOR INSERT TO public WITH CHECK (true);
