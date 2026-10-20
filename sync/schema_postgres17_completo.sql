-- ==============================================================================
-- SISTEMA POS (TIENDA KARY) - ESQUEMA COMPLETO PARA POSTGRESQL 17
-- Base de datos unificada: incluye tablas operativas + tabla de auditoría.
-- Estándar de tiempo: Wall-Clock estricto (TEXT / ISO sin desfase horario).
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS unaccent;

-- ------------------------------------------------------------------------------
-- 1. SECUENCIA GLOBAL DE SINCRONIZACIÓN Y TRIGGER DE ASIGNACIÓN
-- ------------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS public.global_sync_seq;

CREATE OR REPLACE FUNCTION public.assign_sync_seq()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.sync_seq := nextval('public.global_sync_seq');
    RETURN NEW;
END;
$function$;

-- ------------------------------------------------------------------------------
-- 2. GUARD LWW (LAST-WRITE-WINS)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lww_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    IF NEW.updated_at <= OLD.updated_at THEN
        RETURN NULL;
    END IF;
    RETURN NEW;
END;
$function$;

-- ------------------------------------------------------------------------------
-- 3. TABLAS OPERATIVAS Y DE NEGOCIO
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.config_sucursal (
    id TEXT PRIMARY KEY,
    nombre TEXT,
    direccion TEXT,
    telefono TEXT,
    activa INTEGER DEFAULT 0,
    caja_base NUMERIC DEFAULT 200000,
    descuento_mayorista NUMERIC DEFAULT 25,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    rol TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.categorias (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    categoria_padre_id TEXT REFERENCES public.categorias(id) ON DELETE SET NULL,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.productos (
    id TEXT PRIMARY KEY,
    nombre TEXT,
    descripcion TEXT,
    precio NUMERIC,
    stock_minimo INTEGER DEFAULT 5,
    foto_path TEXT,
    categoria_id TEXT REFERENCES public.categorias(id) ON DELETE SET NULL,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.inventario_sucursal (
    producto_id TEXT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    sucursal_id TEXT NOT NULL REFERENCES public.config_sucursal(id) ON DELETE CASCADE,
    stock INTEGER NOT NULL DEFAULT 0,
    stock_reservado INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT,
    PRIMARY KEY (producto_id, sucursal_id)
);

CREATE TABLE IF NOT EXISTS public.clientes (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    tipo TEXT NOT NULL,
    identificacion TEXT,
    telefono TEXT,
    email TEXT,
    origen TEXT DEFAULT 'Credito',
    categoria TEXT DEFAULT 'Normal',
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.ventas (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT,
    total NUMERIC,
    metodo_pago TEXT,
    fecha TEXT,
    es_credito INTEGER DEFAULT 0,
    cliente_id TEXT,
    monto_recibido NUMERIC,
    vuelto NUMERIC,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.detalle_ventas (
    id TEXT PRIMARY KEY,
    venta_id TEXT NOT NULL,
    producto_id TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC NOT NULL,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.gastos (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT,
    tipo TEXT,
    descripcion TEXT,
    monto NUMERIC,
    fecha TEXT,
    metodo_pago TEXT DEFAULT 'Efectivo',
    estado TEXT,
    venta_id TEXT,
    pedido_id TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.abonos_credito (
    id TEXT PRIMARY KEY,
    cliente_id TEXT NOT NULL REFERENCES public.clientes(id),
    monto NUMERIC NOT NULL,
    fecha TEXT NOT NULL,
    metodo_pago TEXT NOT NULL,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.solicitudes_venta (
    id TEXT PRIMARY KEY,
    tipo TEXT NOT NULL,
    venta_id TEXT,
    sucursal_id TEXT NOT NULL,
    fecha_venta TEXT NOT NULL,
    datos TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    usuario_solicitante TEXT NOT NULL,
    fecha_solicitud TEXT NOT NULL,
    usuario_revisor TEXT,
    fecha_revision TEXT,
    motivo_rechazo TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.solicitudes_gasto (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT NOT NULL,
    fecha_gasto TEXT NOT NULL,
    datos TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    usuario_solicitante TEXT NOT NULL,
    fecha_solicitud TEXT NOT NULL,
    usuario_revisor TEXT,
    fecha_revision TEXT,
    motivo_rechazo TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.movimientos_inventario (
    id TEXT PRIMARY KEY,
    producto_id TEXT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    sucursal_id TEXT NOT NULL REFERENCES public.config_sucursal(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    referencia_id TEXT,
    usuario TEXT,
    fecha TEXT,
    stock_objetivo INTEGER,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.movimientos_reserva_inventario (
    id TEXT PRIMARY KEY,
    producto_id TEXT NOT NULL REFERENCES public.productos(id) ON DELETE CASCADE,
    sucursal_id TEXT NOT NULL REFERENCES public.config_sucursal(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    referencia_id TEXT,
    usuario TEXT,
    fecha TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.pedidos (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT NOT NULL,
    cliente_id TEXT NOT NULL REFERENCES public.clientes(id),
    fecha_pedido TEXT NOT NULL,
    fecha_entrega_estimada TEXT NOT NULL,
    fecha_entrega_real TEXT,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    total NUMERIC NOT NULL,
    valor_domicilio NUMERIC DEFAULT 0,
    notas TEXT,
    venta_id TEXT,
    usuario_creo TEXT,
    cliente_nombre_registro TEXT,
    cliente_identificacion_registro TEXT,
    cliente_telefono_registro TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.detalle_pedidos (
    id TEXT PRIMARY KEY,
    pedido_id TEXT NOT NULL REFERENCES public.pedidos(id),
    producto_id TEXT NOT NULL REFERENCES public.productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario NUMERIC NOT NULL,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.abonos_pedido (
    id TEXT PRIMARY KEY,
    pedido_id TEXT NOT NULL REFERENCES public.pedidos(id),
    monto NUMERIC NOT NULL,
    fecha TEXT NOT NULL,
    metodo_pago TEXT NOT NULL,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.cierres_caja (
    id TEXT PRIMARY KEY,
    sucursal_id TEXT NOT NULL,
    usuario TEXT,
    rol TEXT,
    tipo TEXT NOT NULL,
    nota TEXT,
    fecha_desde TEXT NOT NULL,
    fecha_hasta TEXT NOT NULL,
    fondo_base NUMERIC NOT NULL,
    efectivo_esperado NUMERIC NOT NULL,
    efectivo_contado NUMERIC NOT NULL,
    diferencia NUMERIC NOT NULL,
    denominaciones TEXT,
    updated_at TEXT,
    deleted_at TEXT,
    sync_seq BIGINT
);

CREATE TABLE IF NOT EXISTS public.kardex_checkpoints (
    tabla TEXT NOT NULL,
    producto_id TEXT NOT NULL,
    sucursal_id TEXT NOT NULL,
    suma_podada BIGINT NOT NULL DEFAULT 0,
    fecha_corte TEXT NOT NULL,
    updated_at TEXT,
    PRIMARY KEY (tabla, producto_id, sucursal_id)
);

-- ------------------------------------------------------------------------------
-- 4. TABLA DE AUDITORÍA UNIFICADA
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auditoria (
    id BIGSERIAL PRIMARY KEY,
    fecha TEXT NOT NULL,
    usuario TEXT NOT NULL,
    rol TEXT NOT NULL,
    sucursal_id TEXT NOT NULL,
    accion TEXT NOT NULL,
    detalles TEXT
);

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON public.auditoria(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON public.auditoria(usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_accion ON public.auditoria(accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_sucursal ON public.auditoria(sucursal_id);

-- ------------------------------------------------------------------------------
-- 5. TRIGGERS SYNC_SEQ Y LWW PARA CADA TABLA SINCRONIZADA
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    t text;
    tablas text[] := ARRAY[
        'config_sucursal', 'usuarios', 'categorias', 'productos',
        'inventario_sucursal', 'clientes', 'ventas', 'detalle_ventas',
        'gastos', 'abonos_credito', 'solicitudes_venta', 'solicitudes_gasto',
        'movimientos_inventario', 'movimientos_reserva_inventario',
        'pedidos', 'detalle_pedidos', 'abonos_pedido', 'cierres_caja'
    ];
BEGIN
    FOREACH t IN ARRAY tablas LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_assign_sync_seq ON public.%I', t);
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_sync_seq ON public.%I', t, t);
        EXECUTE format('CREATE TRIGGER trg_assign_sync_seq BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.assign_sync_seq()', t);

        EXECUTE format('DROP TRIGGER IF EXISTS trg_lww_guard ON public.%I', t);
        EXECUTE format('CREATE TRIGGER trg_lww_guard BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.lww_guard()', t);

        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(sync_seq)', 'idx_' || t || '_sync_seq', t);
    END LOOP;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. FUNCIONES RPC DE INVENTARIO, KARDEX Y AUDITORÍA
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.aplicar_movimiento_inventario(text, text, text, text, integer, text, text, timestamptz);
CREATE OR REPLACE FUNCTION public.aplicar_movimiento_inventario(
    p_id text,
    p_producto_id text,
    p_sucursal_id text,
    p_tipo text,
    p_cantidad integer,
    p_referencia_id text,
    p_usuario text,
    p_fecha text
) RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    v_insertado boolean;
BEGIN
    INSERT INTO public.movimientos_inventario (
        id, producto_id, sucursal_id, tipo, cantidad, referencia_id, usuario, fecha, updated_at
    ) VALUES (
        p_id, p_producto_id, p_sucursal_id, p_tipo, p_cantidad, p_referencia_id, p_usuario, p_fecha, p_fecha
    ) ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS v_insertado = ROW_COUNT;

    IF v_insertado THEN
        INSERT INTO public.inventario_sucursal (producto_id, sucursal_id, stock, stock_reservado, updated_at)
        VALUES (p_producto_id, p_sucursal_id, GREATEST(0, p_cantidad), 0, p_fecha)
        ON CONFLICT (producto_id, sucursal_id) DO UPDATE SET
            stock = GREATEST(0, public.inventario_sucursal.stock + EXCLUDED.stock),
            updated_at = EXCLUDED.updated_at;
    END IF;
END;
$function$;

DROP FUNCTION IF EXISTS public.aplicar_reserva_inventario(text, text, text, text, integer, text, text, timestamptz);
CREATE OR REPLACE FUNCTION public.aplicar_reserva_inventario(
    p_id text,
    p_producto_id text,
    p_sucursal_id text,
    p_tipo text,
    p_cantidad integer,
    p_referencia_id text,
    p_usuario text,
    p_fecha text
) RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
    v_insertado boolean;
BEGIN
    INSERT INTO public.movimientos_reserva_inventario (
        id, producto_id, sucursal_id, tipo, cantidad, referencia_id, usuario, fecha, updated_at
    ) VALUES (
        p_id, p_producto_id, p_sucursal_id, p_tipo, p_cantidad, p_referencia_id, p_usuario, p_fecha, p_fecha
    ) ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS v_insertado = ROW_COUNT;

    IF v_insertado THEN
        INSERT INTO public.inventario_sucursal (producto_id, sucursal_id, stock, stock_reservado, updated_at)
        VALUES (p_producto_id, p_sucursal_id, 0, GREATEST(0, p_cantidad), p_fecha)
        ON CONFLICT (producto_id, sucursal_id) DO UPDATE SET
            stock_reservado = GREATEST(0, public.inventario_sucursal.stock_reservado + EXCLUDED.stock_reservado),
            updated_at = EXCLUDED.updated_at;
    END IF;
END;
$function$;

DROP FUNCTION IF EXISTS public.aplicar_correccion_stock(text, text, text, integer, text, text, timestamptz);
CREATE OR REPLACE FUNCTION public.aplicar_correccion_stock(
    p_id text,
    p_producto_id text,
    p_sucursal_id text,
    p_stock_objetivo integer,
    p_referencia_id text,
    p_usuario text,
    p_fecha text
) RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
    v_insertado boolean;
    v_stock_actual integer := 0;
    v_delta_real integer := 0;
BEGIN
    SELECT cantidad INTO v_delta_real FROM public.movimientos_inventario WHERE id = p_id;
    IF FOUND THEN
        RETURN v_delta_real;
    END IF;

    SELECT COALESCE(stock, 0) INTO v_stock_actual
    FROM public.inventario_sucursal
    WHERE producto_id = p_producto_id AND sucursal_id = p_sucursal_id
    FOR UPDATE;

    v_delta_real := p_stock_objetivo - v_stock_actual;

    INSERT INTO public.movimientos_inventario (
        id, producto_id, sucursal_id, tipo, cantidad, referencia_id, usuario, fecha, stock_objetivo, updated_at
    ) VALUES (
        p_id, p_producto_id, p_sucursal_id, 'AJUSTE_EDICION_PRODUCTO', v_delta_real, p_referencia_id, p_usuario, p_fecha, p_stock_objetivo, p_fecha
    ) ON CONFLICT (id) DO NOTHING;

    GET DIAGNOSTICS v_insertado = ROW_COUNT;

    IF NOT v_insertado THEN
        SELECT cantidad INTO v_delta_real FROM public.movimientos_inventario WHERE id = p_id;
        RETURN v_delta_real;
    END IF;

    IF v_delta_real <> 0 THEN
        INSERT INTO public.inventario_sucursal (producto_id, sucursal_id, stock, stock_reservado, updated_at)
        VALUES (p_producto_id, p_sucursal_id, GREATEST(0, p_stock_objetivo), 0, p_fecha)
        ON CONFLICT (producto_id, sucursal_id) DO UPDATE SET
            stock = GREATEST(0, p_stock_objetivo),
            updated_at = EXCLUDED.updated_at;
    END IF;

    RETURN v_delta_real;
END;
$function$;

DROP FUNCTION IF EXISTS public.podar_kardex(text, timestamptz);
CREATE OR REPLACE FUNCTION public.podar_kardex(p_tabla text, p_fecha_corte text)
RETURNS bigint
LANGUAGE plpgsql
AS $function$
DECLARE
    v_borrados bigint;
BEGIN
    IF p_tabla NOT IN ('movimientos_inventario', 'movimientos_reserva_inventario') THEN
        RAISE EXCEPTION 'podar_kardex: tabla no permitida: %', p_tabla;
    END IF;

    EXECUTE format(
        $f$
        INSERT INTO public.kardex_checkpoints (tabla, producto_id, sucursal_id, suma_podada, fecha_corte, updated_at)
        SELECT %L, producto_id, sucursal_id, SUM(cantidad), $1, $1
        FROM public.%I
        WHERE fecha < $1
        GROUP BY producto_id, sucursal_id
        ON CONFLICT (tabla, producto_id, sucursal_id) DO UPDATE SET
            suma_podada = public.kardex_checkpoints.suma_podada + excluded.suma_podada,
            fecha_corte = excluded.fecha_corte,
            updated_at = excluded.updated_at
        $f$,
        p_tabla, p_tabla
    ) USING p_fecha_corte;

    EXECUTE format('DELETE FROM public.%I WHERE fecha < $1', p_tabla) USING p_fecha_corte;
    GET DIAGNOSTICS v_borrados = ROW_COUNT;

    RETURN v_borrados;
END;
$function$;

CREATE OR REPLACE FUNCTION public.buscar_auditoria(
    p_usuario text DEFAULT NULL,
    p_sucursal_id text DEFAULT NULL,
    p_accion text DEFAULT NULL,
    p_detalles_terminos text[] DEFAULT NULL,
    p_producto_ids text[] DEFAULT NULL,
    p_fecha_desde text DEFAULT NULL,
    p_fecha_hasta text DEFAULT NULL,
    p_limite int DEFAULT 50,
    p_offset int DEFAULT 0
)
RETURNS TABLE (
    fecha text,
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

