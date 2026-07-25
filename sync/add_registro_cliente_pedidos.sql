-- Agrega columnas de snapshot del cliente (nombre/identificación/teléfono) a la tabla
-- pedidos en Supabase (Postgres). Un pedido puede quedar "huérfano" cuando el cliente que
-- lo generó se elimina más tarde (eliminar-cliente hace soft delete y la sincronización
-- termina con un DELETE físico de la fila en clientes), y el LEFT JOIN pedidos->clientes
-- perdía el nombre del cliente en el listado/detalle de Pedidos/Apartados.
-- Ejecutar en: Supabase Dashboard > SQL Editor.

ALTER TABLE public.pedidos
    ADD COLUMN IF NOT EXISTS cliente_nombre_registro TEXT,
    ADD COLUMN IF NOT EXISTS cliente_identificacion_registro TEXT,
    ADD COLUMN IF NOT EXISTS cliente_telefono_registro TEXT;

-- No afecta al trigger lww_guard (opera sobre updated_at, no sobre columnas
-- específicas), así que no requiere cambios adicionales.
