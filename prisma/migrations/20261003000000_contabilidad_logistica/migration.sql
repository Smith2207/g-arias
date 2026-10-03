CREATE TYPE "EstadoDespacho" AS ENUM ('PREPARACION', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO');
CREATE TYPE "TipoMovimiento" AS ENUM ('COBRO', 'GASTO', 'DEVOLUCION');
ALTER TABLE "Pedido"
 ADD COLUMN "despacho" "EstadoDespacho" NOT NULL DEFAULT 'PREPARACION',
 ADD COLUMN "direccion" TEXT NOT NULL DEFAULT '',
 ADD COLUMN "transportista" TEXT NOT NULL DEFAULT '',
 ADD COLUMN "seguimiento" TEXT NOT NULL DEFAULT '',
 ADD COLUMN "enviadoAt" TIMESTAMP(3),
 ADD COLUMN "entregadoAt" TIMESTAMP(3);
UPDATE "Pedido" SET "despacho" = 'ENTREGADO' WHERE "estado" = 'ENTREGADO';
UPDATE "Pedido" SET "despacho" = 'CANCELADO' WHERE "estado" = 'CANCELADO';
CREATE TABLE "MovimientoCaja" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "clave" TEXT NOT NULL,
 "pedidoId" TEXT,
 "tipo" "TipoMovimiento" NOT NULL,
 "monto" DECIMAL(18,2) NOT NULL CHECK ("monto" > 0),
 "concepto" TEXT NOT NULL,
 "medio" TEXT NOT NULL,
 "referencia" TEXT NOT NULL DEFAULT '',
 "registradoPor" TEXT NOT NULL,
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "MovimientoCaja_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "MovimientoCaja_vinculo_check" CHECK (("tipo" = 'GASTO' AND "pedidoId" IS NULL) OR ("tipo" IN ('COBRO', 'DEVOLUCION') AND "pedidoId" IS NOT NULL))
);
CREATE UNIQUE INDEX "MovimientoCaja_clave_key" ON "MovimientoCaja"("clave");
CREATE INDEX "MovimientoCaja_pedidoId_createdAt_idx" ON "MovimientoCaja"("pedidoId", "createdAt");
CREATE INDEX "MovimientoCaja_tipo_createdAt_idx" ON "MovimientoCaja"("tipo", "createdAt");
