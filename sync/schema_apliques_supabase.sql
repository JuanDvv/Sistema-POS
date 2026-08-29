-- =========================================================================
-- SCRIPT SQL: SIEMBRA DE CATEGORÍA Y PRODUCTOS DE APLIQUES (SUPABASE / POSTGRESQL)
-- Total de productos: 24 (Valores de $3.000 a $26.000, paso de $1.000)
-- =========================================================================

-- 1. Categoría Apliques
INSERT INTO public.categorias (id, nombre, categoria_padre_id, updated_at)
VALUES ('cat-apliques', 'Apliques', NULL, now())
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  categoria_padre_id = EXCLUDED.categoria_padre_id,
  updated_at = now();

-- 2. Productos de Apliques ($3.000 a $26.000)
INSERT INTO public.productos (id, nombre, descripcion, precio, stock_minimo, categoria_id, updated_at)
VALUES
  ('p-aplique-3000', 'Aplique $3.000', 'Aplique con valor de $3.000 (3000)', 3000, 5, 'cat-apliques', now()),
  ('p-aplique-4000', 'Aplique $4.000', 'Aplique con valor de $4.000 (4000)', 4000, 5, 'cat-apliques', now()),
  ('p-aplique-5000', 'Aplique $5.000', 'Aplique con valor de $5.000 (5000)', 5000, 5, 'cat-apliques', now()),
  ('p-aplique-6000', 'Aplique $6.000', 'Aplique con valor de $6.000 (6000)', 6000, 5, 'cat-apliques', now()),
  ('p-aplique-7000', 'Aplique $7.000', 'Aplique con valor de $7.000 (7000)', 7000, 5, 'cat-apliques', now()),
  ('p-aplique-8000', 'Aplique $8.000', 'Aplique con valor de $8.000 (8000)', 8000, 5, 'cat-apliques', now()),
  ('p-aplique-9000', 'Aplique $9.000', 'Aplique con valor de $9.000 (9000)', 9000, 5, 'cat-apliques', now()),
  ('p-aplique-10000', 'Aplique $10.000', 'Aplique con valor de $10.000 (10000)', 10000, 5, 'cat-apliques', now()),
  ('p-aplique-11000', 'Aplique $11.000', 'Aplique con valor de $11.000 (11000)', 11000, 5, 'cat-apliques', now()),
  ('p-aplique-12000', 'Aplique $12.000', 'Aplique con valor de $12.000 (12000)', 12000, 5, 'cat-apliques', now()),
  ('p-aplique-13000', 'Aplique $13.000', 'Aplique con valor de $13.000 (13000)', 13000, 5, 'cat-apliques', now()),
  ('p-aplique-14000', 'Aplique $14.000', 'Aplique con valor de $14.000 (14000)', 14000, 5, 'cat-apliques', now()),
  ('p-aplique-15000', 'Aplique $15.000', 'Aplique con valor de $15.000 (15000)', 15000, 5, 'cat-apliques', now()),
  ('p-aplique-16000', 'Aplique $16.000', 'Aplique con valor de $16.000 (16000)', 16000, 5, 'cat-apliques', now()),
  ('p-aplique-17000', 'Aplique $17.000', 'Aplique con valor de $17.000 (17000)', 17000, 5, 'cat-apliques', now()),
  ('p-aplique-18000', 'Aplique $18.000', 'Aplique con valor de $18.000 (18000)', 18000, 5, 'cat-apliques', now()),
  ('p-aplique-19000', 'Aplique $19.000', 'Aplique con valor de $19.000 (19000)', 19000, 5, 'cat-apliques', now()),
  ('p-aplique-20000', 'Aplique $20.000', 'Aplique con valor de $20.000 (20000)', 20000, 5, 'cat-apliques', now()),
  ('p-aplique-21000', 'Aplique $21.000', 'Aplique con valor de $21.000 (21000)', 21000, 5, 'cat-apliques', now()),
  ('p-aplique-22000', 'Aplique $22.000', 'Aplique con valor de $22.000 (22000)', 22000, 5, 'cat-apliques', now()),
  ('p-aplique-23000', 'Aplique $23.000', 'Aplique con valor de $23.000 (23000)', 23000, 5, 'cat-apliques', now()),
  ('p-aplique-24000', 'Aplique $24.000', 'Aplique con valor de $24.000 (24000)', 24000, 5, 'cat-apliques', now()),
  ('p-aplique-25000', 'Aplique $25.000', 'Aplique con valor de $25.000 (25000)', 25000, 5, 'cat-apliques', now()),
  ('p-aplique-26000', 'Aplique $26.000', 'Aplique con valor de $26.000 (26000)', 26000, 5, 'cat-apliques', now())
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  precio = EXCLUDED.precio,
  categoria_id = EXCLUDED.categoria_id,
  updated_at = now();

-- 3. Inicializar inventario_sucursal para las sucursales existentes con stock 0 si no existe
INSERT INTO public.inventario_sucursal (producto_id, sucursal_id, stock, updated_at)
SELECT p.id, s.id, 0, now()
FROM public.productos p
CROSS JOIN public.config_sucursal s
WHERE p.id LIKE 'p-aplique-%'
ON CONFLICT (producto_id, sucursal_id) DO NOTHING;

