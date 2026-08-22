-- Migración: columna `valor_domicilio` en `pedidos`, para soportar domicilio (envío) en el
-- módulo de Pedidos/Apartados igual que ya existe en Ventas.
--
-- Motivo: a diferencia de `ventas` (donde el domicilio queda embebido como sufijo "(Domicilio: $X)"
-- en metodo_pago porque la venta se cobra completa en el momento del registro), un pedido se paga
-- con abonos repartidos en el tiempo -- no hay un único "metodo_pago" del que colgar el sufijo.
-- Por eso el pedido necesita su propia columna numérica: total = productos + valor_domicilio,
-- igual que ventas.js calcula subtotalProductos + valorDomicilio en el cliente. El gasto real
-- "Domicilio (Descuento de Caja)" (salida de caja para el mensajero) recién se genera al entregar
-- el pedido (ver entregarPedidoTx en services/pedidoService.js), enlazado a la venta que se genera
-- en ese momento -- no al crear el pedido, porque el mensajero todavía no ha salido a repartir.
--
-- Ejecutar este script completo en el SQL Editor de AMBOS proyectos de Supabase (el de datos, no
-- el de logs de auditoría), TEST primero:
--   - PRUEBA:     https://supabase.com/dashboard/project/kfcaaiyzdmcdccmhqemf/sql/new
--   - PRODUCCIÓN: https://supabase.com/dashboard/project/mkbwfypxupebulwhijgw/sql/new
-- Es idempotente (ADD COLUMN IF NOT EXISTS): se puede correr más de una vez sin problema.

ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS valor_domicilio numeric DEFAULT 0;
