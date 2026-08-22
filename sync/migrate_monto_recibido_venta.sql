-- Migración: columnas `monto_recibido` y `vuelto` en `ventas`, para dejar registrado cuánto
-- dinero entregó el cliente al pagar en efectivo (o la porción en efectivo de un pago Mixto) y
-- cuánto vuelto se le devolvió.
--
-- Motivo: el comprobante impreso al cobrar (ver services/ticketEscPos.js y construirTicketHTML en
-- ventas.js/reportes.js) ya muestra "Recibido"/"Cambio" tomándolos de los campos que el cajero
-- llena en el modal de cobro, pero esos valores solo vivían en memoria del navegador durante esa
-- venta puntual y se perdían apenas se cerraba el modal -- reimprimir el comprobante de una venta
-- ya registrada desde Reportes (ver imprimirComprobanteHistorial en reportes.js) no podía
-- mostrarlos. Ambas columnas quedan NULL para ventas sin componente en efectivo (Transferencia,
-- Crédito) o para ventas anteriores a esta migración.
--
-- Ejecutar este script completo en el SQL Editor de AMBOS proyectos de Supabase (el de datos, no
-- el de logs de auditoría), TEST primero:
--   - PRUEBA:     https://supabase.com/dashboard/project/kfcaaiyzdmcdccmhqemf/sql/new
--   - PRODUCCIÓN: https://supabase.com/dashboard/project/mkbwfypxupebulwhijgw/sql/new
-- Es idempotente (ADD COLUMN IF NOT EXISTS): se puede correr más de una vez sin problema.

ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS monto_recibido numeric;
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS vuelto numeric;
