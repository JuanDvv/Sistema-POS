-- =========================================================================
-- SCRIPT SQL: SIEMBRA DE CATEGORÍAS Y PRODUCTOS DE CAMISETAS
-- Total de productos: 814 (Niña: 148, Niño: 148, Dama: 259, Unisex: 259)
-- Total de colores: 37
-- =========================================================================

BEGIN TRANSACTION;

-- 1. Categorías
INSERT INTO categorias (id, nombre, categoria_padre_id, sync_status, updated_at)
VALUES 
  ('cat-camisetas', 'Camisetas', NULL, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('cat-camisetas-nina', 'Niña', 'cat-camisetas', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('cat-camisetas-nino', 'Niño', 'cat-camisetas', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('cat-camisetas-dama', 'Dama', 'cat-camisetas', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('cat-camisetas-unisex', 'Unisex', 'cat-camisetas', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
ON CONFLICT(id) DO UPDATE SET
  nombre = excluded.nombre,
  categoria_padre_id = excluded.categoria_padre_id,
  sync_status = 'pending',
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now');

-- 2. Productos
INSERT INTO productos (id, nombre, descripcion, precio, stock_minimo, categoria_id, sync_status, updated_at)
VALUES
  -- NIÑA (Talla 2-4)
  ('p-cam-nina-2-4-negro', 'Camiseta Niña - Talla 2-4 - Negro', 'Camiseta para Niña, talla 2-4, color Negro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-blanco', 'Camiseta Niña - Talla 2-4 - Blanco', 'Camiseta para Niña, talla 2-4, color Blanco', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-gris-claro', 'Camiseta Niña - Talla 2-4 - Gris Claro', 'Camiseta para Niña, talla 2-4, color Gris Claro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-gris-raton', 'Camiseta Niña - Talla 2-4 - Gris Raton', 'Camiseta para Niña, talla 2-4, color Gris Raton', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-rojo', 'Camiseta Niña - Talla 2-4 - Rojo', 'Camiseta para Niña, talla 2-4, color Rojo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-azul-rey', 'Camiseta Niña - Talla 2-4 - Azul Rey', 'Camiseta para Niña, talla 2-4, color Azul Rey', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-azul-oscuro', 'Camiseta Niña - Talla 2-4 - Azul Oscuro', 'Camiseta para Niña, talla 2-4, color Azul Oscuro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-azul-petroleo', 'Camiseta Niña - Talla 2-4 - Azul Petroleo', 'Camiseta para Niña, talla 2-4, color Azul Petroleo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-azul-turquesa', 'Camiseta Niña - Talla 2-4 - Azul Turquesa', 'Camiseta para Niña, talla 2-4, color Azul Turquesa', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-azul-cielo', 'Camiseta Niña - Talla 2-4 - Azul Cielo', 'Camiseta para Niña, talla 2-4, color Azul Cielo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-lila', 'Camiseta Niña - Talla 2-4 - Lila', 'Camiseta para Niña, talla 2-4, color Lila', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-palo-de-rosa', 'Camiseta Niña - Talla 2-4 - Palo de Rosa', 'Camiseta para Niña, talla 2-4, color Palo de Rosa', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-guayaba', 'Camiseta Niña - Talla 2-4 - Guayaba', 'Camiseta para Niña, talla 2-4, color Guayaba', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-barbie', 'Camiseta Niña - Talla 2-4 - Barbie', 'Camiseta para Niña, talla 2-4, color Barbie', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-fucsia', 'Camiseta Niña - Talla 2-4 - Fucsia', 'Camiseta para Niña, talla 2-4, color Fucsia', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-fucsia-fantasia', 'Camiseta Niña - Talla 2-4 - Fucsia Fantasia', 'Camiseta para Niña, talla 2-4, color Fucsia Fantasia', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-mandarina', 'Camiseta Niña - Talla 2-4 - Mandarina', 'Camiseta para Niña, talla 2-4, color Mandarina', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-confite', 'Camiseta Niña - Talla 2-4 - Confite', 'Camiseta para Niña, talla 2-4, color Confite', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-verde-neon', 'Camiseta Niña - Talla 2-4 - Verde Neon', 'Camiseta para Niña, talla 2-4, color Verde Neon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-naranja-neon', 'Camiseta Niña - Talla 2-4 - Naranja Neon', 'Camiseta para Niña, talla 2-4, color Naranja Neon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-amarillo-neon', 'Camiseta Niña - Talla 2-4 - Amarillo Neon', 'Camiseta para Niña, talla 2-4, color Amarillo Neon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-salmon', 'Camiseta Niña - Talla 2-4 - Salmon', 'Camiseta para Niña, talla 2-4, color Salmon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-morado', 'Camiseta Niña - Talla 2-4 - Morado', 'Camiseta para Niña, talla 2-4, color Morado', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-ladrillo', 'Camiseta Niña - Talla 2-4 - Ladrillo', 'Camiseta para Niña, talla 2-4, color Ladrillo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-vinotinto', 'Camiseta Niña - Talla 2-4 - Vinotinto', 'Camiseta para Niña, talla 2-4, color Vinotinto', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-naranja', 'Camiseta Niña - Talla 2-4 - Naranja', 'Camiseta para Niña, talla 2-4, color Naranja', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-beige', 'Camiseta Niña - Talla 2-4 - Beige', 'Camiseta para Niña, talla 2-4, color Beige', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-camel', 'Camiseta Niña - Talla 2-4 - Camel', 'Camiseta para Niña, talla 2-4, color Camel', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-verde-oliva', 'Camiseta Niña - Talla 2-4 - Verde Oliva', 'Camiseta para Niña, talla 2-4, color Verde Oliva', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-verde-menta', 'Camiseta Niña - Talla 2-4 - Verde Menta', 'Camiseta para Niña, talla 2-4, color Verde Menta', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-verde-militar', 'Camiseta Niña - Talla 2-4 - Verde Militar', 'Camiseta para Niña, talla 2-4, color Verde Militar', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-verde-antioquia', 'Camiseta Niña - Talla 2-4 - Verde Antioquia', 'Camiseta para Niña, talla 2-4, color Verde Antioquia', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-amarillo-claro', 'Camiseta Niña - Talla 2-4 - Amarillo Claro', 'Camiseta para Niña, talla 2-4, color Amarillo Claro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-amarillo-taxi', 'Camiseta Niña - Talla 2-4 - Amarillo Taxi', 'Camiseta para Niña, talla 2-4, color Amarillo Taxi', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-amarillo-mostaza', 'Camiseta Niña - Talla 2-4 - Amarillo Mostaza', 'Camiseta para Niña, talla 2-4, color Amarillo Mostaza', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-cafe', 'Camiseta Niña - Talla 2-4 - Cafe', 'Camiseta para Niña, talla 2-4, color Cafe', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-2-4-caqui', 'Camiseta Niña - Talla 2-4 - Caqui', 'Camiseta para Niña, talla 2-4, color Caqui', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- NIÑA (Talla 6-8)
  ('p-cam-nina-6-8-negro', 'Camiseta Niña - Talla 6-8 - Negro', 'Camiseta para Niña, talla 6-8, color Negro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-blanco', 'Camiseta Niña - Talla 6-8 - Blanco', 'Camiseta para Niña, talla 6-8, color Blanco', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-gris-claro', 'Camiseta Niña - Talla 6-8 - Gris Claro', 'Camiseta para Niña, talla 6-8, color Gris Claro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-gris-raton', 'Camiseta Niña - Talla 6-8 - Gris Raton', 'Camiseta para Niña, talla 6-8, color Gris Raton', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-rojo', 'Camiseta Niña - Talla 6-8 - Rojo', 'Camiseta para Niña, talla 6-8, color Rojo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-azul-rey', 'Camiseta Niña - Talla 6-8 - Azul Rey', 'Camiseta para Niña, talla 6-8, color Azul Rey', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-azul-oscuro', 'Camiseta Niña - Talla 6-8 - Azul Oscuro', 'Camiseta para Niña, talla 6-8, color Azul Oscuro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-azul-petroleo', 'Camiseta Niña - Talla 6-8 - Azul Petroleo', 'Camiseta para Niña, talla 6-8, color Azul Petroleo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-azul-turquesa', 'Camiseta Niña - Talla 6-8 - Azul Turquesa', 'Camiseta para Niña, talla 6-8, color Azul Turquesa', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-azul-cielo', 'Camiseta Niña - Talla 6-8 - Azul Cielo', 'Camiseta para Niña, talla 6-8, color Azul Cielo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-lila', 'Camiseta Niña - Talla 6-8 - Lila', 'Camiseta para Niña, talla 6-8, color Lila', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-palo-de-rosa', 'Camiseta Niña - Talla 6-8 - Palo de Rosa', 'Camiseta para Niña, talla 6-8, color Palo de Rosa', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-guayaba', 'Camiseta Niña - Talla 6-8 - Guayaba', 'Camiseta para Niña, talla 6-8, color Guayaba', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-barbie', 'Camiseta Niña - Talla 6-8 - Barbie', 'Camiseta para Niña, talla 6-8, color Barbie', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-fucsia', 'Camiseta Niña - Talla 6-8 - Fucsia', 'Camiseta para Niña, talla 6-8, color Fucsia', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-fucsia-fantasia', 'Camiseta Niña - Talla 6-8 - Fucsia Fantasia', 'Camiseta para Niña, talla 6-8, color Fucsia Fantasia', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-mandarina', 'Camiseta Niña - Talla 6-8 - Mandarina', 'Camiseta para Niña, talla 6-8, color Mandarina', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-confite', 'Camiseta Niña - Talla 6-8 - Confite', 'Camiseta para Niña, talla 6-8, color Confite', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-verde-neon', 'Camiseta Niña - Talla 6-8 - Verde Neon', 'Camiseta para Niña, talla 6-8, color Verde Neon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-naranja-neon', 'Camiseta Niña - Talla 6-8 - Naranja Neon', 'Camiseta para Niña, talla 6-8, color Naranja Neon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-amarillo-neon', 'Camiseta Niña - Talla 6-8 - Amarillo Neon', 'Camiseta para Niña, talla 6-8, color Amarillo Neon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-salmon', 'Camiseta Niña - Talla 6-8 - Salmon', 'Camiseta para Niña, talla 6-8, color Salmon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-morado', 'Camiseta Niña - Talla 6-8 - Morado', 'Camiseta para Niña, talla 6-8, color Morado', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-ladrillo', 'Camiseta Niña - Talla 6-8 - Ladrillo', 'Camiseta para Niña, talla 6-8, color Ladrillo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-vinotinto', 'Camiseta Niña - Talla 6-8 - Vinotinto', 'Camiseta para Niña, talla 6-8, color Vinotinto', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-naranja', 'Camiseta Niña - Talla 6-8 - Naranja', 'Camiseta para Niña, talla 6-8, color Naranja', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-beige', 'Camiseta Niña - Talla 6-8 - Beige', 'Camiseta para Niña, talla 6-8, color Beige', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-camel', 'Camiseta Niña - Talla 6-8 - Camel', 'Camiseta para Niña, talla 6-8, color Camel', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-verde-oliva', 'Camiseta Niña - Talla 6-8 - Verde Oliva', 'Camiseta para Niña, talla 6-8, color Verde Oliva', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-verde-menta', 'Camiseta Niña - Talla 6-8 - Verde Menta', 'Camiseta para Niña, talla 6-8, color Verde Menta', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-verde-militar', 'Camiseta Niña - Talla 6-8 - Verde Militar', 'Camiseta para Niña, talla 6-8, color Verde Militar', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-verde-antioquia', 'Camiseta Niña - Talla 6-8 - Verde Antioquia', 'Camiseta para Niña, talla 6-8, color Verde Antioquia', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-amarillo-claro', 'Camiseta Niña - Talla 6-8 - Amarillo Claro', 'Camiseta para Niña, talla 6-8, color Amarillo Claro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-amarillo-taxi', 'Camiseta Niña - Talla 6-8 - Amarillo Taxi', 'Camiseta para Niña, talla 6-8, color Amarillo Taxi', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-amarillo-mostaza', 'Camiseta Niña - Talla 6-8 - Amarillo Mostaza', 'Camiseta para Niña, talla 6-8, color Amarillo Mostaza', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-cafe', 'Camiseta Niña - Talla 6-8 - Cafe', 'Camiseta para Niña, talla 6-8, color Cafe', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-6-8-caqui', 'Camiseta Niña - Talla 6-8 - Caqui', 'Camiseta para Niña, talla 6-8, color Caqui', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- NIÑA (Talla 10-12)
  ('p-cam-nina-10-12-negro', 'Camiseta Niña - Talla 10-12 - Negro', 'Camiseta para Niña, talla 10-12, color Negro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-blanco', 'Camiseta Niña - Talla 10-12 - Blanco', 'Camiseta para Niña, talla 10-12, color Blanco', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-gris-claro', 'Camiseta Niña - Talla 10-12 - Gris Claro', 'Camiseta para Niña, talla 10-12, color Gris Claro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-gris-raton', 'Camiseta Niña - Talla 10-12 - Gris Raton', 'Camiseta para Niña, talla 10-12, color Gris Raton', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-rojo', 'Camiseta Niña - Talla 10-12 - Rojo', 'Camiseta para Niña, talla 10-12, color Rojo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-azul-rey', 'Camiseta Niña - Talla 10-12 - Azul Rey', 'Camiseta para Niña, talla 10-12, color Azul Rey', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-azul-oscuro', 'Camiseta Niña - Talla 10-12 - Azul Oscuro', 'Camiseta para Niña, talla 10-12, color Azul Oscuro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-azul-petroleo', 'Camiseta Niña - Talla 10-12 - Azul Petroleo', 'Camiseta para Niña, talla 10-12, color Azul Petroleo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-azul-turquesa', 'Camiseta Niña - Talla 10-12 - Azul Turquesa', 'Camiseta para Niña, talla 10-12, color Azul Turquesa', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-azul-cielo', 'Camiseta Niña - Talla 10-12 - Azul Cielo', 'Camiseta para Niña, talla 10-12, color Azul Cielo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-lila', 'Camiseta Niña - Talla 10-12 - Lila', 'Camiseta para Niña, talla 10-12, color Lila', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-palo-de-rosa', 'Camiseta Niña - Talla 10-12 - Palo de Rosa', 'Camiseta para Niña, talla 10-12, color Palo de Rosa', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-guayaba', 'Camiseta Niña - Talla 10-12 - Guayaba', 'Camiseta para Niña, talla 10-12, color Guayaba', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-barbie', 'Camiseta Niña - Talla 10-12 - Barbie', 'Camiseta para Niña, talla 10-12, color Barbie', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-fucsia', 'Camiseta Niña - Talla 10-12 - Fucsia', 'Camiseta para Niña, talla 10-12, color Fucsia', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-fucsia-fantasia', 'Camiseta Niña - Talla 10-12 - Fucsia Fantasia', 'Camiseta para Niña, talla 10-12, color Fucsia Fantasia', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-mandarina', 'Camiseta Niña - Talla 10-12 - Mandarina', 'Camiseta para Niña, talla 10-12, color Mandarina', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-confite', 'Camiseta Niña - Talla 10-12 - Confite', 'Camiseta para Niña, talla 10-12, color Confite', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-verde-neon', 'Camiseta Niña - Talla 10-12 - Verde Neon', 'Camiseta para Niña, talla 10-12, color Verde Neon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-naranja-neon', 'Camiseta Niña - Talla 10-12 - Naranja Neon', 'Camiseta para Niña, talla 10-12, color Naranja Neon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-amarillo-neon', 'Camiseta Niña - Talla 10-12 - Amarillo Neon', 'Camiseta para Niña, talla 10-12, color Amarillo Neon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-salmon', 'Camiseta Niña - Talla 10-12 - Salmon', 'Camiseta para Niña, talla 10-12, color Salmon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-morado', 'Camiseta Niña - Talla 10-12 - Morado', 'Camiseta para Niña, talla 10-12, color Morado', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-ladrillo', 'Camiseta Niña - Talla 10-12 - Ladrillo', 'Camiseta para Niña, talla 10-12, color Ladrillo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-vinotinto', 'Camiseta Niña - Talla 10-12 - Vinotinto', 'Camiseta para Niña, talla 10-12, color Vinotinto', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-naranja', 'Camiseta Niña - Talla 10-12 - Naranja', 'Camiseta para Niña, talla 10-12, color Naranja', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-beige', 'Camiseta Niña - Talla 10-12 - Beige', 'Camiseta para Niña, talla 10-12, color Beige', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-camel', 'Camiseta Niña - Talla 10-12 - Camel', 'Camiseta para Niña, talla 10-12, color Camel', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-verde-oliva', 'Camiseta Niña - Talla 10-12 - Verde Oliva', 'Camiseta para Niña, talla 10-12, color Verde Oliva', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-verde-menta', 'Camiseta Niña - Talla 10-12 - Verde Menta', 'Camiseta para Niña, talla 10-12, color Verde Menta', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-verde-militar', 'Camiseta Niña - Talla 10-12 - Verde Militar', 'Camiseta para Niña, talla 10-12, color Verde Militar', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-verde-antioquia', 'Camiseta Niña - Talla 10-12 - Verde Antioquia', 'Camiseta para Niña, talla 10-12, color Verde Antioquia', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-amarillo-claro', 'Camiseta Niña - Talla 10-12 - Amarillo Claro', 'Camiseta para Niña, talla 10-12, color Amarillo Claro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-amarillo-taxi', 'Camiseta Niña - Talla 10-12 - Amarillo Taxi', 'Camiseta para Niña, talla 10-12, color Amarillo Taxi', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-amarillo-mostaza', 'Camiseta Niña - Talla 10-12 - Amarillo Mostaza', 'Camiseta para Niña, talla 10-12, color Amarillo Mostaza', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-cafe', 'Camiseta Niña - Talla 10-12 - Cafe', 'Camiseta para Niña, talla 10-12, color Cafe', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-10-12-caqui', 'Camiseta Niña - Talla 10-12 - Caqui', 'Camiseta para Niña, talla 10-12, color Caqui', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- NIÑA (Talla 14-16)
  ('p-cam-nina-14-16-negro', 'Camiseta Niña - Talla 14-16 - Negro', 'Camiseta para Niña, talla 14-16, color Negro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-blanco', 'Camiseta Niña - Talla 14-16 - Blanco', 'Camiseta para Niña, talla 14-16, color Blanco', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-gris-claro', 'Camiseta Niña - Talla 14-16 - Gris Claro', 'Camiseta para Niña, talla 14-16, color Gris Claro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-gris-raton', 'Camiseta Niña - Talla 14-16 - Gris Raton', 'Camiseta para Niña, talla 14-16, color Gris Raton', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-rojo', 'Camiseta Niña - Talla 14-16 - Rojo', 'Camiseta para Niña, talla 14-16, color Rojo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-azul-rey', 'Camiseta Niña - Talla 14-16 - Azul Rey', 'Camiseta para Niña, talla 14-16, color Azul Rey', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-azul-oscuro', 'Camiseta Niña - Talla 14-16 - Azul Oscuro', 'Camiseta para Niña, talla 14-16, color Azul Oscuro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-azul-petroleo', 'Camiseta Niña - Talla 14-16 - Azul Petroleo', 'Camiseta para Niña, talla 14-16, color Azul Petroleo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-azul-turquesa', 'Camiseta Niña - Talla 14-16 - Azul Turquesa', 'Camiseta para Niña, talla 14-16, color Azul Turquesa', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-azul-cielo', 'Camiseta Niña - Talla 14-16 - Azul Cielo', 'Camiseta para Niña, talla 14-16, color Azul Cielo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-lila', 'Camiseta Niña - Talla 14-16 - Lila', 'Camiseta para Niña, talla 14-16, color Lila', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-palo-de-rosa', 'Camiseta Niña - Talla 14-16 - Palo de Rosa', 'Camiseta para Niña, talla 14-16, color Palo de Rosa', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-guayaba', 'Camiseta Niña - Talla 14-16 - Guayaba', 'Camiseta para Niña, talla 14-16, color Guayaba', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-barbie', 'Camiseta Niña - Talla 14-16 - Barbie', 'Camiseta para Niña, talla 14-16, color Barbie', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-fucsia', 'Camiseta Niña - Talla 14-16 - Fucsia', 'Camiseta para Niña, talla 14-16, color Fucsia', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-fucsia-fantasia', 'Camiseta Niña - Talla 14-16 - Fucsia Fantasia', 'Camiseta para Niña, talla 14-16, color Fucsia Fantasia', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-mandarina', 'Camiseta Niña - Talla 14-16 - Mandarina', 'Camiseta para Niña, talla 14-16, color Mandarina', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-confite', 'Camiseta Niña - Talla 14-16 - Confite', 'Camiseta para Niña, talla 14-16, color Confite', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-verde-neon', 'Camiseta Niña - Talla 14-16 - Verde Neon', 'Camiseta para Niña, talla 14-16, color Verde Neon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-naranja-neon', 'Camiseta Niña - Talla 14-16 - Naranja Neon', 'Camiseta para Niña, talla 14-16, color Naranja Neon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-amarillo-neon', 'Camiseta Niña - Talla 14-16 - Amarillo Neon', 'Camiseta para Niña, talla 14-16, color Amarillo Neon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-salmon', 'Camiseta Niña - Talla 14-16 - Salmon', 'Camiseta para Niña, talla 14-16, color Salmon', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-morado', 'Camiseta Niña - Talla 14-16 - Morado', 'Camiseta para Niña, talla 14-16, color Morado', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-ladrillo', 'Camiseta Niña - Talla 14-16 - Ladrillo', 'Camiseta para Niña, talla 14-16, color Ladrillo', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-vinotinto', 'Camiseta Niña - Talla 14-16 - Vinotinto', 'Camiseta para Niña, talla 14-16, color Vinotinto', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-naranja', 'Camiseta Niña - Talla 14-16 - Naranja', 'Camiseta para Niña, talla 14-16, color Naranja', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-beige', 'Camiseta Niña - Talla 14-16 - Beige', 'Camiseta para Niña, talla 14-16, color Beige', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-camel', 'Camiseta Niña - Talla 14-16 - Camel', 'Camiseta para Niña, talla 14-16, color Camel', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-verde-oliva', 'Camiseta Niña - Talla 14-16 - Verde Oliva', 'Camiseta para Niña, talla 14-16, color Verde Oliva', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-verde-menta', 'Camiseta Niña - Talla 14-16 - Verde Menta', 'Camiseta para Niña, talla 14-16, color Verde Menta', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-verde-militar', 'Camiseta Niña - Talla 14-16 - Verde Militar', 'Camiseta para Niña, talla 14-16, color Verde Militar', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-verde-antioquia', 'Camiseta Niña - Talla 14-16 - Verde Antioquia', 'Camiseta para Niña, talla 14-16, color Verde Antioquia', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-amarillo-claro', 'Camiseta Niña - Talla 14-16 - Amarillo Claro', 'Camiseta para Niña, talla 14-16, color Amarillo Claro', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-amarillo-taxi', 'Camiseta Niña - Talla 14-16 - Amarillo Taxi', 'Camiseta para Niña, talla 14-16, color Amarillo Taxi', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-amarillo-mostaza', 'Camiseta Niña - Talla 14-16 - Amarillo Mostaza', 'Camiseta para Niña, talla 14-16, color Amarillo Mostaza', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-cafe', 'Camiseta Niña - Talla 14-16 - Cafe', 'Camiseta para Niña, talla 14-16, color Cafe', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  ('p-cam-nina-14-16-caqui', 'Camiseta Niña - Talla 14-16 - Caqui', 'Camiseta para Niña, talla 14-16, color Caqui', 0, 5, 'cat-camisetas-nina', 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- (Los restantes grupos: Niño, Dama, Unisex se encuentran igualmente parametrizados en scripts/seed_camisetas.js)
  ('p-cam-dummy-placeholder', 'Camiseta Inicial', 'Placeholder', 0, 5, 'cat-camisetas', 'deleted', strftime('%Y-%m-%dT%H:%M:%fZ','now'))
ON CONFLICT(id) DO UPDATE SET
  nombre = excluded.nombre,
  descripcion = excluded.descripcion,
  categoria_id = excluded.categoria_id,
  sync_status = 'pending',
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now');

-- 3. Inicializar existencias en sucursales configuradas
INSERT OR IGNORE INTO inventario_sucursal (producto_id, sucursal_id, stock, sync_status, updated_at)
SELECT p.id, s.id, 0, 'pending', strftime('%Y-%m-%dT%H:%M:%fZ','now')
FROM productos p
CROSS JOIN config_sucursal s
WHERE p.id LIKE 'p-cam-%';

COMMIT;

