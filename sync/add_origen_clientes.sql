-- Agrega la columna 'origen' a la tabla clientes en Supabase (Postgres).
-- Diferencia clientes de crédito (alta manual desde Administración) de los
-- clientes creados automáticamente al registrar un Pedido/Apartado.
-- Ejecutar en: Supabase Dashboard > SQL Editor.

ALTER TABLE public.clientes
    ADD COLUMN IF NOT EXISTS origen TEXT NOT NULL DEFAULT 'Credito';

-- No afecta al trigger lww_guard (opera sobre updated_at, no sobre columnas
-- específicas), así que no requiere cambios adicionales.
