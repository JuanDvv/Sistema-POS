-- =========================================================================
-- SCRIPT SQL: SIEMBRA DE CATEGORÍAS Y PRODUCTOS DE CAMISETAS VISCOSAS (SQLITE)
-- Total de productos: 18 (Dama: 5, Unisex: 5, Niña: 4, Niño: 4)
-- =========================================================================

BEGIN TRANSACTION;

-- 1. Categoría Principal y Subcategorías
INSERT INTO categorias (id, nombre, categoria_padre_id, sync_status, updated_at)
VALUES 
  ('cat-camisetas', 'Camisetas', NULL, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('cat-camisetas-viscosa-dama', 'Viscosa Dama', 'cat-camisetas', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('cat-camisetas-viscosa-unisex', 'Viscosa Unisex', 'cat-camisetas', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('cat-camisetas-viscosa-nina', 'Viscosa Niña', 'cat-camisetas', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('cat-camisetas-viscosa-nino', 'Viscosa Niño', 'cat-camisetas', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
ON CONFLICT(id) DO UPDATE SET
  nombre = excluded.nombre,
  categoria_padre_id = excluded.categoria_padre_id,
  sync_status = 'pending',
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now');

-- 2. Productos de Camisetas Viscosas
INSERT INTO productos (id, nombre, descripcion, precio, stock_minimo, categoria_id, sync_status, updated_at)
VALUES
  -- DAMA (S, M, L, XL, XXL)
  ('p-cam-viscosa-dama-s', 'Camiseta Viscosa Dama - Talla S', 'Camiseta Viscosa para Dama, talla S', 0, 5, 'cat-camisetas-viscosa-dama', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-dama-m', 'Camiseta Viscosa Dama - Talla M', 'Camiseta Viscosa para Dama, talla M', 0, 5, 'cat-camisetas-viscosa-dama', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-dama-l', 'Camiseta Viscosa Dama - Talla L', 'Camiseta Viscosa para Dama, talla L', 0, 5, 'cat-camisetas-viscosa-dama', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-dama-xl', 'Camiseta Viscosa Dama - Talla XL', 'Camiseta Viscosa para Dama, talla XL', 0, 5, 'cat-camisetas-viscosa-dama', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-dama-xxl', 'Camiseta Viscosa Dama - Talla XXL', 'Camiseta Viscosa para Dama, talla XXL', 0, 5, 'cat-camisetas-viscosa-dama', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- UNISEX (S, M, L, XL, XXL)
  ('p-cam-viscosa-unisex-s', 'Camiseta Viscosa Unisex - Talla S', 'Camiseta Viscosa para Unisex, talla S', 0, 5, 'cat-camisetas-viscosa-unisex', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-unisex-m', 'Camiseta Viscosa Unisex - Talla M', 'Camiseta Viscosa para Unisex, talla M', 0, 5, 'cat-camisetas-viscosa-unisex', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-unisex-l', 'Camiseta Viscosa Unisex - Talla L', 'Camiseta Viscosa para Unisex, talla L', 0, 5, 'cat-camisetas-viscosa-unisex', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-unisex-xl', 'Camiseta Viscosa Unisex - Talla XL', 'Camiseta Viscosa para Unisex, talla XL', 0, 5, 'cat-camisetas-viscosa-unisex', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-unisex-xxl', 'Camiseta Viscosa Unisex - Talla XXL', 'Camiseta Viscosa para Unisex, talla XXL', 0, 5, 'cat-camisetas-viscosa-unisex', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- NIÑA (2-4, 6-8, 10-12, 14-16)
  ('p-cam-viscosa-nina-2-4', 'Camiseta Viscosa Niña - Talla 2-4', 'Camiseta Viscosa para Niña, talla 2-4', 0, 5, 'cat-camisetas-viscosa-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-nina-6-8', 'Camiseta Viscosa Niña - Talla 6-8', 'Camiseta Viscosa para Niña, talla 6-8', 0, 5, 'cat-camisetas-viscosa-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-nina-10-12', 'Camiseta Viscosa Niña - Talla 10-12', 'Camiseta Viscosa para Niña, talla 10-12', 0, 5, 'cat-camisetas-viscosa-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-nina-14-16', 'Camiseta Viscosa Niña - Talla 14-16', 'Camiseta Viscosa para Niña, talla 14-16', 0, 5, 'cat-camisetas-viscosa-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- NIÑO (2-4, 6-8, 10-12, 14-16)
  ('p-cam-viscosa-nino-2-4', 'Camiseta Viscosa Niño - Talla 2-4', 'Camiseta Viscosa para Niño, talla 2-4', 0, 5, 'cat-camisetas-viscosa-nino', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-nino-6-8', 'Camiseta Viscosa Niño - Talla 6-8', 'Camiseta Viscosa para Niño, talla 6-8', 0, 5, 'cat-camisetas-viscosa-nino', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-nino-10-12', 'Camiseta Viscosa Niño - Talla 10-12', 'Camiseta Viscosa para Niño, talla 10-12', 0, 5, 'cat-camisetas-viscosa-nino', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-viscosa-nino-14-16', 'Camiseta Viscosa Niño - Talla 14-16', 'Camiseta Viscosa para Niño, talla 14-16', 0, 5, 'cat-camisetas-viscosa-nino', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
ON CONFLICT(id) DO UPDATE SET
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  categoria_id = excluded.categoria_id,
  sync_status = 'pending',
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now');

-- 3. Inicializar inventario_sucursal para las sucursales existentes con stock 0 si no existe
INSERT OR IGNORE INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
SELECT p.id, s.id, 0, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')
FROM productos p
CROSS JOIN config_sucursal s
WHERE p.id LIKE 'p-cam-viscosa-%';

COMMIT;

