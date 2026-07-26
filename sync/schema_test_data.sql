-- =========================================================================
-- ESQUEMA COMPLETO PARA EL PROYECTO SUPABASE DE TEST (DATOS)
-- Proyecto destino: kfcaaiyzdmcdccmhqemf (test)
-- Generado a partir del esquema REAL de producción (mkbwfypxupebulwhijgw)
-- el 2026-07-26 vía Supabase Management API (introspección de catálogo).
-- Ejecutar UNA VEZ, completo, en: Supabase Dashboard (proyecto TEST) > SQL Editor.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

CREATE EXTENSION IF NOT EXISTS "supabase_vault";

CREATE EXTENSION IF NOT EXISTS "pg_cron";

CREATE TABLE public.abonos_credito (
  id text NOT NULL,
  cliente_id text NOT NULL,
  monto real NOT NULL,
  fecha text NOT NULL,
  metodo_pago text NOT NULL,
  sync_status text DEFAULT 'pending'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE public.abonos_pedido (
  id text NOT NULL,
  pedido_id text NOT NULL,
  monto numeric NOT NULL,
  fecha timestamp with time zone NOT NULL,
  metodo_pago text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE public.categorias (
  id text NOT NULL,
  nombre text NOT NULL,
  categoria_padre_id text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE public.clientes (
  id text NOT NULL,
  nombre text NOT NULL,
  tipo text NOT NULL,
  identificacion text,
  telefono text,
  email text,
  sync_status text DEFAULT 'pending'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  origen text NOT NULL DEFAULT 'Credito'::text
);

CREATE TABLE public.config_sucursal (
  id text NOT NULL,
  nombre text NOT NULL,
  direccion text,
  telefono text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE public.detalle_pedidos (
  id text NOT NULL,
  pedido_id text NOT NULL,
  producto_id text NOT NULL,
  cantidad integer NOT NULL,
  precio_unitario numeric NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE public.detalle_transferencias (
  id text NOT NULL,
  transferencia_id text NOT NULL,
  producto_id text NOT NULL,
  cantidad integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE public.detalle_ventas (
  id text NOT NULL,
  venta_id text,
  producto_id text NOT NULL,
  cantidad integer NOT NULL,
  precio_unitario real NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE public.gastos (
  id text NOT NULL,
  sucursal_id text NOT NULL,
  tipo text NOT NULL,
  descripcion text NOT NULL,
  monto real NOT NULL,
  fecha timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  estado text,
  metodo_pago text DEFAULT 'Efectivo'::text,
  venta_id text,
  pedido_id text
);

CREATE TABLE public.inventario_sucursal (
  producto_id text NOT NULL,
  sucursal_id text NOT NULL,
  stock integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  stock_reservado integer NOT NULL DEFAULT 0
);

CREATE TABLE public.movimientos_inventario (
  id text NOT NULL,
  producto_id text NOT NULL,
  sucursal_id text NOT NULL,
  tipo text NOT NULL,
  cantidad integer NOT NULL,
  referencia_id text,
  usuario text,
  fecha timestamp with time zone,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE public.pedidos (
  id text NOT NULL,
  sucursal_id text NOT NULL,
  cliente_id text NOT NULL,
  fecha_pedido timestamp with time zone NOT NULL,
  fecha_entrega_estimada timestamp with time zone NOT NULL,
  fecha_entrega_real timestamp with time zone,
  estado text NOT NULL DEFAULT 'pendiente'::text,
  total numeric NOT NULL,
  notas text,
  venta_id text,
  usuario_creo text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone,
  cliente_nombre_registro text,
  cliente_identificacion_registro text,
  cliente_telefono_registro text
);

CREATE TABLE public.productos (
  id text NOT NULL,
  nombre text NOT NULL,
  descripcion text,
  precio real NOT NULL,
  stock_minimo integer NOT NULL,
  foto_path text,
  categoria_id text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE public.solicitudes_venta (
  id text NOT NULL,
  tipo text NOT NULL,
  venta_id text,
  sucursal_id text NOT NULL,
  fecha_venta text NOT NULL,
  datos text,
  estado text NOT NULL DEFAULT 'pendiente'::text,
  usuario_solicitante text NOT NULL,
  fecha_solicitud text NOT NULL,
  usuario_revisor text,
  fecha_revision text,
  motivo_rechazo text,
  sync_status text DEFAULT 'pending'::text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE public.transferencias (
  id text NOT NULL,
  sucursal_origen_id text NOT NULL,
  sucursal_destino_id text NOT NULL,
  fecha timestamp with time zone NOT NULL,
  usuario text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE public.usuarios (
  id text NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  rol text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

CREATE TABLE public.ventas (
  id text NOT NULL,
  sucursal_id text NOT NULL,
  total real NOT NULL,
  metodo_pago text NOT NULL,
  fecha timestamp with time zone NOT NULL,
  es_credito integer DEFAULT 0,
  cliente_id text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted_at timestamp with time zone
);

ALTER TABLE public.abonos_credito ADD CONSTRAINT abonos_credito_pkey PRIMARY KEY (id);

ALTER TABLE public.abonos_pedido ADD CONSTRAINT abonos_pedido_pkey PRIMARY KEY (id);

ALTER TABLE public.categorias ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);

ALTER TABLE public.clientes ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);

ALTER TABLE public.config_sucursal ADD CONSTRAINT config_sucursal_pkey PRIMARY KEY (id);

ALTER TABLE public.detalle_pedidos ADD CONSTRAINT detalle_pedidos_pkey PRIMARY KEY (id);

ALTER TABLE public.detalle_transferencias ADD CONSTRAINT detalle_transferencias_pkey PRIMARY KEY (id);

ALTER TABLE public.detalle_ventas ADD CONSTRAINT detalle_ventas_pkey PRIMARY KEY (id);

ALTER TABLE public.gastos ADD CONSTRAINT gastos_pkey PRIMARY KEY (id);

ALTER TABLE public.inventario_sucursal ADD CONSTRAINT inventario_sucursal_pkey PRIMARY KEY (producto_id, sucursal_id);

ALTER TABLE public.movimientos_inventario ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id);

ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);

ALTER TABLE public.productos ADD CONSTRAINT productos_pkey PRIMARY KEY (id);

ALTER TABLE public.solicitudes_venta ADD CONSTRAINT solicitudes_venta_pkey PRIMARY KEY (id);

ALTER TABLE public.transferencias ADD CONSTRAINT transferencias_pkey PRIMARY KEY (id);

ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);

ALTER TABLE public.ventas ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);

ALTER TABLE public.usuarios ADD CONSTRAINT usuarios_username_key UNIQUE (username);

ALTER TABLE public.abonos_credito ADD CONSTRAINT abonos_credito_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id);

ALTER TABLE public.abonos_pedido ADD CONSTRAINT abonos_pedido_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES pedidos(id);

ALTER TABLE public.categorias ADD CONSTRAINT categorias_categoria_padre_id_fkey FOREIGN KEY (categoria_padre_id) REFERENCES categorias(id) ON DELETE SET NULL;

ALTER TABLE public.detalle_pedidos ADD CONSTRAINT detalle_pedidos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES pedidos(id);

ALTER TABLE public.detalle_pedidos ADD CONSTRAINT detalle_pedidos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos(id);

ALTER TABLE public.detalle_transferencias ADD CONSTRAINT detalle_transferencias_transferencia_id_fkey FOREIGN KEY (transferencia_id) REFERENCES transferencias(id) ON DELETE CASCADE;

ALTER TABLE public.detalle_ventas ADD CONSTRAINT detalle_ventas_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE;

ALTER TABLE public.gastos ADD CONSTRAINT gastos_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES ventas(id);

ALTER TABLE public.inventario_sucursal ADD CONSTRAINT inventario_sucursal_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE;

ALTER TABLE public.inventario_sucursal ADD CONSTRAINT inventario_sucursal_sucursal_id_fkey FOREIGN KEY (sucursal_id) REFERENCES config_sucursal(id) ON DELETE CASCADE;

ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id);

ALTER TABLE public.productos ADD CONSTRAINT productos_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL;

CREATE INDEX idx_detalle_ventas_venta ON public.detalle_ventas USING btree (venta_id);

CREATE INDEX idx_detalle_ventas_producto ON public.detalle_ventas USING btree (producto_id);

CREATE INDEX idx_gastos_fecha ON public.gastos USING btree (fecha);

CREATE INDEX idx_gastos_sucursal ON public.gastos USING btree (sucursal_id);

CREATE INDEX idx_gastos_venta_id ON public.gastos USING btree (venta_id);

CREATE INDEX idx_movimientos_inventario_producto ON public.movimientos_inventario USING btree (producto_id, sucursal_id);

CREATE INDEX idx_movimientos_inventario_referencia ON public.movimientos_inventario USING btree (referencia_id);

CREATE INDEX idx_solicitudes_venta_estado ON public.solicitudes_venta USING btree (estado);

CREATE INDEX idx_solicitudes_venta_venta_id ON public.solicitudes_venta USING btree (venta_id);

CREATE INDEX idx_solicitudes_venta_sucursal ON public.solicitudes_venta USING btree (sucursal_id);

CREATE INDEX idx_ventas_sucursal ON public.ventas USING btree (sucursal_id);

CREATE INDEX idx_ventas_fecha ON public.ventas USING btree (fecha);

CREATE OR REPLACE FUNCTION public.lww_guard()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
    if new.updated_at <= old.updated_at then
        return old; -- descarta el UPDATE si no trae una versión más nueva
    end if;
    return new;
end;
$function$
;

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.abonos_credito FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_abonos_pedido_lww BEFORE UPDATE ON public.abonos_pedido FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.config_sucursal FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.detalle_transferencias FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.detalle_ventas FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.gastos FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.inventario_sucursal FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER lww_guard_movimientos_inventario BEFORE UPDATE ON public.movimientos_inventario FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_pedidos_lww BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.productos FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.solicitudes_venta FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.transferencias FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION lww_guard();

CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.ventas FOR EACH ROW EXECUTE FUNCTION lww_guard();

-- Row Level Security: en producción todas las tablas la tienen habilitada
-- (detalle_transferencias y transferencias además con FORCE).
ALTER TABLE public.abonos_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abonos_pedido ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_sucursal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_transferencias FORCE ROW LEVEL SECURITY;
ALTER TABLE public.detalle_ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gastos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario_sucursal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transferencias FORCE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

CREATE POLICY allow_all_abonos_credito ON public.abonos_credito FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY abonos_pedido_all ON public.abonos_pedido FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios anonimos en categorias" ON public.categorias FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY allow_all_clients ON public.clientes FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY config_sucursal_update_policy ON public.config_sucursal FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios anonimos en config_sucursal" ON public.config_sucursal FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY detalle_pedidos_all ON public.detalle_pedidos FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a anon en detalle_transferencias" ON public.detalle_transferencias FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios autenticados y anonimos detalle" ON public.detalle_transferencias FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a anon en detalle_ventas" ON public.detalle_ventas FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a anon en gastos" ON public.gastos FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios anonimos en inventario_sucursal" ON public.inventario_sucursal FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir lectura de movimientos_inventario" ON public.movimientos_inventario FOR SELECT TO public USING (true);

CREATE POLICY usuarios_autenticados_full_access ON public.movimientos_inventario FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir actualizar movimientos_inventario" ON public.movimientos_inventario FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir insertar movimientos_inventario" ON public.movimientos_inventario FOR INSERT TO public WITH CHECK (true);

CREATE POLICY pedidos_all ON public.pedidos FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a anon en productos" ON public.productos FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY solicitudes_venta_all ON public.solicitudes_venta FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a anon en transferencias" ON public.transferencias FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios autenticados y anonimos" ON public.transferencias FOR ALL TO anon,authenticated USING (true) WITH CHECK (true);

CREATE POLICY usuarios_update_policy ON public.usuarios FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a usuarios anonimos en usuarios" ON public.usuarios FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Permitir todo a anon en ventas" ON public.ventas FOR ALL TO anon USING (true) WITH CHECK (true);
