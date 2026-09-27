-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'CONFIRMADO', 'ENTREGADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "stock" INTEGER,
ADD COLUMN     "stockMinimo" INTEGER NOT NULL DEFAULT 12;

-- CreateTable
CREATE TABLE "Variante" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "talla" TEXT NOT NULL,
    "stock" INTEGER,
    "stockMinimo" INTEGER NOT NULL DEFAULT 12,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Variante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "huella" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "notas" TEXT NOT NULL DEFAULT '',
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "total" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaPedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "varianteId" TEXT,
    "nombre" TEXT NOT NULL,
    "varianteNombre" TEXT NOT NULL DEFAULT '',
    "presentacion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "unidades" INTEGER NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "stockDescontado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LineaPedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Configuracion" (
    "id" TEXT NOT NULL DEFAULT 'tienda',
    "nombre" TEXT NOT NULL DEFAULT 'Arias',
    "whatsapp" TEXT NOT NULL,
    "contacto" TEXT NOT NULL DEFAULT '',
    "condicionesEnvio" TEXT NOT NULL DEFAULT 'Coordinamos disponibilidad, pago y envío por WhatsApp.',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Variante_productoId_activo_idx" ON "Variante"("productoId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_codigo_key" ON "Pedido"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_clave_key" ON "Pedido"("clave");

-- CreateIndex
CREATE INDEX "Pedido_estado_createdAt_idx" ON "Pedido"("estado", "createdAt");

-- CreateIndex
CREATE INDEX "Pedido_telefono_createdAt_idx" ON "Pedido"("telefono", "createdAt");

-- CreateIndex
CREATE INDEX "LineaPedido_pedidoId_idx" ON "LineaPedido"("pedidoId");

-- CreateIndex
CREATE INDEX "LineaPedido_productoId_idx" ON "LineaPedido"("productoId");

-- CreateIndex
CREATE INDEX "LineaPedido_varianteId_idx" ON "LineaPedido"("varianteId");

-- AddForeignKey
ALTER TABLE "Variante" ADD CONSTRAINT "Variante_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaPedido" ADD CONSTRAINT "LineaPedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "Pedido"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaPedido" ADD CONSTRAINT "LineaPedido_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaPedido" ADD CONSTRAINT "LineaPedido_varianteId_fkey" FOREIGN KEY ("varianteId") REFERENCES "Variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


ALTER TABLE "Producto" ADD CONSTRAINT "Producto_stock_nonnegative" CHECK ("stock" IS NULL OR "stock" >= 0), ADD CONSTRAINT "Producto_min_nonnegative" CHECK ("stockMinimo" >= 0);
ALTER TABLE "Variante" ADD CONSTRAINT "Variante_stock_nonnegative" CHECK ("stock" IS NULL OR "stock" >= 0), ADD CONSTRAINT "Variante_min_nonnegative" CHECK ("stockMinimo" >= 0);
ALTER TABLE "LineaPedido" ADD CONSTRAINT "LineaPedido_positive" CHECK ("cantidad" > 0 AND "unidades" > 0 AND "precio" > 0);
