-- Migración: columna `categoria` en `clientes`, para sincronizar la categoría del cliente
-- ('Normal' o 'Fiscal') entre terminales locales y Supabase.
--
-- Motivo: los clientes fiscales requieren generar cuenta de cobro (documento equivalente).
-- Sin esta columna en la nube, al sincronizar clientes entre terminales o restablecer la base
-- local, la categoría 'Fiscal' se perdía y el reporte de ventas no mostraba el botón para descargar
-- la cuenta de cobro.
--
-- Ejecutar este script completo en el SQL Editor de AMBOS proyectos de Supabase (el de datos, no
-- el de logs de auditoría), TEST primero:
--   - PRUEBA:     https://supabase.com/dashboard/project/kfcaaiyzdmcdccmhqemf/sql/new
--   - PRODUCCIÓN: https://supabase.com/dashboard/project/mkbwfypxupebulwhijgw/sql/new
-- Es idempotente (ADD COLUMN IF NOT EXISTS): se puede correr más de una vez sin problema.

ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'Normal'::text;

